/**
 * Utility for displaying organized scraper health information in the browser console
 */
import { apiRequest } from "./queryClient";

type ScraperStatus = {
  name: string;
  status: string;
  lastCheck: string;
  lastSuccess?: string;
  errorMessage?: string;
  successCount: number;
  failureCount: number;
  realData?: any[]; // Store actual products scraped directly from the source
};

/**
 * Fetches and logs the status of all scrapers in a formatted console output
 */
export async function logScraperHealth() {
  try {
    const response = await apiRequest('GET', '/api/scraper-status');
    const scraperStatus: ScraperStatus[] = await response.json();
    
    // Also fetch actual products to display samples of real data
    const productsResponse = await apiRequest('GET', '/api/trending/products');
    const products = await productsResponse.json();
    
    // Group scrapers by status
    const activeScrapers = scraperStatus.filter(s => s.status === 'active');
    const errorScrapers = scraperStatus.filter(s => s.status === 'error');
    const warningScrapers = scraperStatus.filter(s => s.status === 'warning');
    const otherScrapers = scraperStatus.filter(s => 
      s.status !== 'active' && s.status !== 'error' && s.status !== 'warning'
    );
    
    // Identify AI fallback scrapers based on success count
    activeScrapers.forEach(scraper => {
      if (scraper.successCount === 0 && !scraper.errorMessage) {
        scraper.status = 'gpt-fallback';
      }
      
      // Find real scraped data (if any) for this scraper
      const realData = products.filter((p: any) => 
        p.source?.toLowerCase() === scraper.name.toLowerCase() && 
        p.isAIGenerated === false
      );
      
      // Attach real data samples to scraper object
      if (realData && realData.length > 0) {
        scraper.realData = realData.slice(0, 3); // Limit to 3 samples
      }
    });
    
    // Clear console for better visibility
    console.clear();
    
    // Header styling
    const headerStyle = 'color: #fff; background: #333; padding: 4px 8px; border-radius: 4px; font-weight: bold;';
    const subheaderStyle = 'color: #fff; background: #555; padding: 2px 6px; border-radius: 4px; font-weight: bold;';
    
    // Status styling
    const statusStyles = {
      active: 'color: #00cc00; font-weight: bold;',
      'gpt-fallback': 'color: #0099ff; font-weight: bold;',
      degraded: 'color: #ffaa00; font-weight: bold;',
      'rate-limited': 'color: #cc00cc; font-weight: bold;',
      error: 'color: #ff0000; font-weight: bold;',
      warning: 'color: #ffcc00; font-weight: bold;',
      default: 'color: #999999; font-weight: bold;'
    };
    
    // Main header
    console.log('%c🔍 GlowBot Scraper Health Monitor 🔍', headerStyle);
    console.log(`Last updated: ${new Date().toLocaleString()}`);
    console.log('-'.repeat(50));
    
    // Summary
    console.log('%cSummary:', subheaderStyle);
    console.log(`Total scrapers: ${scraperStatus.length}`);
    console.log(`%c✅ Active: ${activeScrapers.length}`, 'color: #00cc00');
    console.log(`%c⚠️ Warnings: ${warningScrapers.length}`, 'color: #ffcc00');
    console.log(`%c❌ Errors: ${errorScrapers.length}`, 'color: #ff0000');
    console.log('-'.repeat(50));
    
    // Active scrapers
    if (activeScrapers.length > 0) {
      console.log('%c✅ Active Scrapers:', subheaderStyle);
      activeScrapers.forEach(scraper => {
        const lastCheck = new Date(scraper.lastCheck).toLocaleString();
        const successCount = typeof scraper.successCount === 'number' ? scraper.successCount : 0;
        const failureCount = typeof scraper.failureCount === 'number' ? scraper.failureCount : 0;
        
        // Display based on whether using AI fallback or not
        const isAIFallback = scraper.status === 'gpt-fallback';
        const statusStyle = isAIFallback ? statusStyles['gpt-fallback'] : statusStyles.active;
        const statusIcon = isAIFallback ? '🤖' : '✅';
        const statusLabel = isAIFallback ? 'AI Fallback' : 'Active';
        
        console.log(
          `%c${scraper.name}%c - ${statusIcon} ${statusLabel} - Last check: ${lastCheck}`, 
          statusStyle, 
          'color: inherit'
        );
        
        if (isAIFallback) {
          console.log(`  Direct successes: ${successCount} | Using AI for data generation | Failures: ${failureCount}`);
          
          // Show specific failure reason
          let failureReason = '🔍 Analyzing failure reason...';
          if (scraper.errorMessage) {
            if (scraper.errorMessage.includes('429') || scraper.errorMessage.includes('rate limit')) {
              failureReason = '🚫 Rate limited by platform - too many requests';
            } else if (scraper.errorMessage.includes('403') || scraper.errorMessage.includes('401')) {
              failureReason = '🔐 Authentication/permission denied by platform';
            } else if (scraper.errorMessage.includes('parse') || scraper.errorMessage.includes('extract')) {
              failureReason = '📄 Website structure changed - cannot parse data';
            } else if (scraper.errorMessage.includes('timeout')) {
              failureReason = '⏰ Connection timeout - platform too slow';
            } else if (scraper.errorMessage.includes('ECONNREFUSED') || scraper.errorMessage.includes('network')) {
              failureReason = '🌐 Network connection failed';
            } else if (scraper.errorMessage.includes('CAPTCHA') || scraper.errorMessage.includes('bot')) {
              failureReason = '🤖 Bot detection - platform blocking automated requests';
            } else {
              failureReason = `❌ ${scraper.errorMessage.substring(0, 80)}...`;
            }
          } else if (successCount === 0 && failureCount === 0) {
            failureReason = '⚙️ Scraper not configured or never attempted';
          } else if (failureCount > 0) {
            failureReason = '⚠️ Recent scraping failures detected - check logs';
          } else {
            failureReason = '🤔 Reason unknown - may be intentionally using AI fallback';
          }
          
          console.log(`  💡 Why AI fallback: ${failureReason}`);
        } else {
          console.log(`  Success count: ${successCount} | Failure count: ${failureCount}`);
        }
        
        // Display real data (if any) from this scraper
        if (scraper.realData && scraper.realData.length > 0) {
          console.log(`  %c🌐 Real data from ${scraper.name}:`, 'color: #00cc99; font-style: italic');
          scraper.realData.forEach((product: any, index: number) => {
            console.log(`    ${index + 1}. ${product.title} (${product.mentionCount?.toLocaleString() || 'unknown'} mentions)`);
          });
        }
      });
      console.log('-'.repeat(50));
    }
    
    // Warning scrapers
    if (warningScrapers.length > 0) {
      console.log('%c⚠️ Warning Scrapers:', subheaderStyle);
      warningScrapers.forEach(scraper => {
        const lastCheck = new Date(scraper.lastCheck).toLocaleString();
        const successCount = typeof scraper.successCount === 'number' ? scraper.successCount : 0;
        const failureCount = typeof scraper.failureCount === 'number' ? scraper.failureCount : 0;
        console.log(`%c${scraper.name}%c - Last check: ${lastCheck} - Success count: ${successCount} - Failures: ${failureCount}`, 
          statusStyles.warning, 'color: inherit');
        console.log(`  Message: ${scraper.errorMessage || 'No details'}`);
      });
      console.log('-'.repeat(50));
    }
    
    // Error scrapers
    if (errorScrapers.length > 0) {
      console.log('%c❌ Error Scrapers:', subheaderStyle);
      errorScrapers.forEach(scraper => {
        const lastCheck = new Date(scraper.lastCheck).toLocaleString();
        const lastSuccess = scraper.lastSuccess ? 
          new Date(scraper.lastSuccess).toLocaleString() : 'Never';
        const successCount = typeof scraper.successCount === 'number' ? scraper.successCount : 0;
        const failureCount = typeof scraper.failureCount === 'number' ? scraper.failureCount : 0;
        
        console.log(`%c${scraper.name}%c - Last check: ${lastCheck}`, 
          statusStyles.error, 'color: inherit');
        console.log(`  Last success: ${lastSuccess}`);
        console.log(`  Success/failure count: ${successCount}/${failureCount}`);
        console.log(`  Error: ${scraper.errorMessage || 'Unknown error'}`);
      });
      console.log('-'.repeat(50));
    }
    
    // Other scrapers
    if (otherScrapers.length > 0) {
      console.log('%cOther Scrapers:', subheaderStyle);
      otherScrapers.forEach(scraper => {
        const lastCheck = scraper.lastCheck ? 
          new Date(scraper.lastCheck).toLocaleString() : 'Never';
        const successCount = typeof scraper.successCount === 'number' ? scraper.successCount : 0;
        const failureCount = typeof scraper.failureCount === 'number' ? scraper.failureCount : 0;
        
        console.log(`%c${scraper.name}%c - Status: ${scraper.status} - Last check: ${lastCheck}`, 
          statusStyles.default, 'color: inherit');
        console.log(`  Success/failure count: ${successCount}/${failureCount}`);
      });
      console.log('-'.repeat(50));
    }
    
    // Footer message
    console.log('To refresh scraper status, call window.checkScraperHealth()');
    
  } catch (error) {
    console.error('Failed to fetch scraper health information:', error);
  }
}

