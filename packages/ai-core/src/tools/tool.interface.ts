import type { ToolDefinition, ToolResult } from '../schemas';

export interface Tool {
  definition: ToolDefinition;
  execute(
    input: unknown,
    context?: { userId?: string; organizationId?: string },
  ): Promise<ToolResult>;
}
