export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/firebase/server-auth'
import { db } from '@/lib/db'
import { transactions, budgets, notifications, users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { transactionSchema } from '@/lib/validations'
import { sendBudgetExceededEmail, sendLargeExpenseEmail } from '@/lib/resend'
import { startOfMonth, endOfMonth } from 'date-fns'
import { nanoid } from 'nanoid'

// ─── GET /api/transactions ─────────────────────────────────────────────────────
export async function GET(request) {
  try {
    const user = await getSessionUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search') || ''
    const type = searchParams.get('type') || ''
    const category = searchParams.get('category') || ''
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const sortBy = searchParams.get('sortBy') || 'date'
    const sortDir = searchParams.get('sortDir') || 'desc'

    let list = await db.select().from(transactions).where(eq(transactions.userId, user.id))

    list = list.map(tx => ({ ...tx, amount: parseFloat(tx.amount), date: new Date(tx.date) }))

    if (type) list = list.filter(t => t.type === type)
    if (category) list = list.filter(t => t.category === category)
    if (search) {
      const sq = search.toLowerCase()
      list = list.filter(t =>
        (t.title && t.title.toLowerCase().includes(sq)) ||
        (t.notes && t.notes.toLowerCase().includes(sq)) ||
        (t.category && t.category.toLowerCase().includes(sq))
      )
    }
    if (startDate) list = list.filter(t => t.date >= new Date(startDate + 'T00:00:00'))
    if (endDate) list = list.filter(t => t.date <= new Date(endDate + 'T23:59:59'))

    list.sort((a, b) => {
      let valA = a[sortBy === 'date' ? 'date' : sortBy]
      let valB = b[sortBy === 'date' ? 'date' : sortBy]
      if (typeof valA === 'string') { valA = valA.toLowerCase(); valB = valB?.toLowerCase() }
      if (valA < valB) return sortDir === 'asc' ? -1 : 1
      if (valA > valB) return sortDir === 'asc' ? 1 : -1
      return 0
    })

    const total = list.length
    const paginated = list.slice((page - 1) * limit, page * limit).map(tx => ({ ...tx, date: tx.date.toISOString() }))

    return NextResponse.json({ transactions: paginated, pagination: { page, limit, total, totalPages: Math.ceil(total / limit), hasMore: page * limit < total } })
  } catch (error) {
    console.error('[GET /api/transactions]', error)
    return NextResponse.json({ error: 'Internal server error', detail: error.message }, { status: 500 })
  }
}

// ─── POST /api/transactions ────────────────────────────────────────────────────
export async function POST(request) {
  try {
    const user = await getSessionUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const parsed = transactionSchema.safeParse({ ...body, amount: Number(body.amount) })
    if (!parsed.success) return NextResponse.json({ error: 'Validation failed', issues: parsed.error.issues }, { status: 422 })

    const txId = nanoid()
    const txDate = new Date(parsed.data.date)

    const [tx] = await db.insert(transactions).values({
      id: txId,
      userId: user.id,
      title: parsed.data.title,
      amount: parsed.data.amount,
      type: parsed.data.type,
      category: parsed.data.category,
      date: txDate,
      paymentMethod: parsed.data.paymentMethod || 'CASH',
      notes: parsed.data.notes || null,
    }).returning()

    const transaction = { ...tx, amount: parseFloat(tx.amount), date: new Date(tx.date).toISOString() }

    // Fire-and-forget: budget alerts + notifications
    setImmediate(async () => {
      try {
        const userRows = await db.select().from(users).where(eq(users.id, user.id))
        const dbUser = userRows[0]
        if (!dbUser) return

        if (transaction.type === 'EXPENSE') {
          if (dbUser.emailOnLargeExpense && transaction.amount >= 10000) {
            await sendLargeExpenseEmail({ to: dbUser.email, name: dbUser.name || 'there', title: transaction.title, amount: transaction.amount, category: transaction.category, currency: dbUser.currency || 'INR' })
          }

          // Budget check
          const monthStart = startOfMonth(txDate)
          const monthEnd = endOfMonth(txDate)
          const budgetRows = await db.select().from(budgets).where(eq(budgets.userId, user.id))
          const matchingBudget = budgetRows.find(b => b.category === transaction.category && new Date(b.month) >= monthStart && new Date(b.month) <= monthEnd)

          if (matchingBudget) {
            const allTx = await db.select().from(transactions).where(eq(transactions.userId, user.id))
            const totalSpent = allTx
              .filter(t => t.type === 'EXPENSE' && t.category === transaction.category && new Date(t.date) >= monthStart && new Date(t.date) <= monthEnd)
              .reduce((s, t) => s + parseFloat(t.amount), 0)

            if (totalSpent > parseFloat(matchingBudget.limit) && dbUser.emailOnBudgetExceeded) {
              await sendBudgetExceededEmail({ to: dbUser.email, name: dbUser.name || 'there', category: transaction.category, limit: parseFloat(matchingBudget.limit), spent: totalSpent, currency: dbUser.currency || 'INR' })
              await db.insert(notifications).values({ id: nanoid(), userId: user.id, title: `Budget Exceeded: ${transaction.category}`, message: `You spent ₹${Math.round(totalSpent).toLocaleString()} vs budget of ₹${Math.round(parseFloat(matchingBudget.limit)).toLocaleString()}.`, type: 'WARNING', read: false })
            }
          }

          await db.insert(notifications).values({ id: nanoid(), userId: user.id, title: 'Expense Added', message: `${transaction.title} — ₹${transaction.amount.toLocaleString()} added to ${transaction.category}.`, type: 'INFO', read: false })
        } else {
          await db.insert(notifications).values({ id: nanoid(), userId: user.id, title: 'Income Added', message: `${transaction.title} — ₹${transaction.amount.toLocaleString()} added as ${transaction.category}.`, type: 'SUCCESS', read: false })
        }
      } catch (e) { console.error('[POST /api/transactions] bg error:', e) }
    })

    return NextResponse.json({ transaction }, { status: 201 })
  } catch (error) {
    console.error('[POST /api/transactions]', error)
    return NextResponse.json({ error: 'Internal server error', detail: error.message }, { status: 500 })
  }
}

// ─── DELETE /api/transactions (bulk) ──────────────────────────────────────────
export async function DELETE(request) {
  try {
    const user = await getSessionUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { ids } = await request.json()
    if (!Array.isArray(ids) || ids.length === 0) return NextResponse.json({ error: 'No IDs provided' }, { status: 400 })

    const { inArray, and } = await import('drizzle-orm')
    const deleted = await db.delete(transactions).where(and(inArray(transactions.id, ids), eq(transactions.userId, user.id))).returning()

    return NextResponse.json({ deleted: deleted.length })
  } catch (error) {
    console.error('[DELETE /api/transactions]', error)
    return NextResponse.json({ error: 'Internal server error', detail: error.message }, { status: 500 })
  }
}
