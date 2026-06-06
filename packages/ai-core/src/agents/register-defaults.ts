import type { AgentRegistry } from '../registry';
import { PlaceholderAgent } from './placeholder-agent';
import { AGENT_DEFINITIONS } from './definitions';

export function registerDefaultAgents(registry: AgentRegistry): void {
  const domainMap: Record<string, string> = {
    'sales-agent': 'sales',
    'marketing-agent': 'marketing',
    'social-media-agent': 'social media',
    'finance-agent': 'finance',
    'hr-agent': 'human resources',
    'support-agent': 'customer support',
    'operations-agent': 'operations',
    'analytics-agent': 'analytics',
  };

  for (const definition of AGENT_DEFINITIONS) {
    const domain = domainMap[definition.id] || definition.id;
    const instance = new PlaceholderAgent(definition.name, domain);
    registry.register(definition, instance);
  }
}
