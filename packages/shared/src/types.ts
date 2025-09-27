export type ModuleKey = "scriptok" | "glowbot";

export interface ContentItem {
  id: string;              // uuid
  module: ModuleKey;       // origin module
  platform: "tiktok" | "shorts" | "reels" | "blog" | "youtube" | "email";
  playbook: string;        // template key
  text: string;            // generated output
  meta?: Record<string, unknown>;
  createdAt: string;       // ISO
}

export interface GenerateRequest {
  module: ModuleKey;
  platform: ContentItem['platform'];
  playbook: string;
  inputs: Record<string, any>;
}

export interface GenerateResponse {
  success: boolean;
  data?: ContentItem;
  error?: string;
}

export interface HealthResponse {
  status: 'ok' | 'error';
  timestamp: string;
  version: string;
}