/**
 * Fetches and displays a detailed breakdown of scraped trending products
 */
export async function logTrendingProducts() {
  try {
    const response = await apiRequest('GET', '/api/trending/products');
    if (!response.ok) {
      throw new Error(`Failed to fetch trending products: ${response.status} ${response.statusText}`);
    }
    const products = await response.json();
    
    // Get AI fallback information
    let dataSource = "Live scraped data";
    let dataSourceIcon = "🌐";
    try {
      const statsResponse = await apiRequest('GET', '/api/scraper-status');
      const scraperStatus = await statsResponse.json();
      const aiScrapers = scraperStatus.filter((s: any) => s.status === 'gpt-fallback' || s.successCount === 0);
      
      if (aiScrapers.length > 0) {
        // If all scrapers are in AI fallback
        if (aiScrapers.length === scraperStatus.length) {
          dataSource = "AI-generated data (all scrapers)";
          dataSourceIcon = "🤖";
        } else {
          dataSource = "Mixed data sources (scraped + AI)";
          dataSourceIcon = "🔄";
        }
      }
    } catch (error) {
      // Continue without showing data source info
    }
    
    // Header styling
    const headerStyle = 'color: #fff; background: #333; padding: 4px 8px; border-radius: 4px; font-weight: bold;';
    const subheaderStyle = 'color: #fff; background: #555; padding: 2px 6px; border-radius: 4px; font-weight: bold;';
    
    console.clear();
    console.log('%c📊 GlowBot Trending Products 📊', headerStyle);
    console.log(`${dataSourceIcon} Data source: ${dataSource}`);
    console.log(`Total products: ${products.length}`);
    
    // Add explanation about mention counts
    console.log('');
    console.log('%c📌 About Mention Counts:', 'color: #ff6600; font-weight: bold;');
    console.log('  %c🌐 Real scraped data:%c Actual mention counts from source websites', 'color: #00cc99; font-style: italic;', 'color: inherit');
    console.log('  %c🤖 AI-generated data:%c Estimated mention counts (not actual data)', 'color: #0099ff; font-style: italic;', 'color: inherit');
    
    // Handle empty products case
    if (!products || products.length === 0) {
      console.log('%c⚠️ No trending products found.', 'color: #f39c12; font-weight: bold;');
      console.log('Possible reasons:');
      console.log('1. The system is still initializing trend data');
      console.log('2. Scrapers have not completed their first run');
      console.log('3. External APIs may be temporarily unavailable');
      console.log('-'.repeat(50));
      console.log('To manually refresh trending products data, call window.refreshTrendingProducts()');
      console.log('To view trending products when available, call window.checkTrendingProducts()');
      return;
    }
    
    // Group by source and niche
    const bySource: Record<string, any[]> = {};
    const byNiche: Record<string, any[]> = {};
    
    products.forEach((product: any) => {
      // Group by source
      if (!bySource[product.source]) {
        bySource[product.source] = [];
      }
      bySource[product.source].push(product);
      
      // Group by niche
      if (!byNiche[product.niche]) {
        byNiche[product.niche] = [];
      }
      byNiche[product.niche].push(product);
    });
    
    console.log('-'.repeat(50));
    
    // Products by source
    console.log('%cProducts by Source:', subheaderStyle);
    if (Object.keys(bySource).length === 0) {
      console.log('  No source information available');
    } else {
      Object.entries(bySource).forEach(([source, sourceProducts]) => {
        console.log(`%c${source}%c (${sourceProducts.length} products)`, 'color: #3498db; font-weight: bold;', 'color: inherit');
        
        // Show top 3 products by mentions for each source
        sourceProducts
          .sort((a, b) => (b.mentions || 0) - (a.mentions || 0))
          .slice(0, 3)
          .forEach((product, idx) => {
            const mentions = product.mentions ? product.mentions.toLocaleString() : 'unknown';
            const isAI = product.isAIGenerated === true;
            const icon = isAI ? '🤖' : '🌐';
            console.log(`  ${idx + 1}. ${icon} ${product.title} (${mentions} mentions)`);
          });
        
        if (sourceProducts.length > 3) {
          console.log(`  ... ${sourceProducts.length - 3} more products`);
        }
      });
    }
    
    console.log('-'.repeat(50));
    
    // Products by niche
    console.log('%cProducts by Niche:', subheaderStyle);
    if (Object.keys(byNiche).length === 0) {
      console.log('  No niche information available');
    } else {
      Object.entries(byNiche).forEach(([niche, nicheProducts]) => {
        console.log(`%c${niche}%c (${nicheProducts.length} products)`, 'color: #9b59b6; font-weight: bold;', 'color: inherit');
        
        // Show top 3 products by mentions for each niche
        nicheProducts
          .sort((a, b) => (b.mentions || 0) - (a.mentions || 0))
          .slice(0, 3)
          .forEach((product, idx) => {
            const mentions = product.mentions ? product.mentions.toLocaleString() : 'unknown';
            const isAI = product.isAIGenerated === true;
            const icon = isAI ? '🤖' : '🌐';
            console.log(`  ${idx + 1}. ${icon} ${product.title} (${mentions} mentions)`);
          });
        
        if (nicheProducts.length > 3) {
          console.log(`  ... ${nicheProducts.length - 3} more products`);
        }
      });
    }
    
    // Footer message
    console.log('-'.repeat(50));
    console.log('To refresh trending products, call window.checkTrendingProducts()');
    console.log('To manually trigger a new scrape, call window.refreshTrendingProducts()');
    
  } catch (error) {
    console.error('Failed to fetch trending products:', error);
  }
}

