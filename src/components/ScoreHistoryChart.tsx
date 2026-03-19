'use client'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

type DataPoint = {
  date: string
  performance: number | null
  accessibility: number | null
  best_practices: number | null
  seo: number | null
}

const LINES = [
  { key: 'performance', label: 'Performance', colour: '#3b82f6' },
  { key: 'accessibility', label: 'Accessibility', colour: '#8b5cf6' },
  { key: 'best_practices', label: 'Best Practices', colour: '#f59e0b' },
  { key: 'seo', label: 'SEO', colour: '#10b981' },
] as const

export function ScoreHistoryChart({ data }: { data: DataPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={320}>
      <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="date" tick={{ fontSize: 12 }} />
        <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} width={32} />
        <Tooltip
          contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }}
        />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        {LINES.map(({ key, label, colour }) => (
          <Line
            key={key}
            type="monotone"
            dataKey={key}
            name={label}
            stroke={colour}
            strokeWidth={2}
            dot={{ r: 3 }}
            connectNulls={false}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  )
}
