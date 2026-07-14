export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/firebase/server-auth'
import { db } from '@/lib/db'
import { transactions, budgets, notifications, users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { startOfMonth, endOfMonth } from 'date-fns'
import { parseFirestoreDate } from '@/lib/utils'

export async function GET(request) {
  try {
    const user = await getSessionUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const now = new Date()
    const monthStart = startOfMonth(now)
    const monthEnd = endOfMonth(now)

    const [userRows, txRows, budgetRows, notifRows] = await Promise.all([
      db.select().from(users).where(eq(users.id, user.id)),
      db.select().from(transactions).where(eq(transactions.userId, user.id)),
      db.select().from(budgets).where(eq(budgets.userId, user.id)),
      db.select().from(notifications).where(eq(notifications.userId, user.id)),
    ])

    if (!userRows.length) return NextResponse.json({ error: 'User profile not found' }, { status: 404 })

    const userData = userRows[0]
    const unreadNotifications = notifRows.filter(n => !n.read).length

    let monthIncome = 0, monthExpense = 0, totalIncome = 0, totalExpense = 0

    txRows.forEach(tx => {
      const amount = parseFloat(tx.amount) || 0
      const txDate = new Date(tx.date)
      const isThisMonth = txDate >= monthStart && txDate <= monthEnd
      if (tx.type === 'INCOME') {
        totalIncome += amount
        if (isThisMonth) monthIncome += amount
      } else if (tx.type === 'EXPENSE') {
        totalExpense += amount
        if (isThisMonth) monthExpense += amount
      }
    })

    const recentTransactions = [...txRows]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 5)
      .map(tx => ({ ...tx, amount: parseFloat(tx.amount), date: new Date(tx.date).toISOString() }))

    const spentMap = {}
    txRows.forEach(tx => {
      const txDate = new Date(tx.date)
      if (tx.type === 'EXPENSE' && txDate >= monthStart && txDate <= monthEnd) {
        spentMap[tx.category] = (spentMap[tx.category] || 0) + parseFloat(tx.amount)
      }
    })

    const enrichedBudgets = budgetRows
      .filter(b => { const m = new Date(b.month); return m >= monthStart && m <= monthEnd })
      .map(b => {
        const spent = spentMap[b.category] || 0
        const limit = parseFloat(b.limit)
        return {
          id: b.id, category: b.category, limit,
          month: new Date(b.month).toISOString(),
          spent, remaining: limit - spent,
          percentage: Math.min(100, Math.round((spent / limit) * 100)),
          isExceeded: spent > limit,
        }
      })

    return NextResponse.json({
      user: userData,
      stats: { monthIncome, monthExpense, monthSavings: monthIncome - monthExpense, totalBalance: totalIncome - totalExpense },
      recentTransactions,
      budgets: enrichedBudgets,
      unreadNotifications,
    })
  } catch (error) {
    console.error('[GET /api/dashboard]', error)
    return NextResponse.json({ error: 'Internal server error', detail: error.message }, { status: 500 })
  }
}
