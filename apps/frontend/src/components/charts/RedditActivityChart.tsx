'use client';

import { memo, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';

interface DataPoint {
  scoredAt: string | Date;
  redditPostCount: number;
}

interface Props {
  data: DataPoint[];
}

export const RedditActivityChart = memo(function RedditActivityChart({ data }: Props) {
  const formatted = useMemo(
    () =>
      data.map((d) => ({
        date: format(new Date(d.scoredAt), 'MMM d'),
        posts: d.redditPostCount ?? 0,
      })),
    [data],
  );

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={formatted}>
        <CartesianGrid strokeDasharray="3 3" stroke="#222" />
        <XAxis dataKey="date" stroke="#555" tick={{ fontSize: 10 }} />
        <YAxis stroke="#555" tick={{ fontSize: 10 }} />
        <Tooltip
          contentStyle={{ backgroundColor: '#111', border: '1px solid #222', borderRadius: 8 }}
          labelStyle={{ color: '#888' }}
        />
        <Bar dataKey="posts" fill="#f59e0b" radius={[2, 2, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
});
