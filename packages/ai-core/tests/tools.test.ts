import { describe, it, expect, beforeEach } from 'vitest';
import { ToolRegistry, PLACEHOLDER_TOOLS } from '../src/tools';

describe('ToolRegistry', () => {
  let registry: ToolRegistry;

  beforeEach(() => {
    registry = new ToolRegistry();
    for (const tool of PLACEHOLDER_TOOLS) {
      registry.register(tool);
    }
  });

  it('should register and list all placeholder tools', () => {
    const tools = registry.list();
    expect(tools.length).toBe(8);
    expect(tools.map((t) => t.name)).toContain('EmailTool');
    expect(tools.map((t) => t.name)).toContain('CRMTool');
    expect(tools.map((t) => t.name)).toContain('CalendarTool');
  });

  it('should check if a tool exists', () => {
    expect(registry.has('EmailTool')).toBe(true);
    expect(registry.has('NonExistentTool')).toBe(false);
  });

  it('should execute a placeholder tool successfully', async () => {
    const result = await registry.execute('EmailTool', {
      to: 'test@example.com',
      subject: 'Test',
      body: 'Hello',
      action: 'send',
    });
    expect(result.success).toBe(true);
    expect(result.durationMs).toBeGreaterThanOrEqual(0);
  });

  it('should return error for non-existent tool', async () => {
    const result = await registry.execute('FakeTool', {});
    expect(result.success).toBe(false);
    expect(result.error).toContain('not found');
  });

  it('should include tool definitions with correct structure', () => {
    const tools = registry.list();
    for (const tool of tools) {
      expect(tool.name).toBeDefined();
      expect(tool.description).toBeDefined();
      expect(tool.timeout).toBeGreaterThan(0);
      expect(tool.retryPolicy.maxRetries).toBeGreaterThanOrEqual(0);
    }
  });
});
