import { Router } from 'express';
import { Orchestrator, type ExecutionRecord, type WorkflowDefinition } from '@ai-bos/ai-core';

const router = Router();

// Singleton orchestrator instance
const orchestrator = new Orchestrator();

// ─── Execute Task ────────────────────────────────────────────

router.post('/execute', async (req, res) => {
  try {
    const { query, organizationId, userId, workspaceId, conversationHistory } = req.body;

    if (!query || !organizationId || !userId) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'query, organizationId, and userId are required',
        },
      });
    }

    const result: ExecutionRecord = await orchestrator.execute({
      query,
      organizationId,
      userId,
      workspaceId,
      conversationHistory,
    });

    return res.status(200).json({ success: true, data: result });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: {
        code: 'EXECUTION_ERROR',
        message: err instanceof Error ? err.message : 'Unknown error',
      },
    });
  }
});

// ─── List Agents ─────────────────────────────────────────────

router.get('/agents', (_req, res) => {
  const agents = orchestrator.registry.list();
  return res.json({ success: true, data: agents });
});

// ─── Get Agent ───────────────────────────────────────────────

router.get('/agents/:agentId', (req, res) => {
  const definition = orchestrator.registry.getDefinition(req.params.agentId);
  if (!definition) {
    return res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: `Agent "${req.params.agentId}" not found` },
    });
  }
  return res.json({ success: true, data: definition });
});

// ─── Task History ────────────────────────────────────────────

router.get('/history', (req, res) => {
  const { organizationId, userId, status, limit } = req.query;
  const records = orchestrator.execution.list({
    organizationId: organizationId as string,
    userId: userId as string,
    status: status as any,
    limit: limit ? parseInt(limit as string, 10) : undefined,
  });
  return res.json({ success: true, data: records });
});

// ─── Get Execution ───────────────────────────────────────────

router.get('/history/:executionId', (req, res) => {
  const record = orchestrator.execution.get(req.params.executionId);
  if (!record) {
    return res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Execution record not found' },
    });
  }
  return res.json({ success: true, data: record });
});

// ─── Memory ──────────────────────────────────────────────────

router.get('/memory/:organizationId', async (req, res) => {
  const { userId } = req.query;
  const summary = await orchestrator.memory.getSummary(
    req.params.organizationId,
    userId as string | undefined,
  );
  return res.json({ success: true, data: { summary } });
});

router.post('/memory', async (req, res) => {
  const { content, organizationId, type, userId, metadata } = req.body;
  if (!content || !organizationId) {
    return res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'content and organizationId are required' },
    });
  }
  const entry = await orchestrator.memory.remember(content, organizationId, {
    type,
    userId,
    metadata,
  });
  return res.status(201).json({ success: true, data: entry });
});

// ─── Workflows ───────────────────────────────────────────────

router.get('/workflows', (_req, res) => {
  const definitions = orchestrator.workflows.listDefinitions();
  return res.json({ success: true, data: definitions });
});

router.post('/workflows', (req, res) => {
  try {
    const definition: WorkflowDefinition = req.body;
    orchestrator.workflows.registerDefinition(definition);
    return res.status(201).json({ success: true, data: definition });
  } catch (err) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: err instanceof Error ? err.message : 'Invalid workflow',
      },
    });
  }
});

router.post('/workflows/:definitionId/start', async (req, res) => {
  try {
    const { context, organizationId, userId } = req.body;
    const instance = await orchestrator.workflows.start(req.params.definitionId, context || {}, {
      organizationId,
      userId,
    });
    return res.status(201).json({ success: true, data: instance });
  } catch (err) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'WORKFLOW_ERROR',
        message: err instanceof Error ? err.message : 'Failed to start workflow',
      },
    });
  }
});

router.get('/workflows/instances', (req, res) => {
  const { status } = req.query;
  const instances = orchestrator.workflows.listInstances({
    status: status as any,
  });
  return res.json({ success: true, data: instances });
});

router.post('/workflows/instances/:instanceId/cancel', (req, res) => {
  orchestrator.workflows.cancel(req.params.instanceId);
  return res.json({ success: true, data: { cancelled: true } });
});

// ─── Tools ───────────────────────────────────────────────────

router.get('/tools', (_req, res) => {
  const tools = orchestrator.tools.list();
  return res.json({ success: true, data: tools });
});

// ─── Events ──────────────────────────────────────────────────

router.get('/events', (req, res) => {
  const { type, organizationId, limit } = req.query;
  const events = orchestrator.eventBus.getHistory({
    type: type as any,
    organizationId: organizationId as string,
    limit: limit ? parseInt(limit as string, 10) : 50,
  });
  return res.json({ success: true, data: events });
});

// ─── Telemetry / Status ──────────────────────────────────────

router.get('/status', (_req, res) => {
  const status = orchestrator.getStatus();
  return res.json({ success: true, data: status });
});

router.get('/telemetry', (req, res) => {
  const { name, limit } = req.query;
  const metrics = orchestrator.telemetry.getMetrics({
    name: name as string,
    limit: limit ? parseInt(limit as string, 10) : 100,
  });
  const traces = orchestrator.telemetry.getTraces({ limit: 50 });
  const summary = orchestrator.telemetry.getSummary();
  return res.json({ success: true, data: { metrics, traces, summary } });
});

export { router as aiBrainRouter };
