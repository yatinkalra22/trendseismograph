'use client';

import { memo, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Activity, BarChart3, FlaskConical, Search, Code2, Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: BarChart3 },
  { href: '/explore', label: 'Explore', icon: Search },
  { href: '/backtest', label: 'Back-Test', icon: FlaskConical },
  { href: '/api-docs', label: 'API', icon: Code2 },
];

export const Navbar = memo(function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 h-16 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-full flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <Activity className="w-6 h-6 text-tipping" />
          <span className="text-lg font-bold hidden sm:inline">
            Trend<span className="text-tipping">Seismograph</span>
          </span>
          <span className="text-lg font-bold sm:hidden">
            T<span className="text-tipping">S</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-1">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors',
                pathname === href
                  ? 'bg-surface text-tipping'
                  : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover',
              )}
            >
              <Icon className="w-4 h-4" />
              {label}
            </Link>
          ))}
        </div>

        {/* Mobile toggle */}
        <button
          className="md:hidden p-2 text-text-secondary hover:text-text-primary"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-b border-border bg-background px-4 pb-4">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                'flex items-center gap-3 px-3 py-3 rounded-lg text-sm transition-colors',
                pathname === href
                  ? 'bg-surface text-tipping'
                  : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover',
              )}
            >
              <Icon className="w-4 h-4" />
              {label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
});
