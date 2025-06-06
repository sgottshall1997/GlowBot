import { Router } from "express";
import { z } from "zod";
import { TEMPLATE_TYPES, TONE_OPTIONS, NICHES } from "@shared/constants";
import { storage } from "../storage";
import { generateContent, estimateVideoDuration } from "../services/contentGenerator";
import { generateVideoContent } from "../services/videoContentGenerator";
import { generatePlatformSpecificContent } from "../services/platformContentGenerator";
import { CacheService } from "../services/cacheService";
import { insertContentHistorySchema } from "@shared/schema";
import { sendWebhookNotification } from "../services/webhookService";
import rateLimit from "express-rate-limit";
import { logFeedback } from "../database/feedbackLogger";

// Helper function to extract hashtags from text
function extractHashtags(text: string): string[] {
  const hashtagRegex = /#[\w]+/g;
  const matches = text.match(hashtagRegex);
  return matches ? matches.map(tag => tag.substring(1)) : [];
}

const router = Router();

// Create a rate limiter middleware that limits to 5 requests per minute
const contentGenerationLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // limit each IP to 5 requests per windowMs
  message: {
    error: "Too many generations — please wait a minute and try again."
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  skipSuccessfulRequests: false, // Count all requests, including successful ones
  keyGenerator: (req) => {
    // If user is authenticated, use their ID as the key, otherwise use IP
    return req.user?.id?.toString() || req.ip || 'unknown';
  }
});

// Import tone definitions
import { TONES } from '../prompts/tones';
import { loadPromptTemplates } from '../prompts/templates';

// Validate request body schema with basic type checking
const generateContentSchema = z.object({
  product: z.string().trim().min(1, "Product name is required"),
  templateType: z.string().default("original"),
  tone: z.string().default("friendly"),
  niche: z.string().default("skincare"),
  platforms: z.array(z.string()).min(1, "At least one platform is required").default(["Instagram"]),
  contentType: z.enum(["video", "photo"]).default("video"),
  isVideoContent: z.boolean().optional().default(false),
  videoDuration: z.enum(["30", "45", "60"]).optional(),
});

// Helper functions to check if tone and template exist in the system
async function isValidTemplateType(templateType: string, niche: string): Promise<boolean> {
  try {
    // Load available templates
    const templates = await loadPromptTemplates();
    
    // Check if the template exists in the niche-specific templates
    if (templates[niche] && templateType in templates[niche]) {
      return true;
    }
    
    // If not in niche-specific, check if it exists in default templates
    if (templates.default && templateType in templates.default) {
      return true;
    }
    
    return false;
  } catch (error) {
    console.error("Error checking template validity:", error);
    return false;
  }
}

function isValidTone(tone: string): boolean {
  return tone in TONES;
}

// Helper to get all available tones
function getAvailableTones(): string[] {
  return Object.keys(TONES);
}

// Helper to get all available template types
async function getAvailableTemplateTypes(niche: string): Promise<string[]> {
  try {
    const templates = await loadPromptTemplates();
    const nicheTemplates = templates[niche] || {};
    const defaultTemplates = templates.default || {};
    
    // Combine niche-specific and default templates without using Set
    const allTemplates: string[] = [];
    
    // Add niche-specific templates
    Object.keys(nicheTemplates).forEach(key => {
      if (!allTemplates.includes(key)) {
        allTemplates.push(key);
      }
    });
    
    // Add default templates (if not already added)
    Object.keys(defaultTemplates).forEach(key => {
      if (!allTemplates.includes(key)) {
        allTemplates.push(key);
      }
    });
    
    return allTemplates;
  } catch (error) {
    console.error("Error getting available templates:", error);
    return [];
  }
}

// Create a cache service for content generation
interface CachedContent {
  content: string;
  fallbackLevel?: 'exact' | 'default' | 'generic';
  generatedAt: number;
}

const contentCache = new CacheService<CachedContent>({
  defaultTtl: 1000 * 60 * 60 * 24, // 24 hour cache
  maxSize: 500 // Store up to 500 generations
});

