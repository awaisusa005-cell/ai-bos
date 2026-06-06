import { Sidebar } from './sidebar';
import { TopNav } from './top-nav';

export function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <TopNav />
        <main className="flex-1 overflow-y-auto bg-gray-50 p-6 dark:bg-slate-900">{children}</main>
      </div>
    </div>
  );
}
