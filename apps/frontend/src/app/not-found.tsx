import Link from 'next/link';
import { Activity } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 text-center">
      <Activity className="w-12 h-12 text-tipping mb-4" />
      <h1 className="text-3xl font-bold mb-2">404</h1>
      <p className="text-text-secondary mb-6">This page doesn&apos;t exist.</p>
      <Link
        href="/dashboard"
        className="px-5 py-2 bg-tipping text-background font-medium rounded-lg hover:bg-tipping/90 transition-colors text-sm"
      >
        Go to Dashboard
      </Link>
    </div>
  );
}
