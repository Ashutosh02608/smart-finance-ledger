export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/firebase/server-auth'
import { db } from '@/lib/firebase/admin'
import { transactionSchema } from '@/lib/validations'

// ─── GET /api/transactions/[id] ────────────────────────────────────────────────
export async function GET(request, { params }) {
  try {
    const user = await getSessionUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const docRef = db.collection('transactions').doc(params.id)
    const doc = await docRef.get()

    if (!doc.exists || doc.data().userId !== user.id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const data = doc.data()
    const transaction = {
      id: doc.id,
      ...data,
      date: data.date ? data.date.toDate().toISOString() : null,
      createdAt: data.createdAt ? data.createdAt.toDate().toISOString() : null,
      updatedAt: data.updatedAt ? data.updatedAt.toDate().toISOString() : null,
    }

    return NextResponse.json({ transaction })
  } catch (error) {
    console.error('[GET /api/transactions/[id]]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ─── PUT /api/transactions/[id] ────────────────────────────────────────────────
export async function PUT(request, { params }) {
  try {
    const user = await getSessionUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const docRef = db.collection('transactions').doc(params.id)
    const doc = await docRef.get()

    if (!doc.exists || doc.data().userId !== user.id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const body = await request.json()
    const parsed = transactionSchema.partial().safeParse({
      ...body,
      amount: body.amount ? Number(body.amount) : undefined,
    })

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', issues: parsed.error.issues },
        { status: 422 }
      )
    }

    const updateData = {
      ...parsed.data,
      ...(parsed.data.date && { date: new Date(parsed.data.date) }),
      updatedAt: new Date(),
    }

    await docRef.update(updateData)

    const updatedDoc = await docRef.get()
    const data = updatedDoc.data()
    const transaction = {
      id: updatedDoc.id,
      ...data,
      date: data.date ? data.date.toDate().toISOString() : null,
      createdAt: data.createdAt ? data.createdAt.toDate().toISOString() : null,
      updatedAt: data.updatedAt ? data.updatedAt.toDate().toISOString() : null,
    }

    return NextResponse.json({ transaction })
  } catch (error) {
    console.error('[PUT /api/transactions/[id]]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ─── DELETE /api/transactions/[id] ────────────────────────────────────────────
export async function DELETE(request, { params }) {
  try {
    const user = await getSessionUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const docRef = db.collection('transactions').doc(params.id)
    const doc = await docRef.get()

    if (!doc.exists || doc.data().userId !== user.id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    await docRef.delete()

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[DELETE /api/transactions/[id]]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
