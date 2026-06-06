import { z } from 'zod';

// ─── Risk & Priority ─────────────────────────────────────────

export const RiskLevel = z.enum(['low', 'medium', 'high', 'critical']);
export type RiskLevel = z.infer<typeof RiskLevel>;

export const Priority = z.enum(['low', 'normal', 'high', 'urgent']);
export type Priority = z.infer<typeof Priority>;

export const TaskStatus = z.enum([
  'pending',
  'queued',
  'running',
  'completed',
  'failed',
  'cancelled',
  'waiting_approval',
]);
export type TaskStatus = z.infer<typeof TaskStatus>;

export const WorkflowStatus = z.enum([
  'idle',
  'running',
  'paused',
  'completed',
  'failed',
  'cancelled',
]);
export type WorkflowStatus = z.infer<typeof WorkflowStatus>;

// ─── AI Provider ─────────────────────────────────────────────

export const AIProviderType = z.enum(['openai', 'anthropic', 'gemini', 'local']);
export type AIProviderType = z.infer<typeof AIProviderType>;

export const ChatMessage = z.object({
  role: z.enum(['system', 'user', 'assistant', 'tool']),
  content: z.string(),
  name: z.string().optional(),
  toolCallId: z.string().optional(),
});
export type ChatMessage = z.infer<typeof ChatMessage>;

export const CompletionRequest = z.object({
  messages: z.array(ChatMessage),
  model: z.string().optional(),
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().positive().optional(),
  topP: z.number().min(0).max(1).optional(),
  stop: z.array(z.string()).optional(),
  responseFormat: z.enum(['text', 'json']).optional(),
  tools: z.array(z.any()).optional(),
});
export type CompletionRequest = z.infer<typeof CompletionRequest>;

export const CompletionResponse = z.object({
  id: z.string(),
  content: z.string(),
  model: z.string(),
  usage: z.object({
    promptTokens: z.number(),
    completionTokens: z.number(),
    totalTokens: z.number(),
  }),
  finishReason: z.enum(['stop', 'length', 'tool_calls', 'content_filter']),
  toolCalls: z
    .array(
      z.object({
        id: z.string(),
        name: z.string(),
        arguments: z.string(),
      }),
    )
    .optional(),
});
export type CompletionResponse = z.infer<typeof CompletionResponse>;

// ─── Agent / Employee ────────────────────────────────────────

export const AgentCapability = z.object({
  name: z.string(),
  description: z.string(),
  inputSchema: z.any().optional(),
  outputSchema: z.any().optional(),
});
export type AgentCapability = z.infer<typeof AgentCapability>;

export const AgentDefinition = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  capabilities: z.array(AgentCapability),
  supportedTools: z.array(z.string()),
  allowedIntegrations: z.array(z.string()),
  priority: z.number().default(0),
  requiredPermissions: z.array(z.string()),
  inputSchema: z.any().optional(),
  outputSchema: z.any().optional(),
});
export type AgentDefinition = z.infer<typeof AgentDefinition>;

// ─── Intent ──────────────────────────────────────────────────

export const DetectedIntent = z.object({
  agentId: z.string(),
  confidence: z.number().min(0).max(1),
  reason: z.string(),
});
export type DetectedIntent = z.infer<typeof DetectedIntent>;

export const IntentResult = z.object({
  query: z.string(),
  intents: z.array(DetectedIntent),
  primaryAgent: z.string(),
  multiAgent: z.boolean(),
});
export type IntentResult = z.infer<typeof IntentResult>;

// ─── Task & Plan ─────────────────────────────────────────────

export const TaskNode = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  agentId: z.string(),
  dependencies: z.array(z.string()).default([]),
  status: TaskStatus.default('pending'),
  input: z.any().optional(),
  output: z.any().optional(),
  error: z.string().optional(),
  startedAt: z.string().optional(),
  completedAt: z.string().optional(),
});
export type TaskNode = z.infer<typeof TaskNode>;

export const ExecutionPlan = z.object({
  id: z.string(),
  query: z.string(),
  tasks: z.array(TaskNode),
  status: WorkflowStatus.default('idle'),
  createdAt: z.string(),
});
export type ExecutionPlan = z.infer<typeof ExecutionPlan>;

// ─── Tool ────────────────────────────────────────────────────

export const ToolDefinition = z.object({
  name: z.string(),
  description: z.string(),
  inputSchema: z.any(),
  outputSchema: z.any(),
  permissions: z.array(z.string()).default([]),
  timeout: z.number().default(30000),
  retryPolicy: z
    .object({
      maxRetries: z.number().default(3),
      backoffMs: z.number().default(1000),
      backoffMultiplier: z.number().default(2),
    })
    .default({}),
});
export type ToolDefinition = z.infer<typeof ToolDefinition>;

