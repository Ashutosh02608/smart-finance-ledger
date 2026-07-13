export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/firebase/server-auth'
import { db } from '@/lib/firebase/admin'
import { budgetSchema } from '@/lib/validations'

// ─── PUT /api/budgets/[id] ─────────────────────────────────────────────────────
export async function PUT(request, { params }) {
  try {
    const user = await getSessionUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const docRef = db.collection('budgets').doc(params.id)
    const doc = await docRef.get()

    if (!doc.exists || doc.data().userId !== user.id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const body = await request.json()
    const parsed = budgetSchema.partial().safeParse({
      ...body,
      limit: body.limit ? Number(body.limit) : undefined,
    })

    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', issues: parsed.error.issues }, { status: 422 })
    }

    const updateData = {
      ...parsed.data,
      updatedAt: new Date(),
    }

    await docRef.update(updateData)

    const updatedDoc = await docRef.get()
    const data = updatedDoc.data()
    const budget = {
      id: updatedDoc.id,
      ...data,
      month: data.month ? data.month.toDate().toISOString() : null,
    }

    return NextResponse.json({ budget })
  } catch (error) {
    console.error('[PUT /api/budgets/[id]]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ─── DELETE /api/budgets/[id] ──────────────────────────────────────────────────
export async function DELETE(request, { params }) {
  try {
    const user = await getSessionUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const docRef = db.collection('budgets').doc(params.id)
    const doc = await docRef.get()

    if (!doc.exists || doc.data().userId !== user.id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    await docRef.delete()

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[DELETE /api/budgets/[id]]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
