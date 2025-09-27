import { Router, Request, Response } from "express";
import { z } from "zod";
import { contentRepo } from "../../packages/shared/src/contentRepo.memory";
import { generate as promptFactoryGenerate } from "../../packages/prompt-factory/src/index";

const router = Router();

// Health endpoint
router.get('/health', (req: Request, res: Response) => {
  res.json({ 
    ok: true,
    timestamp: new Date().toISOString(),
    status: 'healthy'
  });
});

// Version endpoint  
router.get('/version', (req: Request, res: Response) => {
  res.json({ 
    version: process.env.npm_package_version || '1.0.0'
  });
});

// Generate content endpoint
const generateRequestSchema = z.object({
  module: z.enum(['scriptok', 'glowbot']),
  platform: z.enum(['tiktok', 'shorts', 'reels', 'blog', 'youtube', 'email']),
  playbook: z.string(),
  inputs: z.record(z.unknown())
});

router.post('/generate', async (req: Request, res: Response) => {
  try {
    // Validate request body
    const parseResult = generateRequestSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: 'Invalid request body',
        details: parseResult.error.errors
      });
    }

    const { module, platform, playbook, inputs } = parseResult.data;

    // Call prompt-factory to generate content
    const result = await promptFactoryGenerate({
      module,
      platform,
      playbook,
      inputs
    });

    // Save to content repository
    const contentItem = await contentRepo.create({
      module,
      platform,
      playbook,
      text: result.text,
      meta: result.meta
    });

    res.json(contentItem);
  } catch (error) {
    console.error('Generation error:', error);
    res.status(500).json({
      error: 'Failed to generate content',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// List content endpoint
router.get('/content', async (req: Request, res: Response) => {
  try {
    const module = req.query.module as 'scriptok' | 'glowbot' | undefined;
    
    let items;
    if (module) {
      items = await contentRepo.findByModule(module);
    } else {
      items = await contentRepo.findAll();
    }

    res.json(items);
  } catch (error) {
    console.error('List content error:', error);
    res.status(500).json({
      error: 'Failed to list content',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// List available modules and playbooks
router.get('/modules', (req: Request, res: Response) => {
  try {
    const modules = {
      glowbot: {
        name: "GlowBot",
        description: "AI-powered viral content generation",
        playbooks: [
          {
            id: "viral-hook",
            name: "Viral Hook Generator", 
            description: "Creates engaging hooks for social media content",
            platforms: ["tiktok", "shorts", "reels"]
          },
          {
            id: "content-script",
            name: "Content Script Generator",
            description: "Generates complete scripts for video content", 
            platforms: ["youtube", "tiktok", "shorts"]
          },
          {
            id: "trend-adaptation",
            name: "Trend Adaptation",
            description: "Adapts trending formats to your content",
            platforms: ["tiktok", "shorts", "reels"]
          }
        ]
      },
      scriptok: {
        name: "ScriptTok",
        description: "Specialized script generation for short-form video content",
        playbooks: [
          {
            id: "tiktok-script",
            name: "TikTok Script Generator",
            description: "Creates engaging TikTok scripts with hooks and viral elements",
            platforms: ["tiktok"]
          },
          {
            id: "shorts-script", 
            name: "YouTube Shorts Generator",
            description: "Optimized scripts for YouTube Shorts format",
            platforms: ["shorts"]
          },
          {
            id: "reels-script",
            name: "Instagram Reels Creator", 
            description: "Instagram Reels scripts with visual storytelling",
            platforms: ["reels"]
          }
        ]
      }
    };

    res.json(modules);
  } catch (error) {
    console.error('List modules error:', error);
    res.status(500).json({
      error: 'Failed to list modules',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;