import type { MemoryEntry, MemoryType } from '../schemas';

export interface MemoryStore {
  save(entry: Omit<MemoryEntry, 'id' | 'createdAt'>): Promise<MemoryEntry>;
  get(id: string): Promise<MemoryEntry | null>;
  search(
    query: string,
    organizationId: string,
    options?: { type?: MemoryType; limit?: number },
  ): Promise<MemoryEntry[]>;
  list(
    organizationId: string,
    options?: { type?: MemoryType; userId?: string; limit?: number },
  ): Promise<MemoryEntry[]>;
  delete(id: string): Promise<void>;
  clear(organizationId: string, type?: MemoryType): Promise<void>;
}

export interface MemoryService {
  remember(
    content: string,
    organizationId: string,
    options?: { type?: MemoryType; userId?: string; metadata?: Record<string, unknown> },
  ): Promise<MemoryEntry>;
  recall(
    query: string,
    organizationId: string,
    options?: { type?: MemoryType; limit?: number },
  ): Promise<MemoryEntry[]>;
  forget(id: string): Promise<void>;
  getSummary(organizationId: string, userId?: string): Promise<string>;
  summarizeConversation(messages: Array<{ role: string; content: string }>): Promise<string>;
}
