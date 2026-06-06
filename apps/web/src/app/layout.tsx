import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'AI BOS - AI Business Operating System',
  description: 'Manage your business with AI-powered automation',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
