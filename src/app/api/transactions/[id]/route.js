export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/firebase/server-auth'
import { db } from '@/lib/db'
import { transactions } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { transactionSchema } from '@/lib/validations'

export async function GET(request, { params }) {
  try {
    const user = await getSessionUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const rows = await db.select().from(transactions).where(and(eq(transactions.id, id), eq(transactions.userId, user.id)))
    if (!rows.length) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const tx = rows[0]
    return NextResponse.json({ transaction: { ...tx, amount: parseFloat(tx.amount), date: new Date(tx.date).toISOString() } })
  } catch (error) {
    console.error('[GET /api/transactions/[id]]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request, { params }) {
  try {
    const user = await getSessionUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const existing = await db.select().from(transactions).where(and(eq(transactions.id, id), eq(transactions.userId, user.id)))
    if (!existing.length) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const body = await request.json()
    const parsed = transactionSchema.partial().safeParse({ ...body, amount: body.amount ? Number(body.amount) : undefined })
    if (!parsed.success) return NextResponse.json({ error: 'Validation failed', issues: parsed.error.issues }, { status: 422 })

    const updateData = {
      ...parsed.data,
      ...(parsed.data.date && { date: new Date(parsed.data.date) }),
      updatedAt: new Date(),
    }

    const [updated] = await db.update(transactions).set(updateData).where(eq(transactions.id, id)).returning()
    return NextResponse.json({ transaction: { ...updated, amount: parseFloat(updated.amount), date: new Date(updated.date).toISOString() } })
  } catch (error) {
    console.error('[PUT /api/transactions/[id]]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request, { params }) {
  try {
    const user = await getSessionUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const deleted = await db.delete(transactions).where(and(eq(transactions.id, id), eq(transactions.userId, user.id))).returning()
    if (!deleted.length) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[DELETE /api/transactions/[id]]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
