export default function IntegrationsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Integrations</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Connect third-party tools and services
        </p>
      </div>
      <div className="rounded-xl border border-gray-200 bg-white p-12 text-center dark:border-gray-700 dark:bg-slate-800">
        <p className="text-gray-500 dark:text-gray-400">
          {/* TODO: Implement integration marketplace and connection management */}
          Integrations module coming soon. Connect Slack, Google, Salesforce, and more.
        </p>
      </div>
    </div>
  );
}
