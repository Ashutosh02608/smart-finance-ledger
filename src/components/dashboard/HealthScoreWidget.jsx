'use client'

import { motion } from 'framer-motion'
import { getScoreGrade } from '@/lib/health-score'
import { Skeleton } from '@/components/ui/index'
import { CheckCircle, AlertTriangle, XCircle } from 'lucide-react'

export function HealthScoreWidget({ data, loading }) {
  if (loading) {
    return (
      <div className="card p-5 space-y-3">
        <Skeleton className="h-4 w-32" />
        <div className="flex justify-center"><Skeleton className="w-32 h-32 rounded-full" /></div>
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-3/4" />
      </div>
    )
  }

  const score = data?.score ?? 0
  const { grade, label, color } = getScoreGrade(score)
  const circumference = 2 * Math.PI * 45
  const offset = circumference - (score / 100) * circumference

  return (
    <div className="card p-5">
      <h2 className="text-base font-semibold text-[var(--text-primary)] mb-4">Financial Health Score</h2>

      {/* Circular Progress */}
      <div className="flex flex-col items-center mb-5">
        <div className="relative w-32 h-32">
          <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
            {/* Track */}
            <circle cx="50" cy="50" r="45" fill="none" stroke="var(--border-subtle)" strokeWidth="8" />
            {/* Progress */}
            <motion.circle
              cx="50" cy="50" r="45"
              fill="none"
              stroke={color}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset: offset }}
              transition={{ duration: 1.2, ease: 'easeOut', delay: 0.3 }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <motion.span
              className="text-3xl font-bold"
              style={{ color }}
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.5, type: 'spring' }}
            >
              {score}
            </motion.span>
            <span className="text-xs text-[var(--text-muted)]">/ 100</span>
          </div>
        </div>
        <div className="mt-2 text-center">
          <span className="text-lg font-bold" style={{ color }}>{grade}</span>
          <span className="text-sm text-[var(--text-secondary)] ml-2">{label}</span>
        </div>
      </div>

      {/* Reasons */}
      {data?.reasons?.length > 0 && (
        <div className="space-y-1.5">
          {data.reasons.slice(0, 4).map((reason, i) => {
            const isGood = reason.startsWith('✓')
            const isWarn = reason.startsWith('⚠')
            return (
              <div key={i} className="flex items-start gap-2 text-xs">
                {isGood ? <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" /> :
                 isWarn ? <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" /> :
                 <XCircle className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />}
                <span className="text-[var(--text-secondary)]">
                  {reason.replace(/^[✓⚠✗]\s*/, '')}
                </span>
              </div>
            )
          })}
        </div>
      )}

      {/* Top recommendation */}
      {data?.recommendations?.[0] && (
        <div className="mt-3 p-2.5 rounded-lg bg-violet-500/10 border border-violet-500/20">
          <p className="text-xs text-violet-300">{data.recommendations[0]}</p>
        </div>
      )}
    </div>
  )
}
