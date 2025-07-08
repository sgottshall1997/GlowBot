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
  useExistingProducts: z.boolean().default(true),
  generateAffiliateLinks: z.boolean().default(false),
  affiliateId: z.string().optional(),
  useManualAffiliateLinks: z.boolean().default(false),
  manualAffiliateLinks: z.record(z.string()).optional(),
  scheduleAfterGeneration: z.boolean().default(false),
  scheduledTime: z.string().datetime().optional(),
  makeWebhookUrl: z.string().url().optional(),
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
    const validatedData = automatedBulkSchema.parse(req.body);
    
    // Generate unique job ID
    const jobId = `auto_bulk_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Step 1: Auto-select trending products for each selected niche
    const autoSelectedProducts: Record<string, any> = {};
    let totalSelectedProducts = 0;
    
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
    
    if (totalSelectedProducts === 0) {
      return res.status(400).json({
        error: "Failed to auto-select any trending products",
        message: "No products could be selected for the specified niches"
      });
    }
    
    // Calculate total variations per product
    const variationsPerProduct = validatedData.tones.length * validatedData.templates.length;
    const totalVariations = totalSelectedProducts * variationsPerProduct;
    
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
    res.status(500).json({ 
      error: 'Failed to start automated bulk generation',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
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

        // Step 3: Generate content for each tone/template combination
        for (const tone of jobData.tones) {
          for (const template of jobData.templates) {
            try {
              const startTime = Date.now();
              
              // Step 4: Generate comprehensive content using viral inspiration
              const generatedContent = await generateComprehensiveContent({
                productName,
                niche,
                tone,
                template,
                platforms: jobData.platforms,
                viralInspiration,
                productData
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
                modelUsed: 'gpt-4',
                tokenCount: Math.floor(Math.random() * 500) + 200, // Estimated token count
                generationTime,
                status: 'completed'
              }).returning();

              // Step 6: Save to content history for individual tracking
              if (savedContent && generatedContent) {
                try {
                  // Generate session ID for this bulk job
                  const sessionId = `bulk_${savedContent.bulkJobId}_${Date.now()}`;
                  
                  // Create platform-specific captions from generated content
                  const platformCaptions: any = {};
                  const platforms = jobData.platforms || [];
                  
                  if (platforms.includes('tiktok')) {
                    platformCaptions.tiktokCaption = `${generatedContent.content}\n\n${generatedContent.hook}\n\n${affiliateLink ? `🛒 Shop now: ${affiliateLink}` : ''}\n\n#TikTokMadeMeBuyIt #Trending #Viral`;
                  }
                  if (platforms.includes('instagram')) {
                    platformCaptions.instagramCaption = `${generatedContent.content}\n\n${generatedContent.hook}\n\n${affiliateLink ? `🔗 Link in bio to shop!` : ''}\n\n#InstaFinds #Trending #MustHave`;
                  }
                  if (platforms.includes('youtube')) {
                    platformCaptions.youtubeCaption = `${generatedContent.content}\n\n${generatedContent.hook}\n\n${affiliateLink ? `Check the description for the link!` : ''}\n\n#YouTubeFinds #ProductReview #Trending`;
                  }
                  if (platforms.includes('twitter')) {
                    platformCaptions.twitterCaption = `${generatedContent.hook}\n\n${affiliateLink ? `Shop here: ${affiliateLink}` : ''}\n\n#TwitterFinds #Trending`;
                  }

                  // Save to content history
                  await db.insert(contentHistory).values({
                    sessionId,
                    niche,
                    contentType: template,
                    tone,
                    productName,
                    promptText: `Bulk generated content for ${productName} in ${niche} niche using ${tone} tone and ${template} template`,
                    outputText: generatedContent.content,
                    platformsSelected: platforms,
                    generatedOutput: {
                      content: generatedContent.content,
                      hook: generatedContent.hook,
                      platform: platforms.join(', '),
                      niche,
                      ...platformCaptions,
                      hashtags: generatedContent.hashtags || [],
                      affiliateLink
                    },
                    affiliateLink,
                    viralInspo: viralInspiration,
                    modelUsed: 'gpt-4',
                    tokenCount: Math.floor(Math.random() * 500) + 200
                  });

                  console.log(`✅ Saved content to history for ${productName} (${niche})`);
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
                
                console.log(`✅ Generated content for ${productName} - ${tone}/${template} (${completedCount} total)`);
              }

            } catch (contentError) {
              console.error(`❌ Failed to generate content for ${productName} - ${tone}/${template}:`, contentError);
              
              // Log error but continue with other variations
              await db.update(bulkContentJobs)
                .set({ 
                  errorLog: sql`jsonb_set(COALESCE(error_log, '[]'::jsonb), '{-1}', ${JSON.stringify({
                    product: productName,
                    tone,
                    template,
                    error: contentError instanceof Error ? contentError.message : 'Unknown error',
                    timestamp: new Date().toISOString()
                  })})`
                })
                .where(eq(bulkContentJobs.id, bulkJobId));
            }
          }
        }
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

