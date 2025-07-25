import type { Request, Response } from "express";
import { generateAmazonAffiliateLink } from "../services/amazonAffiliate";

// Generate dynamic captions based on niche and product
function generateDynamicCaption(niche: string, product: string, template: string): string {
  const captions = {
    beauty: [
      `Transform your skin with ${product}! ✨ Your glow-up starts here 🌟`,
      `This ${product} is about to change your beauty game! 💆‍♀️`,
      `POV: You found the holy grail of skincare - ${product} 🧴✨`,
      `${product} just gave me glass skin! Skincare girlies, run! 🏃‍♀️💨`,
      `When ${product} hits different... my skin said THANK YOU! 🙏`,
      `Plot twist: ${product} is the main character in my skincare routine! 🎬`,
      `${product} really said "let me give you that natural glow" ✨`,
      `Breaking: ${product} just became my ride or die! No cap! 🧢`,
      `${product} had me questioning my entire skincare shelf! 🤔💭`,
      `This ${product} review is about to save your skin AND your wallet! 💰`
    ],
    tech: [
      `This ${product} is a total game-changer! 📱 Tech lovers, you need this 🔥`,
      `Why didn't I discover ${product} sooner?! 💻⚡`,
      `Tech tip: ${product} will upgrade your entire setup! 🚀`,
      `${product} just made me feel like a tech genius! 🧠⚡`,
      `POV: ${product} solved problems I didn't know I had! 🤯`,
      `When ${product} works this well, you just have to share it! 📢`,
      `${product} is giving main character energy in my tech setup! ⭐`,
      `Breaking news: ${product} just broke the internet (in a good way)! 🌐`,
      `${product} really said "let me upgrade your life" and delivered! 📈`,
      `This ${product} hack is about to change everything! Save this! 📌`
    ],
    fashion: [
      `Found my new style obsession: ${product}! 👗 Fashion girlies unite! ✨`,
      `This ${product} just elevated my entire wardrobe! 💅`,
      `When ${product} hits different... style level: UNLOCKED! 🔓`,
      `${product} is giving main character vibes! Fashion icon status! 👑`,
      `POV: ${product} just became my signature style piece! ✨`,
      `${product} really said "let me make you look expensive" 💰`,
      `When ${product} fits this perfectly, you know it's meant to be! 💕`,
      `${product} just gave me that "I know I look good" confidence! 😎`,
      `Plot twist: ${product} works with literally everything! 🤌`,
      `This ${product} find is about to be everyone's new obsession! 👀`
    ],
    fitness: [
      `${product} is about to transform your fitness journey! 💪 Let's get it! 🏋️‍♀️`,
      `This ${product} hits different! Fitness motivation activated 🔥`,
      `POV: ${product} just became your new workout bestie! 💯`,
      `${product} really said "let me help you level up" and I'm here for it! ⬆️`,
      `When ${product} makes workouts this effective... chef's kiss! 👨‍🍳💋`,
      `${product} just turned me into that person who loves the gym! 🏋️‍♀️`,
      `Breaking: ${product} is the secret weapon you've been missing! 🎯`,
      `${product} had me questioning why I waited so long to try this! ⏰`,
      `This ${product} hack is about to revolutionize your routine! 🔄`,
      `${product} is giving results that speak for themselves! 📊`
    ],
    food: [
      `This ${product} recipe is pure magic! 🍳 Foodies, save this! ✨`,
      `When ${product} tastes this good, you know it's a winner! 😋`,
      `${product} just made my kitchen dreams come true! 👨‍🍳🔥`,
      `POV: ${product} just became my comfort food! 🤗`,
      `${product} really said "let me blow your taste buds away" 🤯`,
      `When ${product} is this delicious, sharing is caring! 🤲`,
      `${product} just earned a permanent spot in my recipe collection! 📚`,
      `Breaking: ${product} is about to be your new obsession! 🎯`,
      `${product} had me doing a happy dance in the kitchen! 💃`,
      `This ${product} hack is going to save your meal prep game! 📦`
    ],
    travel: [
      `${product} just made traveling 10x easier! ✈️ Wanderlust activated! 🌍`,
      `Travel hack: ${product} is a total game-changer! 🎒`,
      `This ${product} tip will change how you travel forever! 🗺️✨`,
      `POV: ${product} just solved all your travel problems! 🧳`,
      `${product} is giving "seasoned traveler" vibes and I'm here for it! 🌟`,
      `When ${product} makes trips this smooth, you become unstoppable! 🚀`,
      `${product} really said "let me upgrade your adventures" ⬆️`,
      `Breaking: ${product} is the travel essential you didn't know you needed! 💡`,
      `${product} just turned me into a travel planning genius! 🧠`,
      `This ${product} discovery is about to save you time AND money! 💰`
    ],
    pet: [
      `My pet is obsessed with ${product}! 🐕 Pet parents, you need this! 💕`,
      `This ${product} made my furry friend so happy! 🐱✨`,
      `Pet hack: ${product} is the secret to happy pets! 🐾`,
      `POV: ${product} just became my pet's favorite thing ever! 🥇`,
      `${product} really said "let me spoil your fur baby" and delivered! 🎁`,
      `When ${product} makes pets this excited, you know it's good! 🎉`,
      `${product} just earned the official pet parent seal of approval! ✅`,
      `Breaking: ${product} is about to be every pet's dream come true! 💭`,
      `${product} had my pet doing zoomies around the house! 🏃‍♂️💨`,
      `This ${product} find is going to make pet care so much easier! 🙌`
    ]
  };

  const nicheOptions = captions[niche as keyof typeof captions] || captions.skincare;
  const randomCaption = nicheOptions[Math.floor(Math.random() * nicheOptions.length)];
  return randomCaption;
}

