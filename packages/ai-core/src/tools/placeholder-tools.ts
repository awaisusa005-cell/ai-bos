import type { Tool } from './tool.interface';
import type { ToolDefinition, ToolResult } from '../schemas';

function createPlaceholderTool(definition: ToolDefinition): Tool {
  return {
    definition,
    async execute(input: unknown): Promise<ToolResult> {
      return {
        success: true,
        data: {
          tool: definition.name,
          input,
          result: `[${definition.name}] Mock execution completed successfully.`,
          note: 'This is a placeholder implementation. Connect real integration in production.',
        },
        durationMs: Math.floor(Math.random() * 100) + 10,
      };
    },
  };
}

export const PLACEHOLDER_TOOLS: Tool[] = [
  createPlaceholderTool({
    name: 'EmailTool',
    description: 'Send emails, manage inbox, create drafts, and search email history.',
    inputSchema: {
      type: 'object',
      properties: {
        to: { type: 'string' },
        subject: { type: 'string' },
        body: { type: 'string' },
        action: { type: 'string', enum: ['send', 'draft', 'search'] },
      },
    },
    outputSchema: {
      type: 'object',
      properties: { messageId: { type: 'string' }, status: { type: 'string' } },
    },
    permissions: ['email.send', 'email.read'],
    timeout: 30000,
    retryPolicy: { maxRetries: 2, backoffMs: 1000, backoffMultiplier: 2 },
  }),
  createPlaceholderTool({
    name: 'CalendarTool',
    description: 'Create events, check availability, schedule meetings, and manage calendar.',
    inputSchema: {
      type: 'object',
      properties: {
        action: { type: 'string', enum: ['create', 'check', 'update', 'delete'] },
        title: { type: 'string' },
        startTime: { type: 'string' },
        endTime: { type: 'string' },
      },
    },
    outputSchema: {
      type: 'object',
      properties: { eventId: { type: 'string' }, status: { type: 'string' } },
    },
    permissions: ['calendar.read', 'calendar.write'],
    timeout: 15000,
    retryPolicy: { maxRetries: 2, backoffMs: 1000, backoffMultiplier: 2 },
  }),
  createPlaceholderTool({
    name: 'CRMTool',
    description: 'Manage contacts, deals, companies, and pipeline in the CRM system.',
    inputSchema: {
      type: 'object',
      properties: {
        action: { type: 'string', enum: ['create', 'read', 'update', 'search'] },
        entity: { type: 'string', enum: ['contact', 'deal', 'company'] },
        data: { type: 'object' },
      },
    },
    outputSchema: {
      type: 'object',
      properties: { entityId: { type: 'string' }, data: { type: 'object' } },
    },
    permissions: ['crm.read', 'crm.write'],
    timeout: 20000,
    retryPolicy: { maxRetries: 3, backoffMs: 1000, backoffMultiplier: 2 },
  }),
  createPlaceholderTool({
    name: 'SearchTool',
    description: 'Search the web, internal documents, knowledge base, and connected data sources.',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string' },
        source: { type: 'string', enum: ['web', 'internal', 'knowledge_base'] },
        limit: { type: 'number' },
      },
    },
    outputSchema: {
      type: 'object',
      properties: { results: { type: 'array', items: { type: 'object' } } },
    },
    permissions: ['search.read'],
    timeout: 30000,
    retryPolicy: { maxRetries: 2, backoffMs: 2000, backoffMultiplier: 2 },
  }),
  createPlaceholderTool({
    name: 'AnalyticsTool',
    description: 'Query analytics data, generate metrics, create charts, and analyze trends.',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string' },
        metric: { type: 'string' },
        timeRange: { type: 'string' },
        groupBy: { type: 'string' },
      },
    },
    outputSchema: {
      type: 'object',
      properties: { data: { type: 'array' }, summary: { type: 'string' } },
    },
    permissions: ['analytics.read'],
    timeout: 45000,
    retryPolicy: { maxRetries: 2, backoffMs: 2000, backoffMultiplier: 2 },
  }),
  createPlaceholderTool({
    name: 'FileTool',
    description: 'Read, write, search, and manage files and documents.',
    inputSchema: {
      type: 'object',
      properties: {
        action: { type: 'string', enum: ['read', 'write', 'search', 'list'] },
        path: { type: 'string' },
        content: { type: 'string' },
      },
    },
    outputSchema: {
      type: 'object',
      properties: {
        path: { type: 'string' },
        content: { type: 'string' },
        status: { type: 'string' },
      },
    },
    permissions: ['files.read', 'files.write'],
    timeout: 15000,
    retryPolicy: { maxRetries: 2, backoffMs: 500, backoffMultiplier: 2 },
  }),
  createPlaceholderTool({
    name: 'BrowserTool',
    description:
      'Navigate web pages, extract content, fill forms, and interact with web applications.',
    inputSchema: {
      type: 'object',
      properties: {
        action: { type: 'string', enum: ['navigate', 'extract', 'click', 'type'] },
        url: { type: 'string' },
        selector: { type: 'string' },
      },
    },
    outputSchema: {
      type: 'object',
      properties: {
        content: { type: 'string' },
        screenshot: { type: 'string' },
        status: { type: 'string' },
      },
    },
    permissions: ['browser.access'],
    timeout: 60000,
    retryPolicy: { maxRetries: 1, backoffMs: 3000, backoffMultiplier: 2 },
  }),
  createPlaceholderTool({
    name: 'ReportTool',
    description: 'Generate reports, summaries, and documents in various formats.',
    inputSchema: {
      type: 'object',
      properties: {
        type: { type: 'string', enum: ['summary', 'detailed', 'executive', 'custom'] },
        data: { type: 'object' },
        format: { type: 'string', enum: ['text', 'markdown', 'html', 'pdf'] },
      },
    },
    outputSchema: {
      type: 'object',
      properties: {
        reportId: { type: 'string' },
        content: { type: 'string' },
        format: { type: 'string' },
      },
    },
    permissions: ['reports.generate'],
    timeout: 30000,
    retryPolicy: { maxRetries: 2, backoffMs: 1000, backoffMultiplier: 2 },
  }),
];