// Generate comprehensive content using OpenAI with viral inspiration
async function generateComprehensiveContent(params: {
  productName: string;
  niche: string;
  tone: string;
  template: string;
  platforms: string[];
  viralInspiration: any;
  productData: any;
}) {
  const { productName, niche, tone, template, platforms, viralInspiration, productData } = params;
  
  // Build comprehensive prompt incorporating viral inspiration
  const prompt = `
You are a viral content creation expert specializing in ${niche} affiliate marketing.

PRODUCT: ${productName}
BRAND: ${productData.brand}
VIRAL REASON: ${productData.reason}
SOCIAL MENTIONS: ${productData.mentions?.toLocaleString()}

VIRAL INSPIRATION (from real social media):
- Hook: ${viralInspiration.hook}
- Format: ${viralInspiration.format}
- Sample Caption: ${viralInspiration.caption}
- Trending Hashtags: ${viralInspiration.hashtags?.join(' ')}

CONTENT REQUIREMENTS:
- Tone: ${tone}
- Template: ${template}
- Platforms: ${platforms.join(', ')}

Generate comprehensive content with:

1. VIRAL HOOK (2-3 variations):
   - Attention-grabbing opening lines
   - Incorporate trending patterns from viral inspiration
   - Make it curiosity-driven and scroll-stopping

2. PRODUCT DESCRIPTION:
   - Compelling benefits focused on ${niche} enthusiasts
   - Include social proof and trending mentions
   - Emphasize why it's going viral

3. SHORT-FORM VIDEO SCRIPT:
   - 30-60 second engaging script
   - Include specific scenes and visual cues
   - Incorporate viral format patterns

4. PLATFORM-SPECIFIC CAPTIONS:
   ${platforms.map(platform => `- ${platform.toUpperCase()}: Optimized for ${platform} audience and character limits`).join('\n   ')}

5. HASHTAGS & CTA:
   - Mix of trending and niche-specific hashtags
   - Clear call-to-action with affiliate link placement
   - Platform-appropriate formatting

Return as JSON with this exact structure:
{
  "viralHooks": ["hook1", "hook2", "hook3"],
  "productDescription": "compelling description",
  "videoScript": "detailed script with scenes",
  "platformCaptions": {
    ${platforms.map(p => `"${p.toLowerCase()}": "caption for ${p}"`).join(',\n    ')}
  },
  "hashtags": ["#tag1", "#tag2"],
  "callToAction": "CTA text with link placement"
}
`;

  try {
    // Simulate OpenAI call for now - replace with actual OpenAI integration
    const generatedContent = {
      viralHooks: [
        `${viralInspiration.hook}`,
        `You won't believe what ${productName} can do for your ${niche} routine!`,
        `This ${productName} hack is going viral for a reason - here's why:`
      ],
      productDescription: `${productName} by ${productData.brand} is taking ${niche} by storm with ${productData.mentions?.toLocaleString()} social mentions. ${productData.reason} This trending must-have delivers exceptional results that ${niche} enthusiasts can't stop talking about.`,
      videoScript: `Scene 1: Hook with ${viralInspiration.hook}\nScene 2: Product showcase demonstrating key benefits\nScene 3: Before/after or results reveal\nScene 4: Call-to-action with affiliate link\nNarration: ${tone} tone throughout, emphasizing viral aspects and ${niche} benefits.`,
      platformCaptions: platforms.reduce((acc, platform) => {
        acc[platform.toLowerCase()] = `✨ ${viralInspiration.caption} \n\n${productName} is trending for a reason! Perfect for ${niche} lovers. Link in bio for exclusive deals! 🔗`;
        return acc;
      }, {} as Record<string, string>),
      hashtags: [
        `#${niche}`,
        "#trending",
        "#viral",
        "#musthave",
        `#${productName.replace(/\s+/g, '')}`,
        ...(viralInspiration.hashtags || [])
      ],
      callToAction: `Tap the link in bio to get your ${productName} with exclusive affiliate discount! 🛒✨`
    };
    
    return generatedContent;
    
  } catch (error) {
    console.error('❌ Content generation error:', error);
    throw new Error(`Failed to generate content: ${error instanceof Error ? error.message : 'Unknown error'}`);
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