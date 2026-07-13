'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { ArrowUpRight, AlertTriangle } from 'lucide-react'
import { Skeleton } from '@/components/ui/index'
import { Button } from '@/components/ui/Button'
import { formatCurrency } from '@/lib/utils'
import { cn } from '@/lib/utils'

export function BudgetProgressWidget({ budgets = [], loading, currency = 'INR' }) {
  if (loading) {
    return (
      <div className="card p-5 space-y-3">
        <Skeleton className="h-4 w-32" />
        {[...Array(3)].map((_, i) => (
          <div key={i} className="space-y-1.5">
            <div className="flex justify-between">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-3 w-16" />
            </div>
            <Skeleton className="h-2 w-full rounded-full" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-[var(--text-primary)]">Budget Overview</h2>
        <Link href="/budgets">
          <Button variant="ghost" size="sm" rightIcon={<ArrowUpRight className="w-3.5 h-3.5" />}>
            Manage
          </Button>
        </Link>
      </div>

      {budgets.length === 0 ? (
        <div className="py-6 text-center">
          <p className="text-sm text-[var(--text-muted)]">No budgets set for this month</p>
          <Link href="/budgets">
            <Button size="sm" variant="outline" className="mt-3">Create Budget</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {budgets.slice(0, 4).map((budget) => {
            const pct = budget.percentage || 0
            const isExceeded = budget.isExceeded

            return (
              <div key={budget.id}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5">
                    {isExceeded && <AlertTriangle className="w-3 h-3 text-amber-400" />}
                    <span className="text-sm font-medium text-[var(--text-primary)]">{budget.category}</span>
                  </div>
                  <div className="text-right">
                    <span className={cn('text-xs font-semibold', isExceeded ? 'text-red-400' : 'text-[var(--text-secondary)]')}>
                      {formatCurrency(budget.spent, currency)}
                    </span>
                    <span className="text-xs text-[var(--text-muted)]"> / {formatCurrency(budget.limit, currency)}</span>
                  </div>
                </div>
                <div className="h-2 bg-[var(--bg-tertiary)] rounded-full overflow-hidden">
                  <motion.div
                    className={cn(
                      'h-full rounded-full',
                      isExceeded ? 'bg-gradient-to-r from-red-600 to-red-400' :
                      pct > 80 ? 'bg-gradient-to-r from-amber-500 to-amber-400' :
                      'bg-gradient-to-r from-violet-600 to-violet-400'
                    )}
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, pct)}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
                  />
                </div>
                <p className="text-xs text-[var(--text-muted)] mt-1">
                  {isExceeded
                    ? `Over by ${formatCurrency(Math.abs(budget.remaining), currency)}`
                    : `${formatCurrency(budget.remaining, currency)} remaining`}
                </p>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