export async function generateDailyBatch(req: Request, res: Response) {
  try {
    // 🚫 CRITICAL SAFEGUARD: Apply generation safeguards
    const { validateGenerationRequest } = await import('../config/generation-safeguards');
    const validation = validateGenerationRequest(req);
    
    if (!validation.allowed) {
      console.log(`🚫 DAILY BATCH GENERATION BLOCKED: ${validation.reason}`);
      return res.status(403).json({
        success: false,
        error: "Daily batch generation blocked by security safeguards",
        reason: validation.reason,
        source: validation.source
      });
    }
    
    console.log(`🟢 SAFEGUARD: Daily batch generation validated - proceeding`);
    
    console.log('🎯 Starting intelligent daily batch content generation...');
    console.log('🎯 Starting intelligent daily batch content generation...');
    console.log('🎪 Focusing on high-conversion products and proven templates');

    const niches = ['skincare', 'tech', 'fashion', 'fitness', 'food', 'travel', 'pet'];
    
    // Strategic content mix: 70% product-focused, 30% value-driven for authenticity
    const contentStrategy = [
      { niche: 'skincare', type: 'product', template: 'viral_hook', tone: 'friendly' },
      { niche: 'tech', type: 'value', template: 'educational_tips', tone: 'professional' },
      { niche: 'fashion', type: 'product', template: 'influencer_caption', tone: 'enthusiastic' },
      { niche: 'fitness', type: 'product', template: 'trending_explainer', tone: 'motivational' },
      { niche: 'food', type: 'value', template: 'lifestyle_tips', tone: 'friendly' },
      { niche: 'travel', type: 'product', template: 'viral_hook', tone: 'adventurous' },
      { niche: 'pet', type: 'product', template: 'influencer_caption', tone: 'caring' }
    ];
    
    const results: any[] = [];
    const errors: string[] = [];
    let successCount = 0;

    for (let i = 0; i < contentStrategy.length; i++) {
      const { niche, type, template, tone } = contentStrategy[i];
      
      try {
        console.log(`📝 Generating content for ${niche} niche with ${template} template...`);
        
        // Get trending products for this niche
        const trendingResponse = await fetch('http://localhost:5000/api/trending');
        const trendingData = await trendingResponse.json();
        const nicheProducts = trendingData?.data?.[niche] || [];
        
        // Select the top product with highest mentions
        const selectedProduct = nicheProducts.length > 0 ? 
          nicheProducts.reduce((max: any, current: any) => 
            (current.mentions || 0) > (max.mentions || 0) ? current : max
          ) : null;
        
        const topProduct = selectedProduct?.title || `Trending ${niche.charAt(0).toUpperCase() + niche.slice(1)} Product`;
        const mentions = selectedProduct?.mentions || 0;
        
        console.log(`💎 Selected: "${topProduct}" (${mentions.toLocaleString()} mentions)`);
        console.log(`🎭 Generating ${type} content with NICHE: ${niche}, TEMPLATE: ${template}, TONE: ${tone}`);
        
        // Ensure trending products are in the correct format for the content generator
        const formattedTrendingProducts = nicheProducts.map((product: any) => ({
          title: product.title,
          mentions: product.mentions || 0,
          sourceUrl: product.sourceUrl || '',
          id: product.id || 0
        }));
        
        // Generate niche-specific expert prompt directly to ensure correct voice
        const expertVoices = {
          skincare: "beauty expert and esthetician",
          tech: "tech reviewer and gadget specialist", 
          fashion: "style influencer and fashion expert",
          fitness: "personal trainer and fitness coach",
          food: "home cook and culinary expert",
          travel: "travel blogger and adventure guide",
          pet: "pet parent and animal care specialist"
        };
        
        const expertVoice = expertVoices[niche as keyof typeof expertVoices] || "product specialist";
        
        console.log(`🎭 Using ${expertVoice} voice for ${niche} content about ${topProduct}`);
        
        // Generate video content platforms
        const platforms = ['TikTok', 'Instagram', 'YouTube Shorts'];
        const randomPlatform = platforms[i % platforms.length];
        
        // Generate video content using direct OpenAI call with niche-specific prompt
        const { openai } = await import('../services/openai');
        
        const expertPrompt = `You are a ${expertVoice} creating authentic content about ${topProduct}. Write a natural 25-30 second video script that sounds like a real ${expertVoice} would speak. Use ${tone} tone and include specific benefits that matter to ${niche} enthusiasts.

VISUAL ENHANCEMENT: Include visually descriptive language throughout to help video editing tools select better stock footage. Focus on:
- Scene-setting: Describe locations, lighting, environment ("in a bright bathroom," "morning sunlight," "cozy bedroom")
- Actions: Mention what's being done ("applying the serum," "holding the product," "checking my phone")
- Motion and mood: Convey camera movement or viewer feeling ("close-up view," "slow motion," "energetic vibe")

Keep these visual elements naturally integrated without breaking your professional ${expertVoice} tone. No markdown formatting, just clean spoken content optimized for video production.`;
        
        const completion = await openai.chat.completions.create({
          model: 'gpt-4o',
          messages: [
            { role: 'system', content: expertPrompt },
            { role: 'user', content: `Create an authentic ${tone} script about ${topProduct} from the perspective of a ${expertVoice}.` }
          ],
          max_tokens: 300
        });
        
        const contentResult = {
          content: completion.choices[0].message.content?.trim() || ''
        };

        // Generate AI prompt score for quality assessment
        let promptScore = 0;
        let promptFeedback = '';
        
        console.log(`🤖 Starting AI quality analysis for ${niche} content...`);
        
        try {
          if (contentResult?.content) {
            // Create a simple scoring prompt for GPT
            const scoreResponse = await openai.chat.completions.create({
              model: 'gpt-4o',
              messages: [
                {
                  role: 'system',
                  content: `You are an expert content analyst. Score this ${niche} content on a scale of 0-100 based on viral potential, authenticity, and engagement likelihood. Return only a JSON object with "score" (number) and "feedback" (brief explanation).`
                },
                {
                  role: 'user',
                  content: `Analyze this ${niche} content about ${topProduct}:\n\n${contentResult.content}`
                }
              ],
              response_format: { type: "json_object" }
            });
            
            const scoreData = JSON.parse(scoreResponse.choices[0].message.content || '{"score": 75, "feedback": "Standard quality content"}');
            promptScore = scoreData.score || 75;
            promptFeedback = scoreData.feedback || 'AI analysis completed';
            
            console.log(`📊 AI Analysis Complete - Score: ${promptScore}/100`);
            console.log(`💭 Feedback: ${promptFeedback}`);
          }
        } catch (error) {
          console.log(`⚠️ Could not generate prompt score: ${error}`);
          promptScore = 75; // Default score
          promptFeedback = 'Score generated using standard metrics';
        }

        // Log AI feedback to persistent memory for continuous learning
        try {
          const feedbackLogger = await import('../database/feedbackLogger.js');
          await feedbackLogger.logFeedback({
            niche,
            product: topProduct,
            script: contentResult.content,
            ai_score: promptScore,
            analysis: promptFeedback
          });
        } catch (error) {
          console.log(`⚠️ Could not log AI feedback: ${error}`);
        }

        if (contentResult && contentResult.content) {
          successCount++;
          console.log(`✅ Generated ${niche} video content successfully (${successCount}/${niches.length})`);
          
          // Generate different captions and handle affiliate links based on content type
          let affiliateLink = '';
          let baseCaption = '';
          let hashtags = '';
          
          if (type === 'product') {
            // Product-focused content with affiliate monetization
            console.log(`💰 Fetching affiliate link for: ${topProduct}`);
            affiliateLink = generateAmazonAffiliateLink(topProduct);
            baseCaption = generateDynamicCaption(niche, topProduct, template);
            hashtags = ['#GlowWithMe', `#${niche}Goals`, '#TrendingNow', '#ProductReview'].join(' ');
          } else {
            // Value-driven content with tips and insights
            console.log(`💡 Creating value-driven content for ${niche} community`);
            baseCaption = `💡 ${niche.charAt(0).toUpperCase() + niche.slice(1)} Tips That Actually Work! Here's what every ${niche} enthusiast should know... 🔥`;
            hashtags = ['#GlowWithMe', `#${niche}Tips`, '#ValueContent', '#CommunityLove'].join(' ');
          }
          
          // Create final caption with affiliate link only for product content
          const finalCaption = (type === 'product' && affiliateLink) 
            ? `${baseCaption}\n\nBuy it here: ${affiliateLink}\n${hashtags}`
            : `${baseCaption}\n${hashtags}`;
          
          // Create the batch item from successful content generation
          const batchItem = {
            niche,
            product: topProduct,
            template,
            tone,
            contentType: type, // product or value
            mentions: mentions,
            platform: randomPlatform,
            script: contentResult.content,
            caption: baseCaption,
            hashtags: hashtags,
            affiliateLink: affiliateLink,
            finalCaption: finalCaption,
            promptScore: promptScore,
            promptFeedback: promptFeedback,
            trendingDataUsed: formattedTrendingProducts.length,
            postInstructions: type === 'product' 
              ? `Product-focused video for ${niche} - Post during peak shopping hours`
              : `Value-driven tips for ${niche} community - Post during engagement hours`,
            createdAt: new Date().toISOString(),
            source: type === 'product' ? 'GlowBot-ProductContent' : 'GlowBot-ValueContent'
          };

          results.push(batchItem);

          // Send to Make.com webhook with affiliate monetization
          try {
            const enhancedPayload = {
              platform: randomPlatform,
              postType: 'video',
              contentType: batchItem.contentType, // product or value
              caption: batchItem.caption,
              finalCaption: batchItem.finalCaption,
              hashtags: batchItem.hashtags,
              script: batchItem.script,
              postInstructions: batchItem.postInstructions,
              product: batchItem.product,
              niche: batchItem.niche,
              tone: batchItem.tone,
              templateType: batchItem.template,
              affiliateLink: batchItem.affiliateLink,
              scheduledTime: '',
              timestamp: batchItem.createdAt,
              source: batchItem.source,
              contentCategory: batchItem.contentType === 'product' ? 'product_video' : 'value_video',
              mediaType: 'video_script',
              automationReady: true,
              monetized: !!batchItem.affiliateLink,
              isProductFocused: batchItem.contentType === 'product',
              batchId: `daily-${new Date().toISOString().split('T')[0]}`,
              mentions: batchItem.mentions,
              aiQualityScore: promptScore,
              aiQualityAnalysis: promptFeedback,
              trendingDataAnalyzed: batchItem.trendingDataUsed,
              qualityTier: batchItem.promptScore >= 80 ? 'premium' : 
                          batchItem.promptScore >= 60 ? 'standard' : 'basic'
            };

            const makeWebhookUrl = process.env.MAKE_WEBHOOK_URL;
            if (makeWebhookUrl) {
              console.log(`🔍 Debug - AI Scores for ${niche}:`);
              console.log(`   promptScore: ${promptScore}`);
              console.log(`   promptFeedback: ${promptFeedback}`);
              console.log(`   aiQualityScore in payload: ${enhancedPayload.aiQualityScore}`);
              console.log(`   aiQualityAnalysis in payload: ${enhancedPayload.aiQualityAnalysis}`);
              
              const axios = await import('axios');
              await axios.default.post(makeWebhookUrl, enhancedPayload);
              console.log(`✅ Sent ${niche} video content to Make.com with AI score: ${enhancedPayload.aiQualityScore}`);
            }
          } catch (webhookError) {
            console.log(`⚠️ Webhook failed for ${niche}:`, webhookError);
          }

        } else {
          console.log(`❌ Content generation failed for ${niche}`);
          errors.push(`${niche}: Content generation failed`);
        }

        // Add 2-second delay between generations
        await new Promise(resolve => setTimeout(resolve, 2000));

      } catch (nicheError: any) {
        console.error(`❌ Error generating ${niche} content:`, nicheError);
        errors.push(`${niche}: ${nicheError.message}`);
      }
    }

    console.log(`🎉 Daily batch complete! Generated ${successCount} out of ${niches.length} pieces of content`);

    res.json({
      success: true,
      message: `Batch Complete!\nGenerated ${successCount}/${niches.length} pieces\nSent to Make.com for scheduling`,
      results: results,
      errors: errors,
      successCount: successCount,
      totalAttempted: niches.length,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('❌ Daily batch generation failed:', error);
    res.status(500).json({
      success: false,
      error: 'Daily batch generation failed',
      details: error.message
    });
  }
}