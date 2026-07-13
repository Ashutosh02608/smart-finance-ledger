export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { db } from '@/lib/firebase/admin'
import { sendWelcomeEmail } from '@/lib/resend'
import { DEFAULT_CATEGORIES } from '@/lib/utils'

// ─── POST /api/auth/register ──────────────────────────────────────────────────
// Called after Firebase creates a user — seeds Firestore user profile and default categories
export async function POST(request) {
  try {
    const { userId, email, name } = await request.json()
    if (!userId || !email) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const userRef = db.collection('users').doc(userId)
    const userDoc = await userRef.get()

    const userData = {
      email,
      name: name || email.split('@')[0],
      currency: 'INR',
      timezone: 'Asia/Kolkata',
      emailOnBudgetExceeded: true,
      emailOnLargeExpense: true,
      emailOnMonthlySummary: true,
      updatedAt: new Date(),
    }

    if (!userDoc.exists) {
      userData.createdAt = new Date()
      await userRef.set(userData)

      // Seed default categories in a batch
      const batch = db.batch()
      
      const defaultCategories = [
        ...DEFAULT_CATEGORIES.INCOME.map(c => ({ ...c, type: 'INCOME', isCustom: false, userId })),
        ...DEFAULT_CATEGORIES.EXPENSE.map(c => ({ ...c, type: 'EXPENSE', isCustom: false, userId })),
      ]

      defaultCategories.forEach((cat) => {
        // Compound-like key to prevent duplicates
        const catRef = db.collection('categories').doc(`${userId}_${cat.name}_${cat.type}`)
        batch.set(catRef, { ...cat, createdAt: new Date() })
      })

      // Create welcome notification
      const notifRef = db.collection('notifications').doc()
      batch.set(notifRef, {
        userId,
        title: 'Welcome to Smart Finance Ledger!',
        message: 'Your account is ready. Start by adding your first transaction or setting up budgets.',
        type: 'SUCCESS',
        read: false,
        createdAt: new Date(),
      })

      await batch.commit()
    } else {
      await userRef.update(userData)
    }

    // Send welcome email (non-blocking)
    sendWelcomeEmail({ to: email, name: userData.name }).catch(console.error)

    return NextResponse.json({ user: { id: userId, ...userData } }, { status: 201 })
  } catch (error) {
    console.error('[POST /api/auth/register]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
