// Unified prompt engine copied from packages for immediate use
export type ModuleKey = 'glowbot' | 'scriptok';

export interface PromptRequest {
  module: ModuleKey;
  platform: string;
  playbook: string;
  inputs: Record<string, any>;
}

export interface PromptResult {
  text: string;
  meta?: Record<string, unknown>;
}

interface PlaybookTemplate {
  id: string;
  name: string;
  description: string;
  platforms: string[];
  template: string;
  schema?: Record<string, any>;
}

interface ModuleConfig {
  name: string;
  playbooks: PlaybookTemplate[];
}

// GlowBot Module Templates
const glowbotModule: ModuleConfig = {
  name: 'GlowBot',
  playbooks: [
    {
      id: 'viral-hook',
      name: 'Viral Hook Generator',
      description: 'Create attention-grabbing hooks designed to go viral',
      platforms: ['tiktok', 'shorts', 'reels'],
      template: `Create a viral hook about {{topic}} for {{platform}}:

Topic: {{topic}}
Target Audience: {{audience}}
Tone: {{tone}}

Generate a compelling hook that:
- Grabs attention in the first 3 seconds
- Creates curiosity or emotion
- Is platform-optimized for {{platform}}
- Speaks directly to {{audience}}
- Uses {{tone}} tone

Hook:`,
    },
    {
      id: 'content-script',
      name: 'Full Content Script',
      description: 'Generate complete script for viral content',
      platforms: ['tiktok', 'shorts', 'reels', 'youtube'],
      template: `Create a full script for {{platform}} about {{topic}}:

Topic: {{topic}}
Target Audience: {{audience}}
Tone: {{tone}}
Duration: {{duration}} seconds

Script Structure:
1. Hook (0-3s): [Attention-grabbing opener]
2. Content (3-{{duration}}s): [Main value/entertainment]
3. CTA (last 2s): [Strong call-to-action]

Keep it engaging, {{tone}}, and optimized for {{audience}} on {{platform}}.

Script:`,
    },
    {
      id: 'trend-adaptation',
      name: 'Trend Adaptation',
      description: 'Adapt content to current trends',
      platforms: ['tiktok', 'shorts', 'reels'],
      template: `Adapt {{topic}} to the trending {{trend}} format for {{platform}}:

Original Topic: {{topic}}
Trending Format: {{trend}}
Platform: {{platform}}
Target Audience: {{audience}}

Create content that:
- Follows the {{trend}} format/style
- Incorporates {{topic}} naturally
- Feels authentic and not forced
- Maximizes viral potential

Adapted Content:`,
    }
  ]
};

// ScriptTok Module Templates
const scriptokModule: ModuleConfig = {
  name: 'ScriptTok',
  playbooks: [
    {
      id: 'tiktok-script',
      name: 'TikTok Script Generator',
      description: 'Specialized scripts for TikTok format',
      platforms: ['tiktok'],
      template: `Create a TikTok script about {{topic}}:

Topic: {{topic}}
Target Audience: {{audience}}
Tone: {{tone}}

TikTok-Specific Requirements:
- Hook in first 3 seconds
- Fast-paced, engaging content
- Clear visual cues
- Strong retention throughout
- Trending audio compatibility

Script with visual directions:
[VISUAL] [AUDIO/TEXT]`,
    },
    {
      id: 'shorts-script',
      name: 'YouTube Shorts Script',
      description: 'Optimized for YouTube Shorts format',
      platforms: ['shorts'],
      template: `Create a YouTube Shorts script about {{topic}}:

Topic: {{topic}}
Target Audience: {{audience}}
Tone: {{tone}}

YouTube Shorts Optimization:
- Strong hook for retention
- Value-packed content
- Subscribe/like reminders
- SEO-friendly language

Script:`,
    },
    {
      id: 'reels-script',
      name: 'Instagram Reels Script',
      description: 'Tailored for Instagram Reels audience',
      platforms: ['reels'],
      template: `Create an Instagram Reels script about {{topic}}:

Topic: {{topic}}
Target Audience: {{audience}}
Tone: {{tone}}

Instagram Reels Features:
- Aesthetic visual planning
- Hashtag optimization
- Story integration potential
- Share-worthy moments

Script with hashtag suggestions:`,
    }
  ]
};

// Template engine for processing prompts
export class PromptEngine {
  private modules: Map<string, ModuleConfig> = new Map();

  constructor() {
    // Register modules
    this.modules.set('glowbot', glowbotModule);
    this.modules.set('scriptok', scriptokModule);
  }

  private processTemplate(template: string, inputs: Record<string, any>): string {
    let processed = template;
    
    // Simple template variable replacement {{variable}}
    const variableRegex = /\{\{([^}]+)\}\}/g;
    processed = processed.replace(variableRegex, (match, variable) => {
      const trimmedVar = variable.trim();
      return inputs[trimmedVar] !== undefined ? String(inputs[trimmedVar]) : match;
    });

    return processed;
  }

  private validateInputs(playbook: PlaybookTemplate, inputs: Record<string, any>): boolean {
    // Basic validation - can be enhanced with schema validation
    if (!playbook.platforms.includes(inputs.platform)) {
      throw new Error(`Platform "${inputs.platform}" not supported for playbook "${playbook.id}". Supported platforms: ${playbook.platforms.join(', ')}`);
    }
    return true;
  }

  async generate(request: PromptRequest): Promise<PromptResult> {
    const { module, platform, playbook: playbookId, inputs } = request;

    // Get module
    const moduleConfig = this.modules.get(module);
    if (!moduleConfig) {
      throw new Error(`Module "${module}" not found. Available modules: ${Array.from(this.modules.keys()).join(', ')}`);
    }

    // Get playbook
    const playbook = moduleConfig.playbooks.find(p => p.id === playbookId);
    if (!playbook) {
      const availablePlaybooks = moduleConfig.playbooks.map(p => p.id).join(', ');
      throw new Error(`Playbook "${playbookId}" not found in module "${module}". Available playbooks: ${availablePlaybooks}`);
    }

    // Validate inputs
    const allInputs = { ...inputs, platform };
    this.validateInputs(playbook, allInputs);

    // Process template
    const processedPrompt = this.processTemplate(playbook.template, allInputs);

    // For now, return the processed template as the result
    // In a real implementation, this would be sent to an AI service
    return {
      text: processedPrompt,
      meta: {
        module,
        platform,
        playbook: playbookId,
        processedAt: new Date().toISOString(),
      },
    };
  }

  getModules(): Array<{ key: string; name: string; playbooks: Array<{ id: string; name: string; description: string; platforms: string[] }> }> {
    return Array.from(this.modules.entries()).map(([key, config]) => ({
      key,
      name: config.name,
      playbooks: config.playbooks.map(p => ({
        id: p.id,
        name: p.name,
        description: p.description,
        platforms: p.platforms,
      })),
    }));
  }
}