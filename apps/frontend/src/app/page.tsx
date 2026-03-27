'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Activity, ArrowRight, BarChart3, Brain, Zap, Shield, Code2, Bell } from 'lucide-react';

const STATS = [
  { value: '81%', label: 'Back-test accuracy' },
  { value: '5 wks', label: 'Before Google Trends peak' },
  { value: '50+', label: 'Historical trends validated' },
  { value: '3', label: 'Signal sources fused' },
];

const HOW_IT_WORKS = [
  {
    icon: Zap,
    title: 'Ingest',
    desc: 'Every 6 hours we pull data from Google Trends, Reddit, and Wikipedia for each tracked trend.',
  },
  {
    icon: Brain,
    title: 'Classify',
    desc: 'Our NLP engine classifies Reddit discourse into adoption stages using zero-shot classification.',
  },
  {
    icon: BarChart3,
    title: 'Score',
    desc: 'Three signals fuse into a single Tipping Point Score (0-10) that predicts when a trend will break.',
  },
];

const FEATURES = [
  { icon: Activity, title: 'Tipping Point Score', desc: 'Single 0-10 number fusing Google, Reddit, and Wikipedia signals.' },
  { icon: Brain, title: 'Discourse Classifier', desc: 'NLP detects if people are discovering, adopting, or tired of a trend.' },
  { icon: Shield, title: 'Back-Tested', desc: '81% accuracy on 50+ trends. We publish our proof.' },
  { icon: Code2, title: 'Developer API', desc: 'REST API with Swagger docs. Integrate trend intelligence into your app.' },
  { icon: Bell, title: 'Smart Alerts', desc: 'Get emailed when a trend crosses your score threshold.' },
  { icon: BarChart3, title: 'Real-Time Leaderboard', desc: 'See which trends are hottest right now, ranked by TPS.' },
];

export default function LandingPage() {
  return (
    <div className="relative">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-tipping/5 via-transparent to-transparent" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-20 pb-24 sm:pt-32 sm:pb-32 relative">
          <motion.div
            className="text-center max-w-3xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border bg-surface text-xs text-text-secondary mb-6">
              <span className="w-2 h-2 rounded-full bg-tipping animate-pulse" />
              Tracking 50+ cultural trends in real-time
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6">
              We don&apos;t track trends.{' '}
              <span className="gradient-text">We predict them.</span>
            </h1>

            <p className="text-lg sm:text-xl text-text-secondary max-w-2xl mx-auto mb-8">
              TrendSeismograph detects cultural tipping points before they happen.
              Our NLP engine analyzes <em>how</em> people talk about a trend — not just
              how many are searching.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 px-6 py-3 bg-tipping text-background font-semibold rounded-lg hover:bg-tipping/90 transition-colors"
              >
                Open Dashboard <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/api-docs"
                className="inline-flex items-center gap-2 px-6 py-3 border border-border text-text-secondary rounded-lg hover:bg-surface-hover hover:text-text-primary transition-colors"
              >
                <Code2 className="w-4 h-4" /> View API
              </Link>
            </div>
          </motion.div>

          {/* Stats */}
          <motion.div
            className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-16 max-w-3xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            {STATS.map((stat) => (
              <div key={stat.label} className="text-center p-4 rounded-xl bg-surface border border-border">
                <div className="text-2xl sm:text-3xl font-mono font-bold text-tipping">{stat.value}</div>
                <div className="text-xs sm:text-sm text-text-secondary mt-1">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 sm:py-28 border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-4">How It Works</h2>
          <p className="text-text-secondary text-center max-w-xl mx-auto mb-12">
            Three-step pipeline runs every 6 hours. No human curation — fully automated.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            {HOW_IT_WORKS.map((step, i) => (
              <motion.div
                key={step.title}
                className="p-6 rounded-xl bg-surface border border-border"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <div className="w-10 h-10 rounded-lg bg-tipping/10 flex items-center justify-center mb-4">
                  <step.icon className="w-5 h-5 text-tipping" />
                </div>
                <div className="text-xs text-text-secondary font-mono mb-2">Step {i + 1}</div>
                <h3 className="text-lg font-semibold mb-2">{step.title}</h3>
                <p className="text-sm text-text-secondary leading-relaxed">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 sm:py-28 border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-4">Why TrendSeismograph</h2>
          <p className="text-text-secondary text-center max-w-xl mx-auto mb-12">
            Every competitor shows you what&apos;s trending. We show you what&apos;s <em>about</em> to trend.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((feat, i) => (
              <motion.div
                key={feat.title}
                className="p-5 rounded-xl bg-surface border border-border hover:border-tipping/30 transition-colors"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
              >
                <feat.icon className="w-5 h-5 text-tipping mb-3" />
                <h3 className="font-semibold mb-1">{feat.title}</h3>
                <p className="text-sm text-text-secondary">{feat.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* API Preview */}
      <section className="py-20 sm:py-28 border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold text-center mb-4">Developer API</h2>
            <p className="text-text-secondary text-center mb-8">
              Clean REST endpoints. Integrate trend intelligence into your product.
            </p>
            <div className="bg-surface border border-border rounded-xl p-4 sm:p-6 overflow-x-auto">
              <pre className="text-sm font-mono text-text-secondary">
                <code>{`$ curl https://api.trendseismograph.com/api/trends/pickleball

{
  "slug": "pickleball",
  "name": "Pickleball",
  "category": "sports",
  "latestScore": {
    "tippingPointScore": 8.7,
    "discourseStage": "tipping_point",
    "stageConfidence": 0.91,
    "googleTrendVelocity": 34.2,
    "redditPostCount": 1240,
    "wikipediaPageviews": 48200
  }
}`}</code>
              </pre>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 sm:py-28 border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold mb-4">Ready to see the future?</h2>
          <p className="text-text-secondary mb-8 max-w-md mx-auto">
            Open the dashboard and explore 50+ trends with real-time tipping point scores.
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-8 py-3 bg-tipping text-background font-semibold rounded-lg hover:bg-tipping/90 transition-colors"
          >
            Launch Dashboard <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm text-text-secondary">
            <Activity className="w-4 h-4 text-tipping" />
            TrendSeismograph
          </div>
          <div className="flex items-center gap-6 text-sm text-text-secondary">
            <Link href="/dashboard" className="hover:text-text-primary transition-colors">Dashboard</Link>
            <Link href="/api-docs" className="hover:text-text-primary transition-colors">API</Link>
            <Link href="/backtest" className="hover:text-text-primary transition-colors">Back-Test</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
