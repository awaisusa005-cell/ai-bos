import { v4 as uuid } from 'uuid';
import type { ExecutionRecord, OrchestrationContext } from '../schemas';
import { AgentRegistry } from '../registry';
import { EventBus } from '../events';
import { ProviderManager } from '../providers';
import { IntentDetector } from './intent-detector';
import { TaskPlanner } from '../planner';
import { ContextEngine } from '../context';
import type { ContextSource } from '../context';
import { DefaultMemoryService, InMemoryStore } from '../memory';
import type { MemoryService } from '../memory';
import { PromptManager, DEFAULT_PROMPTS, DEFAULT_FRAGMENTS } from '../prompts';
import { ToolRegistry, PLACEHOLDER_TOOLS } from '../tools';
import { WorkflowEngine } from '../workflows';
import { ExecutionTracker } from '../execution';
import { TelemetryService } from '../telemetry';
import { registerDefaultAgents } from '../agents';

export interface OrchestratorConfig {
  providers?: Array<{
    id: string;
    type: 'openai' | 'anthropic' | 'gemini' | 'local';
    apiKey?: string;
    baseUrl?: string;
    defaultModel?: string;
  }>;
  defaultProvider?: string;
}

/**
 * Central AI Orchestrator
 *
 * The main entry point for the AI Brain. Coordinates:
 * - Intent detection
 * - Task planning
 * - Agent selection & execution
 * - Tool invocation
 * - Memory management
 * - Workflow execution
 * - Telemetry & tracking
 */
export class Orchestrator {
  readonly registry: AgentRegistry;
  readonly eventBus: EventBus;
  readonly providers: ProviderManager;
  readonly intentDetector: IntentDetector;
  readonly planner: TaskPlanner;
  readonly contextEngine: ContextEngine;
  readonly memory: MemoryService;
  readonly prompts: PromptManager;
  readonly tools: ToolRegistry;
  readonly workflows: WorkflowEngine;
  readonly execution: ExecutionTracker;
  readonly telemetry: TelemetryService;

  constructor(config: OrchestratorConfig = {}) {
    // Initialize core infrastructure
    this.eventBus = new EventBus();
    this.providers = new ProviderManager();
    this.registry = new AgentRegistry();
    this.tools = new ToolRegistry();
    this.prompts = new PromptManager();
    this.workflows = new WorkflowEngine(this.eventBus);
    this.execution = new ExecutionTracker(this.eventBus);
    this.telemetry = new TelemetryService(this.eventBus);

    // Initialize memory
    const memoryStore = new InMemoryStore();
    this.memory = new DefaultMemoryService(memoryStore);

    // Initialize context engine
    this.contextEngine = new ContextEngine(this.memory);

    // Configure providers
    if (config.providers) {
      for (const p of config.providers) {
        this.providers.register(p.id, {
          type: p.type,
          apiKey: p.apiKey,
          baseUrl: p.baseUrl,
          defaultModel: p.defaultModel,
        });
      }
    }
    if (config.defaultProvider) {
      this.providers.setDefault(config.defaultProvider);
    }

    // Initialize intent detector and planner
    const provider = config.providers?.length ? this.providers.getDefault() : undefined;
    this.intentDetector = new IntentDetector(this.registry, provider);
    this.planner = new TaskPlanner(this.registry, provider);

    // Register defaults
    registerDefaultAgents(this.registry);
    for (const tool of PLACEHOLDER_TOOLS) {
      this.tools.register(tool);
    }
    for (const template of DEFAULT_PROMPTS) {
      this.prompts.registerTemplate(template);
    }
    for (const [name, content] of Object.entries(DEFAULT_FRAGMENTS)) {
      this.prompts.registerFragment(name, content);
    }
  }

