'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import axios from 'axios'
import {
  TrendingUp, TrendingDown, Wallet, PiggyBank, Plus, ArrowUpRight,
  Sparkles, Target, Zap, AlertCircle
} from 'lucide-react'
import { StatCard, Skeleton, EmptyState, Card } from '@/components/ui/index'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/index'
import { TransactionModal } from '@/components/dashboard/TransactionModal'
import { HealthScoreWidget } from '@/components/dashboard/HealthScoreWidget'
import { BudgetProgressWidget } from '@/components/dashboard/BudgetProgressWidget'
import { MiniChart } from '@/components/charts/MiniChart'
import { formatCurrency, formatDate, formatRelativeTime } from '@/lib/utils'
import Link from 'next/link'

const stagger = {
  container: { transition: { staggerChildren: 0.07 } },
  item: { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 } },
}

export default function DashboardPage() {
  const [dash, setDash] = useState(null)
  const [insights, setInsights] = useState(null)
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [txModalOpen, setTxModalOpen] = useState(false)

  const fetchData = async () => {
    try {
      const [dashRes, insightsRes, analyticsRes] = await Promise.all([
        axios.get('/api/dashboard'),
        axios.get('/api/insights'),
        axios.get('/api/analytics?months=6'),
      ])
      setDash(dashRes.data)
      setInsights(insightsRes.data)
      setAnalytics(analyticsRes.data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const stats = dash?.stats || {}
  const currency = dash?.user?.currency || 'INR'

  return (
    <>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">
              Good {getGreeting()}, {dash?.user?.name?.split(' ')[0] || 'there'} 👋
            </h1>
            <p className="text-sm text-[var(--text-secondary)] mt-1">
              Here's your financial overview for {new Date().toLocaleString('en-IN', { month: 'long', year: 'numeric' })}
            </p>
          </div>
          <Button
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => setTxModalOpen(true)}
            className="hidden sm:inline-flex"
          >
            Add Transaction
          </Button>
        </div>

        {/* Stat Cards */}
        <motion.div variants={stagger.container} animate="animate" className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              title: 'Total Balance',
              value: formatCurrency(stats.totalBalance || 0, currency),
              icon: <Wallet className="w-5 h-5" />,
              gradient: 'gradient-brand',
            },
            {
              title: 'This Month Income',
              value: formatCurrency(stats.monthIncome || 0, currency),
              icon: <TrendingUp className="w-5 h-5" />,
              gradient: 'gradient-success',
            },
            {
              title: 'This Month Expenses',
              value: formatCurrency(stats.monthExpense || 0, currency),
              icon: <TrendingDown className="w-5 h-5" />,
              gradient: 'gradient-danger',
            },
            {
              title: 'Savings',
              value: formatCurrency(stats.monthSavings || 0, currency),
              icon: <PiggyBank className="w-5 h-5" />,
              gradient: 'bg-gradient-to-br from-amber-500 to-orange-500',
            },
          ].map((card) => (
            <motion.div key={card.title} variants={stagger.item}>
              <StatCard {...card} isLoading={loading} />
            </motion.div>
          ))}
        </motion.div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 2/3 */}
          <div className="lg:col-span-2 space-y-6">
            {/* Overview Chart */}
            <div className="card p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-semibold text-[var(--text-primary)]">Income vs Expenses</h2>
                <Link href="/analytics">
                  <Button variant="ghost" size="sm" rightIcon={<ArrowUpRight className="w-3.5 h-3.5" />}>
                    Full Report
                  </Button>
                </Link>
              </div>
              <MiniChart data={analytics?.monthly || []} loading={loading} />
            </div>

            {/* Recent Transactions */}
            <div className="card p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-semibold text-[var(--text-primary)]">Recent Transactions</h2>
                <Link href="/transactions">
                  <Button variant="ghost" size="sm" rightIcon={<ArrowUpRight className="w-3.5 h-3.5" />}>
                    View All
                  </Button>
                </Link>
              </div>
              {loading ? (
                <div className="space-y-3">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <Skeleton className="w-9 h-9 rounded-xl" />
                      <div className="flex-1 space-y-1.5">
                        <Skeleton className="h-3.5 w-40" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                      <Skeleton className="h-4 w-20" />
                    </div>
                  ))}
                </div>
              ) : dash?.recentTransactions?.length === 0 ? (
                <EmptyState
                  icon={<ArrowUpRight className="w-7 h-7" />}
                  title="No transactions yet"
                  description="Add your first transaction to get started"
                  action={<Button size="sm" onClick={() => setTxModalOpen(true)} leftIcon={<Plus className="w-3.5 h-3.5" />}>Add Transaction</Button>}
                />
              ) : (
                <div className="space-y-1">
                  {dash?.recentTransactions?.map((tx) => (
                    <RecentTransactionRow key={tx.id} tx={tx} currency={currency} />
                  ))}
                </div>
              )}
            </div>

            {/* AI Insights */}
            {insights?.insights?.length > 0 && (
              <div className="card p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="w-4 h-4 text-violet-400" />
                  <h2 className="text-base font-semibold text-[var(--text-primary)]">Spending Insights</h2>
                </div>
                <div className="space-y-2">
                  {insights.insights.map((insight, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.08 }}
                      className="flex items-start gap-3 p-3 rounded-lg bg-[var(--bg-secondary)]"
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-violet-400 mt-1.5 shrink-0" />
                      <p className="text-sm text-[var(--text-secondary)]">{insight}</p>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right 1/3 */}
          <div className="space-y-6">
            {/* Health Score */}
            <HealthScoreWidget data={insights?.healthScore} loading={loading} />

            {/* Budget Progress */}
            <BudgetProgressWidget budgets={dash?.budgets || []} loading={loading} currency={currency} />

            {/* Quick Actions */}
            <div className="card p-5">
              <h2 className="text-base font-semibold text-[var(--text-primary)] mb-3">Quick Actions</h2>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: 'Add Income', icon: <TrendingUp className="w-4 h-4" />, onClick: () => setTxModalOpen(true), color: 'text-emerald-400' },
                  { label: 'Add Expense', icon: <TrendingDown className="w-4 h-4" />, onClick: () => setTxModalOpen(true), color: 'text-red-400' },
                  { label: 'Set Budget', icon: <Target className="w-4 h-4" />, href: '/budgets', color: 'text-violet-400' },
                  { label: 'Analytics', icon: <Zap className="w-4 h-4" />, href: '/analytics', color: 'text-amber-400' },
                ].map((action) => (
                  action.href ? (
                    <Link key={action.label} href={action.href}>
                      <button className="w-full flex flex-col items-center gap-2 p-3 rounded-xl bg-[var(--bg-secondary)] hover:bg-[var(--bg-tertiary)] border border-[var(--border-subtle)] transition-all hover:border-[var(--border-default)] text-center">
                        <span className={action.color}>{action.icon}</span>
                        <span className="text-xs font-medium text-[var(--text-secondary)]">{action.label}</span>
                      </button>
                    </Link>
                  ) : (
                    <button key={action.label} onClick={action.onClick} className="flex flex-col items-center gap-2 p-3 rounded-xl bg-[var(--bg-secondary)] hover:bg-[var(--bg-tertiary)] border border-[var(--border-subtle)] transition-all hover:border-[var(--border-default)] text-center">
                      <span className={action.color}>{action.icon}</span>
                      <span className="text-xs font-medium text-[var(--text-secondary)]">{action.label}</span>
                    </button>
                  )
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <TransactionModal
        isOpen={txModalOpen}
        onClose={() => setTxModalOpen(false)}
        onSuccess={fetchData}
      />
    </>
  )
}

function RecentTransactionRow({ tx, currency }) {
  const isIncome = tx.type === 'INCOME'
  return (
    <div className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-[var(--bg-secondary)] transition-colors group">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm shrink-0 ${isIncome ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'}`}>
        {isIncome ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-[var(--text-primary)] truncate">{tx.title}</p>
        <p className="text-xs text-[var(--text-muted)]">{tx.category} · {formatRelativeTime(tx.date)}</p>
      </div>
      <span className={`text-sm font-semibold shrink-0 ${isIncome ? 'text-emerald-400' : 'text-red-400'}`}>
        {isIncome ? '+' : '-'}{formatCurrency(tx.amount, currency)}
      </span>
    </div>
  )
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'morning'
  if (h < 17) return 'afternoon'
  return 'evening'
}
