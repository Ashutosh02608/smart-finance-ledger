export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import prisma from '@/lib/prisma'
import { startOfMonth, endOfMonth, subMonths, format } from 'date-fns'

// ─── GET /api/analytics ────────────────────────────────────────────────────────
// Returns chart data for the last N months
export async function GET(request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const months = parseInt(searchParams.get('months') || '6')

    const now = new Date()
    const results = []

    for (let i = months - 1; i >= 0; i--) {
      const monthDate = subMonths(now, i)
      const mStart = startOfMonth(monthDate)
      const mEnd = endOfMonth(monthDate)

      const [incomeAgg, expenseAgg, byCategory] = await Promise.all([
        prisma.transaction.aggregate({
          where: { userId: user.id, type: 'INCOME', date: { gte: mStart, lte: mEnd } },
          _sum: { amount: true },
        }),
        prisma.transaction.aggregate({
          where: { userId: user.id, type: 'EXPENSE', date: { gte: mStart, lte: mEnd } },
          _sum: { amount: true },
        }),
        prisma.transaction.groupBy({
          by: ['category'],
          where: { userId: user.id, type: 'EXPENSE', date: { gte: mStart, lte: mEnd } },
          _sum: { amount: true },
          orderBy: { _sum: { amount: 'desc' } },
        }),
      ])

      const income = incomeAgg._sum.amount || 0
      const expense = expenseAgg._sum.amount || 0

      results.push({
        month: format(monthDate, 'MMM yyyy'),
        income,
        expense,
        savings: income - expense,
        byCategory: byCategory.map(c => ({
          category: c.category,
          amount: c._sum.amount || 0,
        })),
      })
    }

    // Daily spending for current month
    const currMonthStart = startOfMonth(now)
    const currMonthEnd = endOfMonth(now)
    const dailySpending = await prisma.transaction.groupBy({
      by: ['date'],
      where: { userId: user.id, type: 'EXPENSE', date: { gte: currMonthStart, lte: currMonthEnd } },
      _sum: { amount: true },
      orderBy: { date: 'asc' },
    })

    return NextResponse.json({
      monthly: results,
      daily: dailySpending.map(d => ({
        date: format(new Date(d.date), 'd MMM'),
        amount: d._sum.amount || 0,
      })),
    })
  } catch (error) {
    console.error('[GET /api/analytics]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
