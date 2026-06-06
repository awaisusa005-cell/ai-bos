'use client';

import { useState } from 'react';

// ─── Mock Data ───────────────────────────────────────────────

const MOCK_AGENTS = [
  { id: 'sales-agent', name: 'SalesAgent', status: 'active', tasksCompleted: 12 },
  { id: 'marketing-agent', name: 'MarketingAgent', status: 'active', tasksCompleted: 8 },
  { id: 'social-media-agent', name: 'SocialMediaAgent', status: 'idle', tasksCompleted: 5 },
  { id: 'finance-agent', name: 'FinanceAgent', status: 'active', tasksCompleted: 15 },
  { id: 'hr-agent', name: 'HRAgent', status: 'idle', tasksCompleted: 3 },
  { id: 'support-agent', name: 'SupportAgent', status: 'active', tasksCompleted: 22 },
  { id: 'operations-agent', name: 'OperationsAgent', status: 'idle', tasksCompleted: 7 },
  { id: 'analytics-agent', name: 'AnalyticsAgent', status: 'active', tasksCompleted: 18 },
];

const MOCK_EXECUTIONS = [
  {
    id: 'exec-1',
    query: 'Generate Q2 revenue report',
    agent: 'FinanceAgent',
    status: 'completed',
    duration: '2.3s',
    time: '2 min ago',
  },
  {
    id: 'exec-2',
    query: 'Create Instagram campaign for new product',
    agent: 'SocialMediaAgent',
    status: 'running',
    duration: '—',
    time: 'Just now',
  },
  {
    id: 'exec-3',
    query: 'Qualify new inbound leads',
    agent: 'SalesAgent',
    status: 'completed',
    duration: '1.8s',
    time: '5 min ago',
  },
  {
    id: 'exec-4',
    query: 'Analyze customer churn patterns',
    agent: 'AnalyticsAgent',
    status: 'completed',
    duration: '4.1s',
    time: '10 min ago',
  },
  {
    id: 'exec-5',
    query: 'Draft support response template',
    agent: 'SupportAgent',
    status: 'failed',
    duration: '0.5s',
    time: '12 min ago',
  },
];

const MOCK_EVENTS = [
  { type: 'task.completed', payload: 'Q2 revenue report generated', time: '2 min ago' },
  {
    type: 'agent.selected',
    payload: 'SocialMediaAgent selected for campaign task',
    time: 'Just now',
  },
  { type: 'tool.executed', payload: 'AnalyticsTool queried customer data', time: '5 min ago' },
  { type: 'workflow.started', payload: 'Lead qualification workflow triggered', time: '8 min ago' },
  { type: 'memory.updated', payload: 'Organization knowledge base updated', time: '15 min ago' },
  { type: 'task.failed', payload: 'Email delivery failed — retrying', time: '12 min ago' },
];

const MOCK_WORKFLOWS = [
  { id: 'wf-1', name: 'Lead Qualification', status: 'running', steps: 5, completed: 3 },
  { id: 'wf-2', name: 'Content Publishing', status: 'idle', steps: 4, completed: 0 },
  { id: 'wf-3', name: 'Monthly Report Generation', status: 'completed', steps: 7, completed: 7 },
];

// ─── Components ──────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    active: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    idle: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
    running: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    completed: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    failed: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${colors[status] || colors.idle}`}
    >
      {status}
    </span>
  );
}

function Card({
  title,
  children,
  className = '',
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-slate-800 ${className}`}
    >
      <h3 className="mb-4 font-semibold text-gray-900 dark:text-white">{title}</h3>
      {children}
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────

export default function AIBrainPage() {
  const [activeTab, setActiveTab] = useState<
    'overview' | 'agents' | 'history' | 'workflows' | 'memory' | 'events'
  >('overview');

  const tabs = [
    { id: 'overview' as const, label: 'Overview' },
    { id: 'agents' as const, label: 'AI Employees' },
    { id: 'history' as const, label: 'Task History' },
    { id: 'workflows' as const, label: 'Workflows' },
    { id: 'memory' as const, label: 'Memory' },
    { id: 'events' as const, label: 'Events' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">AI Brain</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Central AI orchestration engine — multi-agent coordination, memory, and workflows
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex gap-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && <OverviewTab />}
      {activeTab === 'agents' && <AgentsTab />}
      {activeTab === 'history' && <HistoryTab />}
      {activeTab === 'workflows' && <WorkflowsTab />}
      {activeTab === 'memory' && <MemoryTab />}
      {activeTab === 'events' && <EventsTab />}
    </div>
  );
}

