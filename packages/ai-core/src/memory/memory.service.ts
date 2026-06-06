import { v4 as uuid } from 'uuid';
import type { MemoryEntry, MemoryType } from '../schemas';
import type { MemoryStore, MemoryService } from './memory.interface';

/**
 * In-memory implementation of MemoryStore.
 * Replace with database-backed or vector-store-backed implementation in production.
 */
export class InMemoryStore implements MemoryStore {
  private entries = new Map<string, MemoryEntry>();

  async save(entry: Omit<MemoryEntry, 'id' | 'createdAt'>): Promise<MemoryEntry> {
    const full: MemoryEntry = {
      ...entry,
      id: uuid(),
      createdAt: new Date().toISOString(),
    };
    this.entries.set(full.id, full);
    return full;
  }

  async get(id: string): Promise<MemoryEntry | null> {
    return this.entries.get(id) || null;
  }

  async search(
    query: string,
    organizationId: string,
    options?: { type?: MemoryType; limit?: number },
  ): Promise<MemoryEntry[]> {
    const queryLower = query.toLowerCase();
    let results = Array.from(this.entries.values()).filter(
      (e) => e.organizationId === organizationId && e.content.toLowerCase().includes(queryLower),
    );

    if (options?.type) {
      results = results.filter((e) => e.type === options.type);
    }

    return results.slice(0, options?.limit || 10);
  }

  async list(
    organizationId: string,
    options?: { type?: MemoryType; userId?: string; limit?: number },
  ): Promise<MemoryEntry[]> {
    let results = Array.from(this.entries.values()).filter(
      (e) => e.organizationId === organizationId,
    );

    if (options?.type) {
      results = results.filter((e) => e.type === options.type);
    }
    if (options?.userId) {
      results = results.filter((e) => e.userId === options.userId);
    }

    return results.slice(0, options?.limit || 50);
  }

  async delete(id: string): Promise<void> {
    this.entries.delete(id);
  }

  async clear(organizationId: string, type?: MemoryType): Promise<void> {
    for (const [id, entry] of this.entries) {
      if (entry.organizationId === organizationId && (!type || entry.type === type)) {
        this.entries.delete(id);
      }
    }
  }
}

/**
 * Default Memory Service implementation.
 * Manages short-term, long-term, and semantic memory through a pluggable store.
 */
export class DefaultMemoryService implements MemoryService {
  constructor(private store: MemoryStore) {}

  async remember(
    content: string,
    organizationId: string,
    options?: { type?: MemoryType; userId?: string; metadata?: Record<string, unknown> },
  ): Promise<MemoryEntry> {
    return this.store.save({
      type: options?.type || 'long_term',
      content,
      organizationId,
      userId: options?.userId,
      metadata: options?.metadata,
    });
  }

  async recall(
    query: string,
    organizationId: string,
    options?: { type?: MemoryType; limit?: number },
  ): Promise<MemoryEntry[]> {
    return this.store.search(query, organizationId, options);
  }

  async forget(id: string): Promise<void> {
    return this.store.delete(id);
  }

  async getSummary(organizationId: string, userId?: string): Promise<string> {
    const entries = await this.store.list(organizationId, {
      userId,
      limit: 20,
      type: 'long_term',
    });

    if (entries.length === 0) {
      return 'No prior context available.';
    }

    return entries.map((e) => `- ${e.content}`).join('\n');
  }

  async summarizeConversation(messages: Array<{ role: string; content: string }>): Promise<string> {
    // TODO: Use LLM to summarize when conversation gets too long
    const lastMessages = messages.slice(-5);
    return lastMessages.map((m) => `${m.role}: ${m.content.slice(0, 100)}`).join('\n');
  }
}
