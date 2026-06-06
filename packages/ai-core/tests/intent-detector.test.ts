import { describe, it, expect, beforeEach } from 'vitest';
import { IntentDetector } from '../src/orchestrator/intent-detector';
import { AgentRegistry } from '../src/registry';
import { registerDefaultAgents } from '../src/agents/register-defaults';

describe('IntentDetector', () => {
  let detector: IntentDetector;
  let registry: AgentRegistry;

  beforeEach(() => {
    registry = new AgentRegistry();
    registerDefaultAgents(registry);
    detector = new IntentDetector(registry);
  });

  it('should route sales-related queries to SalesAgent', async () => {
    const result = await detector.detect('I need more leads in the sales pipeline');
    expect(result.primaryAgent).toBe('sales-agent');
    expect(result.intents[0]!.confidence).toBeGreaterThan(0.5);
  });

  it('should route marketing queries to MarketingAgent', async () => {
    const result = await detector.detect('Create a new marketing campaign for Q3');
    expect(result.primaryAgent).toBe('marketing-agent');
  });

  it('should route social media queries correctly', async () => {
    const result = await detector.detect('Create Instagram posts for the new product launch');
    expect(result.primaryAgent).toBe('social-media-agent');
  });

  it('should route finance queries to FinanceAgent', async () => {
    const result = await detector.detect('Why did revenue drop last month? Check the budget');
    expect(result.intents.some((i) => i.agentId === 'finance-agent')).toBe(true);
  });

  it('should detect multi-agent queries', async () => {
    const result = await detector.detect('I need more customers through marketing and sales');
    expect(result.intents.length).toBeGreaterThan(1);
  });

  it('should return confidence scores between 0 and 1', async () => {
    const result = await detector.detect('Help me with analytics reporting on customer data');
    for (const intent of result.intents) {
      expect(intent.confidence).toBeGreaterThanOrEqual(0);
      expect(intent.confidence).toBeLessThanOrEqual(1);
    }
  });

  it('should default to operations-agent for unclear queries', async () => {
    const result = await detector.detect('xyzzy foo bar');
    expect(result.primaryAgent).toBe('operations-agent');
  });
});
