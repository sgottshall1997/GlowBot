import OpenAI from 'openai';
import { generateWithAI, AIModel } from './aiModelRouter';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface PlatformContentRequest {
  product: string;
  niche: string;
  platforms: string[];
  contentType: "video" | "photo";
  templateType: string;
  tone: string;
  videoDuration?: string;
  trendingData?: any;
  useSpartanFormat?: boolean;
  aiModel?: AIModel;
}

interface PlatformSpecificContent {
  videoScript?: string;
  photoDescription?: string;
  socialCaptions: {
    [platform: string]: {
      caption: string;
      postInstructions: string;
    };
  };
}

// Check content similarity using simple word overlap
function checkContentSimilarity(content1: string, content2: string): number {
  const words1 = content1.toLowerCase().split(/\s+/).filter(w => w.length > 3);
  const words2 = content2.toLowerCase().split(/\s+/).filter(w => w.length > 3);
  
  const intersection = words1.filter(word => words2.includes(word));
  const union = [...new Set([...words1, ...words2])];
  
  return union.length > 0 ? (intersection.length / union.length) * 100 : 0;
}

// Generate Amazon affiliate link
function generateAmazonAffiliateLink(productName: string, affiliateId: string = "sgottshall107-20"): string {
  // Create a search-friendly version of the product name
  const searchQuery = encodeURIComponent(productName.replace(/\s+/g, ' ').trim());
  return `https://www.amazon.com/s?k=${searchQuery}&tag=${affiliateId}`;
}

