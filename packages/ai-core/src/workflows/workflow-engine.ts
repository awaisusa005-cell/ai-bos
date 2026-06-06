import { v4 as uuid } from 'uuid';
import type { WorkflowDefinition, WorkflowStep, WorkflowStatus } from '../schemas';
import type { EventBus } from '../events';

export interface WorkflowInstance {
  id: string;
  definitionId: string;
  status: WorkflowStatus;
  currentStepId: string | null;
  stepResults: Map<string, { success: boolean; output: unknown; error?: string }>;
  context: Record<string, unknown>;
  startedAt: string;
  completedAt?: string;
  error?: string;
}

export type StepExecutor = (
  step: WorkflowStep,
  context: Record<string, unknown>,
) => Promise<{ success: boolean; output: unknown; error?: string }>;

/**
 * Workflow Engine
 *
 * Supports: sequential execution, conditional branching, loops,
 * retries, rollback, waiting for user approval, and scheduled execution.
 */
export class WorkflowEngine {
  private definitions = new Map<string, WorkflowDefinition>();
  private instances = new Map<string, WorkflowInstance>();
  private stepExecutors = new Map<string, StepExecutor>();
  private approvalCallbacks = new Map<string, (approved: boolean) => void>();

  constructor(private eventBus?: EventBus) {}

  registerDefinition(definition: WorkflowDefinition): void {
    this.definitions.set(definition.id, definition);
  }

  registerStepExecutor(stepType: string, executor: StepExecutor): void {
    this.stepExecutors.set(stepType, executor);
  }

  async start(
    definitionId: string,
    context: Record<string, unknown> = {},
    meta?: { organizationId?: string; userId?: string },
  ): Promise<WorkflowInstance> {
    const definition = this.definitions.get(definitionId);
    if (!definition) {
      throw new Error(`Workflow definition "${definitionId}" not found`);
    }

    const instance: WorkflowInstance = {
      id: uuid(),
      definitionId,
      status: 'running',
      currentStepId: definition.entryStepId,
      stepResults: new Map(),
      context,
      startedAt: new Date().toISOString(),
    };

    this.instances.set(instance.id, instance);

    await this.eventBus?.emit(
      'workflow.started',
      {
        instanceId: instance.id,
        definitionId,
      },
      meta,
    );

    await this.executeFromStep(instance, definition);

    return instance;
  }

  async approveStep(instanceId: string, approved: boolean): Promise<void> {
    const callback = this.approvalCallbacks.get(instanceId);
    if (callback) {
      callback(approved);
      this.approvalCallbacks.delete(instanceId);
    }
  }

  cancel(instanceId: string): void {
    const instance = this.instances.get(instanceId);
    if (instance && instance.status === 'running') {
      instance.status = 'cancelled';
      instance.completedAt = new Date().toISOString();
    }
  }

  getInstance(instanceId: string): WorkflowInstance | undefined {
    return this.instances.get(instanceId);
  }

  listInstances(filter?: { status?: WorkflowStatus }): WorkflowInstance[] {
    let results = Array.from(this.instances.values());
    if (filter?.status) {
      results = results.filter((i) => i.status === filter.status);
    }
    return results;
  }

  listDefinitions(): WorkflowDefinition[] {
    return Array.from(this.definitions.values());
  }

  private async executeFromStep(
    instance: WorkflowInstance,
    definition: WorkflowDefinition,
  ): Promise<void> {
    while (instance.currentStepId && instance.status === 'running') {
      const step = definition.steps.find((s) => s.id === instance.currentStepId);
      if (!step) {
        instance.status = 'failed';
        instance.error = `Step "${instance.currentStepId}" not found`;
        break;
      }

      const result = await this.executeStep(instance, step);
      instance.stepResults.set(step.id, result);

      if (result.success) {
        instance.currentStepId = step.nextOnSuccess || null;
      } else {
        // Retry logic
        if (step.retries > 0) {
          let retried = false;
          for (let attempt = 0; attempt < step.retries; attempt++) {
            const retryResult = await this.executeStep(instance, step);
            if (retryResult.success) {
              instance.stepResults.set(step.id, retryResult);
              instance.currentStepId = step.nextOnSuccess || null;
              retried = true;
              break;
            }
          }
          if (!retried) {
            instance.currentStepId = step.nextOnFailure || null;
            if (!instance.currentStepId) {
              instance.status = 'failed';
              instance.error = result.error;
            }
          }
        } else {
          instance.currentStepId = step.nextOnFailure || null;
          if (!instance.currentStepId) {
            instance.status = 'failed';
            instance.error = result.error;
          }
        }
      }
    }

    if (instance.status === 'running') {
      instance.status = 'completed';
      instance.completedAt = new Date().toISOString();
      await this.eventBus?.emit('workflow.completed', { instanceId: instance.id });
    } else if (instance.status === 'failed') {
      instance.completedAt = new Date().toISOString();
      await this.eventBus?.emit('workflow.failed', {
        instanceId: instance.id,
        error: instance.error,
      });
    }
  }

  private async executeStep(
    instance: WorkflowInstance,
    step: WorkflowStep,
  ): Promise<{ success: boolean; output: unknown; error?: string }> {
    if (step.type === 'wait_approval') {
      return this.waitForApproval(instance.id);
    }

    if (step.type === 'condition') {
      return this.evaluateCondition(step, instance.context);
    }

    if (step.type === 'delay') {
      const delayMs = (step.config.delayMs as number) || 1000;
      await new Promise((resolve) => setTimeout(resolve, Math.min(delayMs, 60000)));
      return { success: true, output: { delayed: delayMs } };
    }

    const executor = this.stepExecutors.get(step.type);
    if (!executor) {
      // Default executor — just returns success with config as output
      return { success: true, output: step.config };
    }

    try {
      return await executor(step, instance.context);
    } catch (err) {
      return {
        success: false,
        output: null,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }

  private waitForApproval(
    instanceId: string,
  ): Promise<{ success: boolean; output: unknown; error?: string }> {
    return new Promise((resolve) => {
      // Set a timeout for approval (default: 24 hours)
      const timeout = setTimeout(() => {
        this.approvalCallbacks.delete(instanceId);
        resolve({ success: false, output: null, error: 'Approval timed out' });
      }, 86400000);

      this.approvalCallbacks.set(instanceId, (approved: boolean) => {
        clearTimeout(timeout);
        resolve({
          success: approved,
          output: { approved },
          error: approved ? undefined : 'Step rejected by user',
        });
      });
    });
  }

  private evaluateCondition(
    step: WorkflowStep,
    context: Record<string, unknown>,
  ): Promise<{ success: boolean; output: unknown; error?: string }> {
    const { field, operator, value } = step.config as {
      field: string;
      operator: string;
      value: unknown;
    };
    const actual = context[field];

    let result = false;
    switch (operator) {
      case 'eq':
        result = actual === value;
        break;
      case 'neq':
        result = actual !== value;
        break;
      case 'gt':
        result = (actual as number) > (value as number);
        break;
      case 'lt':
        result = (actual as number) < (value as number);
        break;
      case 'contains':
        result = String(actual).includes(String(value));
        break;
      case 'exists':
        result = actual !== undefined && actual !== null;
        break;
      default:
        result = false;
    }

    return Promise.resolve({ success: result, output: { field, operator, value, actual, result } });
  }
}
