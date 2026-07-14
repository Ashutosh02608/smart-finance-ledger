export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/firebase/server-auth'
import { db } from '@/lib/db'
import { notifications } from '@/lib/db/schema'
import { eq, and, inArray } from 'drizzle-orm'

export async function GET(request) {
  try {
    const user = await getSessionUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const unreadOnly = searchParams.get('unread') === 'true'
    const limit = parseInt(searchParams.get('limit') || '50')

    let rows = await db.select().from(notifications).where(eq(notifications.userId, user.id))
    const unreadCount = rows.filter(n => !n.read).length
    if (unreadOnly) rows = rows.filter(n => !n.read)
    rows.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

    return NextResponse.json({ notifications: rows.slice(0, limit), unreadCount })
  } catch (error) {
    console.error('[GET /api/notifications]', error)
    return NextResponse.json({ error: 'Internal server error', detail: error.message }, { status: 500 })
  }
}

export async function PATCH(request) {
  try {
    const user = await getSessionUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    await db.update(notifications).set({ read: true }).where(and(eq(notifications.userId, user.id), eq(notifications.read, false)))
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[PATCH /api/notifications]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request) {
  try {
    const user = await getSessionUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { ids } = await request.json().catch(() => ({ ids: null }))

    if (ids && Array.isArray(ids) && ids.length > 0) {
      await db.delete(notifications).where(and(inArray(notifications.id, ids), eq(notifications.userId, user.id)))
    } else {
      await db.delete(notifications).where(eq(notifications.userId, user.id))
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[DELETE /api/notifications]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
