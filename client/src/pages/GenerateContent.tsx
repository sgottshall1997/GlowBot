import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ContentHistoryManager } from '@shared/contentHistoryUtils';


import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { 
  Sparkles, 
  Clock, 
  Copy, 
  RefreshCw, 
  Edit,
  ChevronDown,
  Zap,
  ExternalLink
} from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { TemplateSelector } from "@/components/TemplateSelector";

// Video duration interface
interface VideoDuration {
  seconds: number;
  readableTime: string;
  wordCount: number;
  pacing: 'slow' | 'moderate' | 'fast';
  isIdealLength: boolean;
  lengthFeedback: string;
}

interface GeneratedContent {
  content: string;
  hook: string;
  platform: string;
  niche: string;
  videoDuration?: VideoDuration;
}

const GenerateContent = () => {
  const [location] = useLocation();
  const { toast } = useToast();
  
  // Extract niche from URL path
  const urlParts = location.split('/');
  const nicheFromUrl = urlParts[2]; // /niche/skincare -> skincare
  
  // Extract template and product from query params using window.location.search
  const urlParams = new URLSearchParams(window.location.search);
  const templateFromUrl = urlParams.get('template');
  const productFromUrl = urlParams.get('product');
  
  // Debug logging to see what we're getting
  // console.log('🔍 URL Debug:', { location, search: window.location.search, productFromUrl, nicheFromUrl });

  // State management
  const [selectedNiche, setSelectedNiche] = useState(nicheFromUrl || 'beauty');
  const [selectedProduct, setSelectedProduct] = useState(productFromUrl || '');
  
  // Update state when URL parameters change
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const productParam = urlParams.get('product');
    const nicheParam = urlParams.get('niche');
    
    // console.log('🔍 useEffect URL parsing:', { productParam, nicheParam });
    
    if (productParam && productParam !== selectedProduct) {
      setSelectedProduct(productParam);
      // console.log('🔍 Setting product from URL:', productParam);
    }
    
    if (nicheParam && nicheParam !== selectedNiche) {
      setSelectedNiche(nicheParam);
      // console.log('🔍 Setting niche from URL:', nicheParam);
    }
  }, [location, window.location.search]);
  const [productUrl, setProductUrl] = useState('');
  const [affiliateNetwork, setAffiliateNetwork] = useState('amazon');
  const [affiliateId, setAffiliateId] = useState('sgottshall107-20');
  const [smartRedirectUrl, setSmartRedirectUrl] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(['tiktok']);
  const [scheduleTime, setScheduleTime] = useState('now');
  const [templateType, setTemplateType] = useState(templateFromUrl || 'social_media_post');
  const [tone, setTone] = useState('enthusiastic');
  const [isHookGeneratorOpen, setIsHookGeneratorOpen] = useState(false);
  const [customHook, setCustomHook] = useState('');
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPlatformCaptions, setShowPlatformCaptions] = useState(true);
  const [useSmartStyle, setUseSmartStyle] = useState(false);
  const [currentPromptStructure, setCurrentPromptStructure] = useState<{
    systemPrompt: string;
    userPrompt: string;
    templateType: string;
  } | null>(null);
  
  // Viral inspiration data (will be populated when product is selected)
  const [viralInspo, setViralInspo] = useState<{
    hook: string;
    format: string;
    caption: string;
    hashtags: string[];
  } | null>(null);
  const [viralInspoLoading, setViralInspoLoading] = useState(false);



  // Generate smart redirect URL
  const generateRedirectUrl = async () => {
    if (!productUrl || !affiliateId) {
      toast({
        title: "Missing Information",
        description: "Please enter both Product URL and Affiliate ID",
        variant: "destructive",
      });
      return;
    }
    
    try {
      // Create the redirect mapping on the server
      const response = await fetch('/api/create-redirect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productUrl,
          affiliateId,
          affiliateNetwork,
          productName: selectedProduct,
          niche: selectedNiche
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create redirect');
      }
      
      const data = await response.json();
      setSmartRedirectUrl(data.redirectUrl);
      
      toast({
        title: "Smart Redirect Created",
        description: "Your trackable affiliate link is ready!",
      });
    } catch (error) {
      console.error('Error creating redirect:', error);
      toast({
        title: "Error",
        description: "Failed to create smart redirect. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Fetch viral inspiration using Perplexity API for real trending insights
  const fetchViralInspirationForProduct = async (productName: string) => {
    if (!productName.trim()) {
      setViralInspo(null);
      setViralInspoLoading(false);
      return;
    }

    setViralInspoLoading(true);
    
    try {
      // Import and use the utility function
      const { fetchViralVideoInspo } = await import('@/lib/fetchViralVideoInspo');
      const inspiration = await fetchViralVideoInspo(productName, selectedNiche);
      
      if (inspiration) {
        console.log('✅ Setting viral inspiration:', inspiration);
        setViralInspo(inspiration);
      } else {
        // If no real data found, clear state
        setViralInspo(null);
        console.warn('No recent viral examples found for', productName);
      }
    } catch (error) {
      console.error('Error fetching viral inspiration:', error);
      setViralInspo(null);
    } finally {
      setViralInspoLoading(false);
    }
  };

  // Watch for product name changes to fetch viral inspiration
  useEffect(() => {
    console.log('useEffect triggered:', { selectedProduct, selectedNiche });
    fetchViralInspirationForProduct(selectedProduct);
  }, [selectedProduct, selectedNiche]);

  // Fetch prompt structure when template type, niche, or tone changes
  const fetchPromptStructure = async () => {
    if (!templateType || !selectedNiche || !tone) {
      setCurrentPromptStructure(null);
      return;
    }

    try {
      const response = await fetch('/api/prompt-structure', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          templateType,
          niche: selectedNiche,
          tone,
          productName: selectedProduct || 'Sample Product',
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setCurrentPromptStructure(data);
      } else {
        console.error('Failed to fetch prompt structure');
        setCurrentPromptStructure(null);
      }
    } catch (error) {
      console.error('Error fetching prompt structure:', error);
      setCurrentPromptStructure(null);
    }
  };

  // Watch for changes in template type, niche, or tone to update prompt structure
  useEffect(() => {
    fetchPromptStructure();
  }, [templateType, selectedNiche, tone]);

  // Debug: Log viralInspo state changes
  useEffect(() => {
    console.log('🎯 Viral inspiration updated:', viralInspo);
  }, [viralInspo]);

  // Copy to clipboard helper
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: `${label} copied to clipboard`,
    });
  };

  // Generate platform-specific captions for displaying in UI (uses current state)
  const generatePlatformCaption = (platform: string): string => {
    if (!generatedContent || !selectedProduct) return '';

    const productName = selectedProduct;
    const mainContent = generatedContent.content;
    const linkUrl = smartRedirectUrl || productUrl || '#';
    
    // Extract first sentence or create a short description
    const shortDesc = mainContent.split('.')[0] + (mainContent.split('.').length > 1 ? '.' : '');
    
    const platformConfigs = {
      tiktok: {
        cta: "Tap the link to grab it now! 👆",
        hashtags: ["#fyp", "#viral", `#${selectedNiche}`, "#trending"],
        maxLength: 150
      },
      instagram: {
        cta: "Link in bio to get yours! ✨",
        hashtags: [`#${selectedNiche}`, "#aesthetic", "#musthave", "#lifestyle"],
        maxLength: 200
      },
      youtube: {
        cta: "Check the description for the link! 📝",
        hashtags: [`#${selectedNiche}`, "#review", "#recommendation", "#shopping"],
        maxLength: 250
      }
    };

    const config = platformConfigs[platform as keyof typeof platformConfigs];
    if (!config) return '';

    // Create caption components
    const hook = generatedContent.hook || generateDynamicHook(productName, selectedNiche);
    const description = shortDesc.length > config.maxLength ? 
      shortDesc.substring(0, config.maxLength - 3) + '...' : shortDesc;
    
    const caption = `${hook}

${description}

${config.cta}

${linkUrl}

${config.hashtags.join(' ')}`;

    return caption;
  };

  // Generate platform-specific captions for saving to history (uses provided data)
  // Dynamic hook generator for varied, engaging hooks
  const generateDynamicHook = (productName: string, niche: string): string => {
    const hooks = [
      `💫 ${productName} is a game changer!`,
      `🌟 ${productName} is a life saver!`,
      `✨ ${productName} changed everything for me!`,
      `🔥 ${productName} is absolutely incredible!`,
      `🚀 ${productName} is revolutionary!`,
      `💎 ${productName} is pure magic!`,
      `⚡ ${productName} is mind-blowing!`,
      `🎯 ${productName} hits different!`,
      `💝 ${productName} is everything!`,
      `🌈 ${productName} is perfection!`,
      `🔮 ${productName} is the secret weapon!`,
      `💖 ${productName} stole my heart!`,
      `🎊 ${productName} is the real deal!`,
      `⭐ ${productName} exceeds expectations!`,
      `🏆 ${productName} wins every time!`
    ];
    
    // Add niche-specific hooks
    const nicheHooks: { [key: string]: string[] } = {
      beauty: [
        `💄 ${productName} is my new obsession!`,
        `✨ ${productName} gave me confidence!`,
        `🌸 ${productName} is skincare gold!`,
        `💅 ${productName} is my holy grail!`
      ],
      tech: [
        `⚡ ${productName} is next level tech!`,
        `🤖 ${productName} is the future!`,
        `💻 ${productName} changed my workflow!`,
        `🔌 ${productName} is pure innovation!`
      ],
      fitness: [
        `💪 ${productName} transformed my workouts!`,
        `🏋️ ${productName} is my fitness secret!`,
        `🔥 ${productName} gets results!`,
        `⚡ ${productName} powers my training!`
      ],
      fashion: [
        `👗 ${productName} is my style staple!`,
        `✨ ${productName} completes every outfit!`,
        `💫 ${productName} is fashion perfection!`,
        `🌟 ${productName} makes me feel amazing!`
      ],
      food: [
        `🍽️ ${productName} is flavor paradise!`,
        `😋 ${productName} satisfies every craving!`,
        `🔥 ${productName} is deliciously addictive!`,
        `✨ ${productName} elevates every meal!`
      ],
      travel: [
        `✈️ ${productName} is my travel essential!`,
        `🌍 ${productName} makes adventures easier!`,
        `🧳 ${productName} is the perfect companion!`,
        `🗺️ ${productName} enhances every trip!`
      ],
      pets: [
        `🐾 ${productName} makes my pet happy!`,
        `💕 ${productName} is pet parent approved!`,
        `🐕 ${productName} is a furry friend favorite!`,
        `✨ ${productName} keeps pets healthy!`
      ]
    };
    
    // Combine general and niche-specific hooks
    const allHooks = [...hooks, ...(nicheHooks[niche] || [])];
    
    // Return random hook
    return allHooks[Math.floor(Math.random() * allHooks.length)];
  };

  const generatePlatformCaptionForSaving = (platform: string, contentData: GeneratedContent, productName: string, linkUrl: string, niche: string): string => {
    if (!contentData || !productName) return '';

    const mainContent = contentData.content;
    
    // Extract first sentence or create a short description
    const shortDesc = mainContent.split('.')[0] + (mainContent.split('.').length > 1 ? '.' : '');
    
    const platformConfigs = {
      tiktok: {
        cta: "Tap the link to grab it now! 👆",
        hashtags: ["#fyp", "#viral", `#${niche}`, "#trending"],
        maxLength: 150
      },
      instagram: {
        cta: "Link in bio to get yours! ✨",
        hashtags: [`#${niche}`, "#aesthetic", "#musthave", "#lifestyle"],
        maxLength: 200
      },
      youtube: {
        cta: "Check the description for the link! 📝",
        hashtags: [`#${niche}`, "#review", "#recommendation", "#shopping"],
        maxLength: 250
      },
      twitter: {
        cta: "Check the link! 🔗",
        hashtags: [`#${niche}`, "#trending", "#musthave"],
        maxLength: 200
      }
    };

    const config = platformConfigs[platform as keyof typeof platformConfigs];
    if (!config) return '';

    // Create caption components
    const hook = contentData.hook || generateDynamicHook(productName, niche);
    const description = shortDesc.length > config.maxLength ? 
      shortDesc.substring(0, config.maxLength - 3) + '...' : shortDesc;
    
    const caption = `${hook}

${description}

${config.cta}

${linkUrl}

${config.hashtags.join(' ')}`;

    return caption;
  };

  // Handle content generation
  // Auto-suggest template based on viral inspiration format
  const autoSuggestTemplate = (viralFormat: string): string => {
    const format = viralFormat.toLowerCase();
    
    // Map viral formats to available template types
    if (format.includes('demo') || format.includes('demonstration')) return 'demo_script';
    if (format.includes('voiceover') && format.includes('story')) return 'pov_story';
    if (format.includes('skit') || format.includes('dialogue')) return 'skit_dialogue';
    if (format.includes('reaction') || format.includes('react')) return 'reaction_video';
    if (format.includes('tutorial') || format.includes('how-to')) return 'tutorial_guide';
    if (format.includes('unboxing') || format.includes('unbox')) return 'unboxing_reveal';
    if (format.includes('review') || format.includes('testing')) return 'product_review';
    if (format.includes('comparison') || format.includes('vs')) return 'comparison_test';
    if (format.includes('testimonial') || format.includes('before_after')) return 'testimonial';
    if (format.includes('lifestyle') || format.includes('day_in_life')) return 'lifestyle_integration';
    
    // Default fallbacks based on common patterns
    if (format.includes('quick') || format.includes('60_second')) return 'quick_review';
    if (format.includes('hook') || format.includes('attention')) return 'viral_hook';
    
    return 'surprise_me'; // fallback to let AI choose
  };

  const handleGenerateContent = async () => {
    if (!selectedProduct) {
      toast({
        title: "Missing Product",
        description: "Please select a product first",
        variant: "destructive",
      });
      return;
    }

    // Auto-suggest template if viral inspiration is available and user hasn't manually selected one
    let finalTemplateType = templateType;
    let templateSource = 'manual';
    
    if (viralInspo && (templateType === 'surprise-me' || !templateType || templateType === 'original')) {
      finalTemplateType = autoSuggestTemplate(viralInspo.format);
      templateSource = `auto-suggested from format: ${viralInspo.format}`;
      
      // Update the UI to show the auto-suggested template
      setTemplateType(finalTemplateType);
      
      toast({
        title: "🎯 Auto-Template Selection",
        description: `Selected "${finalTemplateType}" based on viral format: ${viralInspo.format}`,
        duration: 4000,
      });
    }
    
    console.log("Template source:", templateSource);
    console.log("Selected template:", finalTemplateType);

    setIsGenerating(true);
    try {
      const response = await fetch('/api/generate-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product: selectedProduct,
          niche: selectedNiche,
          platforms: selectedPlatforms,
          templateType: finalTemplateType,
          tone,
          customHook,
          affiliateUrl: smartRedirectUrl || productUrl,
          viralInspiration: viralInspo, // Include viral inspiration data
          templateSource, // Track how template was selected
          useSmartStyle, // Enable smart style recommendations
          userId: 1 // Demo user ID for rating system
        }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('API Response:', result); // Debug log
        
        if (result.success && result.data) {
          // Extract content from the API response structure
          const contentData: GeneratedContent = {
            content: result.data.content,
            hook: result.data.customHook || '',
            platform: selectedPlatforms[0] || 'tiktok',
            niche: selectedNiche,
          };
          
          setGeneratedContent(contentData);
          
          // Generate platform-specific captions for saving to history
          const platformCaptions: any = {};
          selectedPlatforms.forEach(platform => {
            const caption = generatePlatformCaptionForSaving(platform, contentData, selectedProduct, smartRedirectUrl || productUrl, selectedNiche);
            switch(platform) {
              case 'tiktok':
                platformCaptions.tiktokCaption = caption;
                break;
              case 'instagram':
                platformCaptions.instagramCaption = caption;
                break;
              case 'youtube':
                platformCaptions.youtubeCaption = caption;
                break;
              case 'twitter':
                platformCaptions.twitterCaption = caption;
                break;
            }
          });

          // Save to content generation history
          const directAffiliateLink = productUrl && affiliateId ? 
            `${productUrl}${productUrl.includes('?') ? '&' : '?'}tag=${affiliateId}` : '';
          
          ContentHistoryManager.saveEntry({
            productName: selectedProduct,
            niche: selectedNiche,
            platformsSelected: selectedPlatforms,
            templateUsed: templateType,
            tone: tone,
            generatedOutput: {
              content: result.data.content,
              hook: result.data.customHook || '',
              platform: selectedPlatforms[0] || 'tiktok',
              niche: selectedNiche,
              hashtags: result.data.hashtags || [],
              affiliateLink: directAffiliateLink,
              viralInspo: viralInspo || undefined,
              ...platformCaptions
            },
            sessionId: `session_${Date.now()}`
          });
          
          toast({
            title: "Content Generated!",
            description: `Your ${templateType} content is ready`,
          });
          
          // Show Surprise Me reasoning if available
          if (result.data.surpriseMeReasoning) {
            toast({
              title: "🎲 Surprise Me Selection",
              description: result.data.surpriseMeReasoning,
              duration: 5000,
            });
          }
        } else {
          console.error('API Response Error:', result);
          throw new Error(result.error || 'Generation failed');
        }
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Generation failed');
      }
    } catch (error) {
      console.error('Content generation error:', error); // Debug log
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast({
        title: "Generation Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Platform toggle
  const togglePlatform = (platform: string) => {
    setSelectedPlatforms(prev => 
      prev.includes(platform) 
        ? prev.filter(p => p !== platform)
        : [...prev, platform]
    );
  };

  // Niche data
  const niches = [
    { id: 'beauty', name: 'Beauty & Personal Care', color: 'bg-pink-100 text-pink-800' },
    { id: 'tech', name: 'Tech', color: 'bg-blue-100 text-blue-800' },
    { id: 'fashion', name: 'Fashion', color: 'bg-purple-100 text-purple-800' },
    { id: 'fitness', name: 'Fitness', color: 'bg-green-100 text-green-800' },
    { id: 'food', name: 'Food', color: 'bg-orange-100 text-orange-800' },
    { id: 'travel', name: 'Travel', color: 'bg-cyan-100 text-cyan-800' },
    { id: 'pets', name: 'Pets', color: 'bg-yellow-100 text-yellow-800' },
  ];

  const platforms = [
    { id: 'tiktok', name: 'TikTok', color: 'bg-black text-white' },
    { id: 'instagram', name: 'Instagram', color: 'bg-gradient-to-r from-purple-400 to-pink-400 text-white' },
    { id: 'youtube', name: 'YouTube', color: 'bg-red-500 text-white' },
    { id: 'twitter', name: 'Twitter', color: 'bg-blue-400 text-white' },
    { id: 'other', name: 'Other', color: 'bg-gray-500 text-white' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-gray-900">⚡ Viral Content Factory</h1>
          <p className="text-lg text-muted-foreground">
            From trending product to viral content in under 60 seconds
          </p>
        </div>



        {/* Content Generation Module - Vertical Stack Layout */}
        <div className="flex flex-col gap-6 w-full max-w-3xl mx-auto">
          {/* Product & Affiliate Setup */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-blue-500" />
                📄 Product & Affiliate Setup
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
            {/* Product Name */}
            <div>
              <Label htmlFor="product">Product Name</Label>
              <Input
                id="product"
                value={selectedProduct}
                onChange={(e) => setSelectedProduct(e.target.value)}
                placeholder="Enter product name..."
              />
            </div>

            {/* Niche */}
            <div>
              <Label htmlFor="niche">Niche</Label>
              <Select value={selectedNiche} onValueChange={setSelectedNiche}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {niches.map((niche) => (
                    <SelectItem key={niche.id} value={niche.id}>
                      {niche.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Affiliate Link Generator */}
            <div className="border rounded-lg p-4 space-y-3 bg-gray-50">
              <h4 className="font-medium text-sm">🔗 Affiliate Link Generator</h4>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="network" className="text-xs">Network</Label>
                  <Select value={affiliateNetwork} onValueChange={setAffiliateNetwork}>
                    <SelectTrigger className="h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="amazon">Amazon</SelectItem>
                      <SelectItem value="shareasale">ShareASale</SelectItem>
                      <SelectItem value="cj">Commission Junction</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="affiliate-id" className="text-xs">Affiliate ID</Label>
                  <Input
                    id="affiliate-id"
                    className="h-8"
                    value={affiliateId}
                    onChange={(e) => setAffiliateId(e.target.value)}
                    placeholder="Your ID..."
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="product-url" className="text-xs">Product URL</Label>
                <Input
                  id="product-url"
                  className="h-8"
                  value={productUrl}
                  onChange={(e) => setProductUrl(e.target.value)}
                  placeholder="https://..."
                />
              </div>

              {productUrl && affiliateId && (
                <div className="text-xs bg-blue-50 p-3 rounded border border-blue-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-blue-700 font-medium">✅ Amazon Affiliate Link</span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(`${productUrl}${productUrl.includes('?') ? '&' : '?'}tag=${affiliateId}`, 'Amazon affiliate link')}
                      className="h-6 px-2 text-xs"
                    >
                      <Copy className="h-3 w-3 mr-1" />
                      Copy
                    </Button>
                  </div>
                  <code className="block text-blue-800 bg-white p-2 rounded border text-xs">{`${productUrl}${productUrl.includes('?') ? '&' : '?'}tag=${affiliateId}`}</code>
                  <p className="text-blue-600 text-xs mt-2">Direct Amazon link with your associate tag for proper tracking.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Viral Inspiration Preview */}
        {selectedProduct && (viralInspoLoading || viralInspo) && (
          <Card className="shadow-lg bg-[#fff9f0] border border-orange-300">
            <CardHeader className="pb-3">
              <CardTitle className="text-orange-700 flex items-center gap-2">
                {viralInspoLoading ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Analyzing Viral Trends...
                  </>
                ) : (
                  <>🎯 Viral Inspiration Found</>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {viralInspoLoading ? (
                <div className="space-y-2">
                  <p className="text-sm text-orange-600">Searching TikTok and Instagram for viral content patterns...</p>
                </div>
              ) : viralInspo ? (
                <>
                  <p><strong>Hook:</strong> {viralInspo.hook}</p>
                  <p><strong>Format:</strong> {viralInspo.format}</p>
                  <p><strong>Caption:</strong> {viralInspo.caption}</p>
                  <p><strong>Hashtags:</strong> {viralInspo.hashtags?.join(" ")}</p>
                </>
              ) : (
                <p className="text-sm text-orange-600">No recent viral examples found — try refreshing or selecting another product.</p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Content Setup */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-purple-500" />
              🚀 Content Setup
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Platform Selector */}
            <div>
              <Label className="text-sm font-medium">Platforms</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {platforms.map((platform) => (
                  <Button
                    key={platform.id}
                    size="sm"
                    variant={selectedPlatforms.includes(platform.id) ? "default" : "outline"}
                    className={selectedPlatforms.includes(platform.id) ? platform.color : ""}
                    onClick={() => togglePlatform(platform.id)}
                  >
                    {platform.name}
                  </Button>
                ))}
              </div>
            </div>

            {/* Schedule */}
            <div>
              <Label htmlFor="schedule">Schedule</Label>
              <Select value={scheduleTime} onValueChange={setScheduleTime}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="now">Post Now</SelectItem>
                  <SelectItem value="1hour">1 Hour Later</SelectItem>
                  <SelectItem value="custom">Schedule Later</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Template Type */}
            <div>
              <Label htmlFor="template">Template Type</Label>
              <TemplateSelector 
                value={templateType} 
                onChange={setTemplateType}
                selectedNiche={selectedNiche}
              />
            </div>

            {/* Prompt Structure Card */}
            {currentPromptStructure && (
              <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-sm font-semibold text-blue-800">
                    📋 Prompt Structure
                  </CardTitle>
                  <p className="text-xs text-blue-600">
                    See exactly how AI prompts are structured for {selectedNiche} content with {templateType} template
                  </p>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label className="text-xs font-medium text-gray-700">System Prompt</Label>
                    <div className="bg-white rounded-md border border-blue-200 p-3 text-xs font-mono text-gray-700 max-h-32 overflow-y-auto">
                      {currentPromptStructure.systemPrompt}
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-gray-700">User Prompt Template</Label>
                    <div className="bg-white rounded-md border border-blue-200 p-3 text-xs font-mono text-gray-700 max-h-40 overflow-y-auto">
                      {currentPromptStructure.userPrompt}
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs text-blue-600">
                    <span>Template: {currentPromptStructure.templateType}</span>
                    <span>Format: Standard</span>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Tone */}
            <div>
              <Label htmlFor="tone">Tone</Label>
              <Select value={tone} onValueChange={setTone}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="enthusiastic">Enthusiastic</SelectItem>
                  <SelectItem value="professional">Professional</SelectItem>
                  <SelectItem value="casual">Casual</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Smart Style Toggle */}
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
              <div className="flex-1">
                <Label htmlFor="smart-style" className="text-sm font-medium text-purple-800">
                  Use My Best-Rated Style
                </Label>
                <p className="text-xs text-purple-600 mt-1">
                  Generate content based on your highest-rated posts (80+ rating)
                </p>
              </div>
              <Switch
                id="smart-style"
                checked={useSmartStyle}
                onCheckedChange={setUseSmartStyle}
              />
            </div>

            {/* Generate Button */}
            <Button 
              className="w-full h-12 text-lg font-semibold"
              onClick={handleGenerateContent}
              disabled={isGenerating || !selectedProduct}
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                  Generating Content...
                </>
              ) : (
                <>
                  <Zap className="h-5 w-5 mr-2" />
                  🚀 Generate Viral Content (60s)
                </>
              )}
            </Button>
            </CardContent>
          </Card>
        </div>

        {/* 3️⃣ Optional Hook Generator */}
        <Collapsible open={isHookGeneratorOpen} onOpenChange={setIsHookGeneratorOpen}>
          <Card className="shadow-lg">
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-gray-50">
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-yellow-500" />
                    🎨 Viral Hook Generator (Optional)
                  </span>
                  <ChevronDown className={`h-4 w-4 transition-transform ${isHookGeneratorOpen ? 'rotate-180' : ''}`} />
                </CardTitle>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="custom-hook">Custom Hook</Label>
                  <Textarea
                    id="custom-hook"
                    value={customHook}
                    onChange={(e) => setCustomHook(e.target.value)}
                    placeholder="Enter a custom hook or leave blank for AI-generated..."
                    rows={3}
                  />
                </div>
                </div>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        {/* 4️⃣ Generated Content Output */}
        {generatedContent && (
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-green-500" />
                ✨ Generated Content
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-gray-50 p-6 rounded-lg border-l-4 border-green-500">
                  <h4 className="font-semibold mb-3 text-lg">Generated Content:</h4>
                  <div className="text-sm text-gray-600 mb-4 flex gap-4 flex-wrap">
                    <span className="bg-white px-2 py-1 rounded">Template: {templateType}</span>
                    <span className="bg-white px-2 py-1 rounded">Tone: {tone}</span>
                    <span className="bg-white px-2 py-1 rounded">Niche: {selectedNiche}</span>
                    {generatedContent.videoDuration && (
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded font-medium">
                        ⏱️ Est. Duration: {generatedContent.videoDuration.readableTime} ({generatedContent.videoDuration.wordCount} words)
                      </span>
                    )}
                    {generatedContent.videoDuration?.isIdealLength && (
                      <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
                        ✅ Perfect for social media
                      </span>
                    )}
                    {generatedContent.videoDuration && !generatedContent.videoDuration.isIdealLength && (
                      <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs" title={generatedContent.videoDuration.lengthFeedback}>
                        ⚠️ {generatedContent.videoDuration.lengthFeedback.includes('short') ? 'Too short' : 'Too long'}
                      </span>
                    )}
                  </div>
                  <div className="prose prose-sm max-w-none">
                    <p className="whitespace-pre-wrap text-gray-900 leading-relaxed">{generatedContent.content}</p>
                  </div>
                </div>
              
                {generatedContent.hook && (
                  <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
                    <h4 className="font-semibold mb-2">Viral Hook:</h4>
                    <p className="text-blue-900 font-medium">{generatedContent.hook}</p>
                  </div>
                )}

                {/* Platform-Specific Captions */}
                <div className="space-y-4 border-t pt-6">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-lg flex items-center gap-2">
                      🎯 Platform-Specific Captions
                    </h4>
                    <div className="flex items-center gap-2">
                      <Switch 
                        checked={showPlatformCaptions}
                        onCheckedChange={setShowPlatformCaptions}
                        id="platform-captions"
                      />
                      <Label htmlFor="platform-captions" className="text-sm font-medium">Show Captions</Label>
                    </div>
                  </div>
                  
                  {!showPlatformCaptions && (
                    <p className="text-sm text-muted-foreground">
                      Toggle to show platform-optimized captions with hashtags and CTAs
                    </p>
                  )}
                  
                  {showPlatformCaptions && (
                    <div className="space-y-4">
                      {/* TikTok Caption */}
                      <div className="bg-black text-white p-4 rounded-lg border">
                        <div className="flex items-center justify-between mb-3">
                          <h5 className="font-semibold flex items-center gap-2 text-white">
                            📱 TikTok Caption
                          </h5>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => copyToClipboard(generatePlatformCaption('tiktok'), 'TikTok caption')}
                            className="text-xs bg-white text-black hover:bg-gray-100"
                          >
                            <Copy className="h-3 w-3 mr-1" />
                            Copy
                          </Button>
                        </div>
                        <div className="bg-gray-900 p-4 rounded border border-gray-700 text-sm font-mono whitespace-pre-wrap text-gray-100 leading-relaxed max-h-40 overflow-y-auto">
                          {generatePlatformCaption('tiktok')}
                        </div>
                      </div>

                      {/* Instagram Caption */}
                      <div className="bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 text-white p-4 rounded-lg border">
                        <div className="flex items-center justify-between mb-3">
                          <h5 className="font-semibold flex items-center gap-2 text-white">
                            📸 Instagram Caption
                          </h5>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => copyToClipboard(generatePlatformCaption('instagram'), 'Instagram caption')}
                            className="text-xs bg-white text-purple-600 hover:bg-gray-100"
                          >
                            <Copy className="h-3 w-3 mr-1" />
                            Copy
                          </Button>
                        </div>
                        <div className="bg-black bg-opacity-30 backdrop-blur-sm p-4 rounded border border-white/20 text-sm font-mono whitespace-pre-wrap text-white leading-relaxed max-h-40 overflow-y-auto">
                          {generatePlatformCaption('instagram')}
                        </div>
                      </div>

                      {/* YouTube Caption */}
                      <div className="bg-red-600 text-white p-4 rounded-lg border">
                        <div className="flex items-center justify-between mb-3">
                          <h5 className="font-semibold flex items-center gap-2 text-white">
                            ▶️ YouTube Caption
                          </h5>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => copyToClipboard(generatePlatformCaption('youtube'), 'YouTube caption')}
                            className="text-xs bg-white text-red-600 hover:bg-gray-100"
                          >
                            <Copy className="h-3 w-3 mr-1" />
                            Copy
                          </Button>
                        </div>
                        <div className="bg-red-800 p-4 rounded border border-red-700 text-sm font-mono whitespace-pre-wrap text-red-100 leading-relaxed max-h-40 overflow-y-auto">
                          {generatePlatformCaption('youtube')}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => {
                    navigator.clipboard.writeText(generatedContent.content);
                    toast({
                      title: "Copied!",
                      description: "Content copied to clipboard",
                    });
                  }}
                >
                  <Copy className="h-4 w-4 mr-1" />
                  Copy Content
                </Button>
                <Button size="sm" variant="outline">
                  <Edit className="h-4 w-4 mr-1" />
                  Edit Hook
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={handleGenerateContent}
                  disabled={isGenerating}
                >
                  <RefreshCw className={`h-4 w-4 mr-1 ${isGenerating ? 'animate-spin' : ''}`} />
                  {isGenerating ? 'Generating...' : 'Regenerate'}
                </Button>
              </div>
            </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default GenerateContent;