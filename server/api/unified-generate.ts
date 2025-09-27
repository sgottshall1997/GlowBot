import { Router } from 'express';
import { z } from 'zod';
import { contentRepo } from '../../packages/shared/src/contentRepo.memory';
import { generateId } from '../../packages/shared/src/utils';
import type { GenerateRequest, GenerateResponse, HealthResponse } from '../../packages/shared/src/types';

// Import prompt factory (temporary direct import until workspaces are set up)
import { generate as generatePrompt } from '../../packages/prompt-factory/src/index';

const router = Router();

// Request validation schema
const GenerateRequestSchema = z.object({
  module: z.enum(['scriptok', 'glowbot']),
  platform: z.enum(['tiktok', 'shorts', 'reels', 'blog', 'youtube', 'email']),
  playbook: z.string().min(1),
  inputs: z.record(z.any()),
});

// POST /api/generate - Unified content generation endpoint
router.post('/generate', async (req, res) => {
  try {
    // Validate request
    const validation = GenerateRequestSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request format',
        details: validation.error.errors,
      } satisfies GenerateResponse);
    }

    const request: GenerateRequest = validation.data;

    // Generate content using prompt factory
    const promptResult = await generatePrompt(request);

    // Create content item and save to repository
    const contentItem = await contentRepo.create({
      module: request.module,
      platform: request.platform,
      playbook: request.playbook,
      text: promptResult.text,
      meta: promptResult.meta,
    });

    return res.json({
      success: true,
      data: contentItem,
    } satisfies GenerateResponse);

  } catch (error) {
    console.error('Generate API error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    } satisfies GenerateResponse);
  }
});

// GET /api/health - Health check endpoint
router.get('/health', async (req, res) => {
  try {
    // Check content repository
    const count = await contentRepo.count();
    
    const response: HealthResponse = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
    };

    return res.json(response);
  } catch (error) {
    console.error('Health check error:', error);
    return res.status(500).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
    } satisfies HealthResponse);
  }
});

// GET /api/version - Version endpoint
router.get('/version', async (req, res) => {
  return res.json({
    version: process.env.npm_package_version || '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// GET /api/modules - List available modules and playbooks
router.get('/modules', async (req, res) => {
  try {
    const { promptEngine } = await import('../../packages/prompt-factory/src/index');
    
    const modules = promptEngine.getModules().map(moduleKey => ({
      key: moduleKey,
      name: moduleKey === 'glowbot' ? 'GlowBot' : 'ScriptTok',
      playbooks: promptEngine.getPlaybooks(moduleKey).map(playbook => ({
        id: playbook.id,
        name: playbook.name,
        description: playbook.description,
        platforms: playbook.platforms,
      })),
    }));

    return res.json({ modules });
  } catch (error) {
    console.error('Modules API error:', error);
    return res.status(500).json({
      error: 'Failed to fetch modules',
    });
  }
});

// GET /api/content - List generated content
router.get('/content', async (req, res) => {
  try {
    const { module } = req.query;
    
    let content;
    if (module && typeof module === 'string') {
      content = await contentRepo.findByModule(module as 'scriptok' | 'glowbot');
    } else {
      content = await contentRepo.findAll();
    }

    return res.json({ content });
  } catch (error) {
    console.error('Content API error:', error);
    return res.status(500).json({
      error: 'Failed to fetch content',
    });
  }
});

export { router as unifiedGenerateRouter };