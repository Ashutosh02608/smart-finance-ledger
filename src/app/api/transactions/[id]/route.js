export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import prisma from '@/lib/prisma'
import { transactionSchema } from '@/lib/validations'

// ─── GET /api/transactions/[id] ────────────────────────────────────────────────
export async function GET(request, { params }) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const transaction = await prisma.transaction.findFirst({
      where: { id: params.id, userId: user.id },
    })

    if (!transaction) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ transaction })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ─── PUT /api/transactions/[id] ────────────────────────────────────────────────
export async function PUT(request, { params }) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const existing = await prisma.transaction.findFirst({
      where: { id: params.id, userId: user.id },
    })
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

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

    const transaction = await prisma.transaction.update({
      where: { id: params.id },
      data: {
        ...parsed.data,
        ...(parsed.data.date && { date: new Date(parsed.data.date) }),
        updatedAt: new Date(),
      },
    })

    return NextResponse.json({ transaction })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ─── DELETE /api/transactions/[id] ────────────────────────────────────────────
export async function DELETE(request, { params }) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const existing = await prisma.transaction.findFirst({
      where: { id: params.id, userId: user.id },
    })
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    await prisma.transaction.delete({ where: { id: params.id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