// Reusable function for generating platform-specific captions
export async function generatePlatformCaptions(params: {
  productName: string;
  platforms: string[];
  tone: string;
  niche: string;
  mainContent?: string;
  viralInspiration?: any;
  bestRatedStyle?: any;
  enforceCaptionUniqueness?: boolean;
  affiliateId?: string;
  useSpartanFormat?: boolean;
  aiModel?: AIModel;
}): Promise<Record<string, string>> {
  const { productName, platforms, tone, niche, mainContent, viralInspiration, enforceCaptionUniqueness = true, affiliateId = "sgottshall107-20", useSpartanFormat = false, aiModel = "chatgpt" } = params;
  
  console.log(`🎯 Generating platform captions for: ${platforms.join(", ")}`);
  console.log(`🏛️ Spartan format enabled: ${useSpartanFormat}`);
  
  // Build specialized prompt for platform caption generation
  let prompt = `Generate UNIQUE, PLATFORM-NATIVE captions for ${productName} (${niche} niche)${useSpartanFormat ? ' using SPARTAN FORMAT' : ` using ${tone} tone`}.

${useSpartanFormat ? `SPARTAN FORMAT REQUIREMENTS:
- Use direct, factual language only
- No emojis, metaphors, or filler words
- Each platform caption = 4 paragraphs max 50 words:
  1. Product summary (2-3 sentences)
  2. Friendly CTA (e.g., "Want results? Try it.")
  3. Link encouragement ("Check our bio for purchase info")
  4. 5 relevant hashtags
- Tone overridden by Spartan format requirements

CRITICAL REQUIREMENTS:` : 'CRITICAL REQUIREMENTS:'}
- Each platform caption MUST be written INDEPENDENTLY from scratch
- DO NOT reference, summarize, or adapt the main product description
- Each caption should be 70%+ different in structure, words, and approach
- Focus on platform-native language, tone, and engagement strategies
- NEVER reuse phrases or closely paraphrase existing content

${mainContent ? `\nAVOID REPEATING THIS CONTENT: "${typeof mainContent === 'string' ? mainContent.substring(0, 200) : JSON.stringify(mainContent).substring(0, 200)}..."` : ''}

PLATFORM-SPECIFIC REQUIREMENTS:
`;

  const platformPrompts = useSpartanFormat ? {
    tiktok: `Write a direct, no-fluff TikTok caption for "${productName}". Use factual language only. NO emojis, metaphors, or filler words. 4 paragraphs max 50 words: 1) Product summary, 2) Simple CTA, 3) Link direction, 4) 5 hashtags. DO NOT reuse main product description.`,
    instagram: `Write a direct, professional Instagram caption for "${productName}". Use factual language only. NO emojis, metaphors, or filler words. 4 paragraphs max 50 words: 1) Product summary, 2) Simple CTA, 3) Link direction, 4) 5 hashtags. DO NOT copy main product description.`,
    youtube: `Write a direct YouTube description for "${productName}". Use factual language only. NO emojis, metaphors, or filler words. 4 paragraphs max 50 words: 1) Product summary, 2) Simple CTA, 3) Link direction, 4) 5 hashtags. DO NOT reuse main content.`,
    twitter: `Write a direct Twitter post for "${productName}". Use factual language only. NO emojis, metaphors, or filler words. Under 280 characters. Include 1-2 hashtags. End with simple link reference. DO NOT reuse original content.`,
    other: `Write direct, professional content for "${productName}". Use factual language only. NO emojis, metaphors, or filler words. 4 paragraphs max 50 words: 1) Product summary, 2) Simple CTA, 3) Link direction, 4) 5 hashtags. DO NOT copy main description.`
  } : {
    tiktok: `Write a short, punchy TikTok caption for "${productName}". Use slang, emojis (4-6), and Gen Z tone with viral hooks like "POV:", "No bc", "Tell me why". DO NOT reuse or reword the main product description. Add a strong hook and end with a clear CTA like "Get yours at the link in my bio!" or "Tap the link to buy now!"`,
    instagram: `Write a polished, aesthetic Instagram caption for "${productName}". Use lifestyle language, light emojis (2-3), and hashtags. Sound like a lifestyle influencer. DO NOT copy or paraphrase the main product description. End with a clear CTA like "Link in bio to shop!" or "Get yours through my bio link!"`,
    youtube: `Write a YouTube Shorts description that sounds like a voiceover script for "${productName}". Aim for informative but casual tone with emphasis markers (*asterisks*). Include hashtags. DO NOT reuse the full content output. End with "Check the description for the link to buy!"`,
    twitter: `Write a clever, short X (Twitter) post about "${productName}". Include a bold claim or hot take under 280 characters. DO NOT reuse the original content. Include 1-2 trending hashtags. End with "Link below to buy 👇"`,
    other: `Write professional content for "${productName}" suitable for blogs, newsletters, or email marketing. Use business-appropriate tone. DO NOT copy from the main description. Include a clear call-to-action to purchase with "Click here to buy on Amazon"`
  };

  platforms.forEach(platform => {
    const instruction = platformPrompts[platform.toLowerCase()] || platformPrompts.other;
    prompt += `\n\n${platform.toUpperCase()}: ${instruction}`;
  });

  if (viralInspiration) {
    prompt += `\n\nVIRAL CONTEXT (for inspiration only, don't copy): ${viralInspiration.caption || ''}`;
  }

  prompt += `\n\nRespond with ONLY a JSON object in this format:
{
  ${platforms.map(p => `"${p.toLowerCase()}": "caption text here"`).join(',\n  ')}
}`;

  let attempts = 0;
  const maxAttempts = 2;
  
  while (attempts < maxAttempts) {
    try {
      const aiResponse = await generateWithAI(prompt, {
        model: aiModel,
        temperature: 0.9,
        systemPrompt: "You are an expert social media strategist who creates platform-native content. Each platform caption must be completely original, independent, and never repeat existing content.",
        maxTokens: 1000,
        useJson: true,
        metadata: {
          platforms: platforms.join(', '),
          niche,
          productName
        }
      });

      if (!aiResponse.success) {
        console.error('AI Response Error Details:', aiResponse.error);
        const errorMessage = typeof aiResponse.error === 'string' ? aiResponse.error : 
                            typeof aiResponse.error === 'object' ? JSON.stringify(aiResponse.error) : 
                            'Unknown error';
        throw new Error(`AI generation failed: ${errorMessage}`);
      }
      
      // CRITICAL FIX: Handle Claude response structure which uses aiResponse.content.content
      let extractedContent = null;
      
      if (aiResponse.success && aiResponse.content && aiResponse.content.content) {
        // Claude response structure: aiResponse.content.content
        extractedContent = aiResponse.content.content;
        console.log('✅ CLAUDE RESPONSE: Extracted content from aiResponse.content.content');
      } else if (aiResponse.data) {
        // ChatGPT response structure: aiResponse.data
        extractedContent = aiResponse.data;
        console.log('✅ CHATGPT RESPONSE: Extracted content from aiResponse.data');
      } else {
        console.log('⚠️ WARNING: Using fallback - no valid content structure found', {
          hasContent: !!aiResponse.content,
          hasContentContent: !!(aiResponse.content && aiResponse.content.content),
          hasData: !!aiResponse.data,
          responseKeys: Object.keys(aiResponse)
        });
        // Use fallback instead of throwing error
        return generateFallbackCaptions(productName, platforms, niche, affiliateId, useSpartanFormat);
      }

      // Parse JSON response - handle markdown code blocks and control characters
      let cleanContent = extractedContent.trim();
      if (cleanContent.startsWith('```json')) {
        cleanContent = cleanContent.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleanContent.startsWith('```')) {
        cleanContent = cleanContent.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }
      
      // Remove control characters that break JSON parsing
      cleanContent = cleanContent.replace(/[\u0000-\u001F\u007F-\u009F]/g, '');
      
      let captions;
      try {
        captions = JSON.parse(cleanContent);
      } catch (jsonError) {
        console.error('JSON parsing error:', jsonError);
        console.error('Problematic content:', cleanContent);
        // Use fallback instead of throwing error
        return generateFallbackCaptions(productName, platforms, niche, affiliateId, useSpartanFormat);
      }
      
      // Generate Amazon affiliate link
      const amazonLink = generateAmazonAffiliateLink(productName, affiliateId);
      
      // Process captions and add affiliate links
      const enhancedCaptions: Record<string, string> = {};
      for (const [platform, caption] of Object.entries(captions)) {
        let enhancedCaption = caption as string;
        
        // Apply Spartan format filtering to remove emojis and fluff language
        if (useSpartanFormat) {
          enhancedCaption = enhancedCaption
            .replace(/[✨🌿🔥💫⭐️🌟💎✊🏻🔗🛒🛍️📝💰🎯🚀📱📷⚡️💯🎉👏🙌✅❤️💕🥰😍🤩🔑🎊💪🏆🌈]/g, '')
            .replace(/[\u{1F300}-\u{1F9FF}]/gu, '')
            .replace(/\b(amazing|incredible|stunning|absolutely|literally|super|totally|completely|perfect|ultimate|revolutionary|game-changing|life-changing|mind-blowing|effortlessly|unlock|discover|power|thirst|quenches|transform|haven|peace|seamlessly|intuitive|blend|moments|sanctuary|cutting-edge|sleek|upgrade)\b/gi, '')
            .replace(/\s+/g, ' ')
            .trim();
        }
        
        // Add platform-specific affiliate link formatting with required Amazon Associates disclosure
        if (useSpartanFormat) {
          switch (platform.toLowerCase()) {
            case 'tiktok':
              enhancedCaption += `\n\nShop here: ${amazonLink}\n\nAs an Amazon Associate I earn from qualifying purchases. #ad`;
              break;
            case 'instagram':
              enhancedCaption += `\n\nShop the link: ${amazonLink}\n\nAs an Amazon Associate I earn from qualifying purchases. #ad`;
              break;
            case 'youtube':
              enhancedCaption += `\n\nAmazon link: ${amazonLink}\n\nDisclosure: As an Amazon Associate I earn from qualifying purchases.`;
              break;
            case 'twitter':
              enhancedCaption += `\n\n${amazonLink}\n\nAs an Amazon Associate I earn from qualifying purchases. #ad`;
              break;
            case 'other':
              enhancedCaption += `\n\nShop on Amazon: ${amazonLink}\n\nDisclosure: As an Amazon Associate I earn from qualifying purchases.`;
              break;
            default:
              enhancedCaption += `\n\n${amazonLink}\n\nAs an Amazon Associate I earn from qualifying purchases.`;
          }
        } else {
          switch (platform.toLowerCase()) {
            case 'tiktok':
              enhancedCaption += `\n\n🛒 Shop here: ${amazonLink}\n\n📝 As an Amazon Associate I earn from qualifying purchases. #ad`;
              break;
            case 'instagram':
              enhancedCaption += `\n\n🛍️ Shop the link: ${amazonLink}\n\n📝 As an Amazon Associate I earn from qualifying purchases. #ad`;
              break;
            case 'youtube':
              enhancedCaption += `\n\n🔗 Amazon link: ${amazonLink}\n\n📝 Disclosure: As an Amazon Associate I earn from qualifying purchases.`;
              break;
            case 'twitter':
              enhancedCaption += `\n\n🛒 ${amazonLink}\n\nAs an Amazon Associate I earn from qualifying purchases. #ad`;
              break;
            case 'other':
              enhancedCaption += `\n\nShop on Amazon: ${amazonLink}\n\nDisclosure: As an Amazon Associate I earn from qualifying purchases.`;
              break;
            default:
              enhancedCaption += `\n\n${amazonLink}\n\nAs an Amazon Associate I earn from qualifying purchases.`;
          }
        }
        
        enhancedCaptions[platform] = enhancedCaption;
      }
      
      console.log(`✅ Platform captions generated successfully with ${aiModel.toUpperCase()} model for ${Object.keys(enhancedCaptions).length} platforms`);
      return enhancedCaptions;
      
      // Check for similarity if enforcing uniqueness (using original captions before enhancement)
      if (enforceCaptionUniqueness && mainContent) {
        let needsRetry = false;
        
        for (const [platform, caption] of Object.entries(captions)) {
          const similarity = checkContentSimilarity(mainContent, caption as string);
          if (similarity > 70) {
            console.log(`⚠️ High similarity detected for ${platform}: ${similarity.toFixed(1)}%`);
            needsRetry = true;
            break;
          }
        }
        
        if (needsRetry && attempts < maxAttempts - 1) {
          console.log(`🔄 Retrying caption generation due to high similarity (attempt ${attempts + 1})`);
          attempts++;
          prompt += `\n\nIMPORTANT: Previous attempt was too similar to main content. Generate completely different captions with unique structure and wording.`;
          continue;
        }
      }
      
      console.log(`✅ Generated ${Object.keys(enhancedCaptions).length} platform captions with affiliate links`);
      return enhancedCaptions;

    } catch (error) {
      console.error('Error generating platform captions:', error);
      attempts++;
      
      if (attempts >= maxAttempts) {
        return generateFallbackCaptions(productName, platforms, niche, affiliateId, useSpartanFormat);
      }
    }
  }
  
  // Fallback if all attempts fail
  return generateFallbackCaptions(productName, platforms, niche, affiliateId, useSpartanFormat);
}

