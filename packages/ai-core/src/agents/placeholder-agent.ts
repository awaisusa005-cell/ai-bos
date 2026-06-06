import type { AIAgent, AgentInput, AgentOutput } from './agent.interface';

/**
 * Base placeholder agent that returns mock responses.
 * All 8 initial agents extend this with their specific domain context.
 */
export class PlaceholderAgent implements AIAgent {
  constructor(
    private agentName: string,
    private domain: string,
  ) {}

  async execute(input: AgentInput): Promise<AgentOutput> {
    const startTime = Date.now();

    // Simulate processing
    const result = {
      agent: this.agentName,
      domain: this.domain,
      query: input.query,
      response: `[${this.agentName}] This is a placeholder response. In production, this agent would analyze the request "${input.query}" and provide ${this.domain}-specific insights and actions.`,
      suggestedActions: this.getSuggestedActions(input.query),
      status: 'mock',
    };

    return {
      success: true,
      result,
      metadata: {
        tokensUsed: 0,
        durationMs: Date.now() - startTime,
        toolsInvoked: [],
        confidence: 0.85,
      },
    };
  }

  protected getSuggestedActions(_query: string): string[] {
    return [
      `Analyze ${this.domain} data`,
      `Generate ${this.domain} report`,
      `Review ${this.domain} metrics`,
    ];
  }
}
