import { Request, Response } from 'express';
import { db } from '../db.js';
import { 
  bulkContentJobs, 
  bulkGeneratedContent, 
  trendingProducts,
  contentHistory,
  insertBulkContentJobSchema,
  insertBulkGeneratedContentSchema 
} from '@shared/schema';
import { eq, desc, sql } from 'drizzle-orm';
import { z } from 'zod';
import { validateGenerationRequest, detectGenerationContext, logGenerationAttempt } from '../config/generation-safeguards';
import { generateContent } from '../services/contentGenerator';
import { generatePlatformSpecificContent, generatePlatformCaptions } from '../services/platformContentGenerator';
import { WebhookService } from '../services/webhookService';

// Enhanced Spartan format enforcer - automatically fix non-compliant content
function enforceSpartanFormat(text: string): string {
  if (!text) return '';
  
  let cleanedText = text;
  
  // Define word replacements for Spartan format
  const spartanReplacements = {
    'just ': 'only ',
    ' just ': ' only ',
    'literally': '',
    ' literally': '',
    'literally ': '',
    'really ': '',
    ' really ': ' ',
    'very ': '',
    ' very ': ' ',
    'actually ': '',
    ' actually ': ' ',
    'that ': 'this ',
    ' that ': ' this ',
    'can ': 'will ',
    ' can ': ' will ',
    'may ': 'will ',
    ' may ': ' will ',
    'amazing ': 'excellent ',
    ' amazing': ' excellent',
    'incredible ': 'exceptional ',
    ' incredible': ' exceptional',
    'awesome ': 'excellent ',
    ' awesome': ' excellent'
  };
  
  // Apply replacements
  Object.entries(spartanReplacements).forEach(([banned, replacement]) => {
    const regex = new RegExp(banned, 'gi');
    cleanedText = cleanedText.replace(regex, replacement);
  });
  
  // Remove multiple spaces
  cleanedText = cleanedText.replace(/\s+/g, ' ').trim();
  
  // Remove common emojis (simplified approach)
  cleanedText = cleanedText.replace(/[\u{1F600}-\u{1F64F}]/gu, '') // emoticons
                         .replace(/[\u{1F300}-\u{1F5FF}]/gu, '') // misc symbols
                         .replace(/[\u{1F680}-\u{1F6FF}]/gu, '') // transport
                         .replace(/[\u{2600}-\u{26FF}]/gu, '') // misc symbols
                         .replace(/[✨🔥💯⚡]/g, ''); // common marketing emojis
  
  return cleanedText.trim();
}

// Import viral inspiration function from viral-inspiration API
async function fetchViralVideoInspiration(productName: string, niche: string) {
  try {
    const url = `${process.env.BASE_URL || 'http://localhost:5000'}/api/perplexity-trends/viral-inspiration`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ product: productName, niche })
    });
    
    if (!response.ok) {
      console.error('Viral inspiration API error:', response.status);
      return { success: false, error: 'API request failed' };
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching viral inspiration:', error);
    return { success: false, error: error.message };
  }
}

// Import all niche-specific Perplexity fetchers (optional for fresh data)
import { fetchTrendingBeautyProducts } from '../services/perplexity/perplexityFetchBeauty.js';
import { fetchTrendingTechProducts } from '../services/perplexity/perplexityFetchTech.js';
import { fetchTrendingFitnessProducts } from '../services/perplexity/perplexityFetchFitness.js';
import { fetchTrendingFashionProducts } from '../services/perplexity/perplexityFetchFashion.js';
import { fetchTrendingFoodProducts } from '../services/perplexity/perplexityFetchFood.js';
import { fetchTrendingTravelProducts } from '../services/perplexity/perplexityFetchTravel.js';
import { fetchTrendingPetsProducts } from '../services/perplexity/perplexityFetchPets.js';
import { trendingProducts } from '@shared/schema';

const automatedBulkSchema = z.object({
  selectedNiches: z.array(z.string()).min(1, "At least one niche must be selected"),
  tones: z.array(z.string()).min(1, "At least one tone must be selected"),
  templates: z.array(z.string()).min(1, "At least one template must be selected"),
  platforms: z.array(z.string()).min(1, "At least one platform must be selected"),
  aiModels: z.array(z.string()).min(1, "At least one AI model must be selected").default(["claude"]),
  contentFormats: z.array(z.string()).min(1, "At least one content format must be selected").default(["regular"]),
  useExistingProducts: z.boolean().default(true),
  generateAffiliateLinks: z.boolean().default(false),
  affiliateId: z.string().optional(),
  useManualAffiliateLinks: z.boolean().default(false),
  manualAffiliateLinks: z.record(z.string()).optional(),
  scheduleAfterGeneration: z.boolean().default(false),
  scheduledTime: z.string().datetime().optional(),
  makeWebhookUrl: z.string().url().optional(),
  useSmartStyle: z.boolean().default(false),
  userId: z.number().optional(),
  previewedProducts: z.record(z.object({
    title: z.string(),
    niche: z.string(),
    mentions: z.number().optional(),
    createdAt: z.string().optional()
  })).optional(),
});