// Fallback captions generator
function generateFallbackCaptions(productName: string, platforms: string[], niche: string, affiliateId: string = "sgottshall107-20", useSpartanFormat: boolean = false): Record<string, string> {
  const captions: Record<string, string> = {};
  const amazonLink = generateAmazonAffiliateLink(productName, affiliateId);
  
  platforms.forEach(platform => {
    let caption = '';
    switch (platform.toLowerCase()) {
      case 'tiktok':
        if (useSpartanFormat) {
          caption = `${productName} is trending for a reason! This ${niche} find is about to blow up your feed.\n\nShop here: ${amazonLink}\n\nAs an Amazon Associate I earn from qualifying purchases. #ad`;
        } else {
          caption = `${productName} is trending for a reason! This ${niche} find is about to blow up your feed #fyp #viral\n\nShop here: ${amazonLink}\n\nAs an Amazon Associate I earn from qualifying purchases. #ad`;
        }
        break;
      case 'instagram':
        if (useSpartanFormat) {
          caption = `Discovered this ${productName} and had to share. Perfect addition to my ${niche} routine.\n\nShop the link: ${amazonLink}\n\nAs an Amazon Associate I earn from qualifying purchases. #ad`;
        } else {
          caption = `Discovered this ${productName} and had to share. Perfect addition to my ${niche} routine #aesthetic #musthave\n\nShop the link: ${amazonLink}\n\nAs an Amazon Associate I earn from qualifying purchases. #ad`;
        }
        break;
      case 'youtube':
        if (useSpartanFormat) {
          caption = `In this video, I'm reviewing the ${productName} - here's everything you need to know about this trending ${niche} product.\n\nAmazon link: ${amazonLink}\n\nDisclosure: As an Amazon Associate I earn from qualifying purchases.`;
        } else {
          caption = `In this video, I'm reviewing the *${productName}* - here's everything you need to know about this trending ${niche} product.\n\nAmazon link: ${amazonLink}\n\nDisclosure: As an Amazon Associate I earn from qualifying purchases.`;
        }
        break;
      case 'twitter':
        if (useSpartanFormat) {
          caption = `Plot twist: ${productName} lives up to the hype. Best ${niche} purchase this year.\n\n${amazonLink}\n\nAs an Amazon Associate I earn from qualifying purchases. #ad`;
        } else {
          caption = `Plot twist: ${productName} actually lives up to the hype. Best ${niche} purchase this year.\n\n${amazonLink}\n\nAs an Amazon Associate I earn from qualifying purchases. #ad`;
        }
        break;
      default:
        if (useSpartanFormat) {
          caption = `Discover why ${productName} is making waves in the ${niche} industry. A comprehensive look at this trending product.\n\nShop on Amazon: ${amazonLink}\n\nDisclosure: As an Amazon Associate I earn from qualifying purchases.`;
        } else {
          caption = `Discover why ${productName} is making waves in the ${niche} industry. A comprehensive look at this trending product.\n\nShop on Amazon: ${amazonLink}\n\nDisclosure: As an Amazon Associate I earn from qualifying purchases.`;
        }
    }
    captions[platform] = caption;
  });
  
  return captions;
}

