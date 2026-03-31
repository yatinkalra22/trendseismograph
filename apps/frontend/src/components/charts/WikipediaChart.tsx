'use client';

import { memo, useMemo, useCallback } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';
import { formatNumber } from '@/lib/utils';

interface DataPoint {
  scoredAt: string;
  wikipediaPageviews: number;
}

interface Props {
  data: DataPoint[];
}

export const WikipediaChart = memo(function WikipediaChart({ data }: Props) {
  const formatted = useMemo(
    () =>
      data.map((d) => ({
        date: format(new Date(d.scoredAt), 'MMM d'),
        views: d.wikipediaPageviews ?? 0,
      })),
    [data],
  );

  const tooltipFormatter = useCallback(
    (v: number) => [formatNumber(v), 'Pageviews'],
    [],
  );

  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={formatted}>
        <CartesianGrid strokeDasharray="3 3" stroke="#222" />
        <XAxis dataKey="date" stroke="#555" tick={{ fontSize: 10 }} />
        <YAxis stroke="#555" tick={{ fontSize: 10 }} tickFormatter={(v) => formatNumber(v)} />
        <Tooltip
          contentStyle={{ backgroundColor: '#111', border: '1px solid #222', borderRadius: 8 }}
          labelStyle={{ color: '#888' }}
          formatter={tooltipFormatter}
        />
        <Area type="monotone" dataKey="views" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.1} strokeWidth={2} />
      </AreaChart>
    </ResponsiveContainer>
  );
});