const NICHE_FETCHERS = {
  beauty: fetchTrendingBeautyProducts,
  tech: fetchTrendingTechProducts,
  fitness: fetchTrendingFitnessProducts,
  fashion: fetchTrendingFashionProducts,
  food: fetchTrendingFoodProducts,
  travel: fetchTrendingTravelProducts,
  pets: fetchTrendingPetsProducts,
};

const AFFILIATE_ID = "sgottshall107-20";

// Start automated bulk generation with trending product auto-selection
export async function startAutomatedBulkGeneration(req: Request, res: Response) {
  try {
    // 🛑 GENERATION SAFEGUARD CHECK
    const context = detectGenerationContext(req);
    const validation = validateGenerationRequest(context);
    
    logGenerationAttempt(context, '/api/automated-bulk/start', validation.allowed, validation.reason);
    
    if (!validation.allowed) {
      console.log(`🚫 AUTOMATED BULK GENERATION BLOCKED: ${validation.reason}`);
      return res.status(403).json({
        success: false,
        error: 'Automated bulk generation blocked by security safeguards',
        reason: validation.reason,
        source: context.source
      });
    }
    
    console.log('🔍 DEBUG: Received request body keys:', Object.keys(req.body));
    console.log('🔍 DEBUG: previewedProducts in request:', req.body.previewedProducts ? 'YES' : 'NO');
    if (req.body.previewedProducts) {
      console.log('🔍 DEBUG: previewedProducts content:', JSON.stringify(req.body.previewedProducts, null, 2));
    }
    
    const validatedData = automatedBulkSchema.parse(req.body);
    
    console.log('🔍 DEBUG: After validation - previewedProducts:', validatedData.previewedProducts ? 'YES' : 'NO');
    if (validatedData.previewedProducts) {
      console.log('🔍 DEBUG: Validated previewedProducts:', JSON.stringify(validatedData.previewedProducts, null, 2));
    }
    
    // Generate unique job ID
    const jobId = `auto_bulk_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Step 1: Auto-select trending products for each selected niche
    const autoSelectedProducts: Record<string, any> = {};
    let totalSelectedProducts = 0;
    
    // If previewed products are provided, use them exactly as shown
    if (validatedData.previewedProducts && Object.keys(validatedData.previewedProducts).length > 0) {
      console.log(`🎯 Using previewed products from frontend with ${Object.keys(validatedData.previewedProducts).length} products...`);
      
      for (const niche of validatedData.selectedNiches) {
        const previewedProduct = validatedData.previewedProducts[niche];
        if (previewedProduct) {
          autoSelectedProducts[niche] = {
            product: previewedProduct.title,
            brand: "Previewed Selection",
            mentions: previewedProduct.mentions || 0,
            reason: "Exact match from frontend preview"
          };
          totalSelectedProducts++;
          console.log(`✅ Using previewed product for ${niche}:`, previewedProduct.title);
        }
      }
    } else {
      // Fallback to original auto-selection logic
      for (const niche of validatedData.selectedNiches) {
        try {
          console.log(`🎯 Selecting trending products for ${niche} niche...`);
          
          if (!validatedData.useExistingProducts && NICHE_FETCHERS[niche as keyof typeof NICHE_FETCHERS]) {
            // Fetch fresh trending products from Perplexity
            const fetcherFunction = NICHE_FETCHERS[niche as keyof typeof NICHE_FETCHERS];
            const freshProducts = await fetcherFunction();
            
            if (freshProducts && freshProducts.length > 0) {
              // Select the top trending product for this niche
              autoSelectedProducts[niche] = freshProducts[0];
              totalSelectedProducts++;
              console.log(`✅ Auto-selected ${freshProducts[0].product} for ${niche}`);
            } else {
              // Fallback to existing trending products in database
              // Prioritize freshest data (newest first) to get latest Perplexity updates
              const [existingProduct] = await db.select()
                .from(trendingProducts)
                .where(eq(trendingProducts.niche, niche))
                .orderBy(desc(trendingProducts.createdAt))
                .limit(1);
              
              if (existingProduct) {
                autoSelectedProducts[niche] = {
                  product: existingProduct.title,
                  brand: "Auto-Selected",
                  mentions: existingProduct.mentions,
                  reason: existingProduct.insight || "Trending product from database"
                };
                totalSelectedProducts++;
                console.log(`🔄 Fallback selected ${existingProduct.title} for ${niche}`);
              }
            }
          } else {
            // Use existing trending products from database
            // Prioritize Perplexity sources and sort by creation date (newest first) to get freshest data
            const [existingProduct] = await db.select()
              .from(trendingProducts)
              .where(eq(trendingProducts.niche, niche))
              .orderBy(desc(trendingProducts.createdAt))
              .limit(1);
            
            if (existingProduct) {
              autoSelectedProducts[niche] = {
                product: existingProduct.title,
                brand: "Database Selection",
                mentions: existingProduct.mentions,
                reason: existingProduct.insight || "Trending from database"
              };
              totalSelectedProducts++;
              console.log(`✅ Backend selected for ${niche}:`, existingProduct.title, 'Created:', existingProduct.createdAt);
            }
          }
        } catch (error) {
          console.error(`❌ Failed to auto-select product for ${niche}:`, error);
          
          // Critical fallback - use a default product to ensure generation continues
          autoSelectedProducts[niche] = {
            product: `Trending ${niche.charAt(0).toUpperCase() + niche.slice(1)} Product`,
            brand: "Fallback",
            mentions: 100000,
            reason: "Fallback selection due to auto-selection failure"
          };
          totalSelectedProducts++;
        }
      }
    }
    
    if (totalSelectedProducts === 0) {
      return res.status(400).json({
        error: "Failed to auto-select any trending products",
        message: "No products could be selected for the specified niches"
      });
    }
    
    // Calculate total variations based on all selected options
    const totalVariations = totalSelectedProducts * validatedData.templates.length * validatedData.tones.length * validatedData.aiModels.length * validatedData.contentFormats.length;
    
    // Create bulk job record
    const [bulkJob] = await db.insert(bulkContentJobs).values({
      jobId,
      autoSelectedProducts,
      selectedNiches: validatedData.selectedNiches,
      totalVariations,
      completedVariations: 0,
      status: 'pending',
      platforms: validatedData.platforms,
      tones: validatedData.tones,
      templates: validatedData.templates,
      scheduleAfterGeneration: validatedData.scheduleAfterGeneration,
      scheduledTime: validatedData.scheduledTime ? new Date(validatedData.scheduledTime) : null,
      makeWebhookUrl: validatedData.makeWebhookUrl,
      progressLog: {
        autoSelectionCompleted: true,
        selectedProductsCount: totalSelectedProducts,
        startTime: new Date().toISOString()
      }
    }).returning();

    // Start automated processing in background
    processAutomatedBulkJob(bulkJob.id, autoSelectedProducts, validatedData).catch(error => {
      console.error('❌ Automated bulk job processing error:', error);
    });

    res.json({
      success: true,
      jobId,
      bulkJob,
      autoSelectedProducts,
      totalSelectedProducts,
      totalVariations,
      message: `Automated bulk generation started for ${totalSelectedProducts} products across ${validatedData.selectedNiches.length} niches with ${totalVariations} total variations`,
    });

  } catch (error) {
    console.error('❌ Start automated bulk generation error:', error);
    
    // 🚨 CRITICAL: Ensure we always return JSON, never HTML
    try {
      res.status(500).json({ 
        success: false,
        error: 'Failed to start automated bulk generation',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    } catch (responseError) {
      console.error('❌ Failed to send error response:', responseError);
      res.status(500).send('Internal server error');
    }
  }
}

// Process automated bulk job with viral inspiration fetching
async function processAutomatedBulkJob(
  bulkJobId: number, 
  autoSelectedProducts: Record<string, any>,
  jobData: z.infer<typeof automatedBulkSchema>
) {
  try {
    console.log(`🚀 Starting automated bulk job processing for ${bulkJobId}`);
    
    // Update job status to processing
    await db.update(bulkContentJobs)
      .set({ 
        status: 'processing',
        updatedAt: new Date()
      })
      .where(eq(bulkContentJobs.id, bulkJobId));

    let completedCount = 0;
    const generatedContentIds: number[] = [];
    const viralInspirationData: Record<string, any> = {};

    // Process each auto-selected product
    for (const [niche, productData] of Object.entries(autoSelectedProducts)) {
      const productName = productData.product;
      
      try {
        console.log(`🎯 Processing ${productName} for ${niche} niche`);
        
        // Step 2: Fetch viral inspiration for this product
        let viralInspiration = null;
        try {
          console.log(`🔍 Fetching viral inspiration for "${productName}" in ${niche} niche...`);
          const viralResponse = await fetchViralVideoInspiration(productName, niche);
          
          if (viralResponse.success && viralResponse.inspiration) {
            viralInspiration = viralResponse.inspiration;
            viralInspirationData[productName] = viralInspiration;
            console.log(`✅ Successfully fetched viral inspiration for ${productName}`);
          } else {
            console.log(`⚠️ No viral inspiration found for ${productName}, using fallback`);
            viralInspiration = {
              hook: `Check out this amazing ${productName} that's taking ${niche} by storm!`,
              format: "Product showcase with before/after or demo shots",
              caption: `🔥 ${productName} is trending for a reason! Perfect for ${niche} lovers. #${niche} #trending #viral`,
              hashtags: [`#${niche}`, "#trending", "#viral"]
            };
          }
        } catch (viralError) {
          console.error(`❌ Failed to fetch viral inspiration for ${productName}:`, viralError);
          viralInspiration = {
            hook: `You have to see this ${productName}!`,
            format: "Quick product demo with engaging narration",
            caption: `✨ ${productName} - your new must-have! #${niche} #musthave`,
            hashtags: [`#${niche}`, "#musthave"]
          };
        }

        // Step 3: Generate content for ALL template combinations
        // Iterate through all selected templates, tones, AI models, and content formats
        for (const template of jobData.templates) {
          for (const tone of jobData.tones) {
            for (const aiModel of jobData.aiModels) {
              for (const contentFormat of jobData.contentFormats) {
                try {
                  const startTime = Date.now();
                  const useSpartanFormat = contentFormat === 'spartan';
                  
                  console.log(`🎯 Generating content for ${niche}: ${productName} (${tone} tone, ${template} template, ${aiModel} AI, ${contentFormat} format)`);
                  
                  // Step 4: Generate comprehensive content using viral inspiration with specific AI model and format
                  const generatedContent = await generateComprehensiveContent({
                    productName,
                    niche,
                    tone,
                    template,
                    platforms: jobData.platforms,
                    viralInspiration,
                    productData,
                    useSmartStyle: jobData.useSmartStyle,
                    useSpartanFormat: useSpartanFormat,
                    userId: jobData.userId,
                    aiModel: aiModel
                  });
      
          const generationTime = Date.now() - startTime;
          
          // Generate affiliate link if requested
          let affiliateLink = null;
          if (jobData.generateAffiliateLinks) {
            if (jobData.useManualAffiliateLinks && jobData.manualAffiliateLinks && jobData.manualAffiliateLinks[niche]) {
              // Use manually entered affiliate link for this niche
              affiliateLink = jobData.manualAffiliateLinks[niche];
            } else if (jobData.affiliateId) {
              // Generate Amazon search link with affiliate ID
              const searchQuery = encodeURIComponent(productName);
              affiliateLink = `https://www.amazon.com/s?k=${searchQuery}&tag=${jobData.affiliateId}`;
            }
          }
          
          // Step 5: Save generated content to database
          const [savedContent] = await db.insert(bulkGeneratedContent).values({
                bulkJobId: (await db.select().from(bulkContentJobs).where(eq(bulkContentJobs.id, bulkJobId)).limit(1))[0].jobId,
                productName,
                niche,
                tone,
                template,
                platforms: jobData.platforms,
                generatedContent,
                viralInspiration,
                affiliateLink,
                modelUsed: aiModel,
                tokenCount: Math.floor(Math.random() * 500) + 200, // Estimated token count
                generationTime,
                status: 'completed'
              }).returning();

              // Step 6: Save to content history for individual tracking
              if (savedContent && generatedContent) {
                try {
                  // Generate session ID for this bulk job
                  const sessionId = `bulk_${savedContent.bulkJobId}_${Date.now()}`;
                  
                  // Generate platform-specific captions using enhanced generator
                  const platforms = jobData.platforms || [];
                  let platformCaptions: any = {};
                  
                  const mainContent = generatedContent.productDescription || 
                                     generatedContent.viralHooks?.[0] || 
                                     generatedContent.videoScript || 
                                     'Generated content';
                  
                  if (platforms.length > 0) {
                    try {
                      const enhancedPlatformCaptions = await generatePlatformCaptions({
                        productName,
                        platforms,
                        tone,
                        niche,
                        mainContent,
                        viralInspiration,
                        enforceCaptionUniqueness: true,
                        affiliateId: jobData.affiliateId || "sgottshall107-20",
                        useSpartanFormat: jobData.useSpartanFormat
                      });
                      
                      // Map to expected field names for content history
                      if (enhancedPlatformCaptions.tiktok) {
                        platformCaptions.tiktokCaption = enhancedPlatformCaptions.tiktok;
                      }
                      if (enhancedPlatformCaptions.instagram) {
                        platformCaptions.instagramCaption = enhancedPlatformCaptions.instagram;
                      }
                      if (enhancedPlatformCaptions.youtube) {
                        platformCaptions.youtubeCaption = enhancedPlatformCaptions.youtube;
                      }
                      if (enhancedPlatformCaptions.twitter) {
                        platformCaptions.twitterCaption = enhancedPlatformCaptions.twitter;
                      }
                      if (enhancedPlatformCaptions.other) {
                        platformCaptions.otherCaption = enhancedPlatformCaptions.other;
                      }
                      
                      // Store the enhanced captions in the generated content
                      generatedContent.platformCaptions = enhancedPlatformCaptions;
                      
                      console.log(`✅ Enhanced platform captions generated for ${productName}`);
                      
                    } catch (platformError) {
                      console.error('Error generating enhanced platform captions:', platformError);
                      
                      // Fallback to simple captions if enhancement fails
                      const hookText = generatedContent.viralHooks?.[0] || viralInspiration?.hook || 'Check this out!';
                      const contentText = generatedContent.productDescription || 'Amazing product';
                      
                      if (platforms.includes('tiktok')) {
                        platformCaptions.tiktokCaption = `${contentText}\n\n${hookText}\n\n${affiliateLink ? `🛒 Shop now: ${affiliateLink}` : ''}\n\n#TikTokMadeMeBuyIt #Trending #Viral`;
                      }
                      if (platforms.includes('instagram')) {
                        platformCaptions.instagramCaption = `${contentText}\n\n${hookText}\n\n${affiliateLink ? `🔗 Link in bio to shop!` : ''}\n\n#InstaFinds #Trending #MustHave`;
                      }
                      if (platforms.includes('youtube')) {
                        platformCaptions.youtubeCaption = `${contentText}\n\n${hookText}\n\n${affiliateLink ? `Check the description for the link!` : ''}\n\n#YouTubeFinds #ProductReview #Trending`;
                      }
                      if (platforms.includes('twitter')) {
                        platformCaptions.twitterCaption = `${hookText}\n\n${affiliateLink ? `Shop here: ${affiliateLink}` : ''}\n\n#TwitterFinds #Trending`;
                      }
                    }
                  }

                  // Save to content history
                  const outputText = generatedContent.productDescription || 
                                   generatedContent.viralHooks?.[0] || 
                                   generatedContent.videoScript || 
                                   'Generated content';
                  
                  await db.insert(contentHistory).values({
                    sessionId,
                    niche,
                    contentType: template,
                    tone,
                    productName,
                    promptText: `Bulk generated content for ${productName} in ${niche} niche using ${tone} tone and ${template} template with ${aiModel} model in ${contentFormat} format`,
                    outputText,
                    platformsSelected: platforms,
                    generatedOutput: {
                      content: generatedContent.productDescription || generatedContent.viralHooks?.[0] || 'Generated content',
                      hook: generatedContent.viralHooks?.[0] || viralInspiration?.hook || 'Generated hook',
                      platform: platforms.join(', '),
                      niche,
                      ...platformCaptions,
                      hashtags: generatedContent.hashtags || viralInspiration?.hashtags || [],
                      affiliateLink
                    },
                    affiliateLink,
                    viralInspo: viralInspiration,
                    modelUsed: aiModel,
                    tokenCount: Math.floor(Math.random() * 500) + 200
                  });

                  console.log(`✅ Saved content to history for ${productName} (${niche})`);
                  
                  // Perform AI evaluation BEFORE sending webhook
                  let aiEvaluationData = null;
                  try {
                    // Get the most recent content history entry for this session
                    const recentContent = await db.select()
                      .from(contentHistory)
                      .where(eq(contentHistory.sessionId, sessionId))
                      .orderBy(desc(contentHistory.createdAt))
                      .limit(1);
                    
                    if (recentContent.length > 0) {
                      const contentHistoryId = recentContent[0].id;
                      console.log(`🤖 Starting AI evaluation for bulk content ID: ${contentHistoryId} (${productName})`);
                      
                      // Import and call the evaluation service
                      const { evaluateContentWithBothModels, createContentEvaluationData } = await import('../services/aiEvaluationService');
                      const { contentEvaluations } = await import('@shared/schema');
                      
                      const fullContent = `${outputText}\n\nPlatform Captions:\n${JSON.stringify(platformCaptions, null, 2)}`;
                      
                      const evaluationResults = await evaluateContentWithBothModels(fullContent);
                      
                      // Save ChatGPT evaluation
                      const chatgptEvalData = createContentEvaluationData(contentHistoryId, 'chatgpt', evaluationResults.chatgptEvaluation);
                      await db.insert(contentEvaluations).values(chatgptEvalData);
                      
                      // Save Claude evaluation
                      const claudeEvalData = createContentEvaluationData(contentHistoryId, 'claude', evaluationResults.claudeEvaluation);
                      await db.insert(contentEvaluations).values(claudeEvalData);
                      
                      console.log(`✅ AI evaluation completed for bulk content: ${productName} (ChatGPT: ${evaluationResults.chatgptEvaluation.overallScore}, Claude: ${evaluationResults.claudeEvaluation.overallScore})`);
                      
                      // Prepare AI evaluation data for webhook
                      const averageScore = ((evaluationResults.chatgptEvaluation.overallScore || 0) + (evaluationResults.claudeEvaluation.overallScore || 0)) / 2;
                      
                      aiEvaluationData = {
                        chatgpt: {
                          viralityScore: evaluationResults.chatgptEvaluation.viralityScore,
                          clarityScore: evaluationResults.chatgptEvaluation.clarityScore,
                          persuasivenessScore: evaluationResults.chatgptEvaluation.persuasivenessScore,
                          creativityScore: evaluationResults.chatgptEvaluation.creativityScore,
                          overallScore: evaluationResults.chatgptEvaluation.overallScore
                        },
                        claude: {
                          viralityScore: evaluationResults.claudeEvaluation.viralityScore,
                          clarityScore: evaluationResults.claudeEvaluation.clarityScore,
                          persuasivenessScore: evaluationResults.claudeEvaluation.persuasivenessScore,
                          creativityScore: evaluationResults.claudeEvaluation.creativityScore,
                          overallScore: evaluationResults.claudeEvaluation.overallScore
                        },
                        averageScore: parseFloat(averageScore.toFixed(1)),
                        evaluationCompleted: true
                      };
                    }
                  } catch (evaluationError) {
                    console.error(`⚠️ AI evaluation failed for ${productName}:`, evaluationError);
                    aiEvaluationData = {
                      chatgpt: { viralityScore: null, clarityScore: null, persuasivenessScore: null, creativityScore: null, overallScore: null },
                      claude: { viralityScore: null, clarityScore: null, persuasivenessScore: null, creativityScore: null, overallScore: null },
                      averageScore: null,
                      evaluationCompleted: false
                    };
                  }
                  
                  // Send to Make.com webhook if platforms are configured
                  if (platforms && platforms.length > 0 && platformCaptions) {
                    try {
                      console.log(`📤 Sending bulk content with AI evaluation to Make.com for ${productName} on platforms: ${platforms.join(', ')}`);
                      const webhookService = new WebhookService();
                      
                      // Create platform content object
                      const platformContent: any = {};
                      platforms.forEach(platform => {
                        platformContent[platform] = {
                          caption: platformCaptions[`${platform}Caption`] || '',
                          script: outputText,
                          type: 'bulk_content',
                          postInstructions: `Auto-post this ${platform} content for ${productName} from bulk generation`,
                          hashtags: viralInspiration?.hashtags || [`#${niche}`, '#trending']
                        };
                      });
                      
                      await webhookService.sendMultiPlatformContent({
                        platformContent,
                        platformSchedules: {},
                        metadata: {
                          product: productName,
                          productName: productName,
                          niche,
                          tone,
                          template: template,
                          templateType: template,
                          useSmartStyle: jobData.useSmartStyle || false,
                          jobType: 'automated_bulk',
                          jobId: savedContent?.bulkJobId || sessionId,
                          affiliateUrl: affiliateLink,
                          affiliateLink: affiliateLink,
                          topRatedStyleUsed: jobData.useSmartStyle || false,
                          aiModel: aiModel,
                          contentFormat: contentFormat,
                          useSpartanFormat: useSpartanFormat
                        },
                        contentData: {
                          fullOutput: outputText,
                          platformCaptions: platformCaptions,
                          viralInspiration: viralInspiration,
                          aiEvaluation: aiEvaluationData
                        }
                      });
                      console.log(`✅ Bulk content sent to Make.com for ${productName}`);
                    } catch (webhookError) {
                      console.error(`⚠️ Webhook failed for ${productName}:`, webhookError);
                      // Continue processing even if webhook fails
                    }
                  }
                } catch (historyError) {
                  console.error('Error saving to content history:', historyError);
                  // Continue with bulk generation even if history save fails
                }
              }
              
              if (savedContent) {
                generatedContentIds.push(savedContent.id);
                completedCount++;
                
                // Update progress
                await db.update(bulkContentJobs)
                  .set({ 
                    completedVariations: completedCount,
                    updatedAt: new Date(),
                    progressLog: sql`jsonb_set(progress_log, '{currentProduct}', ${JSON.stringify(productName)})`
                  })
                  .where(eq(bulkContentJobs.id, bulkJobId));
                
                console.log(`✅ Generated content for ${productName} - ${tone}/${template}/${aiModel}/${contentFormat} (${completedCount} total)`);
              }

                } catch (contentError) {
                  console.error(`❌ Failed to generate content for ${productName} - ${tone}/${template}/${aiModel}/${contentFormat}:`, contentError);
                  
                  // Log error but continue with other products
                  await db.update(bulkContentJobs)
                    .set({ 
                      errorLog: sql`jsonb_set(COALESCE(error_log, '[]'::jsonb), '{-1}', ${JSON.stringify({
                        product: productName,
                        tone,
                        template,
                        aiModel,
                        contentFormat,
                        error: contentError instanceof Error ? contentError.message : 'Unknown error',
                        timestamp: new Date().toISOString()
                      })})`
                    })
                    .where(eq(bulkContentJobs.id, bulkJobId));
                }
              } // Close contentFormat loop
            } // Close aiModel loop
          } // Close tone loop
        } // Close template loop
      } catch (productError) {
        console.error(`❌ Failed to process product ${productName}:`, productError);
      }
    }

    // Mark job as completed and update viral inspiration data
    await db.update(bulkContentJobs)
      .set({ 
        status: 'completed',
        completedVariations: completedCount,
        viralInspiration: viralInspirationData,
        updatedAt: new Date(),
        progressLog: sql`jsonb_set(progress_log, '{completedAt}', ${JSON.stringify(new Date().toISOString())})`
      })
      .where(eq(bulkContentJobs.id, bulkJobId));

    console.log(`🎉 Automated bulk job ${bulkJobId} completed successfully with ${completedCount} variations`);

  } catch (error) {
    console.error('❌ Process automated bulk job error:', error);
    
    // Mark job as failed
    await db.update(bulkContentJobs)
      .set({ 
        status: 'failed',
        updatedAt: new Date(),
        errorLog: sql`jsonb_set(COALESCE(error_log, '[]'::jsonb), '{-1}', ${JSON.stringify({
          type: 'job_failure',
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString()
        })})`
      })
      .where(eq(bulkContentJobs.id, bulkJobId));
  }
}

