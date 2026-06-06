import { describe, it, expect, beforeEach } from 'vitest';
import { EventBus } from '../src/events';

describe('EventBus', () => {
  let bus: EventBus;

  beforeEach(() => {
    bus = new EventBus();
  });

  it('should emit and receive events', async () => {
    const received: any[] = [];
    bus.on('task.started', (event) => {
      received.push(event);
    });

    await bus.emit('task.started', { taskId: '123' }, { organizationId: 'org-1' });

    expect(received.length).toBe(1);
    expect(received[0].type).toBe('task.started');
    expect(received[0].payload.taskId).toBe('123');
  });

  it('should support multiple handlers for same event', async () => {
    let count = 0;
    bus.on('task.completed', () => {
      count++;
    });
    bus.on('task.completed', () => {
      count++;
    });

    await bus.emit('task.completed', {});
    expect(count).toBe(2);
  });

  it('should support onAll handler', async () => {
    const events: string[] = [];
    bus.onAll((event) => {
      events.push(event.type);
    });

    await bus.emit('task.started', {});
    await bus.emit('task.completed', {});

    expect(events).toEqual(['task.started', 'task.completed']);
  });

  it('should unsubscribe with returned function', async () => {
    let count = 0;
    const unsub = bus.on('task.started', () => {
      count++;
    });

    await bus.emit('task.started', {});
    expect(count).toBe(1);

    unsub();
    await bus.emit('task.started', {});
    expect(count).toBe(1);
  });

  it('should track event history', async () => {
    await bus.emit('task.started', { id: 1 }, { organizationId: 'org-1' });
    await bus.emit('task.completed', { id: 1 }, { organizationId: 'org-1' });

    const history = bus.getHistory();
    expect(history.length).toBe(2);

    const filtered = bus.getHistory({ type: 'task.completed' });
    expect(filtered.length).toBe(1);
  });

  it('should clear all handlers and history', async () => {
    bus.on('task.started', () => {});
    await bus.emit('task.started', {});

    bus.clear();
    expect(bus.getHistory().length).toBe(0);
  });
});
