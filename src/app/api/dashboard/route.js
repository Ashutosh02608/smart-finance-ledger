export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import prisma from '@/lib/prisma'
import { startOfMonth, endOfMonth } from 'date-fns'

// ─── GET /api/dashboard ────────────────────────────────────────────────────────
// Returns all data needed for dashboard in a single request
export async function GET(request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const now = new Date()
    const monthStart = startOfMonth(now)
    const monthEnd = endOfMonth(now)

    const [
      dbUser,
      monthIncome,
      monthExpense,
      allTimeIncome,
      allTimeExpense,
      recentTransactions,
      budgets,
      unreadNotifications,
    ] = await Promise.all([
      prisma.user.findUnique({ where: { id: user.id } }),
      prisma.transaction.aggregate({
        where: { userId: user.id, type: 'INCOME', date: { gte: monthStart, lte: monthEnd } },
        _sum: { amount: true },
      }),
      prisma.transaction.aggregate({
        where: { userId: user.id, type: 'EXPENSE', date: { gte: monthStart, lte: monthEnd } },
        _sum: { amount: true },
      }),
      prisma.transaction.aggregate({
        where: { userId: user.id, type: 'INCOME' },
        _sum: { amount: true },
      }),
      prisma.transaction.aggregate({
        where: { userId: user.id, type: 'EXPENSE' },
        _sum: { amount: true },
      }),
      prisma.transaction.findMany({
        where: { userId: user.id },
        orderBy: { date: 'desc' },
        take: 5,
      }),
      prisma.budget.findMany({
        where: { userId: user.id, month: { gte: monthStart, lte: monthEnd } },
      }),
      prisma.notification.count({
        where: { userId: user.id, read: false },
      }),
    ])

    const income = monthIncome._sum.amount || 0
    const expense = monthExpense._sum.amount || 0
    const totalIncome = allTimeIncome._sum.amount || 0
    const totalExpense = allTimeExpense._sum.amount || 0

    // Enrich budgets
    const enrichedBudgets = await Promise.all(
      budgets.map(async (b) => {
        const spent = await prisma.transaction.aggregate({
          where: {
            userId: user.id, type: 'EXPENSE', category: b.category,
            date: { gte: monthStart, lte: monthEnd },
          },
          _sum: { amount: true },
        })
        const spentAmount = spent._sum.amount || 0
        return {
          ...b,
          spent: spentAmount,
          remaining: b.limit - spentAmount,
          percentage: Math.min(100, Math.round((spentAmount / b.limit) * 100)),
          isExceeded: spentAmount > b.limit,
        }
      })
    )

    return NextResponse.json({
      user: dbUser,
      stats: {
        monthIncome: income,
        monthExpense: expense,
        monthSavings: income - expense,
        totalBalance: totalIncome - totalExpense,
      },
      recentTransactions,
      budgets: enrichedBudgets,
      unreadNotifications,
    })
  } catch (error) {
    console.error('[GET /api/dashboard]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
