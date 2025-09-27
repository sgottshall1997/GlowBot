import { GenerateRequest, GenerateResponse, HealthResponse } from './types';

export class GlowBotClient {
  private baseUrl: string;

  constructor(baseUrl = '/api') {
    this.baseUrl = baseUrl;
  }

  async generate(request: GenerateRequest): Promise<GenerateResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      const data = await response.json();
      
      if (!response.ok) {
        return {
          success: false,
          error: data.error || `Request failed with status ${response.status}`,
        };
      }

      return data;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  async health(): Promise<HealthResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/health`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(`Health check failed with status ${response.status}`);
      }

      return data;
    } catch (error) {
      return {
        status: 'error',
        timestamp: new Date().toISOString(),
        version: 'unknown',
      };
    }
  }

  async version(): Promise<{ version: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/version`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(`Version check failed with status ${response.status}`);
      }

      return data;
    } catch (error) {
      return { version: 'unknown' };
    }
  }
}

// Default client instance for easy import
export const apiClient = new GlowBotClient();