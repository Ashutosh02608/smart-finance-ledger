export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/firebase/server-auth'
import { db } from '@/lib/db'
import { users, notifications } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { DEFAULT_CATEGORIES } from '@/lib/utils'
import { sendWelcomeEmail } from '@/lib/resend'
import { nanoid } from 'nanoid'

export async function POST(request) {
  try {
    const { userId, email, name, token } = await request.json()
    if (!userId || !email) return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })

    const existing = await db.select().from(users).where(eq(users.id, userId))

    const userData = {
      id: userId, email,
      name: name || email.split('@')[0],
      currency: 'INR',
      timezone: 'Asia/Kolkata',
      emailOnBudgetExceeded: true,
      emailOnLargeExpense: true,
      emailOnMonthlySummary: true,
    }

    if (!existing.length) {
      await db.insert(users).values(userData)
      // Welcome notification
      await db.insert(notifications).values({
        id: nanoid(),
        userId,
        title: 'Welcome to Smart Finance Ledger!',
        message: 'Your account is ready. Start by adding your first transaction or setting up budgets.',
        type: 'SUCCESS',
        read: false,
      })
      sendWelcomeEmail({ to: email, name: userData.name }).catch(console.error)
    } else {
      await db.update(users).set({ name: userData.name, updatedAt: new Date() }).where(eq(users.id, userId))
    }

    return NextResponse.json({ user: userData }, { status: 201 })
  } catch (error) {
    console.error('[POST /api/auth/register]', error)
    return NextResponse.json({ error: 'Internal server error', detail: error.message }, { status: 500 })
  }
}