export async function generatePlatformSpecificContent(
  request: PlatformContentRequest
): Promise<PlatformSpecificContent> {
  const { product, niche, platforms, contentType, templateType, tone, videoDuration, trendingData, useSpartanFormat, aiModel = "chatgpt" } = request;
  
  console.log(`🎯 Generating platform-specific content for: ${product}`);
  
  try {
    // Generate platform-specific captions
    const captions = await generatePlatformCaptions({
      productName: product,
      platforms,
      tone,
      niche,
      viralInspiration: trendingData,
      useSpartanFormat: useSpartanFormat,
      aiModel: aiModel
    });
    
    // Structure response
    const socialCaptions: {[platform: string]: {caption: string; postInstructions: string}} = {};
    
    platforms.forEach(platform => {
      socialCaptions[platform] = {
        caption: captions[platform] || `Check out this ${product} - perfect for ${niche} enthusiasts!`,
        postInstructions: `Post on ${platform} with engaging visuals and relevant hashtags`
      };
    });
    
    return {
      socialCaptions
    };
    
  } catch (error) {
    console.error('Error generating platform content:', error);
    throw error;
  }
}

// Helper function to calculate similarity between two texts
function calculateSimilarity(text1: string, text2: string): number {
  const words1 = text1.toLowerCase().split(/\s+/).filter(w => w.length > 2);
  const words2 = text2.toLowerCase().split(/\s+/).filter(w => w.length > 2);
  
  const intersection = words1.filter(word => words2.includes(word));
  const union = [...new Set([...words1, ...words2])];
  
  return union.length > 0 ? (intersection.length / union.length) * 100 : 0;
}

