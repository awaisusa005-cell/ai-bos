import type { ToolDefinition, ToolResult } from '../schemas';
import type { Tool } from './tool.interface';

export class ToolRegistry {
  private tools = new Map<string, Tool>();

  register(tool: Tool): void {
    this.tools.set(tool.definition.name, tool);
  }

  get(name: string): Tool | undefined {
    return this.tools.get(name);
  }

  list(): ToolDefinition[] {
    return Array.from(this.tools.values()).map((t) => t.definition);
  }

  has(name: string): boolean {
    return this.tools.has(name);
  }

  async execute(
    name: string,
    input: unknown,
    context?: { userId?: string; organizationId?: string },
  ): Promise<ToolResult> {
    const tool = this.tools.get(name);
    if (!tool) {
      return { success: false, error: `Tool "${name}" not found`, durationMs: 0 };
    }

    const start = Date.now();
    const { retryPolicy } = tool.definition;
    let lastError: string | undefined;

    for (let attempt = 0; attempt <= retryPolicy.maxRetries; attempt++) {
      try {
        const result = await this.executeWithTimeout(tool, input, context);
        return result;
      } catch (err) {
        lastError = err instanceof Error ? err.message : String(err);
        if (attempt < retryPolicy.maxRetries) {
          const delay = retryPolicy.backoffMs * Math.pow(retryPolicy.backoffMultiplier, attempt);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    return {
      success: false,
      error: `Tool "${name}" failed after ${retryPolicy.maxRetries + 1} attempts: ${lastError}`,
      durationMs: Date.now() - start,
    };
  }

  private async executeWithTimeout(
    tool: Tool,
    input: unknown,
    context?: { userId?: string; organizationId?: string },
  ): Promise<ToolResult> {
    const timeout = tool.definition.timeout;
    const start = Date.now();

    return Promise.race([
      tool.execute(input, context),
      new Promise<ToolResult>((_, reject) =>
        setTimeout(() => reject(new Error(`Tool execution timed out after ${timeout}ms`)), timeout),
      ),
    ]).then((result) => ({ ...result, durationMs: Date.now() - start }));
  }
}
