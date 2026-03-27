'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Code2, Copy, Check, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';

const SECTIONS = [
  {
    title: 'Trends',
    endpoints: [
      { method: 'GET', path: '/api/trends', desc: 'List all trends (paginated)', params: '?stage=&category=&page=&limit=' },
      { method: 'GET', path: '/api/trends/:slug', desc: 'Single trend with latest score', params: '' },
      { method: 'GET', path: '/api/trends/:slug/history', desc: 'Score time-series', params: '?days=90' },
      { method: 'GET', path: '/api/trends/:slug/reddit', desc: 'Reddit discourse samples', params: '' },
      { method: 'POST', path: '/api/trends', desc: 'Add new trend', params: '', auth: true },
      { method: 'DELETE', path: '/api/trends/:slug', desc: 'Stop tracking', params: '', auth: true },
    ],
  },
  {
    title: 'Scores',
    endpoints: [
      { method: 'GET', path: '/api/scores/leaderboard', desc: 'Top 20 by TPS', params: '' },
      { method: 'GET', path: '/api/scores/tipping', desc: 'All tipping point trends', params: '' },
      { method: 'GET', path: '/api/scores/rising', desc: 'Fastest rising trends', params: '' },
      { method: 'POST', path: '/api/scores/trigger/:slug', desc: 'Force re-score', params: '', auth: true },
    ],
  },
  {
    title: 'Discovery',
    endpoints: [
      { method: 'GET', path: '/api/discover', desc: 'Full-text search', params: '?q=pickleball' },
      { method: 'GET', path: '/api/discover/categories', desc: 'All categories with counts', params: '' },
      { method: 'GET', path: '/api/discover/new', desc: 'Trends added in last 7 days', params: '' },
    ],
  },
  {
    title: 'Back-Test',
    endpoints: [
      { method: 'GET', path: '/api/backtest/results', desc: 'All back-test results', params: '' },
      { method: 'GET', path: '/api/backtest/results/:slug', desc: 'Back-test for specific trend', params: '' },
      { method: 'GET', path: '/api/backtest/accuracy', desc: 'Aggregate accuracy stats', params: '' },
    ],
  },
  {
    title: 'Alerts',
    endpoints: [
      { method: 'POST', path: '/api/alerts', desc: 'Create alert', params: '' },
      { method: 'GET', path: '/api/alerts', desc: 'List user alerts', params: '?email=' },
      { method: 'DELETE', path: '/api/alerts/:id', desc: 'Delete alert', params: '' },
    ],
  },
];

const SAMPLE_RESPONSE = `{
  "slug": "pickleball",
  "name": "Pickleball",
  "category": "sports",
  "latestScore": {
    "tippingPointScore": 8.7,
    "discourseStage": "tipping_point",
    "stageConfidence": 0.91,
    "googleTrendValue": 74,
    "googleTrendVelocity": 34.2,
    "redditPostCount": 1240,
    "redditSentiment": 0.78,
    "wikipediaPageviews": 48200,
    "scoredAt": "2026-03-24T00:00:00Z"
  }
}`;

const METHOD_COLORS: Record<string, string> = {
  GET: 'text-emerald-400 bg-emerald-400/10',
  POST: 'text-blue-400 bg-blue-400/10',
  DELETE: 'text-red-400 bg-red-400/10',
};

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button onClick={handleCopy} className="text-text-secondary hover:text-text-primary transition-colors p-1">
      {copied ? <Check className="w-4 h-4 text-tipping" /> : <Copy className="w-4 h-4" />}
    </button>
  );
}

export default function ApiDocsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
      {/* Header */}
      <motion.div className="mb-10" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-2 mb-2">
          <Code2 className="w-6 h-6 text-tipping" />
          <h1 className="text-2xl sm:text-3xl font-bold">API Reference</h1>
        </div>
        <p className="text-text-secondary text-sm mb-4">
          REST API for trend intelligence. All GET endpoints are public. Write endpoints require an API key.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <code className="text-xs font-mono px-3 py-1.5 bg-surface border border-border rounded-lg text-text-secondary">
            Base URL: http://localhost:3001
          </code>
          <a
            href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/docs`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-tipping hover:underline"
          >
            Swagger UI <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </motion.div>

      {/* Auth */}
      <motion.div
        className="bg-surface border border-border rounded-xl p-5 mb-8"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
      >
        <h2 className="text-sm font-semibold mb-2">Authentication</h2>
        <p className="text-xs text-text-secondary mb-3">
          Write operations require a Bearer token. Pass it in the Authorization header:
        </p>
        <div className="flex items-center gap-2 bg-background border border-border rounded-lg px-3 py-2">
          <code className="text-xs font-mono text-text-secondary flex-1 overflow-x-auto">
            Authorization: Bearer YOUR_API_KEY
          </code>
          <CopyButton text="Authorization: Bearer YOUR_API_KEY" />
        </div>
      </motion.div>

      {/* Endpoint Sections */}
      {SECTIONS.map((section, si) => (
        <motion.div
          key={section.title}
          className="mb-8"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 * (si + 2) }}
        >
          <h2 className="text-lg font-semibold mb-4">{section.title}</h2>
          <div className="space-y-2">
            {section.endpoints.map((ep) => (
              <div
                key={`${ep.method}-${ep.path}`}
                className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 p-3 bg-surface border border-border rounded-lg hover:border-border/60 transition-colors"
              >
                <span className={cn('inline-flex px-2 py-0.5 rounded text-xs font-mono font-bold shrink-0 w-fit', METHOD_COLORS[ep.method])}>
                  {ep.method}
                </span>
                <code className="text-sm font-mono text-text-primary break-all">
                  {ep.path}<span className="text-text-secondary">{ep.params}</span>
                </code>
                <span className="text-xs text-text-secondary sm:ml-auto shrink-0">{ep.desc}</span>
                {ep.auth && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-early/10 text-early font-medium shrink-0 w-fit">AUTH</span>
                )}
              </div>
            ))}
          </div>
        </motion.div>
      ))}

      {/* Sample Response */}
      <motion.div
        className="mb-8"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Sample Response</h2>
          <CopyButton text={`curl ${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/trends/pickleball`} />
        </div>
        <div className="bg-surface border border-border rounded-xl p-4 overflow-x-auto">
          <div className="text-xs font-mono text-text-secondary mb-3">
            GET /api/trends/pickleball
          </div>
          <pre className="text-sm font-mono text-text-primary whitespace-pre">{SAMPLE_RESPONSE}</pre>
        </div>
      </motion.div>
    </div>
  );
}