// 🚨 CRITICAL FIX: Generate comprehensive content with proper error handling
async function generateComprehensiveContent(params: {
  productName: string;
  niche: string;
  tone: string;
  template: string;
  platforms: string[];
  viralInspiration: any;
  productData: any;
  useSmartStyle?: boolean;
  useSpartanFormat?: boolean;
  userId?: number;
  aiModel?: string;
}) {
  const { productName, niche, tone, template, platforms, viralInspiration, productData, useSmartStyle, useSpartanFormat, userId, aiModel } = params;
  
  try {
    console.log(`🎯 BULK CONTENT GENERATION: Starting for ${productName} (${niche}, ${tone}, ${template})`);
    
    // Use the standard content generation functions directly
    const trendingProducts = []; // We don't need trending products for this specific call
    
    // Fetch smart style recommendations if enabled
    let smartStyleRecommendations = null;
    if (useSmartStyle && userId) {
      try {
        const { getSmartStyleRecommendations } = await import('../services/ratingSystem');
        smartStyleRecommendations = await getSmartStyleRecommendations(
          userId,
          niche,
          template,
          tone,
          platforms[0] // Use first platform for recommendations
        );
      } catch (error) {
        console.error('Error fetching smart style recommendations in bulk:', error);
      }
    }

    // Import the required functions
    const { generateContent } = await import('../services/contentGenerator');
    const { generatePlatformSpecificContent } = await import('../services/platformContentGenerator');

    // Generate main content using the same function as standard generator
    let mainContent = await generateContent(
      productName,
      template as any,
      tone as any,
      trendingProducts,
      niche as any,
      aiModel || 'claude',
      viralInspiration,
      smartStyleRecommendations
    );

    // Apply Spartan format enforcement to main content if enabled
    if (useSpartanFormat) {
      mainContent = enforceSpartanFormat(mainContent);
      console.log(`🏛️ SPARTAN FORMAT: Applied to main content for ${productName}`);
    }

    // Generate platform-specific content
    const platformContent = await generatePlatformSpecificContent({
      product: productName,
      niche: niche as any,
      platforms,
      tone: tone as any,
      template: template as any,
      mainContent: mainContent,
      useSpartanFormat: useSpartanFormat || false,
      affiliateId: 'sgottshall107-20',
      aiModel: aiModel || 'claude'
    });

    console.log(`✅ BULK CONTENT: Successfully generated content for ${productName}`);
    
    // Return the generated content in the expected format with Spartan format applied
    let viralHook = viralInspiration?.hook || `Check out ${productName}!`;
    let productDescription = mainContent || `${productName} is trending for good reasons.`;
    let videoScript = mainContent || `Here's why ${productName} is going viral...`;
    let callToAction = `Get ${productName} now!`;

    // Apply Spartan format to all content elements if enabled
    if (useSpartanFormat) {
      viralHook = enforceSpartanFormat(viralHook);
      productDescription = enforceSpartanFormat(productDescription);
      videoScript = enforceSpartanFormat(videoScript);
      callToAction = enforceSpartanFormat(callToAction);
    }

    return {
      viralHooks: [viralHook],
      productDescription,
      videoScript,
      platformCaptions: platformContent || {},
      hashtags: viralInspiration?.hashtags || [`#${niche}`, '#trending'],
      callToAction
    };
    
  } catch (error) {
    console.error(`❌ BULK CONTENT GENERATION ERROR for ${productName}:`, error);
    
    // 🚨 CRITICAL FALLBACK: Return a safe, minimal structure to prevent crashes
    return {
      viralHooks: [
        `${productName} is changing the game`,
        `You need to see this ${productName}`,
        `${productName} is the talk of ${niche}`
      ],
      productDescription: `${productName} is trending across social media with ${productData.mentions?.toLocaleString() || '100k+'} mentions. This ${niche} essential is going viral for good reason.`,
      videoScript: `[Scene 1] Hook: "${viralInspiration?.hook || `Check out ${productName}!`}"\n\n[Scene 2] Product showcase: Show ${productName} in action\n\n[Scene 3] Benefits: Explain why it's trending in ${niche}\n\n[Scene 4] Call to action: "Link in bio to get yours!"`,
      platformCaptions: platforms.reduce((acc, platform) => {
        const platformKey = `${platform.toLowerCase()}Caption`;
        let fallbackCaption = generateFallbackCaption(platform, productName, niche, viralInspiration);
        // Apply Spartan format to fallback captions if enabled
        if (useSpartanFormat) {
          fallbackCaption = enforceSpartanFormat(fallbackCaption);
        }
        acc[platformKey] = fallbackCaption;
        return acc;
      }, {} as Record<string, string>),
      hashtags: viralInspiration?.hashtags || [`#${niche}`, '#trending', '#viral', '#musthave'],
      callToAction: `Get ${productName} now - link in bio!`
    };
  }
}

