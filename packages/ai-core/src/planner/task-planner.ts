import { v4 as uuid } from 'uuid';
import type { ExecutionPlan, TaskNode, IntentResult } from '../schemas';
import type { AgentRegistry } from '../registry';
import type { AIProvider } from '../providers';

/**
 * Task Planner
 *
 * Decomposes complex requests into smaller tasks organized as a DAG.
 * Supports sequential dependencies and parallel execution of independent tasks.
 */
export class TaskPlanner {
  constructor(
    private registry: AgentRegistry,
    private provider?: AIProvider,
  ) {}

  async createPlan(query: string, intentResult: IntentResult): Promise<ExecutionPlan> {
    const planId = uuid();

    // For single-agent, simple queries — create a single task
    if (!intentResult.multiAgent && intentResult.intents.length <= 1) {
      const task: TaskNode = {
        id: uuid(),
        name: `Execute: ${query.slice(0, 50)}`,
        description: query,
        agentId: intentResult.primaryAgent,
        dependencies: [],
        status: 'pending',
      };

      return {
        id: planId,
        query,
        tasks: [task],
        status: 'idle',
        createdAt: new Date().toISOString(),
      };
    }

    // For multi-agent or complex queries — decompose
    if (this.provider) {
      try {
        return await this.decomposeWithLLM(planId, query, intentResult);
      } catch {
        // Fall back to simple decomposition
      }
    }

    return this.simpleDecomposition(planId, query, intentResult);
  }

  private async decomposeWithLLM(
    planId: string,
    query: string,
    intentResult: IntentResult,
  ): Promise<ExecutionPlan> {
    if (!this.provider) {
      return this.simpleDecomposition(planId, query, intentResult);
    }

    const agents = intentResult.intents
      .filter((i) => i.confidence >= 0.4)
      .map((i) => {
        const def = this.registry.getDefinition(i.agentId);
        return `${i.agentId}: ${def?.description || 'Unknown'}`;
      });

    const response = await this.provider.complete({
      messages: [
        {
          role: 'system',
          content: `You are a task decomposition engine. Break down a complex request into smaller, actionable tasks.

Available agents:
${agents.join('\n')}

Respond with valid JSON containing an array called "tasks". Each task has:
- name: short task name
- description: what to do
- agentId: which agent handles this (must be from the list above)
- dependsOn: array of task indices (0-based) that must complete first. Use [] for tasks that can start immediately.

Order tasks logically. Independent tasks should have empty dependsOn arrays (they can run in parallel).
Keep to 3-8 tasks. Be specific and actionable.`,
        },
        { role: 'user', content: query },
      ],
      responseFormat: 'json',
      temperature: 0.2,
      maxTokens: 1000,
    });

    try {
      const parsed = JSON.parse(response.content);
      const rawTasks = parsed.tasks || parsed;

      const tasks: TaskNode[] = rawTasks.map((t: any, idx: number) => ({
        id: uuid(),
        name: t.name || `Task ${idx + 1}`,
        description: t.description || t.name,
        agentId: t.agentId || intentResult.primaryAgent,
        dependencies: [] as string[],
        status: 'pending' as const,
      }));

      // Resolve dependency indices to task IDs
      for (let i = 0; i < rawTasks.length; i++) {
        const deps = rawTasks[i].dependsOn || [];
        tasks[i]!.dependencies = deps
          .filter((d: number) => d >= 0 && d < tasks.length)
          .map((d: number) => tasks[d]!.id);
      }

      return {
        id: planId,
        query,
        tasks,
        status: 'idle',
        createdAt: new Date().toISOString(),
      };
    } catch {
      return this.simpleDecomposition(planId, query, intentResult);
    }
  }

  private simpleDecomposition(
    planId: string,
    query: string,
    intentResult: IntentResult,
  ): ExecutionPlan {
    const relevantAgents = intentResult.intents
      .filter((i) => i.confidence >= 0.4)
      .map((i) => i.agentId);

    // Create one task per agent (all independent — can run in parallel)
    const tasks: TaskNode[] = relevantAgents.map((agentId) => {
      const def = this.registry.getDefinition(agentId);
      return {
        id: uuid(),
        name: `${def?.name || agentId}: ${query.slice(0, 40)}`,
        description: `Process "${query}" from ${def?.name || agentId} perspective`,
        agentId,
        dependencies: [],
        status: 'pending' as const,
      };
    });

    return {
      id: planId,
      query,
      tasks,
      status: 'idle',
      createdAt: new Date().toISOString(),
    };
  }

  /**
   * Returns tasks that are ready to execute (all dependencies met)
   */
  getReadyTasks(plan: ExecutionPlan): TaskNode[] {
    const completedIds = new Set(
      plan.tasks.filter((t) => t.status === 'completed').map((t) => t.id),
    );

    return plan.tasks.filter(
      (t) => t.status === 'pending' && t.dependencies.every((dep) => completedIds.has(dep)),
    );
  }

  /**
   * Check if plan is complete (all tasks done or failed)
   */
  isPlanComplete(plan: ExecutionPlan): boolean {
    return plan.tasks.every(
      (t) => t.status === 'completed' || t.status === 'failed' || t.status === 'cancelled',
    );
  }
}
