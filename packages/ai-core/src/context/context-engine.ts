import type { OrchestrationContext, ChatMessage } from '../schemas';
import type { MemoryService } from '../memory';

export interface ContextSource {
  organizationId: string;
  userId: string;
  workspaceId?: string;
  conversationHistory?: ChatMessage[];
  organizationInfo?: Record<string, unknown>;
  userProfile?: Record<string, unknown>;
  workspaceSettings?: Record<string, unknown>;
  recentTasks?: unknown[];
  availableTools?: string[];
  uploadedDocuments?: string[];
  connectedIntegrations?: string[];
}

/**
 * Context Engine
 *
 * Assembles relevant context for each AI employee execution.
 * Filters and summarizes context to stay within token limits.
 */
export class ContextEngine {
  private maxConversationHistory = 20;
  private maxRecentTasks = 10;

  constructor(private memory?: MemoryService) {}

  async build(source: ContextSource): Promise<OrchestrationContext> {
    const memorySummary = this.memory
      ? await this.memory.getSummary(source.organizationId, source.userId)
      : undefined;

    return {
      organizationId: source.organizationId,
      userId: source.userId,
      workspaceId: source.workspaceId,
      conversationHistory: this.trimConversation(source.conversationHistory || []),
      organizationInfo: source.organizationInfo,
      userProfile: source.userProfile,
      workspaceSettings: source.workspaceSettings,
      recentTasks: (source.recentTasks || []).slice(-this.maxRecentTasks),
      availableTools: source.availableTools || [],
      memorySummary,
    };
  }

  /**
   * Build agent-specific context (only relevant parts)
   */
  async buildForAgent(source: ContextSource, agentId: string): Promise<OrchestrationContext> {
    const fullContext = await this.build(source);

    // TODO: Filter context based on agent's required permissions and capabilities
    // For now, return full context
    return fullContext;
  }

  private trimConversation(messages: ChatMessage[]): ChatMessage[] {
    if (messages.length <= this.maxConversationHistory) {
      return messages;
    }

    // Keep system message + last N messages
    const systemMessages = messages.filter((m) => m.role === 'system');
    const nonSystem = messages.filter((m) => m.role !== 'system');
    return [...systemMessages, ...nonSystem.slice(-this.maxConversationHistory)];
  }
}
