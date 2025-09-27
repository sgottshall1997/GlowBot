// Define ModuleKey locally since workspace imports not available
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

export interface PlaybookTemplate {
  id: string;
  name: string;
  description: string;
  platforms: string[];
  template: string;
  schema?: Record<string, any>;
}

export interface ModuleConfig {
  name: string;
  playbooks: PlaybookTemplate[];
}