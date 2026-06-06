import type { AgentDefinition } from '../schemas';

export const AGENT_DEFINITIONS: AgentDefinition[] = [
  {
    id: 'sales-agent',
    name: 'SalesAgent',
    description:
      'Manages sales pipeline, lead qualification, deal tracking, and revenue forecasting.',
    capabilities: [
      { name: 'lead_qualification', description: 'Qualify and score incoming leads' },
      {
        name: 'pipeline_management',
        description: 'Track and advance deals through pipeline stages',
      },
      { name: 'revenue_forecasting', description: 'Predict revenue based on pipeline data' },
      { name: 'follow_up_management', description: 'Schedule and manage follow-up activities' },
    ],
    supportedTools: ['CRMTool', 'EmailTool', 'CalendarTool', 'AnalyticsTool'],
    allowedIntegrations: ['crm', 'email', 'calendar', 'phone'],
    priority: 10,
    requiredPermissions: ['deals.read', 'deals.write', 'contacts.read'],
  },
  {
    id: 'marketing-agent',
    name: 'MarketingAgent',
    description:
      'Creates marketing campaigns, content strategy, audience targeting, and performance analysis.',
    capabilities: [
      { name: 'campaign_creation', description: 'Design and launch marketing campaigns' },
      { name: 'content_generation', description: 'Generate marketing copy and content' },
      { name: 'audience_analysis', description: 'Analyze and segment target audiences' },
      { name: 'performance_tracking', description: 'Monitor campaign performance metrics' },
    ],
    supportedTools: ['EmailTool', 'AnalyticsTool', 'SearchTool', 'ReportTool'],
    allowedIntegrations: ['email', 'social_media', 'analytics', 'ads'],
    priority: 8,
    requiredPermissions: ['campaigns.read', 'campaigns.write', 'analytics.read'],
  },
  {
    id: 'social-media-agent',
    name: 'SocialMediaAgent',
    description:
      'Manages social media presence, content scheduling, engagement, and community management.',
    capabilities: [
      { name: 'post_generation', description: 'Create social media posts and captions' },
      { name: 'content_scheduling', description: 'Schedule posts across platforms' },
      { name: 'engagement_monitoring', description: 'Track likes, comments, and shares' },
      { name: 'trend_analysis', description: 'Identify trending topics and hashtags' },
    ],
    supportedTools: ['SearchTool', 'FileTool', 'AnalyticsTool', 'BrowserTool'],
    allowedIntegrations: ['social_media', 'media_library', 'analytics'],
    priority: 6,
    requiredPermissions: ['social.read', 'social.write', 'media.read'],
  },
  {
    id: 'finance-agent',
    name: 'FinanceAgent',
    description:
      'Handles financial analysis, budgeting, expense tracking, and financial reporting.',
    capabilities: [
      { name: 'financial_analysis', description: 'Analyze revenue, expenses, and profitability' },
      { name: 'budget_management', description: 'Create and track budgets' },
      { name: 'expense_tracking', description: 'Monitor and categorize expenses' },
      { name: 'report_generation', description: 'Generate financial reports and forecasts' },
    ],
    supportedTools: ['AnalyticsTool', 'ReportTool', 'SearchTool'],
    allowedIntegrations: ['accounting', 'banking', 'invoicing'],
    priority: 9,
    requiredPermissions: ['finance.read', 'finance.write', 'reports.read'],
  },
  {
    id: 'hr-agent',
    name: 'HRAgent',
    description: 'Manages recruitment, onboarding, employee engagement, and HR operations.',
    capabilities: [
      { name: 'recruitment', description: 'Screen candidates and manage hiring pipeline' },
      { name: 'onboarding', description: 'Create and manage onboarding workflows' },
      { name: 'employee_engagement', description: 'Track and improve employee satisfaction' },
      { name: 'policy_management', description: 'Maintain and communicate HR policies' },
    ],
    supportedTools: ['EmailTool', 'CalendarTool', 'FileTool', 'SearchTool'],
    allowedIntegrations: ['hr_system', 'email', 'calendar', 'documents'],
    priority: 7,
    requiredPermissions: ['hr.read', 'hr.write', 'employees.read'],
  },
  {
    id: 'support-agent',
    name: 'SupportAgent',
    description: 'Handles customer support tickets, knowledge base, and customer satisfaction.',
    capabilities: [
      { name: 'ticket_management', description: 'Triage and resolve support tickets' },
      { name: 'knowledge_base', description: 'Search and maintain support documentation' },
      { name: 'customer_communication', description: 'Draft and send customer responses' },
      { name: 'escalation', description: 'Identify and escalate complex issues' },
    ],
    supportedTools: ['EmailTool', 'SearchTool', 'CRMTool', 'BrowserTool'],
    allowedIntegrations: ['helpdesk', 'email', 'crm', 'knowledge_base'],
    priority: 9,
    requiredPermissions: ['tickets.read', 'tickets.write', 'customers.read'],
  },
  {
    id: 'operations-agent',
    name: 'OperationsAgent',
    description: 'Manages business operations, process optimization, and workflow automation.',
    capabilities: [
      { name: 'process_optimization', description: 'Identify and improve inefficient processes' },
      { name: 'workflow_automation', description: 'Create and manage automated workflows' },
      { name: 'resource_management', description: 'Optimize resource allocation' },
      { name: 'compliance_monitoring', description: 'Track operational compliance' },
    ],
    supportedTools: ['AnalyticsTool', 'ReportTool', 'CalendarTool', 'FileTool'],
    allowedIntegrations: ['project_management', 'inventory', 'scheduling'],
    priority: 7,
    requiredPermissions: ['operations.read', 'operations.write', 'workflows.read'],
  },
  {
    id: 'analytics-agent',
    name: 'AnalyticsAgent',
    description:
      'Provides data analysis, business intelligence, custom reports, and trend detection.',
    capabilities: [
      { name: 'data_analysis', description: 'Analyze business data and metrics' },
      { name: 'report_generation', description: 'Create custom analytical reports' },
      { name: 'trend_detection', description: 'Identify patterns and anomalies in data' },
      { name: 'forecasting', description: 'Generate predictions based on historical data' },
    ],
    supportedTools: ['AnalyticsTool', 'ReportTool', 'SearchTool', 'BrowserTool'],
    allowedIntegrations: ['analytics', 'database', 'reporting'],
    priority: 8,
    requiredPermissions: ['analytics.read', 'reports.read', 'reports.write'],
  },
];
