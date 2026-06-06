import { v4 as uuid } from 'uuid';
import type { ExecutionRecord, TaskStatus } from '../schemas';
import type { EventBus } from '../events';

export class ExecutionTracker {
  private records = new Map<string, ExecutionRecord>();

  constructor(private eventBus?: EventBus) {}

  start(params: {
    organizationId: string;
    userId: string;
    query: string;
    selectedAgents: string[];
  }): ExecutionRecord {
    const record: ExecutionRecord = {
      id: uuid(),
      organizationId: params.organizationId,
      userId: params.userId,
      query: params.query,
      selectedAgents: params.selectedAgents,
      status: 'running',
      toolsUsed: [],
      logs: [],
      errors: [],
      startedAt: new Date().toISOString(),
    };

    this.records.set(record.id, record);
    this.eventBus?.emit(
      'task.started',
      { executionId: record.id },
      {
        organizationId: params.organizationId,
        userId: params.userId,
      },
    );

    return record;
  }

  addLog(executionId: string, message: string): void {
    const record = this.records.get(executionId);
    if (record) {
      record.logs.push(`[${new Date().toISOString()}] ${message}`);
    }
  }

  addError(executionId: string, error: string): void {
    const record = this.records.get(executionId);
    if (record) {
      record.errors.push(error);
    }
  }

  addToolUsed(executionId: string, toolName: string): void {
    const record = this.records.get(executionId);
    if (record && !record.toolsUsed.includes(toolName)) {
      record.toolsUsed.push(toolName);
    }
  }

  setTokenUsage(
    executionId: string,
    usage: { promptTokens: number; completionTokens: number; totalTokens: number },
  ): void {
    const record = this.records.get(executionId);
    if (record) {
      record.tokenUsage = usage;
    }
  }

  complete(executionId: string, output: unknown): void {
    const record = this.records.get(executionId);
    if (record) {
      record.status = 'completed';
      record.output = output;
      record.completedAt = new Date().toISOString();
      record.durationMs = Date.now() - new Date(record.startedAt).getTime();
      this.eventBus?.emit(
        'task.completed',
        { executionId, durationMs: record.durationMs },
        {
          organizationId: record.organizationId,
          userId: record.userId,
        },
      );
    }
  }

  fail(executionId: string, error: string): void {
    const record = this.records.get(executionId);
    if (record) {
      record.status = 'failed';
      record.errors.push(error);
      record.completedAt = new Date().toISOString();
      record.durationMs = Date.now() - new Date(record.startedAt).getTime();
      this.eventBus?.emit(
        'task.failed',
        { executionId, error },
        {
          organizationId: record.organizationId,
          userId: record.userId,
        },
      );
    }
  }

  get(executionId: string): ExecutionRecord | undefined {
    return this.records.get(executionId);
  }

  list(filter?: {
    organizationId?: string;
    userId?: string;
    status?: TaskStatus;
    limit?: number;
  }): ExecutionRecord[] {
    let results = Array.from(this.records.values());
    if (filter?.organizationId) {
      results = results.filter((r) => r.organizationId === filter.organizationId);
    }
    if (filter?.userId) {
      results = results.filter((r) => r.userId === filter.userId);
    }
    if (filter?.status) {
      results = results.filter((r) => r.status === filter.status);
    }
    results.sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());
    return results.slice(0, filter?.limit || 50);
  }
}
