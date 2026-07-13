export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/firebase/server-auth'
import { db, auth } from '@/lib/firebase/admin'
import { profileSchema } from '@/lib/validations'

// ─── GET /api/user ─────────────────────────────────────────────────────────────
export async function GET(request) {
  try {
    const user = await getSessionUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const userDoc = await db.collection('users').doc(user.id).get()
    if (!userDoc.exists) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    return NextResponse.json({ user: { id: userDoc.id, ...userDoc.data() } })
  } catch (error) {
    console.error('[GET /api/user]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ─── PUT /api/user ─────────────────────────────────────────────────────────────
export async function PUT(request) {
  try {
    const user = await getSessionUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const parsed = profileSchema.partial().safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', issues: parsed.error.issues }, { status: 422 })
    }

    const userRef = db.collection('users').doc(user.id)
    await userRef.update({
      ...parsed.data,
      updatedAt: new Date(),
    })

    const updatedDoc = await userRef.get()
    return NextResponse.json({ user: { id: updatedDoc.id, ...updatedDoc.data() } })
  } catch (error) {
    console.error('[PUT /api/user]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ─── DELETE /api/user ──────────────────────────────────────────────────────────
export async function DELETE(request) {
  try {
    const user = await getSessionUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Cascade delete user data from Firestore using a batch
    const batch = db.batch()

    const collections = ['transactions', 'budgets', 'notifications', 'categories']
    for (const colName of collections) {
      const snapshot = await db.collection(colName).where('userId', '==', user.id).get()
      snapshot.docs.forEach(doc => {
        batch.delete(doc.ref)
      })
    }

    // Delete user profile document
    batch.delete(db.collection('users').doc(user.id))

    // Commit Firestore deletions
    await batch.commit()

    // Delete user from Firebase Auth
    await auth.deleteUser(user.id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[DELETE /api/user]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
