export interface ContentItem {
  id: string;
  module: "scriptok" | "glowbot";
  platform: "tiktok" | "shorts" | "reels" | "blog" | "youtube" | "email";
  playbook: string;
  text: string;
  meta?: Record<string, unknown>;
  createdAt: string;
}