'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import {
  createAlert,
  fetchLeaderboard,
  fetchTrend,
  fetchTrendHistory,
  fetchTrends,
  fetchTippingTrends,
  fetchRisingTrends,
  fetchBacktestAccuracy,
  fetchBacktestResults,
  searchTrends,
} from '@/lib/api';

export const useLeaderboard = () =>
  useQuery({ queryKey: ['leaderboard'], queryFn: fetchLeaderboard, staleTime: 1000 * 60 * 5 });

export const useTrends = (params?: { stage?: string; category?: string; page?: number }) =>
  useQuery({ queryKey: ['trends', params], queryFn: () => fetchTrends(params), staleTime: 1000 * 60 * 5 });

export const useTrend = (slug: string) =>
  useQuery({ queryKey: ['trend', slug], queryFn: () => fetchTrend(slug), staleTime: 1000 * 60 * 10, enabled: !!slug });

export const useTrendHistory = (slug: string, days = 90) =>
  useQuery({ queryKey: ['trend-history', slug, days], queryFn: () => fetchTrendHistory(slug, days), staleTime: 1000 * 60 * 10, enabled: !!slug });

export const useTippingTrends = () =>
  useQuery({ queryKey: ['tipping'], queryFn: fetchTippingTrends, staleTime: 1000 * 60 * 5 });

export const useRisingTrends = () =>
  useQuery({ queryKey: ['rising'], queryFn: fetchRisingTrends, staleTime: 1000 * 60 * 5 });

export const useBacktestAccuracy = () =>
  useQuery({ queryKey: ['backtest-accuracy'], queryFn: fetchBacktestAccuracy, staleTime: 1000 * 60 * 30 });

export const useBacktestResults = () =>
  useQuery({ queryKey: ['backtest-results'], queryFn: fetchBacktestResults, staleTime: 1000 * 60 * 30 });

export const useSearch = (q: string) =>
  useQuery({
    queryKey: ['search', q],
    queryFn: ({ signal }) => searchTrends(q, signal),
    enabled: q.trim().length > 1,
    staleTime: 1000 * 60,
    retry: false,
  });

export const useCreateAlert = () =>
  useMutation({
    mutationKey: ['create-alert'],
    mutationFn: (data: { email: string; slug: string; triggerStage?: string; triggerScore?: number }) => createAlert(data),
  });
