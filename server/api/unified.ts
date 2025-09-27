import { Router } from 'express';
import { z } from 'zod';
import { PromptEngine, PromptRequest } from './unified/engine';
import { contentRepo, CreateContentRequest } from './unified/repository';

const router = Router();
const promptEngine = new PromptEngine();

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
      });
    }

    const request: PromptRequest = validation.data;

    // Generate content using prompt engine
    const promptResult = await promptEngine.generate(request);

    // Create content item and save to repository
    const contentItem = await contentRepo.create({
      module: request.module,
      platform: request.platform,
      playbook: request.playbook,
      text: promptResult.text,
      meta: promptResult.meta,
    });

    // Return successful response
    res.json({
      success: true,
      data: contentItem,
    });

  } catch (error) {
    console.error('Generation error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    });
  }
});

// GET /api/health - System health check
router.get('/health', async (req, res) => {
  try {
    const contentCount = await contentRepo.count();
    const modules = promptEngine.getModules();

    res.json({
      success: true,
      status: 'healthy',
      timestamp: new Date().toISOString(),
      data: {
        contentCount,
        modulesAvailable: modules.length,
        modules: modules.map(m => ({ key: m.key, name: m.name, playbooksCount: m.playbooks.length })),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// GET /api/modules - List available modules and playbooks
router.get('/modules', async (req, res) => {
  try {
    const modules = promptEngine.getModules();
    res.json({
      success: true,
      data: modules,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    });
  }
});

// GET /api/content - List generated content
router.get('/content', async (req, res) => {
  try {
    const { module, platform } = req.query;
    const items = await contentRepo.findAll({
      module: module as string,
      platform: platform as string,
    });

    res.json({
      success: true,
      data: items,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    });
  }
});

// PATCH /api/content/:id - Update existing content
router.patch('/content/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate update payload
    const UpdateContentSchema = z.object({
      module: z.enum(['scriptok', 'glowbot']).optional(),
      platform: z.enum(['tiktok', 'shorts', 'reels', 'blog', 'youtube', 'email']).optional(),
      playbook: z.string().min(1).optional(),
      text: z.string().min(1).optional(),
      meta: z.record(z.any()).optional(),
    });

    const validation = UpdateContentSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: 'Invalid update data',
        details: validation.error.errors,
      });
    }

    const updates = validation.data;
    const updatedItem = await contentRepo.update(id, updates);
    if (!updatedItem) {
      return res.status(404).json({
        success: false,
        error: 'Content not found',
      });
    }

    res.json({
      success: true,
      data: updatedItem,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    });
  }
});

// DELETE /api/content/:id - Delete content item
router.delete('/content/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await contentRepo.delete(id);
    
    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: 'Content not found',
      });
    }

    res.json({
      success: true,
      message: 'Content deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    });
  }
});

// GET /api/version - Current version info  
router.get('/version', async (req, res) => {
  res.json({
    success: true,
    data: {
      version: '1.0.0',
      name: 'GlowBot Monorepo',
      modules: ['glowbot', 'scriptok'],
      buildTime: new Date().toISOString(),
    },
  });
});

export default router;