// Main exports for prompt factory
export * from './types';
export * from './engine';

// Module exports
export * from './modules/glowbot';
export * from './modules/scriptok';

// Main generate function (simplified interface)
import { promptEngine } from './engine';
import { PromptRequest, PromptResult } from './types';

export async function generate(request: PromptRequest): Promise<PromptResult> {
  return promptEngine.generate(request);
}

// Export default instance
export { promptEngine };