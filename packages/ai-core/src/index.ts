// ─── AI Core — Central AI Brain & Multi-Agent Orchestration Engine ───

// Main orchestrator
export { Orchestrator, IntentDetector } from './orchestrator';
export type { OrchestratorConfig } from './orchestrator';

// Agent system
export { AgentRegistry } from './registry';
export { PlaceholderAgent, AGENT_DEFINITIONS, registerDefaultAgents } from './agents';
export type { AIAgent, AgentInput, AgentOutput } from './agents';

// AI Providers
export {
  ProviderManager,
  OpenAIProvider,
  AnthropicProvider,
  GeminiProvider,
  LocalProvider,
} from './providers';
export type { AIProvider, AIProviderConfig } from './providers';

// Task planning
export { TaskPlanner } from './planner';

// Context
export { ContextEngine } from './context';
export type { ContextSource } from './context';

// Memory
export { DefaultMemoryService, InMemoryStore } from './memory';
export type { MemoryService, MemoryStore } from './memory';

// Prompts
export { PromptManager, DEFAULT_PROMPTS, DEFAULT_FRAGMENTS } from './prompts';

// Tools
export { ToolRegistry, PLACEHOLDER_TOOLS } from './tools';
export type { Tool } from './tools';

// Workflows
export { WorkflowEngine } from './workflows';
export type { WorkflowInstance, StepExecutor } from './workflows';

// Execution tracking
export { ExecutionTracker } from './execution';

// Events
export { EventBus } from './events';
export type { EventHandler } from './events';

// Telemetry
export { TelemetryService } from './telemetry';
export type { TelemetryMetric, TelemetryTrace } from './telemetry';

// Schemas & types
export * from './schemas';
