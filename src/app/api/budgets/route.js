export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/firebase/server-auth'
import { db } from '@/lib/db'
import { budgets, transactions } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { budgetSchema } from '@/lib/validations'
import { startOfMonth, endOfMonth } from 'date-fns'
import { nanoid } from 'nanoid'

export async function GET(request) {
  try {
    const user = await getSessionUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const month = searchParams.get('month')

    let monthStart, monthEnd
    if (month) {
      const [year, m] = month.split('-').map(Number)
      monthStart = startOfMonth(new Date(year, m - 1, 1))
      monthEnd = endOfMonth(new Date(year, m - 1, 1))
    } else {
      monthStart = startOfMonth(new Date())
      monthEnd = endOfMonth(new Date())
    }

    const [budgetRows, txRows] = await Promise.all([
      db.select().from(budgets).where(eq(budgets.userId, user.id)),
      db.select().from(transactions).where(eq(transactions.userId, user.id)),
    ])

    const spentMap = {}
    txRows.forEach(tx => {
      const txDate = new Date(tx.date)
      if (tx.type === 'EXPENSE' && txDate >= monthStart && txDate <= monthEnd) {
        spentMap[tx.category] = (spentMap[tx.category] || 0) + parseFloat(tx.amount)
      }
    })

    const enriched = budgetRows
      .filter(b => { const m = new Date(b.month); return m >= monthStart && m <= monthEnd })
      .map(b => {
        const spent = spentMap[b.category] || 0
        const limit = parseFloat(b.limit)
        return { id: b.id, category: b.category, limit, month: new Date(b.month).toISOString(), spent, remaining: limit - spent, percentage: Math.min(100, Math.round((spent / limit) * 100)), isExceeded: spent > limit }
      })

    return NextResponse.json({ budgets: enriched })
  } catch (error) {
    console.error('[GET /api/budgets]', error)
    return NextResponse.json({ error: 'Internal server error', detail: error.message }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const user = await getSessionUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const parsed = budgetSchema.safeParse({ ...body, limit: Number(body.limit) })
    if (!parsed.success) return NextResponse.json({ error: 'Validation failed', issues: parsed.error.issues }, { status: 422 })

    const monthDate = startOfMonth(new Date(parsed.data.month))
    const docId = `${user.id}_${parsed.data.category}_${monthDate.toISOString().slice(0, 7)}`

    // Upsert using onConflictDoUpdate
    const [budget] = await db.insert(budgets).values({
      id: docId,
      userId: user.id,
      category: parsed.data.category,
      limit: parsed.data.limit,
      month: monthDate,
    }).onConflictDoUpdate({
      target: budgets.id,
      set: { limit: parsed.data.limit, updatedAt: new Date() },
    }).returning()

    return NextResponse.json({ budget: { ...budget, limit: parseFloat(budget.limit), month: new Date(budget.month).toISOString() } }, { status: 201 })
  } catch (error) {
    console.error('[POST /api/budgets]', error)
    return NextResponse.json({ error: 'Internal server error', detail: error.message }, { status: 500 })
  }
}
