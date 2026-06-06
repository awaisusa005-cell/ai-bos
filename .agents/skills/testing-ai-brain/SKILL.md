---
name: testing-ai-brain
description: Test the AI Brain orchestration engine end-to-end. Use when verifying AI Brain dashboard UI, API endpoints, or core module changes.
---

# Testing AI Brain

## Prerequisites

- Node.js 22+
- pnpm installed
- Packages built: `pnpm build` from repo root

## Setup

1. Start the API server:
   ```bash
   cd apps/api && pnpm dev
   ```
   Wait for: `AI BOS API running on port 4000`

2. Start the web server:
   ```bash
   cd apps/web && pnpm dev
   ```
   Wait for: Next.js ready on port 3000

3. If port conflicts occur, kill existing processes:
   ```bash
   fuser -k 4000/tcp
   fuser -k 3000/tcp
   ```

## Frontend Testing

Navigate to `http://localhost:3000/dashboard/ai-brain`

### Dashboard Tabs (6 total)

| Tab | What to verify |
|-----|---------------|
| Overview | 4 stat cards (Agents=8, Tasks=90, Workflows=1, Tokens=24.5k), Live Execution Log, Event Stream, Orchestration Status |
| AI Employees | Table with 8 rows (SalesAgent through AnalyticsAgent), columns: Agent, Status, Tasks Completed, ID |
| Task History | List of execution entries with query, agent, duration, status badges |
| Workflows | Workflow cards with name, status badge, step count, progress bar |
| Memory | Three sections: Short-term, Long-term, Semantic memory |
| Events | Event entries with type codes (task.completed, agent.selected, etc.) and timestamps |

### Sidebar
- "AI Brain" link should be the 2nd item (after Dashboard, before AI Employees)
- Should navigate to `/dashboard/ai-brain`
- Uses Brain icon from lucide-react

## API Testing

Base URL: `http://localhost:4000/api/v1/ai-brain`

### Key Endpoints

| Endpoint | Method | Purpose |
|----------|--------|--------|
| /execute | POST | Execute a task (requires: query, organizationId, userId) |
| /agents | GET | List all 8 registered agents |
| /tools | GET | List all 8 placeholder tools |
| /status | GET | System status (agent count, tool count, telemetry) |
| /history | GET | Task execution history |
| /events | GET | Event bus history |
| /telemetry | GET | Metrics and traces |
| /memory/:orgId | GET | Memory summary for org |

### Intent Routing Verification

Test that different queries route to different agents:

```bash
# Should route to sales-agent
curl -s -X POST http://localhost:4000/api/v1/ai-brain/execute \
  -H "Content-Type: application/json" \
  -d '{"query": "I need more leads", "organizationId": "org-1", "userId": "user-1"}'

# Should route to social-media-agent
curl -s -X POST http://localhost:4000/api/v1/ai-brain/execute \
  -H "Content-Type: application/json" \
  -d '{"query": "Create Instagram posts", "organizationId": "org-1", "userId": "user-1"}'

# Should route to finance-agent or analytics-agent
curl -s -X POST http://localhost:4000/api/v1/ai-brain/execute \
  -H "Content-Type: application/json" \
  -d '{"query": "Why did revenue drop?", "organizationId": "org-1", "userId": "user-1"}'

# Should fallback to operations-agent
curl -s -X POST http://localhost:4000/api/v1/ai-brain/execute \
  -H "Content-Type: application/json" \
  -d '{"query": "random gibberish", "organizationId": "org-1", "userId": "user-1"}'
```

### Expected Response Structure (execute)

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "completed",
    "selectedAgents": ["agent-id"],
    "query": "...",
    "output": { "intents": {...}, "plan": {...}, "results": {...} },
    "logs": [...],
    "durationMs": 0
  }
}
```

## Unit Tests

```bash
cd packages/ai-core && pnpm test
```

Expected: 7 test files, 40 tests, all passing:
- registry.test.ts (6)
- intent-detector.test.ts (7)
- planner.test.ts (4)
- memory.test.ts (6)
- tools.test.ts (5)
- workflow-engine.test.ts (6)
- event-bus.test.ts (6)

## Common Issues

- **Port already in use**: Kill existing process with `fuser -k <port>/tcp`
- **Module not found (@ai-bos/ai-core)**: Run `pnpm build` in `packages/ai-core` first
- **TypeScript build errors**: The ai-core package uses `noEmit: false` override in its tsconfig — don't change this
- **Dashboard shows no data**: The frontend uses hardcoded mock data (not connected to API) — this is expected for the placeholder implementation

## Notes

- The frontend dashboard uses **mock/placeholder data** hardcoded in the page component. It does NOT fetch from the API.
- The API uses **live orchestration modules** (registry, intent detection, planner, memory, tools, workflows, events, telemetry).
- No real LLM providers are configured — intent detection uses rule-based keyword matching only.
- All agents return mock responses (placeholder implementation).
