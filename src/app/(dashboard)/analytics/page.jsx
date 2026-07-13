'use client'

import { useState, useEffect } from 'react'
import axios from 'axios'
import {
  ResponsiveContainer, BarChart, Bar, LineChart, Line, AreaChart, Area,
  PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend
} from 'recharts'
import { Skeleton } from '@/components/ui/index'
import { motion } from 'framer-motion'

const COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899', '#84cc16', '#f97316', '#8b5cf6']

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border-default)] rounded-xl p-3 shadow-lg">
      <p className="text-xs font-semibold text-[var(--text-primary)] mb-2">{label}</p>
      {payload.map(p => (
        <div key={p.name} className="flex items-center gap-2 text-xs">
          <div className="w-2 h-2 rounded-full" style={{ background: p.color || p.fill }} />
          <span className="text-[var(--text-secondary)] capitalize">{p.name}:</span>
          <span className="text-[var(--text-primary)] font-medium">₹{(p.value || 0).toLocaleString()}</span>
        </div>
      ))}
    </div>
  )
}

function ChartCard({ title, children, loading }) {
  return (
    <div className="card p-5">
      <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4">{title}</h3>
      {loading ? <Skeleton className="h-48 w-full rounded-xl" /> : children}
    </div>
  )
}

export default function AnalyticsPage() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [months, setMonths] = useState(6)

  useEffect(() => {
    setLoading(true)
    axios.get(`/api/analytics?months=${months}`)
      .then(res => setData(res.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [months])

  const monthly = data?.monthly || []
  const daily = data?.daily || []

  // Compute category breakdown for latest month
  const latestByCategory = monthly[monthly.length - 1]?.byCategory || []

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Analytics</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">Visualize your financial trends</p>
        </div>
        <select
          value={months}
          onChange={e => setMonths(Number(e.target.value))}
          className="h-9 rounded-lg border border-[var(--border-default)] bg-[var(--bg-secondary)] text-[var(--text-primary)] text-sm px-3 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
        >
          <option value={3}>Last 3 months</option>
          <option value={6}>Last 6 months</option>
          <option value={12}>Last 12 months</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Income vs Expense Bar Chart */}
        <ChartCard title="Monthly Income vs Expenses" loading={loading}>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={monthly} barSize={16} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} width={48} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: '12px' }} formatter={(v) => <span style={{ color: 'var(--text-secondary)' }}>{v}</span>} />
              <Bar dataKey="income" fill="#22c55e" radius={[4, 4, 0, 0]} name="income" />
              <Bar dataKey="expense" fill="#ef4444" radius={[4, 4, 0, 0]} name="expense" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Savings Trend Area Chart */}
        <ChartCard title="Savings Trend" loading={loading}>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={monthly}>
              <defs>
                <linearGradient id="savingsGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} width={48} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="savings" stroke="#6366f1" fill="url(#savingsGradient)" strokeWidth={2} name="savings" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Category Breakdown Pie */}
        <ChartCard title="Expense Category Breakdown (This Month)" loading={loading}>
          {latestByCategory.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-sm text-[var(--text-muted)]">No expense data</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={latestByCategory} dataKey="amount" nameKey="category" cx="50%" cy="50%" outerRadius={80} paddingAngle={2}>
                  {latestByCategory.map((entry, i) => (
                    <Cell key={entry.category} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => `₹${v.toLocaleString()}`} />
                <Legend wrapperStyle={{ fontSize: '11px' }} formatter={(v) => <span style={{ color: 'var(--text-secondary)' }}>{v}</span>} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        {/* Daily Spending Line Chart */}
        <ChartCard title="Daily Spending (This Month)" loading={loading}>
          {daily.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-sm text-[var(--text-muted)]">No daily data</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={daily}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} width={48} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="amount" stroke="#f59e0b" strokeWidth={2} dot={false} name="amount" />
              </LineChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        {/* Net Worth Trend */}
        <ChartCard title="Net Worth Trend" loading={loading}>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={monthly.map((m, i) => ({
              month: m.month,
              netWorth: monthly.slice(0, i + 1).reduce((sum, x) => sum + x.savings, 0),
            }))}>
              <defs>
                <linearGradient id="nwGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} width={48} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="netWorth" stroke="#22c55e" fill="url(#nwGradient)" strokeWidth={2} name="netWorth" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Monthly Comparison Bar */}
        <ChartCard title="Monthly Savings Rate (%)" loading={loading}>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={monthly.map(m => ({
              month: m.month,
              savingsRate: m.income > 0 ? Math.max(0, ((m.savings / m.income) * 100)).toFixed(1) : 0,
            }))} barSize={28}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={v => `${v}%`} tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} width={40} />
              <Tooltip formatter={(v) => `${v}%`} />
              <Bar dataKey="savingsRate" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Savings Rate" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  )
}
