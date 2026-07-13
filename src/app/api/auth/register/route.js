export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import prisma from '@/lib/prisma'
import { sendWelcomeEmail } from '@/lib/resend'
import { DEFAULT_CATEGORIES } from '@/lib/utils'

// ─── POST /api/auth/register ──────────────────────────────────────────────────
// Called after Supabase creates user — seeds DB record and default categories
export async function POST(request) {
  try {
    const { userId, email, name } = await request.json()
    if (!userId || !email) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Create user record in our DB
    const user = await prisma.user.upsert({
      where: { id: userId },
      update: {},
      create: { id: userId, email, name: name || email.split('@')[0] },
    })

    // Seed default categories
    const categoryData = [
      ...DEFAULT_CATEGORIES.INCOME.map(c => ({ ...c, type: 'INCOME', isCustom: false, userId })),
      ...DEFAULT_CATEGORIES.EXPENSE.map(c => ({ ...c, type: 'EXPENSE', isCustom: false, userId })),
    ]
    await prisma.category.createMany({ data: categoryData, skipDuplicates: true })

    // Create welcome notification
    await prisma.notification.create({
      data: {
        userId,
        title: 'Welcome to Smart Finance Ledger!',
        message: 'Your account is ready. Start by adding your first transaction or setting up budgets.',
        type: 'SUCCESS',
      },
    })

    // Send welcome email (non-blocking)
    sendWelcomeEmail({ to: email, name: user.name }).catch(console.error)

    return NextResponse.json({ user }, { status: 201 })
  } catch (error) {
    console.error('[POST /api/auth/register]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
