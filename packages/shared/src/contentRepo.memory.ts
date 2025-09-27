import { ContentItem } from './types';
import { generateId, getCurrentTimestamp } from './utils';
import * as fs from 'fs';
import * as path from 'path';

export class MemoryContentRepository {
  private items: Map<string, ContentItem> = new Map();
  private dataFile: string;

  constructor(dataFile = '/tmp/glowbot-content.json') {
    this.dataFile = dataFile;
    this.loadFromDisk();
  }

  private loadFromDisk(): void {
    try {
      if (fs.existsSync(this.dataFile)) {
        const data = fs.readFileSync(this.dataFile, 'utf-8');
        const items: ContentItem[] = JSON.parse(data);
        for (const item of items) {
          this.items.set(item.id, item);
        }
      }
    } catch (error) {
      console.warn('Failed to load content from disk:', error);
    }
  }

  private saveToDisk(): void {
    try {
      const dir = path.dirname(this.dataFile);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      const items = Array.from(this.items.values());
      fs.writeFileSync(this.dataFile, JSON.stringify(items, null, 2));
    } catch (error) {
      console.warn('Failed to save content to disk:', error);
    }
  }

  async create(item: Omit<ContentItem, 'id' | 'createdAt'>): Promise<ContentItem> {
    const newItem: ContentItem = {
      ...item,
      id: generateId(),
      createdAt: getCurrentTimestamp(),
    };
    
    this.items.set(newItem.id, newItem);
    this.saveToDisk();
    return newItem;
  }

  async findById(id: string): Promise<ContentItem | null> {
    return this.items.get(id) || null;
  }

  async findAll(): Promise<ContentItem[]> {
    return Array.from(this.items.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async findByModule(module: ContentItem['module']): Promise<ContentItem[]> {
    const allItems = await this.findAll();
    return allItems.filter(item => item.module === module);
  }

  async update(id: string, updates: Partial<ContentItem>): Promise<ContentItem | null> {
    const existing = this.items.get(id);
    if (!existing) return null;

    const updated = { ...existing, ...updates, id, createdAt: existing.createdAt };
    this.items.set(id, updated);
    this.saveToDisk();
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    const deleted = this.items.delete(id);
    if (deleted) {
      this.saveToDisk();
    }
    return deleted;
  }

  async clear(): Promise<void> {
    this.items.clear();
    this.saveToDisk();
  }

  async count(): Promise<number> {
    return this.items.size;
  }
}

// Default instance for easy import
export const contentRepo = new MemoryContentRepository();