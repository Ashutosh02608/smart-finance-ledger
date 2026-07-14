export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/firebase/server-auth'
import { db } from '@/lib/db'
import { users, transactions, budgets, notifications } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { profileSchema } from '@/lib/validations'

export async function GET(request) {
  try {
    const user = await getSessionUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const rows = await db.select().from(users).where(eq(users.id, user.id))
    if (!rows.length) return NextResponse.json({ error: 'User not found' }, { status: 404 })
    return NextResponse.json({ user: rows[0] })
  } catch (error) {
    console.error('[GET /api/user]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request) {
  try {
    const user = await getSessionUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const parsed = profileSchema.partial().safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: 'Validation failed', issues: parsed.error.issues }, { status: 422 })

    const [updated] = await db.update(users).set({ ...parsed.data, updatedAt: new Date() }).where(eq(users.id, user.id)).returning()
    return NextResponse.json({ user: updated })
  } catch (error) {
    console.error('[PUT /api/user]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request) {
  try {
    const user = await getSessionUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Cascade deletes via FK constraints, but also explicit for safety
    await db.delete(transactions).where(eq(transactions.userId, user.id))
    await db.delete(budgets).where(eq(budgets.userId, user.id))
    await db.delete(notifications).where(eq(notifications.userId, user.id))
    await db.delete(users).where(eq(users.id, user.id))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[DELETE /api/user]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
