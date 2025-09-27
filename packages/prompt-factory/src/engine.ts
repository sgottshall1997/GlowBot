import { PromptRequest, PromptResult, PlaybookTemplate, ModuleConfig } from './types';
import { glowbotModule } from './modules/glowbot';
import { scriptokModule } from './modules/scriptok';

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
    const processedText = this.processTemplate(playbook.template, allInputs);

    return {
      text: processedText,
      meta: {
        module,
        platform,
        playbook: playbookId,
        templateId: playbook.id,
        processedAt: new Date().toISOString(),
      },
    };
  }

  getModules(): string[] {
    return Array.from(this.modules.keys());
  }

  getPlaybooks(module: string): PlaybookTemplate[] {
    const moduleConfig = this.modules.get(module);
    return moduleConfig ? moduleConfig.playbooks : [];
  }

  getPlaybook(module: string, playbookId: string): PlaybookTemplate | null {
    const playbooks = this.getPlaybooks(module);
    return playbooks.find(p => p.id === playbookId) || null;
  }
}

// Default engine instance
export const promptEngine = new PromptEngine();