import { Router } from 'express';
import { WebhookService, getWebhookConfig } from '../services/webhookService';
import axios from 'axios';

const router = Router();

/**
 * POST /api/webhooks/test
 * Sends a test webhook notification with CSV-formatted data
 */
router.post('/', async (req, res) => {
  try {
    // Check if webhook is configured
    const config = getWebhookConfig();
    if (!config.enabled || !config.url) {
      return res.status(400).json({
        success: false,
        message: 'Webhook is not configured or is disabled. Please configure webhook first.'
      });
    }
    
    // Create comprehensive test payload with ALL 36 fields including viral inspiration and AI evaluation
    const testPayload = {
      // BASIC CONTENT FIELDS (10)
      event_type: "content_generated",
      platform: "tiktok",
      niche: "beauty",
      script: "POV: You discover the ultimate glow-up serum! 🌟 This Hero My First Serum is absolutely life-changing for beginner skincare routines. The lightweight formula absorbs instantly and leaves your skin feeling incredible. Perfect for anyone just starting their skincare journey!",
      product: "Hero My First Serum 1.69 fl oz",
      imageUrl: "https://example.com/hero-serum-image.jpg",
      tone: "enthusiastic",
      template: "short_video_script",
      postType: "reel",
      timestamp: new Date().toISOString(),
      
      // PLATFORM-SPECIFIC CAPTIONS (5)
      instagramCaption: "Discovering this Hero serum has been such a game-changer for my skincare journey ✨ Perfect for anyone starting their glow-up routine #skincare #beauty #selfcare",
      tiktokCaption: "POV: you found the holy grail skincare for beginners ✨ Hero My First Serum is giving me LIFE 🙌 #skincare #glowup #beauty",
      youtubeCaption: "In today's video, I'm sharing my honest review of the *Hero My First Serum* - and why it's perfect for skincare beginners. This lightweight serum has completely transformed my routine! #skincare #beautyreview #youtubeshorts",
      xCaption: "Plot twist: the best beginner serum was from Hero all along 💫 This changed my entire skincare game #skincare",
      facebookCaption: "Discovering this Hero serum has been such a game-changer for my skincare journey ✨ Perfect for anyone starting their glow-up routine #skincare #beauty #selfcare",
      
      // AI & MONETIZATION (4)
      model: "Claude",
      contentFormat: "Spartan Format",
      topRatedStyleUsed: true,
      affiliateLink: "https://www.amazon.com/s?k=Hero+My+First+Serum+1.69+fl+oz&tag=sgottshall107-20",
      
      // VIRAL INSPIRATION DATA (5)
      viralHook: "POV: You finally found the holy grail skincare routine starter",
      viralFormat: "Before/After transformation with trending audio and quick results",
      viralCaption: "This Hero serum literally changed my skin game in 30 days - no cap",
      viralHashtags: "#skincare, #hero, #serum, #skincareroutine, #glowup, #skintok",
      viralInspirationFound: true,
      
      // CHATGPT AI EVALUATION (5)
      chatgptViralityScore: 8.5,
      chatgptClarityScore: 9.2,
      chatgptPersuasivenessScore: 7.8,
      chatgptCreativityScore: 8.1,
      chatgptOverallScore: 8.4,
      
      // CLAUDE AI EVALUATION (5)
      claudeViralityScore: 7.9,
      claudeClarityScore: 8.7,
      claudePersuasivenessScore: 8.3,
      claudeCreativityScore: 7.5,
      claudeOverallScore: 8.1,
      
      // EVALUATION SUMMARY (2)
      averageOverallScore: 8.25,
      evaluationCompleted: true
    };
    
    // Enhanced logging with timestamp and highlighted fields
    const timestamp = new Date().toLocaleString();
    console.log(`\n🚀 [${timestamp}] COMPLETE 36-FIELD WEBHOOK TEST TO MAKE.COM`);
    console.log('━'.repeat(80));
    console.log(`📤 Event Type: ${testPayload.event_type}`);
    console.log(`🎯 Niche: ${testPayload.niche}`);
    console.log(`📝 Script Preview: ${testPayload.script.substring(0, 100)}...`);
    console.log(`🔗 Product: ${testPayload.product}`);
    console.log(`🤖 AI Model: ${testPayload.model}`);
    console.log(`📄 Content Format: ${testPayload.contentFormat}`);
    console.log(`💰 Affiliate Link: ${testPayload.affiliateLink ? 'Yes' : 'No'}`);
    console.log(`🔥 Viral Hook: ${testPayload.viralHook}`);
    console.log(`📊 ChatGPT Overall Score: ${testPayload.chatgptOverallScore}`);
    console.log(`📊 Claude Overall Score: ${testPayload.claudeOverallScore}`);
    console.log(`📊 Average Score: ${testPayload.averageOverallScore}`);
    console.log(`✅ All 36 Fields Included: Basic(10) + Captions(5) + AI&Monetization(4) + Viral(5) + ChatGPT(5) + Claude(5) + Summary(2)`);
    console.log('━'.repeat(80));
    console.log('📋 COMPLETE TEST PAYLOAD (ALL 36 FIELDS):');
    console.log(JSON.stringify(testPayload, null, 2));
    console.log('━'.repeat(80));
    
    // Send directly to webhook URL
    const response = await axios.post(config.url, testPayload, {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Accept': 'application/json',
        'User-Agent': 'GlowBot/1.0'
      },
      timeout: 15000
    });
    
    console.log('✅ Test webhook sent successfully:', response.status);
    
    res.json({
      success: true,
      message: 'New JSON format test webhook sent successfully',
      data: testPayload
    });
    
  } catch (error: any) {
    console.error('Error sending test webhook:', error.response?.data || error.message);
    res.status(500).json({
      success: false,
      message: `Failed to send test webhook: ${error.response?.data || error.message}`,
      details: error.response?.status ? `HTTP ${error.response.status}` : 'Network error'
    });
  }
});

export { router as webhookTestRouter };