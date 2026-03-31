'use client';

import { memo, useMemo, useCallback } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';

interface DataPoint {
  scoredAt: string | Date;
  googleTrendValue: number;
}

interface Props {
  data: DataPoint[];
}

export const GoogleTrendsChart = memo(function GoogleTrendsChart({ data }: Props) {
  const formatted = useMemo(
    () =>
      data.map((d) => ({
        date: format(new Date(d.scoredAt), 'MMM d'),
        value: d.googleTrendValue ?? 0,
      })),
    [data],
  );

  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={formatted}>
        <CartesianGrid strokeDasharray="3 3" stroke="#222" />
        <XAxis dataKey="date" stroke="#555" tick={{ fontSize: 10 }} />
        <YAxis domain={[0, 100]} stroke="#555" tick={{ fontSize: 10 }} />
        <Tooltip
          contentStyle={{ backgroundColor: '#111', border: '1px solid #222', borderRadius: 8 }}
          labelStyle={{ color: '#888' }}
        />
        <Area type="monotone" dataKey="value" stroke="#6366f1" fill="#6366f1" fillOpacity={0.1} strokeWidth={2} />
      </AreaChart>
    </ResponsiveContainer>
  );
});
