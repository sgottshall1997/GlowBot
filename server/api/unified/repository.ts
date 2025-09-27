// Simple in-memory content repository
import { randomUUID } from 'crypto';

export interface ContentItem {
  id: string;
  module: 'glowbot' | 'scriptok';
  platform: string;
  playbook: string;
  text: string;
  meta?: Record<string, unknown>;
  createdAt: Date;
}

export interface CreateContentRequest {
  module: 'glowbot' | 'scriptok';
  platform: string;
  playbook: string;
  text: string;
  meta?: Record<string, unknown>;
}

class ContentRepository {
  private items: ContentItem[] = [];

  async create(request: CreateContentRequest): Promise<ContentItem> {
    const item: ContentItem = {
      id: randomUUID(),
      ...request,
      createdAt: new Date(),
    };

    this.items.push(item);
    return item;
  }

  async findAll(options?: { module?: string; platform?: string }): Promise<ContentItem[]> {
    let filtered = [...this.items];

    if (options?.module) {
      filtered = filtered.filter(item => item.module === options.module);
    }

    if (options?.platform) {
      filtered = filtered.filter(item => item.platform === options.platform);
    }

    return filtered.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async findById(id: string): Promise<ContentItem | null> {
    return this.items.find(item => item.id === id) || null;
  }

  async delete(id: string): Promise<boolean> {
    const index = this.items.findIndex(item => item.id === id);
    if (index === -1) return false;

    this.items.splice(index, 1);
    return true;
  }

  async count(): Promise<number> {
    return this.items.length;
  }
}

export const contentRepo = new ContentRepository();