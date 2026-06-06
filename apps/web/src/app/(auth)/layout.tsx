export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 dark:bg-slate-900">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto h-12 w-12 rounded-xl bg-blue-600 flex items-center justify-center">
            <span className="text-white font-bold text-lg">AI</span>
          </div>
          <h1 className="mt-4 text-2xl font-bold text-gray-900 dark:text-white">AI BOS</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">AI Business Operating System</p>
        </div>
        {children}
      </div>
    </div>
  );
}