/**
 * Triggers a manual refresh of trending products data from all scrapers
 */
export async function refreshTrendingProducts() {
  try {
    console.log('%c⏳ Refreshing trending products...', 'color: #f39c12; font-weight: bold;');
    const response = await apiRequest('POST', '/api/trending/refresh');
    
    if (!response.ok) {
      throw new Error(`Failed to refresh trending products: ${response.status} ${response.statusText}`);
    }
    
    const result = await response.json();
    console.log('%c✅ Refresh completed!', 'color: #2ecc71; font-weight: bold;');
    console.log(`Successfully refreshed ${result.count} products`);
    console.log('Wait a moment for scrapers to complete, then call window.checkTrendingProducts() to see updated data');
    
  } catch (error) {
    console.error('Failed to refresh trending products:', error);
  }
}

// Export functions to window for easy access in the console
/**
 * Fetches and displays trending hashtags and emojis by niche
 */
export async function logTrendingHashtagsEmojis() {
  try {
    const response = await apiRequest('GET', '/api/trending-emojis-hashtags');
    if (!response.ok) {
      throw new Error(`Failed to fetch trending hashtags and emojis: ${response.status} ${response.statusText}`);
    }
    const trends = await response.json();
    
    // Header styling
    const headerStyle = 'color: #fff; background: #333; padding: 4px 8px; border-radius: 4px; font-weight: bold;';
    const subheaderStyle = 'color: #fff; background: #555; padding: 2px 6px; border-radius: 4px; font-weight: bold;';
    
    console.clear();
    console.log('%c🔠 GlowBot Trending Hashtags & Emojis 🔠', headerStyle);
    console.log(`Last updated: ${new Date().toLocaleString()}`);
    console.log('-'.repeat(50));
    
    if (!trends || trends.length === 0) {
      console.log('%c⚠️ No trending hashtags and emojis found.', 'color: #f39c12; font-weight: bold;');
      console.log('The system is still building trending data. Check back later.');
      console.log('-'.repeat(50));
      return;
    }
    
    // Display by niche
    console.log('%cTrending by Niche:', subheaderStyle);
    
    trends.forEach((trend: { niche: string, lastUpdated: string, hashtags: string[], emojis: string[] }) => {
      console.log(`%c${trend.niche}%c updated ${new Date(trend.lastUpdated).toLocaleString()}`,
        'color: #9b59b6; font-weight: bold;', 'color: inherit');
      
      // Display hashtags
      console.log('%c#️⃣ Top Hashtags:', 'color: #3498db; font-weight: bold;');
      trend.hashtags.slice(0, 5).forEach((hashtag: string, idx: number) => {
        console.log(`  ${idx + 1}. ${hashtag}`);
      });
      
      // Display emojis
      console.log('%c😀 Top Emojis:', 'color: #2ecc71; font-weight: bold;');
      trend.emojis.slice(0, 5).forEach((emoji: string, idx: number) => {
        console.log(`  ${idx + 1}. ${emoji}`);
      });
      
      console.log('-'.repeat(50));
    });
    
    console.log('To refresh hashtags and emojis, call window.checkTrendingHashtags()');
    
  } catch (error) {
    console.error('Failed to fetch trending hashtags and emojis:', error);
  }
}

declare global {
  interface Window {
    checkScraperHealth: () => Promise<void>;
    checkTrendingProducts: () => Promise<void>;
    refreshTrendingProducts: () => Promise<void>;
    checkTrendingHashtags: () => Promise<void>;
  }
}

// Initialize the global functions
export function initScraperConsole() {
  window.checkScraperHealth = logScraperHealth;
  window.checkTrendingProducts = logTrendingProducts;
  window.refreshTrendingProducts = refreshTrendingProducts;
  window.checkTrendingHashtags = logTrendingHashtagsEmojis;
  
  // Run initial scraper health check
  setTimeout(() => {
    logScraperHealth();
    logTrendingProducts();
  }, 1000);
  
  console.log('Scraper console helpers initialized! Available commands:');
  console.log('- window.checkScraperHealth() - View scraper status');
  console.log('- window.checkTrendingProducts() - View trending products');
  console.log('- window.refreshTrendingProducts() - Manually trigger a new product scrape');
  console.log('- window.checkTrendingHashtags() - View trending hashtags and emojis');
}