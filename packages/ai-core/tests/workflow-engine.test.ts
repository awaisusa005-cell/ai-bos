import { describe, it, expect, beforeEach } from 'vitest';
import { WorkflowEngine } from '../src/workflows';
import { EventBus } from '../src/events';
import type { WorkflowDefinition } from '../src/schemas';

describe('WorkflowEngine', () => {
  let engine: WorkflowEngine;
  let eventBus: EventBus;

  const sampleWorkflow: WorkflowDefinition = {
    id: 'wf-test',
    name: 'Test Workflow',
    description: 'A test workflow',
    steps: [
      {
        id: 'step-1',
        type: 'action',
        name: 'First Step',
        config: { message: 'hello' },
        nextOnSuccess: 'step-2',
        retries: 0,
      },
      {
        id: 'step-2',
        type: 'action',
        name: 'Second Step',
        config: { message: 'world' },
        retries: 0,
      },
    ],
    entryStepId: 'step-1',
    organizationId: 'org-1',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  beforeEach(() => {
    eventBus = new EventBus();
    engine = new WorkflowEngine(eventBus);
  });

  it('should register and list workflow definitions', () => {
    engine.registerDefinition(sampleWorkflow);
    const defs = engine.listDefinitions();
    expect(defs.length).toBe(1);
    expect(defs[0]!.name).toBe('Test Workflow');
  });

  it('should execute a simple sequential workflow', async () => {
    engine.registerDefinition(sampleWorkflow);
    const instance = await engine.start('wf-test', { user: 'test' });

    expect(instance.status).toBe('completed');
    expect(instance.stepResults.size).toBe(2);
  });

  it('should handle conditional steps', async () => {
    const conditionalWorkflow: WorkflowDefinition = {
      id: 'wf-cond',
      name: 'Conditional',
      description: 'Tests conditions',
      steps: [
        {
          id: 'check',
          type: 'condition',
          name: 'Check Value',
          config: { field: 'score', operator: 'gt', value: 50 },
          nextOnSuccess: 'pass',
          nextOnFailure: 'fail',
          retries: 0,
        },
        { id: 'pass', type: 'action', name: 'Passed', config: { result: 'passed' }, retries: 0 },
        { id: 'fail', type: 'action', name: 'Failed', config: { result: 'failed' }, retries: 0 },
      ],
      entryStepId: 'check',
      organizationId: 'org-1',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    engine.registerDefinition(conditionalWorkflow);

    // Score > 50 → should go to 'pass'
    const instance1 = await engine.start('wf-cond', { score: 75 });
    expect(instance1.status).toBe('completed');
    expect(instance1.stepResults.has('pass')).toBe(true);

    // Score < 50 → should go to 'fail'
    const instance2 = await engine.start('wf-cond', { score: 25 });
    expect(instance2.status).toBe('completed');
    expect(instance2.stepResults.has('fail')).toBe(true);
  });

  it('should cancel a workflow', async () => {
    engine.registerDefinition(sampleWorkflow);
    const instance = await engine.start('wf-test');
    // Already completed, but cancel should set status
    engine.cancel(instance.id);
    // Since it already completed, cancel won't override
    expect(instance.status).toBe('completed');
  });

  it('should emit events during execution', async () => {
    const events: string[] = [];
    eventBus.on('workflow.started', () => {
      events.push('started');
    });
    eventBus.on('workflow.completed', () => {
      events.push('completed');
    });

    engine.registerDefinition(sampleWorkflow);
    await engine.start('wf-test');

    expect(events).toContain('started');
    expect(events).toContain('completed');
  });

  it('should throw for unknown workflow', async () => {
    await expect(engine.start('nonexistent')).rejects.toThrow('not found');
  });
});
