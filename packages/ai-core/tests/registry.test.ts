import { describe, it, expect, beforeEach } from 'vitest';
import { AgentRegistry } from '../src/registry';
import { PlaceholderAgent } from '../src/agents/placeholder-agent';
import { AGENT_DEFINITIONS } from '../src/agents/definitions';
import { registerDefaultAgents } from '../src/agents/register-defaults';

describe('AgentRegistry', () => {
  let registry: AgentRegistry;

  beforeEach(() => {
    registry = new AgentRegistry();
  });

  it('should register and retrieve an agent', () => {
    const definition = AGENT_DEFINITIONS[0]!;
    const agent = new PlaceholderAgent(definition.name, 'sales');
    registry.register(definition, agent);

    expect(registry.has(definition.id)).toBe(true);
    expect(registry.get(definition.id)).toBe(agent);
    expect(registry.getDefinition(definition.id)).toBe(definition);
  });

  it('should throw on duplicate registration', () => {
    const definition = AGENT_DEFINITIONS[0]!;
    const agent = new PlaceholderAgent(definition.name, 'sales');
    registry.register(definition, agent);

    expect(() => registry.register(definition, agent)).toThrow('already registered');
  });

  it('should list all registered agents', () => {
    registerDefaultAgents(registry);
    const list = registry.list();
    expect(list.length).toBe(8);
  });

  it('should find agents by capability', () => {
    registerDefaultAgents(registry);
    const results = registry.findByCapability('revenue');
    expect(results.length).toBeGreaterThan(0);
  });

  it('should find agents by tool', () => {
    registerDefaultAgents(registry);
    const results = registry.findByTool('EmailTool');
    expect(results.length).toBeGreaterThan(0);
  });

  it('should unregister an agent', () => {
    registerDefaultAgents(registry);
    expect(registry.has('sales-agent')).toBe(true);
    registry.unregister('sales-agent');
    expect(registry.has('sales-agent')).toBe(false);
    expect(registry.count()).toBe(7);
  });
});
