export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/firebase/server-auth'
import { db } from '@/lib/db'
import { budgets } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { budgetSchema } from '@/lib/validations'

export async function PUT(request, { params }) {
  try {
    const user = await getSessionUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const existing = await db.select().from(budgets).where(and(eq(budgets.id, id), eq(budgets.userId, user.id)))
    if (!existing.length) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const body = await request.json()
    const parsed = budgetSchema.partial().safeParse({ ...body, limit: body.limit ? Number(body.limit) : undefined })
    if (!parsed.success) return NextResponse.json({ error: 'Validation failed', issues: parsed.error.issues }, { status: 422 })

    const [updated] = await db.update(budgets).set({ ...parsed.data, updatedAt: new Date() }).where(eq(budgets.id, id)).returning()
    return NextResponse.json({ budget: { ...updated, limit: parseFloat(updated.limit), month: new Date(updated.month).toISOString() } })
  } catch (error) {
    console.error('[PUT /api/budgets/[id]]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request, { params }) {
  try {
    const user = await getSessionUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const deleted = await db.delete(budgets).where(and(eq(budgets.id, id), eq(budgets.userId, user.id))).returning()
    if (!deleted.length) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[DELETE /api/budgets/[id]]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
