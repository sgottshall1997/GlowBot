import { generateWithFallback } from './openai';
import { generateWithClaude, generateJSONWithClaude } from './claude';
import type { ContentGenerationResponse, ContentGenerationError } from './responseTypes';

export type AIModel = 'chatgpt' | 'claude';

export interface AIGenerationOptions {
  model: AIModel;
  maxTokens?: number;
  temperature?: number;
  useJson?: boolean;
  systemPrompt?: string;
  metadata?: any;
  tryFallbackOnError?: boolean;
}

/**
 * Generate content using the specified AI model
 * @param prompt The prompt to send to the model
 * @param options Configuration options including model selection
 */
export async function generateWithAI(
  prompt: string,
  options: AIGenerationOptions
): Promise<ContentGenerationResponse | ContentGenerationError> {
  const {
    model = 'chatgpt',
    maxTokens = 1500,
    temperature = 0.7,
    useJson = false,
    systemPrompt = "You are a helpful assistant that provides accurate and detailed information.",
    metadata = {},
    tryFallbackOnError = true
  } = options;

  // 🔥 ABSOLUTE CLAUDE ENFORCEMENT - NO FALLBACK ALLOWED
  if (model === 'claude' || model === 'Claude' || model?.toLowerCase?.() === 'claude') {
    console.log(`🚨🚨🚨 ABSOLUTE CLAUDE ENFORCEMENT: Model parameter detected as Claude`);
    console.log(`🔥 CLAUDE ROUTE LOCKED: Bypassing all other logic - CLAUDE ONLY`);
    console.log(`🎯 DIRECT CLAUDE CALL: No switch statement, no fallback, CLAUDE GUARANTEED`);
    
    try {
      if (useJson) {
        const result = await generateJSONWithClaude(prompt, {
          maxTokens,
          temperature,
          systemPrompt,
          metadata: { ...metadata, model: 'claude', forcedClaude: true }
        });
        console.log(`✅ CLAUDE JSON GENERATION COMPLETED SUCCESSFULLY`);
        return result;
      } else {
        const result = await generateWithClaude(prompt, {
          maxTokens,
          temperature,
          systemPrompt,
          metadata: { ...metadata, model: 'claude', forcedClaude: true },
          tryFallbackOnError: false // NO FALLBACK EVER
        });
        console.log(`✅ CLAUDE TEXT GENERATION COMPLETED SUCCESSFULLY`);
        return result;
      }
    } catch (error) {
      console.error(`❌ CLAUDE GENERATION ERROR (NO FALLBACK):`, error);
      // DO NOT FALLBACK - THROW ERROR TO MAINTAIN CLAUDE REQUIREMENT
      throw new Error(`Claude generation required but failed: ${error.message}`);
    }
  }

  console.log(`🚨 AI MODEL ROUTER DEBUG: Received model="${model}", options:`, { model, maxTokens, temperature, useJson });
  console.log(`🤖 Using AI model: ${model.toUpperCase()} ${useJson ? '(JSON mode)' : ''}`);

  try {
    switch (model) {
      case 'claude':
        console.log(`🔥 ROUTING TO CLAUDE: Using Claude AI model for generation`);
        if (useJson) {
          return await generateJSONWithClaude(prompt, {
            maxTokens,
            temperature,
            systemPrompt,
            metadata: { ...metadata, model: 'claude' }
          });
        } else {
          return await generateWithClaude(prompt, {
            maxTokens,
            temperature,
            systemPrompt,
            metadata: { ...metadata, model: 'claude' },
            tryFallbackOnError
          });
        }

      case 'chatgpt':
      default:
        console.log(`🔥 ROUTING TO CHATGPT: Using ChatGPT/OpenAI model for generation`);
        return await generateWithFallback(prompt, {
          maxTokens,
          temperature,
          useJson,
          systemPrompt,
          metadata: { ...metadata, model: 'chatgpt' },
          tryFallbackOnError
        });
    }
  } catch (error) {
    console.error(`❌ AI model ${model} generation failed:`, error);
    throw error;
  }
}

/**
 * Get model-specific configuration for content generation
 */
export function getModelConfig(model: AIModel) {
  switch (model) {
    case 'claude':
      return {
        maxTokens: 2000, // Claude handles longer contexts better
        temperature: 0.7,
        supportsJson: true,
        supportsVision: true,
        contextWindow: 200000, // Claude 3.5 Sonnet context window
        strengths: ['Long-form content', 'Analysis', 'Creative writing', 'Code generation'],
        tooltip: 'Claude may provide more verbose, analytical outputs with detailed explanations'
      };
    
    case 'chatgpt':
    default:
      return {
        maxTokens: 1500,
        temperature: 0.7,
        supportsJson: true,
        supportsVision: true,
        contextWindow: 128000, // GPT-4 context window
        strengths: ['Conversational', 'Concise', 'Structured', 'Code generation'],
        tooltip: 'ChatGPT provides balanced, conversational content with consistent formatting'
      };
  }
}

/**
 * Validate if a model is available
 */
export function isModelAvailable(model: AIModel): boolean {
  switch (model) {
    case 'claude':
      return !!process.env.ANTHROPIC_API_KEY;
    case 'chatgpt':
      return !!process.env.OPENAI_API_KEY;
    default:
      return false;
  }
}

/**
 * Get all available models with their status
 */
export function getAvailableModels(): Array<{ id: AIModel; name: string; available: boolean; config: any }> {
  return [
    {
      id: 'chatgpt',
      name: 'ChatGPT (OpenAI)',
      available: isModelAvailable('chatgpt'),
      config: getModelConfig('chatgpt')
    },
    {
      id: 'claude',
      name: 'Claude (Anthropic)',
      available: isModelAvailable('claude'),
      config: getModelConfig('claude')
    }
  ];
}