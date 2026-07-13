export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import prisma from '@/lib/prisma'
import { transactionSchema } from '@/lib/validations'
import { sendBudgetExceededEmail, sendLargeExpenseEmail } from '@/lib/resend'
import { startOfMonth, endOfMonth } from 'date-fns'

// ─── GET /api/transactions ─────────────────────────────────────────────────────
export async function GET(request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
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

    const where = {
      userId: user.id,
      ...(type && { type }),
      ...(category && { category }),
      ...(search && {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { notes: { contains: search, mode: 'insensitive' } },
          { category: { contains: search, mode: 'insensitive' } },
        ],
      }),
      ...(startDate || endDate ? {
        date: {
          ...(startDate && { gte: new Date(startDate) }),
          ...(endDate && { lte: new Date(endDate) }),
        },
      } : {}),
      ...(minAmount > 0 || maxAmount > 0 ? {
        amount: {
          ...(minAmount > 0 && { gte: minAmount }),
          ...(maxAmount > 0 && { lte: maxAmount }),
        },
      } : {}),
    }

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        orderBy: { [sortBy]: sortDir },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.transaction.count({ where }),
    ])

    return NextResponse.json({
      transactions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
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
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
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

    const transaction = await prisma.transaction.create({
      data: {
        ...parsed.data,
        userId: user.id,
        date: new Date(parsed.data.date),
      },
    })

    // Fire-and-forget: check budget exceeded + large expense alerts
    setImmediate(async () => {
      try {
        const dbUser = await prisma.user.findUnique({ where: { id: user.id } })
        if (!dbUser) return

        if (transaction.type === 'EXPENSE') {
          // Large expense alert (> ₹10,000)
          if (dbUser.emailOnLargeExpense && transaction.amount >= 10000) {
            await sendLargeExpenseEmail({
              to: dbUser.email,
              name: dbUser.name || 'there',
              title: transaction.title,
              amount: transaction.amount,
              category: transaction.category,
              currency: dbUser.currency,
            })
          }

          // Budget exceeded check
          const monthStart = startOfMonth(new Date(transaction.date))
          const monthEnd = endOfMonth(new Date(transaction.date))

          const budget = await prisma.budget.findFirst({
            where: {
              userId: user.id,
              category: transaction.category,
              month: { gte: monthStart, lte: monthEnd },
            },
          })

          if (budget) {
            const spent = await prisma.transaction.aggregate({
              where: {
                userId: user.id,
                type: 'EXPENSE',
                category: transaction.category,
                date: { gte: monthStart, lte: monthEnd },
              },
              _sum: { amount: true },
            })

            const totalSpent = spent._sum.amount || 0

            if (totalSpent > budget.limit && dbUser.emailOnBudgetExceeded) {
              await sendBudgetExceededEmail({
                to: dbUser.email,
                name: dbUser.name || 'there',
                category: transaction.category,
                limit: budget.limit,
                spent: totalSpent,
                currency: dbUser.currency,
              })

              // Create internal notification
              await prisma.notification.create({
                data: {
                  userId: user.id,
                  title: `Budget Exceeded: ${transaction.category}`,
                  message: `You have spent ₹${Math.round(totalSpent).toLocaleString()} against a budget of ₹${Math.round(budget.limit).toLocaleString()}.`,
                  type: 'WARNING',
                },
              })
            }
          }

          // Create success notification
          await prisma.notification.create({
            data: {
              userId: user.id,
              title: 'Expense Added',
              message: `${transaction.title} — ₹${transaction.amount.toLocaleString()} added to ${transaction.category}.`,
              type: 'INFO',
            },
          })
        } else {
          await prisma.notification.create({
            data: {
              userId: user.id,
              title: 'Income Added',
              message: `${transaction.title} — ₹${transaction.amount.toLocaleString()} added as ${transaction.category}.`,
              type: 'SUCCESS',
            },
          })
        }
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
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { ids } = await request.json()
    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'No IDs provided' }, { status: 400 })
    }

    const deleted = await prisma.transaction.deleteMany({
      where: { id: { in: ids }, userId: user.id },
    })

    return NextResponse.json({ deleted: deleted.count })
  } catch (error) {
    console.error('[DELETE /api/transactions]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
