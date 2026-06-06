import type { AgentDefinition } from '../schemas';
import type { AIAgent } from '../agents/agent.interface';

export class AgentRegistry {
  private agents = new Map<string, { definition: AgentDefinition; instance: AIAgent }>();

  register(definition: AgentDefinition, instance: AIAgent): void {
    if (this.agents.has(definition.id)) {
      throw new Error(`Agent "${definition.id}" is already registered`);
    }
    this.agents.set(definition.id, { definition, instance });
  }

  unregister(agentId: string): void {
    this.agents.delete(agentId);
  }

  get(agentId: string): AIAgent | undefined {
    return this.agents.get(agentId)?.instance;
  }

  getDefinition(agentId: string): AgentDefinition | undefined {
    return this.agents.get(agentId)?.definition;
  }

  list(): AgentDefinition[] {
    return Array.from(this.agents.values()).map((a) => a.definition);
  }

  findByCapability(capability: string): AgentDefinition[] {
    return this.list().filter((a) =>
      a.capabilities.some(
        (c) =>
          c.name.toLowerCase().includes(capability.toLowerCase()) ||
          c.description.toLowerCase().includes(capability.toLowerCase()),
      ),
    );
  }

  findByTool(toolName: string): AgentDefinition[] {
    return this.list().filter((a) => a.supportedTools.includes(toolName));
  }

  has(agentId: string): boolean {
    return this.agents.has(agentId);
  }

  count(): number {
    return this.agents.size;
  }
}
