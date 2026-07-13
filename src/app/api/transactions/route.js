export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/firebase/server-auth'
import { db } from '@/lib/firebase/admin'
import { transactionSchema } from '@/lib/validations'
import { sendBudgetExceededEmail, sendLargeExpenseEmail } from '@/lib/resend'
import { startOfMonth, endOfMonth } from 'date-fns'
import { parseFirestoreDate } from '@/lib/utils'

// ─── GET /api/transactions ─────────────────────────────────────────────────────
export async function GET(request) {
  try {
    const user = await getSessionUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search') || ''
    const type = searchParams.get('type') || ''
    const category = searchParams.get('category') || ''
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const sortBy = searchParams.get('sortBy') || 'date'
    const sortDir = searchParams.get('sortDir') || 'desc'
    const minAmount = parseFloat(searchParams.get('minAmount') || '0')
    const maxAmount = parseFloat(searchParams.get('maxAmount') || '0')

    // Fetch all user transactions to filter in-memory (eliminating strict Firestore index constraints)
    const snapshot = await db.collection('transactions').where('userId', '==', user.id).get()

    let list = snapshot.docs.map(doc => {
      const data = doc.data()
      return {
        id: doc.id,
        ...data,
        date: parseFirestoreDate(data.date)?.toISOString() || null,
        createdAt: parseFirestoreDate(data.createdAt)?.toISOString() || null,
        updatedAt: parseFirestoreDate(data.updatedAt)?.toISOString() || null,
      }
    })

    // Apply in-memory filters
    if (type) {
      list = list.filter(t => t.type === type)
    }
    if (category) {
      list = list.filter(t => t.category === category)
    }
    if (search) {
      const sq = search.toLowerCase()
      list = list.filter(t => 
        (t.title && t.title.toLowerCase().includes(sq)) || 
        (t.notes && t.notes.toLowerCase().includes(sq)) || 
        (t.category && t.category.toLowerCase().includes(sq))
      )
    }
    if (startDate) {
      list = list.filter(t => new Date(t.date) >= new Date(startDate + 'T00:00:00'))
    }
    if (endDate) {
      list = list.filter(t => new Date(t.date) <= new Date(endDate + 'T23:59:59'))
    }
    if (minAmount > 0) {
      list = list.filter(t => t.amount >= minAmount)
    }
    if (maxAmount > 0) {
      list = list.filter(t => t.amount <= maxAmount)
    }

    // Apply in-memory sorting
    list.sort((a, b) => {
      let valA = a[sortBy]
      let valB = b[sortBy]

      if (sortBy === 'date') {
        valA = a.date ? new Date(a.date).getTime() : 0
        valB = b.date ? new Date(b.date).getTime() : 0
      } else if (sortBy === 'amount') {
        valA = Number(a.amount || 0)
        valB = Number(b.amount || 0)
      } else if (typeof valA === 'string') {
        valA = valA.toLowerCase()
        valB = valB.toLowerCase()
      }

      if (valA < valB) return sortDir === 'asc' ? -1 : 1
      if (valA > valB) return sortDir === 'asc' ? 1 : -1
      return 0
    })

    const total = list.length
    const totalPages = Math.ceil(total / limit)
    const paginated = list.slice((page - 1) * limit, page * limit)

    return NextResponse.json({
      transactions: paginated,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasMore: page * limit < total,
      },
    })
  } catch (error) {
    console.error('[GET /api/transactions]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ─── POST /api/transactions ────────────────────────────────────────────────────
export async function POST(request) {
  try {
    const user = await getSessionUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const parsed = transactionSchema.safeParse({
      ...body,
      amount: Number(body.amount),
    })

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', issues: parsed.error.issues },
        { status: 422 }
      )
    }

    const txDate = new Date(parsed.data.date)

    const docRef = await db.collection('transactions').add({
      ...parsed.data,
      userId: user.id,
      date: txDate,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    const doc = await docRef.get()
    const transaction = {
      id: doc.id,
      ...doc.data(),
      date: doc.data().date.toDate().toISOString(),
    }

    // Fire-and-forget: check budget exceeded + large expense alerts
    setImmediate(async () => {
      try {
        const userDoc = await db.collection('users').doc(user.id).get()
        if (!userDoc.exists) return
        const dbUser = userDoc.data()

        const batch = db.batch()

        if (transaction.type === 'EXPENSE') {
          // Large expense alert (> ₹10,000)
          if (dbUser.emailOnLargeExpense && transaction.amount >= 10000) {
            await sendLargeExpenseEmail({
              to: dbUser.email || user.email,
              name: dbUser.name || 'there',
              title: transaction.title,
              amount: transaction.amount,
              category: transaction.category,
              currency: dbUser.currency || 'INR',
            })
          }

          // Budget exceeded check
          const monthStart = startOfMonth(txDate)
          const monthEnd = endOfMonth(txDate)

          // Query matching budget
          const budgetSnapshot = await db.collection('budgets')
            .where('userId', '==', user.id)
            .where('category', '==', transaction.category)
            .where('month', '>=', monthStart)
            .where('month', '<=', monthEnd)
            .limit(1)
            .get()

          if (!budgetSnapshot.empty) {
            const budgetDoc = budgetSnapshot.docs[0]
            const budgetData = budgetDoc.data()

            // Sum up expenses for category in date range
            const txsSnapshot = await db.collection('transactions')
              .where('userId', '==', user.id)
              .where('type', '==', 'EXPENSE')
              .where('category', '==', transaction.category)
              .where('date', '>=', monthStart)
              .where('date', '<=', monthEnd)
              .get()

            const totalSpent = txsSnapshot.docs.reduce((sum, doc) => sum + (doc.data().amount || 0), 0)

            if (totalSpent > budgetData.limit && dbUser.emailOnBudgetExceeded) {
              await sendBudgetExceededEmail({
                to: dbUser.email || user.email,
                name: dbUser.name || 'there',
                category: transaction.category,
                limit: budgetData.limit,
                spent: totalSpent,
                currency: dbUser.currency || 'INR',
              })

              // Create warning notification
              const notifRef = db.collection('notifications').doc()
              batch.set(notifRef, {
                userId: user.id,
                title: `Budget Exceeded: ${transaction.category}`,
                message: `You have spent ₹${Math.round(totalSpent).toLocaleString()} against a budget of ₹${Math.round(budgetData.limit).toLocaleString()}.`,
                type: 'WARNING',
                read: false,
                createdAt: new Date(),
              })
            }
          }

          // Create standard expense notification
          const notifRef = db.collection('notifications').doc()
          batch.set(notifRef, {
            userId: user.id,
            title: 'Expense Added',
            message: `${transaction.title} — ₹${transaction.amount.toLocaleString()} added to ${transaction.category}.`,
            type: 'INFO',
            read: false,
            createdAt: new Date(),
          })
        } else {
          // Create success income notification
          const notifRef = db.collection('notifications').doc()
          batch.set(notifRef, {
            userId: user.id,
            title: 'Income Added',
            message: `${transaction.title} — ₹${transaction.amount.toLocaleString()} added as ${transaction.category}.`,
            type: 'SUCCESS',
            read: false,
            createdAt: new Date(),
          })
        }

        await batch.commit()
      } catch (e) {
        console.error('[POST /api/transactions] background task error:', e)
      }
    })

    return NextResponse.json({ transaction }, { status: 201 })
  } catch (error) {
    console.error('[POST /api/transactions]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ─── DELETE /api/transactions (bulk delete) ────────────────────────────────────
export async function DELETE(request) {
  try {
    const user = await getSessionUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { ids } = await request.json()
    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'No IDs provided' }, { status: 400 })
    }

    const batch = db.batch()
    let count = 0

    // Only delete documents belonging to the authorized user
    for (const id of ids) {
      const ref = db.collection('transactions').doc(id)
      const doc = await ref.get()
      if (doc.exists && doc.data().userId === user.id) {
        batch.delete(ref)
        count++
      }
    }

    if (count > 0) {
      await batch.commit()
    }

    return NextResponse.json({ deleted: count })
  } catch (error) {
    console.error('[DELETE /api/transactions]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
