import type { EventBus } from '../events';

export interface TelemetryMetric {
  name: string;
  value: number;
  unit: string;
  tags: Record<string, string>;
  timestamp: string;
}

export interface TelemetryTrace {
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  operationName: string;
  startTime: string;
  endTime?: string;
  durationMs?: number;
  status: 'ok' | 'error';
  tags: Record<string, string>;
}

/**
 * Telemetry Service
 *
 * Provides structured logging, performance metrics, execution tracing,
 * token usage tracking, cost estimation, and latency monitoring.
 */
export class TelemetryService {
  private metrics: TelemetryMetric[] = [];
  private traces: TelemetryTrace[] = [];
  private maxMetrics = 10000;
  private maxTraces = 5000;

  // Cost per 1K tokens (approximate, configurable)
  private costPerKToken: Record<string, number> = {
    'gpt-4o': 0.005,
    'gpt-4o-mini': 0.00015,
    'claude-sonnet-4-20250514': 0.003,
    'gemini-2.0-flash': 0.0001,
  };

  constructor(private eventBus?: EventBus) {
    this.setupEventListeners();
  }

  // ─── Metrics ─────────────────────────────────────────────────

  recordMetric(name: string, value: number, unit: string, tags: Record<string, string> = {}): void {
    this.metrics.push({
      name,
      value,
      unit,
      tags,
      timestamp: new Date().toISOString(),
    });
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }
  }

  recordLatency(operation: string, durationMs: number, tags: Record<string, string> = {}): void {
    this.recordMetric(`latency.${operation}`, durationMs, 'ms', tags);
  }

  recordTokenUsage(
    model: string,
    promptTokens: number,
    completionTokens: number,
    tags: Record<string, string> = {},
  ): void {
    const totalTokens = promptTokens + completionTokens;
    this.recordMetric('tokens.prompt', promptTokens, 'tokens', { model, ...tags });
    this.recordMetric('tokens.completion', completionTokens, 'tokens', { model, ...tags });
    this.recordMetric('tokens.total', totalTokens, 'tokens', { model, ...tags });

    const cost = this.estimateCost(model, totalTokens);
    this.recordMetric('cost.estimated', cost, 'usd', { model, ...tags });
  }

  recordRetry(operation: string, attempt: number, tags: Record<string, string> = {}): void {
    this.recordMetric(`retries.${operation}`, attempt, 'count', tags);
  }

  // ─── Tracing ────────────────────────────────────────────────

  startTrace(
    operationName: string,
    tags: Record<string, string> = {},
    parentSpanId?: string,
  ): TelemetryTrace {
    const trace: TelemetryTrace = {
      traceId: crypto.randomUUID(),
      spanId: crypto.randomUUID(),
      parentSpanId,
      operationName,
      startTime: new Date().toISOString(),
      status: 'ok',
      tags,
    };
    this.traces.push(trace);
    if (this.traces.length > this.maxTraces) {
      this.traces = this.traces.slice(-this.maxTraces);
    }
    return trace;
  }

  endTrace(spanId: string, status: 'ok' | 'error' = 'ok'): void {
    const trace = this.traces.find((t) => t.spanId === spanId);
    if (trace) {
      trace.endTime = new Date().toISOString();
      trace.durationMs = new Date(trace.endTime).getTime() - new Date(trace.startTime).getTime();
      trace.status = status;
    }
  }

  // ─── Cost Estimation ────────────────────────────────────────

  estimateCost(model: string, totalTokens: number): number {
    const rate = this.costPerKToken[model] || 0.001;
    return (totalTokens / 1000) * rate;
  }

  setCostRate(model: string, costPerKToken: number): void {
    this.costPerKToken[model] = costPerKToken;
  }

  // ─── Querying ──────────────────────────────────────────────

  getMetrics(filter?: { name?: string; since?: string; limit?: number }): TelemetryMetric[] {
    let results = this.metrics;
    if (filter?.name) {
      results = results.filter((m) => m.name.includes(filter.name!));
    }
    if (filter?.since) {
      results = results.filter((m) => m.timestamp >= filter.since!);
    }
    return results.slice(-(filter?.limit || 100));
  }

  getTraces(filter?: {
    operationName?: string;
    status?: string;
    limit?: number;
  }): TelemetryTrace[] {
    let results = this.traces;
    if (filter?.operationName) {
      results = results.filter((t) => t.operationName.includes(filter.operationName!));
    }
    if (filter?.status) {
      results = results.filter((t) => t.status === filter.status);
    }
    return results.slice(-(filter?.limit || 50));
  }

  getSummary(): {
    totalRequests: number;
    totalTokens: number;
    totalCost: number;
    avgLatency: number;
    errorRate: number;
  } {
    const tokenMetrics = this.metrics.filter((m) => m.name === 'tokens.total');
    const costMetrics = this.metrics.filter((m) => m.name === 'cost.estimated');
    const latencyMetrics = this.metrics.filter((m) => m.name.startsWith('latency.'));
    const errorTraces = this.traces.filter((t) => t.status === 'error');

    return {
      totalRequests: this.traces.length,
      totalTokens: tokenMetrics.reduce((sum, m) => sum + m.value, 0),
      totalCost: costMetrics.reduce((sum, m) => sum + m.value, 0),
      avgLatency: latencyMetrics.length
        ? latencyMetrics.reduce((sum, m) => sum + m.value, 0) / latencyMetrics.length
        : 0,
      errorRate: this.traces.length ? errorTraces.length / this.traces.length : 0,
    };
  }

  private setupEventListeners(): void {
    if (!this.eventBus) return;

    this.eventBus.on('task.completed', (event) => {
      const { durationMs } = event.payload as { durationMs?: number };
      if (durationMs) {
        this.recordLatency('task_execution', durationMs);
      }
    });

    this.eventBus.on('tool.executed', (event) => {
      const { toolName, durationMs } = event.payload as { toolName: string; durationMs: number };
      this.recordLatency(`tool.${toolName}`, durationMs);
    });
  }
}
