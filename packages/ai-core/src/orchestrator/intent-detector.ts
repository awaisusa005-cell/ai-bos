import type { AgentDefinition, DetectedIntent, IntentResult } from '../schemas';
import type { AgentRegistry } from '../registry';
import type { AIProvider } from '../providers';

/**
 * Intent Detection Layer
 *
 * Analyzes user queries to determine which AI employee(s) should handle them.
 * Uses a two-phase approach:
 * 1. Keyword/capability matching for fast, deterministic routing
 * 2. LLM-based classification for ambiguous queries
 */
export class IntentDetector {
  constructor(
    private registry: AgentRegistry,
    private provider?: AIProvider,
  ) {}

  async detect(query: string): Promise<IntentResult> {
    const agents = this.registry.list();

    // Phase 1: Rule-based keyword matching
    const keywordMatches = this.matchByKeywords(query, agents);

    // If we have high-confidence keyword matches, use them directly
    if (keywordMatches.length > 0 && keywordMatches[0]!.confidence >= 0.8) {
      return this.buildResult(query, keywordMatches);
    }

    // Phase 2: LLM-based classification (if provider available)
    if (this.provider) {
      try {
        const llmMatches = await this.classifyWithLLM(query, agents);
        if (llmMatches.length > 0) {
          return this.buildResult(query, llmMatches);
        }
      } catch {
        // Fall back to keyword matches if LLM fails
      }
    }

    // Fall back to keyword matches (even low-confidence)
    if (keywordMatches.length > 0) {
      return this.buildResult(query, keywordMatches);
    }

    // Default: route to operations agent
    return this.buildResult(query, [
      {
        agentId: 'operations-agent',
        confidence: 0.3,
        reason: 'Default routing — no clear intent detected',
      },
    ]);
  }

  private matchByKeywords(query: string, agents: AgentDefinition[]): DetectedIntent[] {
    const queryLower = query.toLowerCase();
    const matches: DetectedIntent[] = [];

    const keywordMap: Record<string, string[]> = {
      'sales-agent': [
        'sales',
        'lead',
        'deal',
        'pipeline',
        'prospect',
        'close',
        'revenue',
        'customer acquisition',
        'quota',
        'commission',
        'follow up',
        'follow-up',
      ],
      'marketing-agent': [
        'marketing',
        'campaign',
        'brand',
        'advertis',
        'audience',
        'conversion',
        'funnel',
        'content strategy',
        'seo',
        'customer',
        'growth',
      ],
      'social-media-agent': [
        'social media',
        'instagram',
        'twitter',
        'linkedin',
        'facebook',
        'tiktok',
        'post',
        'hashtag',
        'engagement',
        'followers',
        'content calendar',
      ],
      'finance-agent': [
        'finance',
        'budget',
        'expense',
        'revenue',
        'profit',
        'cost',
        'invoice',
        'cash flow',
        'financial',
        'accounting',
        'tax',
        'p&l',
        'roi',
      ],
      'hr-agent': [
        'hire',
        'hiring',
        'recruit',
        'employee',
        'onboard',
        'hr',
        'human resource',
        'talent',
        'interview',
        'candidate',
        'payroll',
        'benefits',
        'culture',
      ],
      'support-agent': [
        'support',
        'ticket',
        'complaint',
        'help desk',
        'customer service',
        'issue',
        'bug report',
        'satisfaction',
        'nps',
        'resolution',
      ],
      'operations-agent': [
        'operations',
        'process',
        'workflow',
        'automat',
        'efficien',
        'optimize',
        'resource',
        'compliance',
        'inventory',
        'supply chain',
        'logistics',
      ],
      'analytics-agent': [
        'analytics',
        'data',
        'report',
        'metric',
        'dashboard',
        'insight',
        'trend',
        'forecast',
        'kpi',
        'performance',
        'analysis',
        'why did',
      ],
    };

    for (const [agentId, keywords] of Object.entries(keywordMap)) {
      const matchedKeywords = keywords.filter((kw) => queryLower.includes(kw));
      if (matchedKeywords.length > 0) {
        const agent = agents.find((a) => a.id === agentId);
        const confidence = Math.min(0.9, 0.4 + matchedKeywords.length * 0.2);
        matches.push({
          agentId,
          confidence,
          reason: `Matched keywords: ${matchedKeywords.join(', ')}${agent ? ` (${agent.name})` : ''}`,
        });
      }
    }

    return matches.sort((a, b) => b.confidence - a.confidence);
  }

  private async classifyWithLLM(
    query: string,
    agents: AgentDefinition[],
  ): Promise<DetectedIntent[]> {
    if (!this.provider) return [];

    const agentList = agents.map((a) => `- ${a.id}: ${a.description}`).join('\n');

    const response = await this.provider.complete({
      messages: [
        {
          role: 'system',
          content: `You are an intent classifier. Given a user query, determine which AI agent(s) should handle it.

Available agents:
${agentList}

Respond with valid JSON array of objects, each with:
- agentId: string (must be one of the listed agent ids)
- confidence: number (0-1)
- reason: string (brief explanation)

Select 1-3 most relevant agents. Always include at least one.`,
        },
        { role: 'user', content: query },
      ],
      responseFormat: 'json',
      temperature: 0.1,
      maxTokens: 500,
    });

    try {
      const parsed = JSON.parse(response.content);
      const intents = Array.isArray(parsed) ? parsed : parsed.intents || [parsed];
      return intents
        .filter((i: any) => i.agentId && typeof i.confidence === 'number')
        .map((i: any) => ({
          agentId: i.agentId,
          confidence: Math.max(0, Math.min(1, i.confidence)),
          reason: i.reason || 'LLM classification',
        }));
    } catch {
      return [];
    }
  }

  private buildResult(query: string, intents: DetectedIntent[]): IntentResult {
    const sorted = intents.sort((a, b) => b.confidence - a.confidence);
    return {
      query,
      intents: sorted,
      primaryAgent: sorted[0]!.agentId,
      multiAgent: sorted.filter((i) => i.confidence >= 0.5).length > 1,
    };
  }
}
