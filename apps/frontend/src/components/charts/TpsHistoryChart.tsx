'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { format } from 'date-fns';

interface DataPoint {
  scoredAt: string;
  tippingPointScore: number;
}

interface Props {
  data: DataPoint[];
}

export function TpsHistoryChart({ data }: Props) {
  const formatted = data.map((d) => ({
    date: format(new Date(d.scoredAt), 'MMM d'),
    score: Number(d.tippingPointScore),
  }));

  return (
    <ResponsiveContainer width="100%" height={240}>
      <LineChart data={formatted}>
        <CartesianGrid strokeDasharray="3 3" stroke="#222" />
        <XAxis dataKey="date" stroke="#555" tick={{ fontSize: 11 }} />
        <YAxis domain={[0, 10]} stroke="#555" tick={{ fontSize: 11 }} />
        <Tooltip
          contentStyle={{ backgroundColor: '#111', border: '1px solid #222', borderRadius: 8 }}
          labelStyle={{ color: '#888' }}
          itemStyle={{ color: '#10b981' }}
        />
        <ReferenceLine y={7} stroke="#10b981" strokeDasharray="4 4" label={{ value: 'Tipping Zone', fill: '#10b981', fontSize: 10 }} />
        <Line type="monotone" dataKey="score" stroke="#10b981" strokeWidth={2} dot={{ fill: '#10b981', r: 2 }} activeDot={{ r: 4 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}
