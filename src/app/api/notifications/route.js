export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/firebase/server-auth'
import { db } from '@/lib/firebase/admin'
import { parseFirestoreDate } from '@/lib/utils'


// ─── GET /api/notifications ──────────────────────────────────────────────────
export async function GET(request) {
  try {
    const user = await getSessionUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const unreadOnly = searchParams.get('unread') === 'true'
    const limit = parseInt(searchParams.get('limit') || '50')

    // Single-field where() only — avoids composite index requirements
    const snapshot = await db.collection('notifications').where('userId', '==', user.id).get()

    let list = snapshot.docs.map(doc => {
      const data = doc.data()
      return {
        id: doc.id,
        ...data,
        createdAt: parseFirestoreDate(data.createdAt)?.toISOString() || null,
      }
    })

    // Filter unread in-memory if needed
    const unreadCount = list.filter(n => n.read === false).length
    if (unreadOnly) list = list.filter(n => n.read === false)

    list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    const notifications = list.slice(0, limit)

    return NextResponse.json({ notifications, unreadCount })
  } catch (error) {
    console.error('[GET /api/notifications]', error)
    return NextResponse.json({ error: 'Internal server error', detail: error.message }, { status: 500 })
  }
}

// ─── PATCH /api/notifications ────────────────────────────────────────────────
// Mark all notifications as read
export async function PATCH(request) {
  try {
    const user = await getSessionUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Single-field where() — filter unread in-memory
    const snapshot = await db.collection('notifications').where('userId', '==', user.id).get()
    const unreadDocs = snapshot.docs.filter(doc => doc.data().read === false)

    if (unreadDocs.length > 0) {
      const batch = db.batch()
      unreadDocs.forEach(doc => batch.update(doc.ref, { read: true }))
      await batch.commit()
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[PATCH /api/notifications]', error)
    return NextResponse.json({ error: 'Internal server error', detail: error.message }, { status: 500 })
  }
}

// ─── DELETE /api/notifications ────────────────────────────────────────────────
export async function DELETE(request) {
  try {
    const user = await getSessionUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { ids } = await request.json().catch(() => ({ ids: null }))
    const batch = db.batch()

    if (ids && Array.isArray(ids) && ids.length > 0) {
      for (const id of ids) {
        const ref = db.collection('notifications').doc(id)
        const doc = await ref.get()
        if (doc.exists && doc.data().userId === user.id) {
          batch.delete(ref)
        }
      }
    } else {
      const snapshot = await db.collection('notifications').where('userId', '==', user.id).get()
      snapshot.docs.forEach(doc => batch.delete(doc.ref))
    }

    await batch.commit()
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[DELETE /api/notifications]', error)
    return NextResponse.json({ error: 'Internal server error', detail: error.message }, { status: 500 })
  }
}
