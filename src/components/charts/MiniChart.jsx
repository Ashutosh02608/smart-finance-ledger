'use client'

import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts'
import { Skeleton } from '@/components/ui/index'

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[var(--bg-card)] border border-[var(--border-default)] rounded-xl p-3 shadow-lg">
        <p className="text-xs font-semibold text-[var(--text-primary)] mb-2">{label}</p>
        {payload.map(p => (
          <div key={p.name} className="flex items-center gap-2 text-xs">
            <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
            <span className="text-[var(--text-secondary)] capitalize">{p.name}:</span>
            <span className="text-[var(--text-primary)] font-medium">
              ₹{(p.value || 0).toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    )
  }
  return null
}

export function MiniChart({ data = [], loading }) {
  if (loading) {
    return <Skeleton className="h-48 w-full rounded-xl" />
  }

  if (!data.length) {
    return (
      <div className="h-48 flex items-center justify-center text-sm text-[var(--text-muted)]">
        No data available yet
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} barSize={20} barGap={4}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis
          dataKey="month"
          tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`}
          tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
          axisLine={false}
          tickLine={false}
          width={48}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend
          wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }}
          formatter={(value) => <span style={{ color: 'var(--text-secondary)', textTransform: 'capitalize' }}>{value}</span>}
        />
        <Bar dataKey="income" fill="#22c55e" radius={[4, 4, 0, 0]} name="income" />
        <Bar dataKey="expense" fill="#ef4444" radius={[4, 4, 0, 0]} name="expense" />
        <Bar dataKey="savings" fill="#6366f1" radius={[4, 4, 0, 0]} name="savings" />
      </BarChart>
    </ResponsiveContainer>
  )
}
