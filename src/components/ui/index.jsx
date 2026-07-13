'use client'

import { cn } from '@/lib/utils'

export function Badge({ children, variant = 'default', className }) {
  const variants = {
    default: 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)]',
    income: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20',
    expense: 'bg-red-500/15 text-red-400 border border-red-500/20',
    warning: 'bg-amber-500/15 text-amber-400 border border-amber-500/20',
    info: 'bg-blue-500/15 text-blue-400 border border-blue-500/20',
    brand: 'bg-violet-500/15 text-violet-400 border border-violet-500/20',
    success: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20',
    danger: 'bg-red-500/15 text-red-400 border border-red-500/20',
  }
  return (
    <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium', variants[variant], className)}>
      {children}
    </span>
  )
}

export function Skeleton({ className, ...props }) {
  return (
    <div className={cn('skeleton rounded-md', className)} {...props} />
  )
}

export function Divider({ className }) {
  return <div className={cn('h-px bg-[var(--border-subtle)]', className)} />
}

export function EmptyState({ icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-[var(--bg-tertiary)] flex items-center justify-center mb-4 text-[var(--text-muted)]">
        {icon}
      </div>
      <h3 className="text-base font-semibold text-[var(--text-primary)] mb-2">{title}</h3>
      {description && <p className="text-sm text-[var(--text-secondary)] max-w-xs mb-6">{description}</p>}
      {action}
    </div>
  )
}

export function Card({ children, className, onClick }) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'card',
        onClick && 'card-hover cursor-pointer',
        className
      )}
    >
      {children}
    </div>
  )
}

export function StatCard({ title, value, change, icon, gradient, isLoading }) {
  if (isLoading) {
    return (
      <div className="card p-5">
        <Skeleton className="h-4 w-24 mb-3" />
        <Skeleton className="h-8 w-32 mb-2" />
        <Skeleton className="h-3 w-20" />
      </div>
    )
  }

  const isPositive = change >= 0

  return (
    <div className="card card-hover p-5">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-[var(--text-secondary)] font-medium">{title}</p>
        <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center text-white', gradient || 'gradient-brand')}>
          {icon}
        </div>
      </div>
      <p className="text-2xl font-bold text-[var(--text-primary)] mb-1">{value}</p>
      {change !== undefined && (
        <p className={cn('text-xs font-medium', isPositive ? 'text-emerald-400' : 'text-red-400')}>
          {isPositive ? '↑' : '↓'} {Math.abs(change).toFixed(1)}% vs last month
        </p>
      )}
    </div>
  )
}