function OverviewTab() {
  return (
    <div className="space-y-6">
      {/* Status Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Registered Agents', value: '8', sub: 'All operational' },
          { label: 'Tasks Executed', value: '90', sub: 'Last 24h' },
          { label: 'Active Workflows', value: '1', sub: '2 completed today' },
          { label: 'Token Usage', value: '24.5k', sub: '~$0.12 est. cost' },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-slate-800"
          >
            <p className="text-sm text-gray-500 dark:text-gray-400">{stat.label}</p>
            <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
            <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">{stat.sub}</p>
          </div>
        ))}
      </div>

      {/* Live Execution + Events */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card title="Live Execution Log">
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {MOCK_EXECUTIONS.slice(0, 4).map((exec) => (
              <div key={exec.id} className="flex items-center justify-between text-sm">
                <div className="flex-1 min-w-0">
                  <p className="truncate text-gray-800 dark:text-gray-200">{exec.query}</p>
                  <p className="text-xs text-gray-400">
                    {exec.agent} · {exec.time}
                  </p>
                </div>
                <StatusBadge status={exec.status} />
              </div>
            ))}
          </div>
        </Card>

        <Card title="Event Stream">
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {MOCK_EVENTS.map((event, i) => (
              <div key={i} className="flex items-start gap-2 text-sm">
                <span className="mt-0.5 h-2 w-2 rounded-full bg-blue-400 flex-shrink-0" />
                <div>
                  <p className="text-gray-800 dark:text-gray-200">{event.payload}</p>
                  <p className="text-xs text-gray-400">
                    {event.type} · {event.time}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Orchestration Status */}
      <Card title="Orchestration Status">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 text-sm">
          <div>
            <p className="text-gray-500 dark:text-gray-400">Provider</p>
            <p className="font-medium text-gray-900 dark:text-white">OpenAI (gpt-4o)</p>
          </div>
          <div>
            <p className="text-gray-500 dark:text-gray-400">Avg Latency</p>
            <p className="font-medium text-gray-900 dark:text-white">2.1s</p>
          </div>
          <div>
            <p className="text-gray-500 dark:text-gray-400">Error Rate</p>
            <p className="font-medium text-gray-900 dark:text-white">1.2%</p>
          </div>
          <div>
            <p className="text-gray-500 dark:text-gray-400">Memory Entries</p>
            <p className="font-medium text-gray-900 dark:text-white">156</p>
          </div>
        </div>
      </Card>
    </div>
  );
}

function AgentsTab() {
  return (
    <Card title="Registered AI Employees">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700 text-left">
              <th className="pb-3 font-medium text-gray-500 dark:text-gray-400">Agent</th>
              <th className="pb-3 font-medium text-gray-500 dark:text-gray-400">Status</th>
              <th className="pb-3 font-medium text-gray-500 dark:text-gray-400">Tasks Completed</th>
              <th className="pb-3 font-medium text-gray-500 dark:text-gray-400">ID</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
            {MOCK_AGENTS.map((agent) => (
              <tr key={agent.id}>
                <td className="py-3 font-medium text-gray-900 dark:text-white">{agent.name}</td>
                <td className="py-3">
                  <StatusBadge status={agent.status} />
                </td>
                <td className="py-3 text-gray-600 dark:text-gray-300">{agent.tasksCompleted}</td>
                <td className="py-3 text-gray-400 font-mono text-xs">{agent.id}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function HistoryTab() {
  return (
    <Card title="Task Execution History">
      <div className="space-y-3">
        {MOCK_EXECUTIONS.map((exec) => (
          <div
            key={exec.id}
            className="flex items-center justify-between rounded-lg border border-gray-100 p-3 dark:border-gray-700"
          >
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 dark:text-white truncate">{exec.query}</p>
              <p className="text-xs text-gray-400 mt-0.5">
                {exec.agent} · Duration: {exec.duration} · {exec.time}
              </p>
            </div>
            <StatusBadge status={exec.status} />
          </div>
        ))}
      </div>
    </Card>
  );
}

function WorkflowsTab() {
  return (
    <Card title="Workflow Viewer">
      <div className="space-y-4">
        {MOCK_WORKFLOWS.map((wf) => (
          <div key={wf.id} className="rounded-lg border border-gray-100 p-4 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-gray-900 dark:text-white">{wf.name}</h4>
              <StatusBadge status={wf.status} />
            </div>
            <div className="mt-2">
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span>
                  {wf.completed}/{wf.steps} steps
                </span>
                <div className="flex-1 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full"
                    style={{ width: `${(wf.completed / wf.steps) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function MemoryTab() {
  return (
    <div className="space-y-6">
      <Card title="Memory Inspector">
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Short-term Memory
            </h4>
            <div className="rounded-lg bg-gray-50 p-3 dark:bg-slate-900 text-sm text-gray-600 dark:text-gray-400">
              <p>Current session: 3 conversation entries</p>
              <p className="mt-1 text-xs">Last updated: 2 min ago</p>
            </div>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Long-term Memory
            </h4>
            <div className="rounded-lg bg-gray-50 p-3 dark:bg-slate-900 text-sm text-gray-600 dark:text-gray-400">
              <p>156 organization knowledge entries stored</p>
              <p className="mt-1 text-xs">
                Topics: product info, customer preferences, pricing rules, team structure
              </p>
            </div>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Semantic Memory
            </h4>
            <div className="rounded-lg bg-gray-50 p-3 dark:bg-slate-900 text-sm text-gray-600 dark:text-gray-400">
              <p>Vector store: ready (embeddings-based search)</p>
              <p className="mt-1 text-xs">Backend: configurable (Pinecone, Weaviate, pgvector)</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

function EventsTab() {
  return (
    <Card title="Event Stream">
      <div className="space-y-2">
        {MOCK_EVENTS.map((event, i) => (
          <div
            key={i}
            className="flex items-start gap-3 rounded-lg border border-gray-100 p-3 dark:border-gray-700"
          >
            <span className="mt-1.5 h-2 w-2 rounded-full bg-blue-400 flex-shrink-0" />
            <div>
              <p className="text-sm text-gray-800 dark:text-gray-200">{event.payload}</p>
              <p className="text-xs text-gray-400 mt-0.5">
                <code className="text-xs">{event.type}</code> · {event.time}
              </p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
