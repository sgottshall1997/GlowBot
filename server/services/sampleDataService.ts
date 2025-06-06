import { storage } from '../storage';
import { InsertSocialMediaPlatform, InsertApiIntegration, InsertPublishedContent } from '@shared/schema';

/**
 * Populates the database with sample data for the API Integration Hub
 */
export async function initializeSampleData() {
  try {
    console.log('Initializing sample data for API Integration Hub...');
    
    // Check if we already have platforms
    const existingPlatforms = await storage.getSocialMediaPlatforms();
    if (existingPlatforms.length === 0) {
      await createSocialMediaPlatforms();
    }
    
    // Check if we already have sample integrations
    const existingIntegrations = await storage.getApiIntegrationsByUser(1);
    if (existingIntegrations.length === 0) {
      await createSampleIntegrations();
    }
    
    // Add sample published content if none exists
    const existingContent = await storage.getPublishedContentByUser(1);
    if (existingContent.length === 0) {
      await createSamplePublishedContent();
    }
    
    console.log('Sample data initialization complete!');
  } catch (error) {
    console.error('Error initializing sample data:', error);
  }
}

/**
 * Creates sample social media platforms
 */
async function createSocialMediaPlatforms() {
  console.log('Creating sample social media platforms...');
  
  const platforms: InsertSocialMediaPlatform[] = [
    {
      platformName: 'Instagram',
      description: 'Share photos and videos with your followers.',
      apiDocsUrl: 'https://developers.facebook.com/docs/instagram-api/',
      postLengthLimit: 2200,
      isActive: true,
      logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a5/Instagram_icon.png/2048px-Instagram_icon.png'
    },
    {
      platformName: 'X (Twitter)',
      description: 'Share short messages with your followers.',
      apiDocsUrl: 'https://developer.twitter.com/en/docs',
      postLengthLimit: 280,
      isActive: true,
      logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/X_icon_2.svg/2048px-X_icon_2.svg.png'
    },
    {
      platformName: 'Facebook',
      description: 'Share updates, photos, and videos with your friends and followers.',
      apiDocsUrl: 'https://developers.facebook.com/docs/',
      postLengthLimit: 63206,
      isActive: true,
      logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b8/2021_Facebook_icon.svg/2048px-2021_Facebook_icon.svg.png'
    },
    {
      platformName: 'LinkedIn',
      description: 'Share professional updates with your network.',
      apiDocsUrl: 'https://docs.microsoft.com/en-us/linkedin/',
      postLengthLimit: 3000,
      isActive: true,
      logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/ca/LinkedIn_logo_initials.png/800px-LinkedIn_logo_initials.png'
    },
    {
      platformName: 'Pinterest',
      description: 'Share visual content with your followers.',
      apiDocsUrl: 'https://developers.pinterest.com/docs/',
      postLengthLimit: 500,
      isActive: true,
      logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/08/Pinterest-logo.png/800px-Pinterest-logo.png'
    },
    {
      platformName: 'TikTok',
      description: 'Share short videos with your followers.',
      apiDocsUrl: 'https://developers.tiktok.com/',
      postLengthLimit: 2200,
      isActive: true,
      logoUrl: 'https://upload.wikimedia.org/wikipedia/en/thumb/a/a9/TikTok_logo.svg/1200px-TikTok_logo.svg.png'
    }
  ];
  
  for (const platform of platforms) {
    await storage.saveSocialMediaPlatform(platform);
  }
  
  console.log(`Created ${platforms.length} sample social media platforms.`);
}

/**
 * Creates sample API integrations
 */
async function createSampleIntegrations() {
  console.log('Creating sample API integrations...');
  
  // Get the platforms
  const platforms = await storage.getSocialMediaPlatforms();
  if (platforms.length === 0) {
    console.warn('No platforms found, skipping integration creation.');
    return;
  }
  
  // Create some sample integrations for the demo user
  const sampleIntegrations: InsertApiIntegration[] = [
    {
      name: 'My Instagram Business Account',
      provider: 'Instagram',
      userId: 1,
      apiKey: 'sample-instagram-api-key',
      apiSecret: 'sample-instagram-api-secret',
      accessToken: 'sample-instagram-access-token',
      refreshToken: 'sample-instagram-refresh-token',
      tokenExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    },
    {
      name: 'GlowBot X Account',
      provider: 'X (Twitter)',
      userId: 1,
      apiKey: 'sample-twitter-api-key',
      apiSecret: 'sample-twitter-api-secret',
      accessToken: 'sample-twitter-access-token',
      refreshToken: 'sample-twitter-refresh-token',
      tokenExpiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days from now
    },
  ];
  
  for (const integration of sampleIntegrations) {
    await storage.saveApiIntegration(integration);
  }
  
  console.log(`Created ${sampleIntegrations.length} sample API integrations.`);
}

/**
 * Creates sample content generations
 */
