export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/firebase/server-auth'
import { db } from '@/lib/firebase/admin'
import { budgetSchema } from '@/lib/validations'
import { startOfMonth, endOfMonth } from 'date-fns'

// ─── GET /api/budgets ─────────────────────────────────────────────────────────
export async function GET(request) {
  try {
    const user = await getSessionUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const month = searchParams.get('month') // e.g., "2024-01"

    let monthStart, monthEnd
    if (month) {
      const [year, m] = month.split('-').map(Number)
      monthStart = startOfMonth(new Date(year, m - 1, 1))
      monthEnd = endOfMonth(new Date(year, m - 1, 1))
    } else {
      monthStart = startOfMonth(new Date())
      monthEnd = endOfMonth(new Date())
    }

    // Query budgets (filtering by month in-memory later)
    const budgetsSnapshot = await db.collection('budgets')
      .where('userId', '==', user.id)
      .get()

    // Query all transactions for user (requires no compound indexes)
    const txSnapshot = await db.collection('transactions')
      .where('userId', '==', user.id)
      .get()

    // Sum expenses by category in memory
    const spentMap = {}
    txSnapshot.docs.forEach(doc => {
      const data = doc.data()
      const txDate = data.date ? data.date.toDate() : null
      if (data.type === 'EXPENSE' && txDate && txDate >= monthStart && txDate <= monthEnd) {
        spentMap[data.category] = (spentMap[data.category] || 0) + (data.amount || 0)
      }
    })

    // Enrich budgets with spent data
    const enriched = budgetsSnapshot.docs
      .filter(doc => {
        const mVal = doc.data().month ? doc.data().month.toDate() : null
        return mVal && mVal >= monthStart && mVal <= monthEnd
      })
      .map(doc => {
        const data = doc.data()
        const spentAmount = spentMap[data.category] || 0
        return {
          id: doc.id,
          category: data.category,
          limit: data.limit,
          month: data.month ? data.month.toDate().toISOString() : null,
          spent: spentAmount,
          remaining: data.limit - spentAmount,
          percentage: Math.min(100, Math.round((spentAmount / data.limit) * 100)),
          isExceeded: spentAmount > data.limit,
        }
      })

    return NextResponse.json({ budgets: enriched })
  } catch (error) {
    console.error('[GET /api/budgets]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ─── POST /api/budgets ─────────────────────────────────────────────────────────
export async function POST(request) {
  try {
    const user = await getSessionUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const parsed = budgetSchema.safeParse({
      ...body,
      limit: Number(body.limit),
    })

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', issues: parsed.error.issues },
        { status: 422 }
      )
    }

    const monthDate = startOfMonth(new Date(parsed.data.month))
    // Deterministic document ID to prevent duplicate categories per month
    const docId = `${user.id}_${parsed.data.category}_${monthDate.toISOString().slice(0, 7)}`

    const budgetRef = db.collection('budgets').doc(docId)

    await budgetRef.set({
      userId: user.id,
      category: parsed.data.category,
      limit: parsed.data.limit,
      month: monthDate,
      updatedAt: new Date(),
    }, { merge: true })

    const doc = await budgetRef.get()
    const budget = {
      id: doc.id,
      ...doc.data(),
      month: doc.data().month.toDate().toISOString(),
    }

    return NextResponse.json({ budget }, { status: 201 })
  } catch (error) {
    console.error('[POST /api/budgets]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
