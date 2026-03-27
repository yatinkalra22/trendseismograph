import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        background: '#0a0a0a',
        surface: '#111111',
        'surface-hover': '#1a1a1a',
        border: '#222222',
        tipping: '#10b981',
        early: '#f59e0b',
        discovery: '#6366f1',
        mainstream: '#3b82f6',
        saturation: '#ef4444',
        'text-primary': '#f5f5f5',
        'text-secondary': '#888888',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
};

export default config;