export const ToolResult = z.object({
  success: z.boolean(),
  data: z.any().optional(),
  error: z.string().optional(),
  durationMs: z.number(),
});
export type ToolResult = z.infer<typeof ToolResult>;

// ─── Memory ──────────────────────────────────────────────────

export const MemoryType = z.enum(['short_term', 'long_term', 'semantic']);
export type MemoryType = z.infer<typeof MemoryType>;

export const MemoryEntry = z.object({
  id: z.string(),
  type: MemoryType,
  content: z.string(),
  metadata: z.record(z.unknown()).optional(),
  organizationId: z.string(),
  userId: z.string().optional(),
  embedding: z.array(z.number()).optional(),
  createdAt: z.string(),
  expiresAt: z.string().optional(),
});
export type MemoryEntry = z.infer<typeof MemoryEntry>;

// ─── Events ──────────────────────────────────────────────────

export const EventType = z.enum([
  'task.started',
  'task.completed',
  'task.failed',
  'memory.updated',
  'tool.executed',
  'workflow.started',
  'workflow.completed',
  'workflow.failed',
  'agent.selected',
  'intent.detected',
  'plan.created',
]);
export type EventType = z.infer<typeof EventType>;

export const SystemEvent = z.object({
  id: z.string(),
  type: EventType,
  payload: z.any(),
  timestamp: z.string(),
  organizationId: z.string(),
  userId: z.string().optional(),
  correlationId: z.string().optional(),
});
export type SystemEvent = z.infer<typeof SystemEvent>;

// ─── Execution Record ────────────────────────────────────────

export const ExecutionRecord = z.object({
  id: z.string(),
  organizationId: z.string(),
  userId: z.string(),
  query: z.string(),
  selectedAgents: z.array(z.string()),
  plan: ExecutionPlan.optional(),
  status: TaskStatus,
  toolsUsed: z.array(z.string()).default([]),
  tokenUsage: z
    .object({
      promptTokens: z.number(),
      completionTokens: z.number(),
      totalTokens: z.number(),
    })
    .optional(),
  costEstimate: z.number().optional(),
  logs: z.array(z.string()).default([]),
  errors: z.array(z.string()).default([]),
  output: z.any().optional(),
  startedAt: z.string(),
  completedAt: z.string().optional(),
  durationMs: z.number().optional(),
});
export type ExecutionRecord = z.infer<typeof ExecutionRecord>;

// ─── Context ─────────────────────────────────────────────────

export const OrchestrationContext = z.object({
  organizationId: z.string(),
  userId: z.string(),
  workspaceId: z.string().optional(),
  conversationHistory: z.array(ChatMessage).default([]),
  organizationInfo: z.record(z.unknown()).optional(),
  userProfile: z.record(z.unknown()).optional(),
  workspaceSettings: z.record(z.unknown()).optional(),
  recentTasks: z.array(z.any()).default([]),
  availableTools: z.array(z.string()).default([]),
  memorySummary: z.string().optional(),
});
export type OrchestrationContext = z.infer<typeof OrchestrationContext>;

// ─── Workflow ────────────────────────────────────────────────

export const WorkflowStepType = z.enum([
  'action',
  'condition',
  'loop',
  'wait_approval',
  'delay',
  'parallel',
]);
export type WorkflowStepType = z.infer<typeof WorkflowStepType>;

export const WorkflowStep = z.object({
  id: z.string(),
  type: WorkflowStepType,
  name: z.string(),
  config: z.record(z.unknown()),
  nextOnSuccess: z.string().optional(),
  nextOnFailure: z.string().optional(),
  retries: z.number().default(0),
  timeout: z.number().optional(),
});
export type WorkflowStep = z.infer<typeof WorkflowStep>;

export const WorkflowDefinition = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  steps: z.array(WorkflowStep),
  entryStepId: z.string(),
  organizationId: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type WorkflowDefinition = z.infer<typeof WorkflowDefinition>;

// ─── Prompt Template ─────────────────────────────────────────

export const PromptTemplate = z.object({
  id: z.string(),
  name: z.string(),
  version: z.number().default(1),
  template: z.string(),
  variables: z.array(z.string()).default([]),
  fragments: z.record(z.string()).default({}),
  metadata: z.record(z.unknown()).optional(),
});
export type PromptTemplate = z.infer<typeof PromptTemplate>;
