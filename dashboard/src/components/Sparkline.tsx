"use client";

import { LineChart, Line, ResponsiveContainer, YAxis } from 'recharts';

export default function Sparkline({ data, color = "#8884d8", dataKey = "value" }: { data: any[], color?: string, dataKey?: string }) {
  if (!data || data.length === 0) return <div className="h-full w-full flex items-center justify-center text-xs text-zinc-600">No data</div>;

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data}>
        <YAxis domain={['auto', 'auto']} hide />
        <Line 
          type="monotone" 
          dataKey={dataKey} 
          stroke={color} 
          strokeWidth={2} 
          dot={false}
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
