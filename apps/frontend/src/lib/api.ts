import axios, { AxiosError } from 'axios';

type ApiErrorResponse = {
  statusCode?: number;
  message?: string;
  userMessage?: string;
  code?: string;
};

export class ApiClientError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number,
    public readonly code?: string,
  ) {
    super(message);
    this.name = 'ApiClientError';
  }
}

const defaultUserMessage = 'Something went wrong. Please try again.';

function getNetworkMessage(error: AxiosError): string {
  if (error.code === 'ECONNABORTED') {
    return 'The request timed out. Please try again.';
  }
  if (error.code === 'ERR_NETWORK') {
    return 'Unable to connect right now. Please check your internet and try again.';
  }
  return defaultUserMessage;
}

function toApiClientError(error: unknown): ApiClientError {
  if (axios.isAxiosError(error)) {
    const payload = (error.response?.data ?? {}) as ApiErrorResponse;
    const statusCode = payload.statusCode ?? error.response?.status;
    const message = payload.userMessage || payload.message || getNetworkMessage(error);
    return new ApiClientError(message, statusCode, payload.code);
  }

  if (error instanceof Error) {
    return new ApiClientError(error.message || defaultUserMessage);
  }

  return new ApiClientError(defaultUserMessage);
}

export function getApiErrorMessage(error: unknown): string {
  if (error instanceof ApiClientError) {
    return error.message;
  }
  return toApiClientError(error).message;
}

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001',
  timeout: 10_000,
});

api.interceptors.response.use(
  (response) => response,
  (error: unknown) => Promise.reject(toApiClientError(error)),
);

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
