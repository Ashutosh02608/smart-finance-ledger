export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/firebase/server-auth'
import { db } from '@/lib/firebase/admin'
import { startOfMonth, endOfMonth } from 'date-fns'
import { parseFirestoreDate } from '@/lib/utils'

// ─── GET /api/dashboard ────────────────────────────────────────────────────────
// Returns all data needed for dashboard in a single aggregated request
export async function GET(request) {
  try {
    const user = await getSessionUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const now = new Date()
    const monthStart = startOfMonth(now)
    const monthEnd = endOfMonth(now)

    // Fetch collections in parallel
    const [userDoc, txsSnapshot, budgetsSnapshot, notifsSnapshot] = await Promise.all([
      db.collection('users').doc(user.id).get(),
      db.collection('transactions').where('userId', '==', user.id).get(),
      db.collection('budgets').where('userId', '==', user.id).get(),
      db.collection('notifications')
        .where('userId', '==', user.id)
        .where('read', '==', false)
        .get(),
    ])

    if (!userDoc.exists) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 })
    }

    const userData = { id: userDoc.id, ...userDoc.data() }
    const unreadNotifications = notifsSnapshot.size

    // Parse all transactions safely
    const allTransactions = txsSnapshot.docs.map(doc => {
      const data = doc.data()
      return {
        id: doc.id,
        ...data,
        date: parseFirestoreDate(data.date),
      }
    })

    // Compute monthly and all-time stats in-memory
    let monthIncome = 0
    let monthExpense = 0
    let totalIncome = 0
    let totalExpense = 0

    allTransactions.forEach(tx => {
      const amount = tx.amount || 0
      const isThisMonth = tx.date >= monthStart && tx.date <= monthEnd

      if (tx.type === 'INCOME') {
        totalIncome += amount
        if (isThisMonth) monthIncome += amount
      } else if (tx.type === 'EXPENSE') {
        totalExpense += amount
        if (isThisMonth) monthExpense += amount
      }
    })

    // Sort in-memory for recent transactions
    const recentTransactions = [...allTransactions]
      .sort((a, b) => b.date - a.date)
      .slice(0, 5)
      .map(tx => ({
        ...tx,
        date: tx.date ? tx.date.toISOString() : null,
      }))

    // Sum expenses by category this month
    const spentMap = {}
    allTransactions.forEach(tx => {
      if (tx.type === 'EXPENSE' && tx.date >= monthStart && tx.date <= monthEnd) {
        spentMap[tx.category] = (spentMap[tx.category] || 0) + tx.amount
      }
    })

    // Enrich budgets safely
    const enrichedBudgets = budgetsSnapshot.docs
      .filter(doc => {
        const mVal = parseFirestoreDate(doc.data().month)
        return mVal && mVal >= monthStart && mVal <= monthEnd
      })
      .map(doc => {
        const data = doc.data()
        const spentAmount = spentMap[data.category] || 0
        return {
          id: doc.id,
          category: data.category,
          limit: data.limit,
          month: parseFirestoreDate(data.month)?.toISOString() || null,
          spent: spentAmount,
          remaining: data.limit - spentAmount,
          percentage: Math.min(100, Math.round((spentAmount / data.limit) * 100)),
          isExceeded: spentAmount > data.limit,
        }
      })

    return NextResponse.json({
      user: userData,
      stats: {
        monthIncome,
        monthExpense,
        monthSavings: monthIncome - monthExpense,
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
