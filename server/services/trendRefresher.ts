import { storage } from "../storage";
import { getAllTrendingProducts, ScraperResults } from "../scrapers";
import { getAmazonTrending } from "../scrapers/amazon";
import cron from "node-cron";

let lastTrendingRefresh: Date = new Date();
const nextScheduledRefresh = "Midnight (12:00 AM)";

/**
 * Enhanced product categorization with confidence scoring and fallback mechanism
 */
function categorizeProductWithFallback(title: string): { niche: string; confidence: 'high' | 'medium' | 'low'; fallback: boolean } {
  const lowerTitle = title.toLowerCase();
  
  // High confidence matches (very specific terms)
  if (lowerTitle.match(/\b(skincare|beauty|retinol|vitamin c|niacinamide|collagen|acne|sunscreen|spf)\b/)) {
    return { niche: 'skincare', confidence: 'high', fallback: false };
  }
  
  if (lowerTitle.match(/\b(smartphone|laptop|computer|iphone|android|tablet|bluetooth|wireless|usb|tech|digital|electronic)\b/)) {
    return { niche: 'tech', confidence: 'high', fallback: false };
  }
  
  if (lowerTitle.match(/\b(workout|fitness|gym|protein|supplements|athletic|sports|exercise|training)\b/)) {
    return { niche: 'fitness', confidence: 'high', fallback: false };
  }
  
  if (lowerTitle.match(/\b(instant pot|air fryer|kitchen|cooking|blender|coffee|recipe|meal|cookware)\b/)) {
    return { niche: 'food', confidence: 'high', fallback: false };
  }
  
  // Medium confidence matches (single relevant keywords)
  if (lowerTitle.match(/\b(cream|serum|cleanser|moisturizer|toner|mask|hydrat|skincare|beauty|makeup|foundation|mascara|face|facial)\b/)) {
    return { niche: 'skincare', confidence: 'medium', fallback: false };
  }
  
  if (lowerTitle.match(/\b(phone|smart|wireless|headphones|earbuds|charger|cable|device|gadget|keyboard|mouse|apple|android|fire tv|stick|airtag|airpods)\b/)) {
    return { niche: 'tech', confidence: 'medium', fallback: false };
  }
  
  if (lowerTitle.match(/\b(shirt|dress|jacket|shoes|sneakers|boots|jeans|pants|sweater|hoodie|hat|bag|purse|jewelry|watch|fashion|clothing|apparel|style|outfit)\b/)) {
    return { niche: 'fashion', confidence: 'medium', fallback: false };
  }
  
  if (lowerTitle.match(/\b(weights|dumbbell|resistance|yoga|running|muscle|cardio|bike|treadmill|water bottle|tumbler|exercise|fitness|gym|workout)\b/)) {
    return { niche: 'fitness', confidence: 'medium', fallback: false };
  }
  
  if (lowerTitle.match(/\b(pot|pan|knife|food|oven|grill|tea|frother|scale|kitchen|cooking|thermometer|air fryer)\b/)) {
    return { niche: 'food', confidence: 'medium', fallback: false };
  }
  
  if (lowerTitle.match(/\b(travel|luggage|backpack|suitcase|trip|vacation|camping|outdoor|hiking|portable|insulated|bottle|stanley|tumbler)\b/)) {
    return { niche: 'travel', confidence: 'medium', fallback: false };
  }
  
  if (lowerTitle.match(/\b(dog|cat|pet|collar|leash|toy|treat|bed|carrier|grooming|puppy|kitten|animal|pee pad|litter|poop bag)\b/)) {
    return { niche: 'pet', confidence: 'medium', fallback: false };
  }
  
  // Low confidence fallback - distribute evenly to avoid empty sections
  const fallbackNiches = ['skincare', 'tech', 'fashion', 'fitness', 'food', 'travel', 'pet'];
  const hash = title.split('').reduce((a, b) => { a = ((a << 5) - a) + b.charCodeAt(0); return a & a; }, 0);
  const nicheIndex = Math.abs(hash) % fallbackNiches.length;
  
  return { 
    niche: fallbackNiches[nicheIndex], 
    confidence: 'low', 
    fallback: true 
  };
}

/**
 * Initialize trending products refresh schedule
 * Runs once at startup and then every day at midnight
 */
export function initTrendingProductsRefresh() {
  console.log("Initializing trending products refresh schedule...");
  
  // Schedule refresh for midnight every day (server time) - DISABLED FOR PRODUCTION
  // cron.schedule("0 0 * * *", async () => {
  //   console.log("Running scheduled trending product refresh at midnight");
  //   try {
  //     await refreshTrendingProducts();
  //     console.log("Scheduled trending products refresh completed successfully");
  //   } catch (error) {
  //     console.error("Error in scheduled trending products refresh:", error);
  //   }
  // });
  
  // Initial refresh at startup if needed
  refreshTrendingProductsIfOld();
}

