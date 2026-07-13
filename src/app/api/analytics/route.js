export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/firebase/server-auth'
import { db } from '@/lib/firebase/admin'
import { startOfMonth, endOfMonth, subMonths, format, isWithinInterval } from 'date-fns'
import { parseFirestoreDate } from '@/lib/utils'

// ─── GET /api/analytics ────────────────────────────────────────────────────────
// Returns chart data for the last N months
export async function GET(request) {
  try {
    const user = await getSessionUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const months = parseInt(searchParams.get('months') || '6')

    const now = new Date()

    // Query all transactions for user
    const txSnapshot = await db.collection('transactions')
      .where('userId', '==', user.id)
      .get()

    const allTransactions = txSnapshot.docs.map(doc => {
      const data = doc.data()
      return {
        id: doc.id,
        ...data,
        date: parseFirestoreDate(data.date),
      }
    }).filter(tx => tx.date !== null)

    const results = []

    // Calculate monthly aggregations
    for (let i = months - 1; i >= 0; i--) {
      const monthDate = subMonths(now, i)
      const mStart = startOfMonth(monthDate)
      const mEnd = endOfMonth(monthDate)

      let income = 0
      let expense = 0
      const categorySpentMap = {}

      allTransactions.forEach(tx => {
        if (isWithinInterval(tx.date, { start: mStart, end: mEnd })) {
          if (tx.type === 'INCOME') {
            income += tx.amount || 0
          } else if (tx.type === 'EXPENSE') {
            expense += tx.amount || 0
            categorySpentMap[tx.category] = (categorySpentMap[tx.category] || 0) + (tx.amount || 0)
          }
        }
      })

      // Convert category spent map to sorted array
      const byCategory = Object.entries(categorySpentMap)
        .map(([category, amount]) => ({ category, amount }))
        .sort((a, b) => b.amount - a.amount)

      results.push({
        month: format(monthDate, 'MMM yyyy'),
        income,
        expense,
        savings: income - expense,
        byCategory,
      })
    }

    // Daily spending for the current month
    const currMonthStart = startOfMonth(now)
    const currMonthEnd = endOfMonth(now)

    const dailySpentMap = {}
    allTransactions.forEach(tx => {
      if (tx.type === 'EXPENSE' && isWithinInterval(tx.date, { start: currMonthStart, end: currMonthEnd })) {
        const dateKey = format(tx.date, 'yyyy-MM-dd') // YYYY-MM-DD for sorting
        dailySpentMap[dateKey] = (dailySpentMap[dateKey] || 0) + (tx.amount || 0)
      }
    })

    // Map, sort chronologically, and format date for the chart
    const dailySpending = Object.entries(dailySpentMap)
      .map(([dateStr, amount]) => ({
        sortDate: new Date(dateStr),
        date: format(new Date(dateStr), 'd MMM'),
        amount,
      }))
      .sort((a, b) => a.sortDate - b.sortDate)
      .map(({ date, amount }) => ({ date, amount }))

    return NextResponse.json({
      monthly: results,
      daily: dailySpending,
    })
  } catch (error) {
    console.error('[GET /api/analytics]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
