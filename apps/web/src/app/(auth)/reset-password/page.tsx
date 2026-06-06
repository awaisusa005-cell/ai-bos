import Link from 'next/link';

export default function ResetPasswordPage() {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm dark:border-gray-700 dark:bg-slate-800">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
        Reset your password
      </h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
        Enter your email and we&apos;ll send you a reset link.
      </p>
      <form className="space-y-4">
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            Email
          </label>
          <input
            id="email"
            type="email"
            placeholder="you@company.com"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-slate-900 dark:text-white"
          />
        </div>
        <button
          type="submit"
          className="w-full rounded-lg bg-blue-600 py-2.5 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
        >
          Send reset link
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
        <Link href="/login" className="text-blue-600 hover:text-blue-500 font-medium">
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
