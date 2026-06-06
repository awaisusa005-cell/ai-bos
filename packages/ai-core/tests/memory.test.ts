import { describe, it, expect, beforeEach } from 'vitest';
import { InMemoryStore, DefaultMemoryService } from '../src/memory';

describe('MemoryService', () => {
  let service: DefaultMemoryService;

  beforeEach(() => {
    const store = new InMemoryStore();
    service = new DefaultMemoryService(store);
  });

  it('should remember and recall entries', async () => {
    await service.remember('Customer prefers email contact', 'org-1', { type: 'long_term' });
    await service.remember('Last meeting was about pricing', 'org-1', { type: 'long_term' });

    const results = await service.recall('email', 'org-1');
    expect(results.length).toBe(1);
    expect(results[0]!.content).toContain('email');
  });

  it('should support short-term memory', async () => {
    const entry = await service.remember('Current task: generate report', 'org-1', {
      type: 'short_term',
    });
    expect(entry.type).toBe('short_term');
    expect(entry.id).toBeDefined();
  });

  it('should generate memory summaries', async () => {
    await service.remember('Revenue grew 20% in Q1', 'org-1', { type: 'long_term' });
    await service.remember('Top product is Widget Pro', 'org-1', { type: 'long_term' });

    const summary = await service.getSummary('org-1');
    expect(summary).toContain('Revenue');
    expect(summary).toContain('Widget Pro');
  });

  it('should return empty summary for unknown org', async () => {
    const summary = await service.getSummary('unknown-org');
    expect(summary).toBe('No prior context available.');
  });

  it('should forget entries', async () => {
    const entry = await service.remember('Temp data', 'org-1');
    const results1 = await service.recall('Temp', 'org-1');
    expect(results1.length).toBe(1);

    await service.forget(entry.id);
    const results2 = await service.recall('Temp', 'org-1');
    expect(results2.length).toBe(0);
  });

  it('should summarize conversations', async () => {
    const messages = [
      { role: 'user', content: 'What is our revenue this quarter?' },
      { role: 'assistant', content: 'Revenue is $1.2M, up 15% from last quarter.' },
    ];
    const summary = await service.summarizeConversation(messages);
    expect(summary).toContain('revenue');
  });
});