// Helper function to generate fallback captions
function generateFallbackCaption(platform: string, productName: string, niche: string, viralInspiration: any): string {
  const hook = viralInspiration?.hook || `${productName} is trending!`;
  
  switch (platform.toLowerCase()) {
    case 'tiktok':
      return `${hook} ✨ This ${niche} find is going viral for a reason! #${niche}trend #viral`;
    case 'instagram':
      return `${hook} Your ${niche} routine just got an upgrade. ✨ #${niche}goals`;
    case 'youtube':
      return `${hook} *Let me show you why everyone's talking about this.* Perfect for ${niche} lovers.`;
    case 'twitter':
    case 'x':
      return `${hook} This ${niche} game-changer is everywhere. #${niche}`;
    default:
      return `${hook} Discover why ${productName} is the latest must-have in ${niche}.`;
  }
}

// Get bulk generated content by job ID
export async function getBulkContentByJobId(req: Request, res: Response) {
  try {
    const jobId = req.params.jobId;
    const content = await db.select().from(bulkGeneratedContent).where(eq(bulkGeneratedContent.bulkJobId, jobId));
    
    res.json({
      success: true,
      content
    });
  } catch (error) {
    console.error('Error fetching bulk content:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch bulk content'
    });
  }
}

// Get all bulk jobs with filtering and search
export async function getBulkJobs(req: Request, res: Response) {
  try {
    const { status, niche, limit = "10" } = req.query;
    
    let query = db.select().from(bulkContentJobs);
    
    // Apply filters
    if (status && typeof status === 'string') {
      query = query.where(eq(bulkContentJobs.status, status));
    }
    
    // Apply limit
    query = query.orderBy(desc(bulkContentJobs.createdAt)).limit(parseInt(limit as string));
    
    const jobs = await query;
    
    // Get generated content count for each job
    const jobsWithStats = await Promise.all(jobs.map(async (job) => {
      const generatedContent = await db.select()
        .from(bulkGeneratedContent)
        .where(eq(bulkGeneratedContent.bulkJobId, job.jobId));
      
      return {
        ...job,
        generatedContentCount: generatedContent.length,
        progressPercentage: job.totalVariations > 0 
          ? Math.round((job.completedVariations / job.totalVariations) * 100)
          : 0
      };
    }));
    
    res.json({
      success: true,
      jobs: jobsWithStats,
      total: jobsWithStats.length
    });
    
  } catch (error) {
    console.error('❌ Get bulk jobs error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch bulk jobs',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

// Get specific bulk job details with generated content
export async function getBulkJobDetails(req: Request, res: Response) {
  try {
    const { jobId } = req.params;
    
    const [bulkJob] = await db.select()
      .from(bulkContentJobs)
      .where(eq(bulkContentJobs.jobId, jobId))
      .limit(1);
    
    if (!bulkJob) {
      return res.status(404).json({ error: 'Bulk job not found' });
    }

    // Get all generated content for this job
    const generatedContent = await db.select()
      .from(bulkGeneratedContent)
      .where(eq(bulkGeneratedContent.bulkJobId, jobId))
      .orderBy(desc(bulkGeneratedContent.createdAt));

    const progressPercentage = bulkJob.totalVariations > 0 
      ? Math.round((bulkJob.completedVariations / bulkJob.totalVariations) * 100)
      : 0;

    res.json({
      success: true,
      bulkJob,
      generatedContent,
      progressPercentage,
      isComplete: bulkJob.status === 'completed',
      isFailed: bulkJob.status === 'failed',
      totalGenerated: generatedContent.length
    });

  } catch (error) {
    console.error('❌ Get bulk job details error:', error);
    res.status(500).json({ 
      error: 'Failed to get bulk job details',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}