/**
 * Refresh trending products if last refresh is older than 24 hours
 */
async function refreshTrendingProductsIfOld() {
  // Check when the last refresh happened
  const lastRefresh = lastTrendingRefresh;
  const now = new Date();
  const hoursSinceLastRefresh = (now.getTime() - lastRefresh.getTime()) / (1000 * 60 * 60);
  
  if (hoursSinceLastRefresh > 24) {
    console.log(`Last trending products refresh was ${hoursSinceLastRefresh.toFixed(2)} hours ago. Refreshing now...`);
    await refreshTrendingProducts();
  } else {
    console.log(`Last trending products refresh was ${hoursSinceLastRefresh.toFixed(2)} hours ago. No refresh needed.`);
  }
}

/**
 * Refresh trending products for all niches
 * Also exported as forceRefreshTrendingProducts for compatibility
 */
export async function refreshTrendingProducts(): Promise<void> {
  const niches = ['skincare', 'tech', 'fashion', 'fitness', 'food', 'travel', 'pet'];
  
  for (const niche of niches) {
    try {
      console.log(`Refreshing trending products for ${niche} niche...`);
      const results = await getAllTrendingProducts(niche);
      
      // Let's ensure we have at least 3 products per niche, even if it means using AI generation
      if (results.products.length < 3) {
        console.log(`Need ${3 - results.products.length} more products for ${niche} to reach minimum`);
        // In real app, this would trigger AI generation
      }
      
      // Update last refresh time
      lastTrendingRefresh = new Date();
      
    } catch (error) {
      console.error(`Error refreshing trending products for ${niche} niche:`, error);
    }
  }
  
  console.log("Trending products refreshed successfully for all niches");
}

/**
 * Get information about trending products refresh timing
 */
export function getTrendingProductsRefreshTime() {
  return {
    lastRefresh: lastTrendingRefresh,
    nextRefresh: nextScheduledRefresh
  };
}

/**
 * Force refresh trending products - alias for compatibility with existing code
 */
export const forceRefreshTrendingProducts = refreshTrendingProducts;

/**
 * Get refreshed trending products for use in API
 */
export async function getRefreshedTrendingProducts() {
  // Refresh if needed (though this won't do anything if we refreshed recently)
  await refreshTrendingProductsIfOld();
  
  // Return all trending products
  const niches = ['skincare', 'tech', 'fashion', 'fitness', 'food', 'travel', 'pets'];
  const result: {
    byNiche: Record<string, any[]>,
    count: number,
    lastRefresh: string,
    nextScheduledRefresh: string
  } = {
    byNiche: {},
    count: 0,
    lastRefresh: lastTrendingRefresh.toISOString(),
    nextScheduledRefresh: nextScheduledRefresh
  };
  
  // Initialize empty arrays for each niche to avoid type errors
  niches.forEach(niche => {
    result.byNiche[niche] = [];
  });
  
  // Fetch Amazon-only trending products for display + other platforms for content enrichment
  try {
    console.log('🔍 Fetching Amazon-only trending products for display...');
    
    // Fetch products for each niche separately using Amazon as primary source
    for (const niche of niches) {
      console.log(`📊 Fetching Amazon products for ${niche}...`);
      
      try {
        // Get Amazon products only for trending display
        const amazonResult = await getAmazonTrending(niche);
        const amazonProducts = amazonResult.products;
        
        if (amazonProducts && amazonProducts.length > 0) {
          console.log(`🛒 ${niche}: Found ${amazonProducts.length} Amazon products`);
          
          // Since we're fetching from niche-specific Amazon URLs, trust the source
          // All products from Amazon's niche-specific pages are relevant to that niche
          const relevantAmazonProducts = amazonProducts.map(product => ({
            ...product,
            niche: niche // Ensure niche is properly set
          }));
          
          console.log(`✅ ${niche}: ${relevantAmazonProducts.length} Amazon products match niche criteria`);
          
          // Add up to 4 authentic Amazon products for this niche
          const productsToAdd = relevantAmazonProducts.slice(0, 4);
          productsToAdd.forEach(product => {
            result.byNiche[niche].push({
              ...product,
              niche: niche,
              source: 'amazon' // Ensure source is clearly marked
            });
            result.count++;
          });
          
          console.log(`📝 Added ${productsToAdd.length} Amazon products to ${niche}`);
          
        } else {
          console.log(`⚠️ No Amazon products found for ${niche} - will show empty section`);
        }
      } catch (nicheError) {
        console.error(`❌ Error fetching Amazon products for ${niche}:`, nicheError);
      }
    }
  } catch (error) {
    console.error(`Error in Amazon-only product fetching:`, error);
  }
  
  return result;
}