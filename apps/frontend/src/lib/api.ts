import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001',
  timeout: 10_000,
});

// Trends
export const fetchTrends = (params?: { stage?: string; category?: string; page?: number }) =>
  api.get('/api/trends', { params }).then((r) => r.data);

export const fetchTrend = (slug: string) =>
  api.get(`/api/trends/${slug}`).then((r) => r.data);

export const fetchTrendHistory = (slug: string, days = 90) =>
  api.get(`/api/trends/${slug}/history`, { params: { days } }).then((r) => r.data);

export const fetchRedditSamples = (slug: string) =>
  api.get(`/api/trends/${slug}/reddit`).then((r) => r.data);

// Scores
export const fetchLeaderboard = () =>
  api.get('/api/scores/leaderboard').then((r) => r.data);

export const fetchTippingTrends = () =>
  api.get('/api/scores/tipping').then((r) => r.data);

export const fetchRisingTrends = () =>
  api.get('/api/scores/rising').then((r) => r.data);

// Discovery
export const searchTrends = (q: string) =>
  api.get('/api/discover', { params: { q } }).then((r) => r.data);

// Backtest
export const fetchBacktestAccuracy = () =>
  api.get('/api/backtest/accuracy').then((r) => r.data);

export const fetchBacktestResults = () =>
  api.get('/api/backtest/results').then((r) => r.data);

// Alerts
export const createAlert = (data: { email: string; slug: string; triggerStage?: string; triggerScore?: number }) =>
  api.post('/api/alerts', data).then((r) => r.data);
