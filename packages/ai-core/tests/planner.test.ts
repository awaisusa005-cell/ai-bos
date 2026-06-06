import { describe, it, expect, beforeEach } from 'vitest';
import { TaskPlanner } from '../src/planner';
import { AgentRegistry } from '../src/registry';
import { registerDefaultAgents } from '../src/agents/register-defaults';
import type { IntentResult } from '../src/schemas';

describe('TaskPlanner', () => {
  let planner: TaskPlanner;
  let registry: AgentRegistry;

  beforeEach(() => {
    registry = new AgentRegistry();
    registerDefaultAgents(registry);
    planner = new TaskPlanner(registry);
  });

  it('should create a single-task plan for simple queries', async () => {
    const intent: IntentResult = {
      query: 'Check revenue',
      intents: [{ agentId: 'finance-agent', confidence: 0.9, reason: 'Finance query' }],
      primaryAgent: 'finance-agent',
      multiAgent: false,
    };

    const plan = await planner.createPlan('Check revenue', intent);
    expect(plan.tasks.length).toBe(1);
    expect(plan.tasks[0]!.agentId).toBe('finance-agent');
    expect(plan.status).toBe('idle');
  });

  it('should create multi-task plan for multi-agent queries', async () => {
    const intent: IntentResult = {
      query: 'Analyze customers and create report',
      intents: [
        { agentId: 'analytics-agent', confidence: 0.8, reason: 'Analytics' },
        { agentId: 'marketing-agent', confidence: 0.6, reason: 'Marketing' },
      ],
      primaryAgent: 'analytics-agent',
      multiAgent: true,
    };

    const plan = await planner.createPlan('Analyze customers and create report', intent);
    expect(plan.tasks.length).toBe(2);
  });

  it('should identify ready tasks (no dependencies)', () => {
    const intent: IntentResult = {
      query: 'Multi-agent query',
      intents: [
        { agentId: 'sales-agent', confidence: 0.7, reason: '' },
        { agentId: 'marketing-agent', confidence: 0.6, reason: '' },
      ],
      primaryAgent: 'sales-agent',
      multiAgent: true,
    };

    // Synchronous plan creation won't use LLM — falls back to simple decomposition
    let plan: any;
    planner.createPlan('test', intent).then((p) => (plan = p));

    // Use timeout to allow async to resolve
    return planner.createPlan('test', intent).then((plan) => {
      const ready = planner.getReadyTasks(plan);
      expect(ready.length).toBe(plan.tasks.length); // All tasks have no deps
    });
  });

  it('should detect plan completion', async () => {
    const intent: IntentResult = {
      query: 'Simple',
      intents: [{ agentId: 'analytics-agent', confidence: 0.9, reason: '' }],
      primaryAgent: 'analytics-agent',
      multiAgent: false,
    };

    const plan = await planner.createPlan('Simple', intent);
    expect(planner.isPlanComplete(plan)).toBe(false);

    plan.tasks[0]!.status = 'completed';
    expect(planner.isPlanComplete(plan)).toBe(true);
  });
});
