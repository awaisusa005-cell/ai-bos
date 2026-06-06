import { v4 as uuid } from 'uuid';
import type { EventType, SystemEvent } from '../schemas';

export type EventHandler = (event: SystemEvent) => void | Promise<void>;

export class EventBus {
  private handlers = new Map<string, Set<EventHandler>>();
  private allHandlers = new Set<EventHandler>();
  private history: SystemEvent[] = [];
  private maxHistory = 1000;

  on(eventType: EventType, handler: EventHandler): () => void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, new Set());
    }
    this.handlers.get(eventType)!.add(handler);
    return () => this.off(eventType, handler);
  }

  onAll(handler: EventHandler): () => void {
    this.allHandlers.add(handler);
    return () => this.allHandlers.delete(handler);
  }

  off(eventType: EventType, handler: EventHandler): void {
    this.handlers.get(eventType)?.delete(handler);
  }

  async emit(
    type: EventType,
    payload: unknown,
    meta?: { organizationId?: string; userId?: string; correlationId?: string },
  ): Promise<void> {
    const event: SystemEvent = {
      id: uuid(),
      type,
      payload,
      timestamp: new Date().toISOString(),
      organizationId: meta?.organizationId || '',
      userId: meta?.userId,
      correlationId: meta?.correlationId,
    };

    this.history.push(event);
    if (this.history.length > this.maxHistory) {
      this.history = this.history.slice(-this.maxHistory);
    }

    const typeHandlers = this.handlers.get(type) || new Set();
    const allPromises: Promise<void>[] = [];

    for (const handler of typeHandlers) {
      allPromises.push(Promise.resolve(handler(event)).catch(() => {}));
    }
    for (const handler of this.allHandlers) {
      allPromises.push(Promise.resolve(handler(event)).catch(() => {}));
    }

    await Promise.allSettled(allPromises);
  }

  getHistory(filter?: {
    type?: EventType;
    organizationId?: string;
    limit?: number;
  }): SystemEvent[] {
    let events = this.history;
    if (filter?.type) {
      events = events.filter((e) => e.type === filter.type);
    }
    if (filter?.organizationId) {
      events = events.filter((e) => e.organizationId === filter.organizationId);
    }
    if (filter?.limit) {
      events = events.slice(-filter.limit);
    }
    return events;
  }

  clear(): void {
    this.handlers.clear();
    this.allHandlers.clear();
    this.history = [];
  }
}
