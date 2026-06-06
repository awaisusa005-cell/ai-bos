export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Welcome to AI Business Operating System
        </p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Active AI Employees', value: '0', change: '+0%' },
          { label: 'Automations Running', value: '0', change: '+0%' },
          { label: 'Revenue This Month', value: '$0', change: '+0%' },
          { label: 'Tasks Completed', value: '0', change: '+0%' },
        ].map((metric) => (
          <div
            key={metric.label}
            className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-slate-800"
          >
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{metric.label}</p>
            <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">{metric.value}</p>
            <p className="mt-1 text-sm text-green-600">{metric.change}</p>
          </div>
        ))}
      </div>

      {/* Placeholder sections */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-slate-800">
          <h3 className="font-semibold text-gray-900 dark:text-white">Recent Activity</h3>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            {/* TODO: Implement activity feed */}
            No recent activity to display.
          </p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-slate-800">
          <h3 className="font-semibold text-gray-900 dark:text-white">AI Employee Status</h3>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            {/* TODO: Implement AI employee status widget */}
            No AI employees configured yet.
          </p>
        </div>
      </div>
    </div>
  );
}
