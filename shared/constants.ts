// Shared constants used across the application

// Universal template types that apply to all niches
export const UNIVERSAL_TEMPLATE_TYPES = [
  "seo_blog",           // SEO Blog Post (1000+ words, keyword-optimized)
  "short_video",        // Short-Form Video Script (TikTok, Reels, YT Shorts)
  "influencer_caption", // Influencer Caption (with hashtags, emojis, CTAs)
  "product_comparison", // Product Comparison (X vs Y, Pros/Cons breakdown)
  "routine_kit",        // "Routine" or "Kit" Builder (Bundles or usage flows)
  "bullet_points",      // Bullet-Point Summary (for newsletters or carousel posts)
  "trending_explainer", // "Why It's Trending" Explainer
  "buyer_persona",      // Buyer Persona Targeting (Gen Z, moms, etc.)
  "affiliate_email"     // Affiliate Email Blurb (1-2 paragraph product promo)
] as const;

// Skincare & Beauty specific templates
export const SKINCARE_TEMPLATE_TYPES = [
  "skincare_routine",   // "Morning & Night Routine" Templates
  "derm_approved",      // "Dermatologist-Approved" TikTok Skits
  "transformation",     // "Before & After Transformation" Captions
  "skin_type_list",     // "5 Must-Haves for [Skin Type]" Listicles
  "dupe_alert"          // "Dupe Alert" Product Comparison
] as const;

// Supplements & Fitness specific templates
export const FITNESS_TEMPLATE_TYPES = [
  "supplement_stack",   // "Supplement Stack Guide"
  "eat_in_day",         // "What I Eat in a Day" Scripts
  "best_supplements",   // "5 Best Supplements for [Goal]" Blog Post
  "myth_busting",       // "Myth-Busting" Infographics or Tweets
  "fitness_influencer"  // "Fitness Influencer Voiceover" for Reels
] as const;

// Tech & Gadgets specific templates
export const TECH_TEMPLATE_TYPES = [
  "unboxing",           // "Unboxing Experience" Script
  "top_use_cases",      // "Top 5 Use Cases" Lists
  "worth_it",           // "Is It Worth It?" Value Breakdown Posts
  "setup_guide",        // "Gadget Setup Guide" Blog or Video
  "hidden_features"     // "Hidden Features" Carousel
] as const;

// Home & Kitchen specific templates
export const HOME_TEMPLATE_TYPES = [
  "pinterest_style",    // "Pinterest-Style" Descriptions
  "product_recipe",     // "Recipe Featuring Product"
  "why_switched",       // "Why I Switched" Personal Narrative
  "amazon_finds",       // "Amazon Finds Under $50" Captions
  "kitchen_must_haves"  // "Kitchen Must-Haves" Blog Listicles
] as const;

// Pet Products specific templates
export const PET_TEMPLATE_TYPES = [
  "dog_testimonial",    // "Dog Testimonial Voiceover" Script
  "pet_owner_tips",     // "5 Things I Wish I Knew" Blog
  "grooming_before_after", // "Before & After Grooming Product" Visual Caption
  "pet_parent_guide",   // "Pet Parent Guide"
  "trainer_tip"         // "Trainer Tip" Skits
] as const;

// Fashion & Accessories specific templates
export const FASHION_TEMPLATE_TYPES = [
  "style_this",         // "How to Style This" Reels Script
  "capsule_wardrobe",   // "Seasonal Capsule Wardrobe" Blog
  "dupes_lookalikes",   // "Dupes & Lookalikes" Comparison Table
  "outfit_inspo",       // "Outfit Inspo" Carousel Captions
  "haul_review"         // "Haul Review" Narration Script
] as const;

// Outdoor & Sports Gear specific templates
export const OUTDOOR_TEMPLATE_TYPES = [
  "packlist",           // "Weekend Warrior Packlist" Templates
  "gear_breakdown",     // "Survival Gear Breakdown" for YouTube/Blog
  "adventure_vlog",     // "Adventure Vlog" Script
  "durability_test",    // "Durability Test" Product Caption
  "top_activity"        // "Top 5 for [Activity]" Lists
] as const;

// Legacy templates (for backward compatibility)
export const LEGACY_TEMPLATE_TYPES = [
  "original",           // Original review
  "comparison",         // Product comparison
  "caption",            // Social media caption
  "pros_cons",          // Pros and cons list
  "routine",            // Skincare routine
  "beginner_kit",       // Beginner skincare kit
  "demo_script",        // Product demo script
  "drugstore_dupe",     // Drugstore dupe review
  "personal_review",    // Personal product review
  "surprise_me",        // Creative/unexpected content
  "tiktok_breakdown",   // TikTok trend breakdown
  "dry_skin_list",      // Dry skin product list
  "top5_under25",       // Affordable options
  "recipe",             // Recipe featuring product
  "packing_list"        // Travel packing list
] as const;

// Combined template types for validation
export const TEMPLATE_TYPES = [
  ...UNIVERSAL_TEMPLATE_TYPES,
  ...SKINCARE_TEMPLATE_TYPES,
  ...FITNESS_TEMPLATE_TYPES,
  ...TECH_TEMPLATE_TYPES,
  ...HOME_TEMPLATE_TYPES,
  ...PET_TEMPLATE_TYPES,
  ...FASHION_TEMPLATE_TYPES,
  ...OUTDOOR_TEMPLATE_TYPES,
  ...LEGACY_TEMPLATE_TYPES
] as const;

export type TemplateType = typeof TEMPLATE_TYPES[number];

// Supported content niches
export const NICHES = [
  "skincare",     // Skincare and beauty products
  "tech",         // Technology and gadgets
  "fashion",      // Clothing and accessories
  "fitness",      // Fitness equipment and supplements
  "food",         // Food and cooking products
  "travel",       // Travel gear and accessories
  "pet"           // Pet products and accessories
] as const;

export type Niche = typeof NICHES[number];

// Tone options for generated content
export const TONE_OPTIONS = [
  "friendly",      // Friendly & approachable
  "professional",  // Professional & expert
  "casual",        // Casual & conversational
  "enthusiastic",  // Enthusiastic & excited
  "minimalist",    // Minimalist & direct
  "luxurious",     // Elegant & sophisticated
  "educational",   // Informative & educational
  "humorous",      // Light-hearted & fun
  "trendy",        // Trend-conscious & current
  "scientific",    // Precise & analytical
  "poetic"         // Artistic & expressive
] as const;

export type ToneOption = typeof TONE_OPTIONS[number];

// Scraper names and platforms
export const SCRAPER_PLATFORMS = [
  "tiktok",
  "instagram",
  "youtube",
  "reddit",
  "amazon",
  "google-trends"
] as const;

export type ScraperPlatform = typeof SCRAPER_PLATFORMS[number];

// Status types for scraper health
export const SCRAPER_STATUS_TYPES = [
  "active",           // Scraper is working with real data
  "gpt-fallback",     // Using GPT due to scraping failure
  "degraded",         // Partially working but with issues
  "error",            // Complete failure with error
  "rate-limited"      // Rate limited by the platform
] as const;

export type ScraperStatusType = typeof SCRAPER_STATUS_TYPES[number];

// API limits for monitoring usage
export const API_LIMITS = {
  MONTHLY_REQUESTS: 500
};