async function createSampleContentGenerations() {
  console.log('Creating sample content generations...');
  
  // Sample content types
  const contentTypes = ['instagram_post', 'tweet', 'facebook_post', 'linkedin_post'];
  const tones = ['professional', 'casual', 'enthusiastic', 'informative'];
  const niches = ['skincare', 'beauty', 'tech', 'fitness'];
  
  // Sample products
  const products = [
    'Vitamin C Serum',
    'Hyaluronic Acid Moisturizer',
    'Blue Light Blocking Glasses',
    'Fitness Tracking Smartwatch',
    'Collagen Peptide Supplement'
  ];
  
  // Create 5 sample content generations
  const sampleContentGenerations = [];
  
  for (let i = 0; i < 5; i++) {
    const templateType = contentTypes[i % contentTypes.length];
    const tone = tones[i % tones.length];
    const niche = niches[i % niches.length];
    const product = products[i % products.length];
    
    const contentGeneration = {
      product,
      niche,
      templateType,
      tone,
      content: `Sample ${niche} content for ${product} using ${templateType} template in a ${tone} tone.`
    };
    
    sampleContentGenerations.push(contentGeneration);
  }
  
  // Save the content generations and store their IDs
  const contentGenerationIds = [];
  for (const contentGeneration of sampleContentGenerations) {
    const savedContent = await storage.saveContentGeneration(contentGeneration);
    contentGenerationIds.push(savedContent.id);
  }
  
  console.log(`Created ${sampleContentGenerations.length} sample content generations.`);
  return contentGenerationIds;
}

/**
 * Creates sample published content
 */
async function createSamplePublishedContent() {
  console.log('Creating sample published content...');
  
  // Get the platforms
  const platforms = await storage.getSocialMediaPlatforms();
  if (platforms.length === 0) {
    console.warn('No platforms found, skipping published content creation.');
    return;
  }
  
  // Find Instagram and Twitter platforms
  const instagramPlatform = platforms.find(p => p.platformName === 'Instagram');
  const twitterPlatform = platforms.find(p => p.platformName === 'X (Twitter)');
  
  if (!instagramPlatform || !twitterPlatform) {
    console.warn('Instagram or Twitter platform not found, skipping published content creation.');
    return;
  }
  
  // Create sample content generations first
  const contentIds = await createSampleContentGenerations();
  if (contentIds.length === 0) {
    console.warn('No content generations created, skipping published content creation.');
    return;
  }
  
  // Create sample published content
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  
  const twoDaysAgo = new Date(now);
  twoDaysAgo.setDate(now.getDate() - 2);
  
  const threeDaysAgo = new Date(now);
  threeDaysAgo.setDate(now.getDate() - 3);
  
  const fourDaysAgo = new Date(now);
  fourDaysAgo.setDate(now.getDate() - 4);
  
  const nextWeek = new Date(now);
  nextWeek.setDate(now.getDate() + 7);
  
  const sampleContent: InsertPublishedContent[] = [
    {
      userId: 1,
      platformId: instagramPlatform.id,
      contentId: contentIds[0],
      integrationId: 1, // Use the Instagram integration ID
      platformContentId: 'instagram-post-123456',
      publishedUrl: 'https://www.instagram.com/p/sample-post-123456/',
      publishStatus: 'success',
      metadata: {
        likes: 245,
        comments: 32,
        impressions: 1200,
        caption: 'Check out our new skincare routine for glowing skin! 💫 #skincare #glowup',
      },
    },
    {
      userId: 1,
      platformId: twitterPlatform.id,
      contentId: contentIds[1],
      integrationId: 2, // Use the Twitter integration ID
      platformContentId: 'twitter-post-789012',
      publishedUrl: 'https://twitter.com/sample/status/789012',
      publishStatus: 'success',
      metadata: {
        likes: 78,
        retweets: 12,
        impressions: 890,
        text: 'Our favorite skincare ingredients for summer: Vitamin C, Niacinamide, and Hyaluronic Acid. What are yours? #skincare #summerbeauty',
      },
    },
    {
      userId: 1,
      platformId: instagramPlatform.id,
      contentId: contentIds[2],
      integrationId: 1, // Use the Instagram integration ID
      platformContentId: null,
      publishedUrl: null,
      publishStatus: 'failed',
      statusMessage: 'Instagram API connection timeout',
      scheduledPublishTime: twoDaysAgo,
      metadata: {
        caption: 'The 5 best serums for overnight skin repair. #skincareroutine #overnightrepair',
      },
    },
    {
      userId: 1,
      platformId: twitterPlatform.id,
      contentId: contentIds[3],
      integrationId: 2, // Use the Twitter integration ID
      platformContentId: null,
      publishedUrl: null,
      publishStatus: 'scheduled',
      scheduledPublishTime: nextWeek,
      metadata: {
        text: 'Coming next week: Our complete guide to summer skincare. Stay tuned! #summerskincare #beautyguide',
      },
    },
    {
      userId: 1,
      platformId: instagramPlatform.id,
      contentId: contentIds[4],
      integrationId: 1, // Use the Instagram integration ID
      platformContentId: 'instagram-post-345678',
      publishedUrl: 'https://www.instagram.com/p/sample-post-345678/',
      publishStatus: 'success',
      metadata: {
        likes: 567,
        comments: 89,
        impressions: 3200,
        caption: 'The perfect morning skincare routine in just 5 steps! ☀️ #morningskincare #skincareessentials',
      },
    },
  ];
  
  for (const content of sampleContent) {
    await storage.savePublishedContent(content);
  }
  
  console.log(`Created ${sampleContent.length} sample published content items.`);
}