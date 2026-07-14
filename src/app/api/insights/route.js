export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/firebase/server-auth'
import { db } from '@/lib/db'
import { transactions, budgets } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { calculateHealthScore } from '@/lib/health-score'
import { calculatePredictions, generateInsights } from '@/lib/predictions'
import { startOfMonth, endOfMonth, subMonths, isWithinInterval } from 'date-fns'

export async function GET(request) {
  try {
    const user = await getSessionUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const now = new Date()
    const monthStart = startOfMonth(now)
    const monthEnd = endOfMonth(now)

    const [txRows, budgetRows] = await Promise.all([
      db.select().from(transactions).where(eq(transactions.userId, user.id)),
      db.select().from(budgets).where(eq(budgets.userId, user.id)),
    ])

    const allTransactions = txRows.map(tx => ({ ...tx, amount: parseFloat(tx.amount), date: new Date(tx.date) })).filter(t => t.date)

    let monthIncome = 0, monthExpense = 0
    const currentCategoryMap = {}
    allTransactions.forEach(tx => {
      if (isWithinInterval(tx.date, { start: monthStart, end: monthEnd })) {
        if (tx.type === 'INCOME') monthIncome += tx.amount
        else if (tx.type === 'EXPENSE') { monthExpense += tx.amount; currentCategoryMap[tx.category] = (currentCategoryMap[tx.category] || 0) + tx.amount }
      }
    })

    const budgetsWithSpent = budgetRows
      .filter(b => { const m = new Date(b.month); return m >= monthStart && m <= monthEnd })
      .map(b => { const spent = currentCategoryMap[b.category] || 0; return { id: b.id, category: b.category, limit: parseFloat(b.limit), month: new Date(b.month).toISOString(), spent } })

    let allTimeIncome = 0, allTimeExpense = 0
    allTransactions.forEach(tx => { if (tx.type === 'INCOME') allTimeIncome += tx.amount; else allTimeExpense += tx.amount })
    const totalNetSavings = allTimeIncome - allTimeExpense

    const sixMonthsAgo = subMonths(monthStart, 6)
    let historicExpenseTotal = 0
    allTransactions.forEach(tx => { if (tx.type === 'EXPENSE' && isWithinInterval(tx.date, { start: sixMonthsAgo, end: monthStart })) historicExpenseTotal += tx.amount })
    const avgMonthlyExpense = historicExpenseTotal / 6

    const last3MonthsHadIncome = [1, 2, 3].map(offset => {
      const mS = startOfMonth(subMonths(now, offset)), mE = endOfMonth(subMonths(now, offset))
      return allTransactions.some(tx => tx.type === 'INCOME' && isWithinInterval(tx.date, { start: mS, end: mE }))
    })

    const healthScore = calculateHealthScore({ monthIncome, monthExpense, budgets: budgetsWithSpent, totalNetSavings, avgMonthlyExpense, last3MonthsHadIncome })
    const predictions = calculatePredictions({ totalSpentThisMonth: monthExpense, totalIncomeThisMonth: monthIncome, budgets: budgetsWithSpent })

    const lastMonthStart = startOfMonth(subMonths(now, 1)), lastMonthEnd = endOfMonth(subMonths(now, 1))
    const lastCategoryMap = {}
    allTransactions.forEach(tx => { if (tx.type === 'EXPENSE' && isWithinInterval(tx.date, { start: lastMonthStart, end: lastMonthEnd })) lastCategoryMap[tx.category] = (lastCategoryMap[tx.category] || 0) + tx.amount })

    const insights = generateInsights({
      currentMonthByCategory: Object.entries(currentCategoryMap).map(([category, total]) => ({ category, total })),
      lastMonthByCategory: Object.entries(lastCategoryMap).map(([category, total]) => ({ category, total })),
      dailyBurnRate: predictions.dailyBurnRate,
      totalIncome: monthIncome,
      totalExpense: monthExpense,
    })

    return NextResponse.json({ healthScore, predictions, insights })
  } catch (error) {
    console.error('[GET /api/insights]', error)
    return NextResponse.json({ error: 'Internal server error', detail: error.message }, { status: 500 })
  }
}
