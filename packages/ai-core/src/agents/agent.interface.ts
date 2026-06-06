import type { OrchestrationContext } from '../schemas';

export interface AgentInput {
  query: string;
  context: OrchestrationContext;
  taskId?: string;
  parameters?: Record<string, unknown>;
}

export interface AgentOutput {
  success: boolean;
  result: unknown;
  metadata?: {
    tokensUsed?: number;
    durationMs?: number;
    toolsInvoked?: string[];
    confidence?: number;
  };
}

export interface AIAgent {
  execute(input: AgentInput): Promise<AgentOutput>;
}