router.post("/", contentGenerationLimiter, async (req, res) => {
  try {
    // Validate request body against schema
    const result = generateContentSchema.safeParse(req.body);
    
    if (!result.success) {
      return res.status(400).json({
        success: false,
        data: null,
        error: "Invalid request parameters"
      });
    }
    
    // Get the validated data
    const validatedData = result.data;
    
    // Check if the requested tone exists in the system
    if (!isValidTone(validatedData.tone)) {
      const availableTones = getAvailableTones();
      return res.status(400).json({
        success: false,
        data: null,
        error: `Invalid tone "${validatedData.tone}". Available: ${availableTones.join(", ")}`
      });
    }
    
    // Check if the template type exists for the requested niche, with automatic fallback
    let finalTemplateType = validatedData.templateType;
    const templateExists = await isValidTemplateType(validatedData.templateType, validatedData.niche);
    if (!templateExists) {
      // If requested template doesn't exist, use the first available template for the niche
      const availableTemplates = await getAvailableTemplateTypes(validatedData.niche);
      if (availableTemplates.length > 0) {
        finalTemplateType = availableTemplates[0];
        console.log(`Template "${validatedData.templateType}" not found for ${validatedData.niche}, using fallback: ${finalTemplateType}`);
      } else {
        // If no templates available, use skincare_routine as ultimate fallback
        finalTemplateType = "skincare_routine";
        console.log(`No templates found for ${validatedData.niche}, using ultimate fallback: ${finalTemplateType}`);
      }
    }
    
    const { product, tone, niche, platforms, contentType, isVideoContent, videoDuration: videoLength } = result.data;
    const templateType = finalTemplateType;
    
    // Create cache parameters object
    const cacheParams = {
      product: product.toLowerCase().trim(),
      templateType,
      tone,
      niche
    };
    
    // Generate cache key from parameters
    const cacheKey = contentCache.generateKey(cacheParams);
    
    // Check if we have a cached result
    const cached = contentCache.get(cacheKey);
    
    // If we have a valid cached result, return it
    if (cached && cached.content) {
      // Estimate video duration for cached content too
      const videoDuration = estimateVideoDuration(cached.content, tone, templateType);
      
      console.log(`Using cached content for ${product}, template: ${templateType}, tone: ${tone}`);
      
      return res.json({
        success: true,
        data: {
          content: cached.content,
          summary: `${templateType} content for ${product} (${tone} tone)`,
          tags: [niche, templateType, tone, "cached"],
          product,
          templateType,
          tone,
          niche,
          fallbackLevel: cached.fallbackLevel || 'exact',
          fromCache: true,
          videoDuration
        },
        error: null
      });
    }
    
    // Get niche-specific trending data for context enrichment
    const trendingProducts = await storage.getTrendingProductsByNiche(niche);
    
    // Handle video content generation - automatically enabled when contentType is "video"
    if ((isVideoContent || contentType === "video") && videoLength) {
      try {
        const videoResult = await generateVideoContent({
          productName: product,
          niche,
          tone,
          duration: videoLength,
          trendingData: trendingProducts
        });

        // Return video content with separate script and caption - no duplicate content
        return res.json({
          success: true,
          data: {
            content: "", // Empty to prevent duplicate display
            videoScript: videoResult.script,
            videoCaption: videoResult.caption,
            hashtags: videoResult.hashtags,
            estimatedDuration: videoResult.estimatedDuration,
            summary: `${videoLength}-second video content for ${product}`,
            tags: [niche, "video", tone, videoLength + "s"],
            product,
            templateType: "video_script",
            tone,
            niche,
            isVideoContent: true,
            videoDuration: videoLength,
            fromCache: false
          },
          error: null
        });
      } catch (error: any) {
        console.error('Video content generation error:', error);
        return res.status(500).json({
          success: false,
          data: null,
          error: "Video content generation failed. Please try again."
        });
      }
    }

    // Generate regular content using OpenAI with error handling and model fallback
    let content, fallbackLevel, prompt, model, tokens;
    
    try {
      const result = await generateContent(product, templateType, tone, trendingProducts, niche);
      content = result.content;
      fallbackLevel = result.fallbackLevel;
      prompt = result.prompt;
      model = result.model;
      tokens = result.tokens;
      
      // Ensure we have valid content
      if (!content || content.trim().length === 0) {
        throw new Error('Generated content is empty');
      }
      
    } catch (error: any) {
      console.error('Content generation error:', error);
      
      // Handle OpenAI quota exceeded errors gracefully
      if (error.status === 429 || error.code === 'insufficient_quota') {
        console.log('OpenAI quota exceeded, attempting fallback to GPT-3.5-turbo...');
        
        try {
          // Retry with GPT-3.5-turbo
          const fallbackResult = await generateContent(product, templateType, tone, trendingProducts, niche, 'gpt-3.5-turbo');
          content = fallbackResult.content;
          fallbackLevel = fallbackResult.fallbackLevel;
          prompt = fallbackResult.prompt;
          model = 'gpt-3.5-turbo';
          tokens = fallbackResult.tokens;
          
          if (!content || content.trim().length === 0) {
            throw new Error('Fallback generation also returned empty content');
          }
          
        } catch (fallbackError: any) {
          console.error('Both GPT-4 and GPT-3.5-turbo failed:', fallbackError);
          
          // Return a meaningful fallback content instead of error
          content = `✨ ${product} - ${templateType.charAt(0).toUpperCase() + templateType.slice(1)} Content ✨

This ${product} is a fantastic choice for your ${niche} journey! With its exceptional quality and ${tone} appeal, it's become a trending favorite.

Key highlights:
🌟 Perfect for ${niche} enthusiasts
💫 ${tone.charAt(0).toUpperCase() + tone.slice(1)} user experience
✨ Trending among community members

Experience the difference today! #${niche} #trending`;
          
          fallbackLevel = 'generic';
          prompt = `Fallback content for ${product}`;
          model = 'fallback';
          tokens = 0;
        }
      } else {
        // For other errors, provide meaningful fallback content
        content = `✨ ${product} - ${templateType.charAt(0).toUpperCase() + templateType.slice(1)} Content ✨

This ${product} is a fantastic choice for your ${niche} journey! With its exceptional quality and ${tone} appeal, it's become a trending favorite.

Key highlights:
🌟 Perfect for ${niche} enthusiasts
💫 ${tone.charAt(0).toUpperCase() + tone.slice(1)} user experience
✨ Trending among community members

Experience the difference today! #${niche} #trending`;
        
        fallbackLevel = 'generic';
        prompt = `Fallback content for ${product}`;
        model = 'fallback';
        tokens = 0;
      }
    }
    
    // Generate platform-specific content if platforms are specified
    let platformContent = null;
    if (platforms && platforms.length > 0) {
      try {
        console.log(`Generating platform-specific content for: ${platforms.join(", ")}`);
        platformContent = await generatePlatformSpecificContent({
          product,
          niche,
          platforms,
          contentType,
          templateType,
          tone,
          videoDuration: videoLength,
          trendingData: trendingProducts
        });
      } catch (error) {
        console.error("Platform content generation failed:", error);
        // Continue without platform content if it fails
      }
    }
    
    // Store in cache with optimized parameters
    contentCache.set(cacheKey, { 
      content, 
      fallbackLevel,
      generatedAt: Date.now() 
    });
    
    console.log(`Cached new content for ${product}, template: ${templateType}, tone: ${tone}`);
    
    // Save to database
    await storage.saveContentGeneration({
      product,
      templateType,
      tone,
      niche,
      content
    });
    
    // Save detailed content history record with all metadata
    const contentHistoryEntry = await storage.saveContentHistory({
      userId: req.user?.id, // If user is authenticated
      niche,
      contentType: templateType,
      tone,
      productName: product,
      promptText: prompt || `Generate ${templateType} content for ${product} with ${tone} tone in ${niche} niche`,
      outputText: content,
      modelUsed: model || "gpt-4o",
      tokenCount: tokens || 0
    });
    
    // Increment API usage counter with template and tone tracking
    await storage.incrementApiUsage(templateType, tone, niche, req.user?.id);
    
    // Send webhook notification if available
    if (contentHistoryEntry) {
      try {
        // Fire and forget - don't await to avoid holding up the response
        sendWebhookNotification(contentHistoryEntry)
          .then(result => {
            if (result.success) {
              console.log(`Webhook notification sent successfully for content #${contentHistoryEntry.id}`);
            } else {
              console.warn(`Webhook notification failed: ${result.message}`);
            }
          })
          .catch(error => {
            console.error('Error in webhook notification:', error);
          });
      } catch (error) {
        // Log webhook errors but don't block the response
        console.error('Error triggering webhook notification:', error);
      }
    }
    
    // Estimate video duration
    const estimatedVideoDuration = estimateVideoDuration(content, tone, templateType);
    
    // 📊 Log feedback to SQLite database
    try {
      const feedbackId = await logFeedback(product, templateType, tone, content);
      console.log(`📊 Feedback logged successfully with ID: ${feedbackId}`);
    } catch (feedbackError) {
      // Log error but don't block the response
      console.error('Error logging feedback to database:', feedbackError);
    }
    
    // Prepare webhook-ready platform data for Make.com automation
    const webhookData = [];
    if (platformContent && platformContent.socialCaptions) {
      for (const [platform, content] of Object.entries(platformContent.socialCaptions)) {
        webhookData.push({
          platform,
          contentType,
          caption: content.caption,
          postInstructions: content.postInstructions,
          videoScript: platformContent.videoScript || null,
          photoDescription: platformContent.photoDescription || null,
          product,
          niche,
          tone,
          templateType,
          hashtags: extractHashtags(content.caption),
          mediaUrl: null, // Ready for user to add media URL
          scheduledTime: null, // Ready for scheduling
          makeWebhookReady: true
        });
      }
    }

    // Return success response with clean JSON structure including platform content
    res.json({
      success: true,
      data: {
        content,
        summary: `Fresh ${templateType} content for ${product} (${tone} tone)`,
        tags: [niche, templateType, tone, model || "gpt-4o"],
        product,
        templateType,
        tone,
        niche,
        fallbackLevel,
        fromCache: false,
        videoDuration: videoLength || undefined,
        model: model || "gpt-4o",
        // Platform-specific content
        platforms: platforms || [],
        contentType,
        platformContent: platformContent || null,
        // Webhook automation ready data
        webhookData
      },
      error: null
    });
  } catch (error) {
    console.error("Error generating content:", error);
    
    // Ensure we always return valid JSON, never HTML
    const errorMessage = error instanceof Error ? error.message : "Failed to generate content";
    
    // Check if response headers are already sent
    if (res.headersSent) {
      console.error("Headers already sent, cannot send error response");
      return;
    }
    
    // Set proper content type to ensure JSON response
    res.setHeader('Content-Type', 'application/json');
    
    res.status(500).json({
      success: false,
      data: null,
      error: errorMessage,
      timestamp: new Date().toISOString(),
      requestId: Math.random().toString(36).substring(7)
    });
  }
});

export { router as generateContentRouter };
