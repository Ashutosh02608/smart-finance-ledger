export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/firebase/server-auth'
import { db } from '@/lib/firebase/admin'
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

    // Parallel fetch: all user transactions and this month's budgets
    const [txsSnapshot, budgetsSnapshot] = await Promise.all([
      db.collection('transactions').where('userId', '==', user.id).get(),
      db.collection('budgets')
        .where('userId', '==', user.id)
        .where('month', '>=', monthStart)
        .where('month', '<=', monthEnd)
        .get(),
    ])

    const allTransactions = txsSnapshot.docs.map(doc => {
      const data = doc.data()
      return {
        id: doc.id,
        ...data,
        date: data.date ? data.date.toDate() : null,
      }
    }).filter(tx => tx.date !== null)

    // Current month stats
    let monthIncome = 0
    let monthExpense = 0
    const currentCategoryMap = {}

    allTransactions.forEach(tx => {
      if (isWithinInterval(tx.date, { start: monthStart, end: monthEnd })) {
        if (tx.type === 'INCOME') {
          monthIncome += tx.amount || 0
        } else if (tx.type === 'EXPENSE') {
          monthExpense += tx.amount || 0
          currentCategoryMap[tx.category] = (currentCategoryMap[tx.category] || 0) + (tx.amount || 0)
        }
      }
    })

    // Enrich budgets with in-memory spent info
    const budgetsWithSpent = budgetsSnapshot.docs.map(doc => {
      const data = doc.data()
      const spent = currentCategoryMap[data.category] || 0
      return {
        id: doc.id,
        category: data.category,
        limit: data.limit,
        month: data.month ? data.month.toDate().toISOString() : null,
        spent,
      }
    })

    // All-time net savings
    let allTimeIncome = 0
    let allTimeExpense = 0
    allTransactions.forEach(tx => {
      if (tx.type === 'INCOME') allTimeIncome += tx.amount || 0
      if (tx.type === 'EXPENSE') allTimeExpense += tx.amount || 0
    })
    const totalNetSavings = allTimeIncome - allTimeExpense

    // Average monthly expense over the last 6 months
    const sixMonthsAgo = subMonths(monthStart, 6)
    let historicExpenseTotal = 0
    allTransactions.forEach(tx => {
      if (tx.type === 'EXPENSE' && isWithinInterval(tx.date, { start: sixMonthsAgo, end: monthStart })) {
        historicExpenseTotal += tx.amount || 0
      }
    })
    const avgMonthlyExpense = historicExpenseTotal / 6

    // Income consistency over last 3 months
    const last3MonthsHadIncome = [1, 2, 3].map(offset => {
      const mStart = startOfMonth(subMonths(now, offset))
      const mEnd = endOfMonth(subMonths(now, offset))
      return allTransactions.some(tx => 
        tx.type === 'INCOME' && isWithinInterval(tx.date, { start: mStart, end: mEnd })
      )
    })

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

    // Last month category breakdown for MoM insights
    const lastMonthStart = startOfMonth(subMonths(now, 1))
    const lastMonthEnd = endOfMonth(subMonths(now, 1))
    const lastCategoryMap = {}

    allTransactions.forEach(tx => {
      if (tx.type === 'EXPENSE' && isWithinInterval(tx.date, { start: lastMonthStart, end: lastMonthEnd })) {
        lastCategoryMap[tx.category] = (lastCategoryMap[tx.category] || 0) + (tx.amount || 0)
      }
    })

    const currentByCategory = Object.entries(currentCategoryMap).map(([category, total]) => ({ category, total }))
    const lastMonthByCategory = Object.entries(lastCategoryMap).map(([category, total]) => ({ category, total }))

    const insights = generateInsights({
      currentMonthByCategory,
      lastMonthByCategory,
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
