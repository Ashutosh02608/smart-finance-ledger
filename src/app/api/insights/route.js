export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import prisma from '@/lib/prisma'
import { calculateHealthScore } from '@/lib/health-score'
import { calculatePredictions, generateInsights } from '@/lib/predictions'
import { startOfMonth, endOfMonth, subMonths, format } from 'date-fns'

export async function GET(request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const now = new Date()
    const monthStart = startOfMonth(now)
    const monthEnd = endOfMonth(now)

    // Current month totals
    const [incomeAgg, expenseAgg, budgets] = await Promise.all([
      prisma.transaction.aggregate({
        where: { userId: user.id, type: 'INCOME', date: { gte: monthStart, lte: monthEnd } },
        _sum: { amount: true },
      }),
      prisma.transaction.aggregate({
        where: { userId: user.id, type: 'EXPENSE', date: { gte: monthStart, lte: monthEnd } },
        _sum: { amount: true },
      }),
      prisma.budget.findMany({
        where: { userId: user.id, month: { gte: monthStart, lte: monthEnd } },
      }),
    ])

    const monthIncome = incomeAgg._sum.amount || 0
    const monthExpense = expenseAgg._sum.amount || 0

    // Enrich budgets with spending
    const budgetsWithSpent = await Promise.all(
      budgets.map(async (b) => {
        const spent = await prisma.transaction.aggregate({
          where: {
            userId: user.id, type: 'EXPENSE', category: b.category,
            date: { gte: monthStart, lte: monthEnd },
          },
          _sum: { amount: true },
        })
        return { ...b, spent: spent._sum.amount || 0 }
      })
    )

    // All-time net savings
    const [allTimeIncome, allTimeExpense] = await Promise.all([
      prisma.transaction.aggregate({ where: { userId: user.id, type: 'INCOME' }, _sum: { amount: true } }),
      prisma.transaction.aggregate({ where: { userId: user.id, type: 'EXPENSE' }, _sum: { amount: true } }),
    ])
    const totalNetSavings = (allTimeIncome._sum.amount || 0) - (allTimeExpense._sum.amount || 0)

    // Average monthly expense over last 6 months
    const sixMonthsAgo = subMonths(monthStart, 6)
    const historicExpense = await prisma.transaction.aggregate({
      where: { userId: user.id, type: 'EXPENSE', date: { gte: sixMonthsAgo, lte: monthStart } },
      _sum: { amount: true },
    })
    const avgMonthlyExpense = (historicExpense._sum.amount || 0) / 6

    // Income consistency over last 3 months
    const last3MonthsHadIncome = await Promise.all(
      [1, 2, 3].map(async (offset) => {
        const mStart = startOfMonth(subMonths(now, offset))
        const mEnd = endOfMonth(subMonths(now, offset))
        const count = await prisma.transaction.count({
          where: { userId: user.id, type: 'INCOME', date: { gte: mStart, lte: mEnd } },
        })
        return count > 0
      })
    )

    // Health score
    const healthScore = calculateHealthScore({
      monthIncome,
      monthExpense,
      budgets: budgetsWithSpent,
      totalNetSavings,
      avgMonthlyExpense,
      last3MonthsHadIncome,
    })

    // Budget predictions
    const predictions = calculatePredictions({
      totalSpentThisMonth: monthExpense,
      totalIncomeThisMonth: monthIncome,
      budgets: budgetsWithSpent,
    })

    // Category breakdown for insights
    const currentByCategory = await prisma.transaction.groupBy({
      by: ['category'],
      where: { userId: user.id, type: 'EXPENSE', date: { gte: monthStart, lte: monthEnd } },
      _sum: { amount: true },
    })
    const lastMonthStart = startOfMonth(subMonths(now, 1))
    const lastMonthEnd = endOfMonth(subMonths(now, 1))
    const lastByCategory = await prisma.transaction.groupBy({
      by: ['category'],
      where: { userId: user.id, type: 'EXPENSE', date: { gte: lastMonthStart, lte: lastMonthEnd } },
      _sum: { amount: true },
    })

    const insights = generateInsights({
      currentMonthByCategory: currentByCategory.map(c => ({ category: c.category, total: c._sum.amount || 0 })),
      lastMonthByCategory: lastByCategory.map(c => ({ category: c.category, total: c._sum.amount || 0 })),
      dailyBurnRate: predictions.dailyBurnRate,
      totalIncome: monthIncome,
      totalExpense: monthExpense,
    })

    return NextResponse.json({ healthScore, predictions, insights })
  } catch (error) {
    console.error('[GET /api/insights]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