// Validate content uniqueness
function validateContentUniqueness(result: PlatformSpecificContent, mainContent?: string): { 
  isUnique: boolean; 
  issues: string[]; 
} {
  const issues: string[] = [];
  
  if (!mainContent) {
    return { isUnique: true, issues: [] };
  }
  
  // Check each platform caption against main content
  Object.entries(result.socialCaptions).forEach(([platform, content]) => {
    const similarity = calculateSimilarity(mainContent, content.caption);
    if (similarity > 70) {
      issues.push(`${platform} caption too similar to main content (${similarity.toFixed(1)}%)`);
    }
  });
  
  return {
    isUnique: issues.length === 0,
    issues
  };
}

// Get platform display name
function getPlatformDisplayName(platformId: string): string {
  const platformNames: {[key: string]: string} = {
    'tiktok': 'TikTok',
    'instagram': 'Instagram',
    'youtube': 'YouTube',
    'twitter': 'Twitter/X',
    'facebook': 'Facebook',
    'linkedin': 'LinkedIn',
    'other': 'Other'
  };
  
  return platformNames[platformId.toLowerCase()] || platformId;
}

// Build platform-specific prompt
function buildPlatformPrompt(request: PlatformContentRequest): string {
  const { product, niche, platforms, tone, templateType } = request;
  
  let prompt = `Create platform-specific content for: ${product} (${niche} category)\n`;
  prompt += `Content type: ${templateType}\n`;
  prompt += `Tone: ${tone}\n`;
  prompt += `Platforms: ${platforms.join(', ')}\n\n`;
  
  prompt += `Generate unique, engaging content optimized for each platform:\n\n`;
  
  platforms.forEach(platform => {
    switch (platform.toLowerCase()) {
      case 'tiktok':
        prompt += `TikTok: Create a short, catchy caption with trending hashtags and Gen Z language\n`;
        break;
      case 'instagram':
        prompt += `Instagram: Write an aesthetic, lifestyle-focused caption with strategic hashtags\n`;
        break;
      case 'youtube':
        prompt += `YouTube: Develop a descriptive, SEO-friendly description with keywords\n`;
        break;
      case 'twitter':
        prompt += `Twitter: Craft a concise, engaging tweet with relevant hashtags\n`;
        break;
      default:
        prompt += `${platform}: Create professional, engaging content suitable for the platform\n`;
    }
  });
  
  return prompt;
}

// Generate fallback content when main generation fails
function generateFallbackContent(request: PlatformContentRequest): PlatformSpecificContent {
  const { product, niche, platforms } = request;
  
  const socialCaptions: {[platform: string]: {caption: string; postInstructions: string}} = {};
  
  platforms.forEach(platform => {
    socialCaptions[platform] = {
      caption: `Check out this ${product} - perfect for ${niche} enthusiasts! #${niche} #trending`,
      postInstructions: `Share on ${platform} with engaging visuals`
    };
  });
  
  return {
    socialCaptions
  };
}