export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/firebase/server-auth'
import { db } from '@/lib/db'
import { transactions, budgets } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { startOfMonth, endOfMonth, subMonths, format, isWithinInterval } from 'date-fns'

export async function GET(request) {
  try {
    const user = await getSessionUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const months = parseInt(searchParams.get('months') || '6')
    const now = new Date()

    const txRows = await db.select().from(transactions).where(eq(transactions.userId, user.id))
    const allTransactions = txRows.map(tx => ({ ...tx, amount: parseFloat(tx.amount), date: new Date(tx.date) })).filter(tx => tx.date)

    const results = []
    for (let i = months - 1; i >= 0; i--) {
      const monthDate = subMonths(now, i)
      const mStart = startOfMonth(monthDate)
      const mEnd = endOfMonth(monthDate)
      let income = 0, expense = 0
      const categorySpentMap = {}
      allTransactions.forEach(tx => {
        if (isWithinInterval(tx.date, { start: mStart, end: mEnd })) {
          if (tx.type === 'INCOME') income += tx.amount
          else if (tx.type === 'EXPENSE') { expense += tx.amount; categorySpentMap[tx.category] = (categorySpentMap[tx.category] || 0) + tx.amount }
        }
      })
      results.push({ month: format(monthDate, 'MMM yyyy'), income, expense, savings: income - expense, byCategory: Object.entries(categorySpentMap).map(([category, amount]) => ({ category, amount })).sort((a, b) => b.amount - a.amount) })
    }

    const currMonthStart = startOfMonth(now)
    const currMonthEnd = endOfMonth(now)
    const dailySpentMap = {}
    allTransactions.forEach(tx => {
      if (tx.type === 'EXPENSE' && isWithinInterval(tx.date, { start: currMonthStart, end: currMonthEnd })) {
        const key = format(tx.date, 'yyyy-MM-dd')
        dailySpentMap[key] = (dailySpentMap[key] || 0) + tx.amount
      }
    })
    const dailySpending = Object.entries(dailySpentMap)
      .map(([d, amount]) => ({ sortDate: new Date(d), date: format(new Date(d), 'd MMM'), amount }))
      .sort((a, b) => a.sortDate - b.sortDate)
      .map(({ date, amount }) => ({ date, amount }))

    return NextResponse.json({ monthly: results, daily: dailySpending })
  } catch (error) {
    console.error('[GET /api/analytics]', error)
    return NextResponse.json({ error: 'Internal server error', detail: error.message }, { status: 500 })
  }
}