  /**
   * Main execution entry point.
   * Receives a user request, routes it through the pipeline, and returns results.
   */
  async execute(params: {
    query: string;
    organizationId: string;
    userId: string;
    workspaceId?: string;
    conversationHistory?: Array<{
      role: 'system' | 'user' | 'assistant' | 'tool';
      content: string;
    }>;
  }): Promise<ExecutionRecord> {
    const trace = this.telemetry.startTrace('orchestrator.execute', {
      organizationId: params.organizationId,
    });

    // 1. Detect intent
    const intentResult = await this.intentDetector.detect(params.query);
    await this.eventBus.emit('intent.detected', intentResult, {
      organizationId: params.organizationId,
      userId: params.userId,
    });

    // 2. Start execution tracking
    const record = this.execution.start({
      organizationId: params.organizationId,
      userId: params.userId,
      query: params.query,
      selectedAgents: intentResult.intents.map((i) => i.agentId),
    });

    try {
      // 3. Create execution plan
      const plan = await this.planner.createPlan(params.query, intentResult);
      record.plan = plan;
      this.execution.addLog(record.id, `Plan created with ${plan.tasks.length} task(s)`);
      await this.eventBus.emit(
        'plan.created',
        { planId: plan.id, taskCount: plan.tasks.length },
        {
          organizationId: params.organizationId,
          userId: params.userId,
        },
      );

      // 4. Build context
      const contextSource: ContextSource = {
        organizationId: params.organizationId,
        userId: params.userId,
        workspaceId: params.workspaceId,
        conversationHistory: params.conversationHistory || [],
        availableTools: this.tools.list().map((t) => t.name),
      };
      const context = await this.contextEngine.build(contextSource);

      // 5. Execute tasks (respecting dependencies)
      const taskResults: Record<string, unknown> = {};

      while (!this.planner.isPlanComplete(plan)) {
        const readyTasks = this.planner.getReadyTasks(plan);
        if (readyTasks.length === 0) break;

        // Execute ready tasks in parallel
        const taskPromises = readyTasks.map(async (task) => {
          task.status = 'running';
          task.startedAt = new Date().toISOString();

          const agent = this.registry.get(task.agentId);
          if (!agent) {
            task.status = 'failed';
            task.error = `Agent "${task.agentId}" not found`;
            return;
          }

          try {
            await this.eventBus.emit(
              'agent.selected',
              { agentId: task.agentId, taskId: task.id },
              {
                organizationId: params.organizationId,
              },
            );

            const output = await agent.execute({
              query: task.description,
              context,
              taskId: task.id,
              parameters: task.input as Record<string, unknown> | undefined,
            });

            task.status = 'completed';
            task.output = output.result;
            task.completedAt = new Date().toISOString();
            taskResults[task.id] = output.result;

            this.execution.addLog(record.id, `Task "${task.name}" completed by ${task.agentId}`);
          } catch (err) {
            task.status = 'failed';
            task.error = err instanceof Error ? err.message : String(err);
            task.completedAt = new Date().toISOString();
            this.execution.addError(record.id, `Task "${task.name}" failed: ${task.error}`);
          }
        });

        await Promise.all(taskPromises);
      }

      // 6. Assemble final output
      const output = {
        query: params.query,
        intents: intentResult,
        plan: {
          id: plan.id,
          taskCount: plan.tasks.length,
          completedTasks: plan.tasks.filter((t) => t.status === 'completed').length,
          failedTasks: plan.tasks.filter((t) => t.status === 'failed').length,
        },
        results: taskResults,
      };

      this.execution.complete(record.id, output);

      // 7. Store in memory
      await this.memory.remember(
        `User asked: "${params.query}" → Routed to ${intentResult.primaryAgent}`,
        params.organizationId,
        { type: 'short_term', userId: params.userId },
      );

      this.telemetry.endTrace(trace.spanId, 'ok');
      return this.execution.get(record.id)!;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      this.execution.fail(record.id, errorMsg);
      this.telemetry.endTrace(trace.spanId, 'error');
      return this.execution.get(record.id)!;
    }
  }

  /**
   * Get system status
   */
  getStatus(): {
    agents: number;
    tools: number;
    workflows: number;
    providers: number;
    telemetry: ReturnType<TelemetryService['getSummary']>;
  } {
    return {
      agents: this.registry.count(),
      tools: this.tools.list().length,
      workflows: this.workflows.listDefinitions().length,
      providers: this.providers.list().length,
      telemetry: this.telemetry.getSummary(),
    };
  }
}
