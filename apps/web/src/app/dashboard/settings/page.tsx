export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Organization and account settings</p>
      </div>
      <div className="rounded-xl border border-gray-200 bg-white p-12 text-center dark:border-gray-700 dark:bg-slate-800">
        <p className="text-gray-500 dark:text-gray-400">
          {/* TODO: Implement settings pages (profile, org, billing, team, API keys) */}
          Settings module coming soon. Manage your organization, team, billing, and preferences.
        </p>
      </div>
    </div>
  );
}
