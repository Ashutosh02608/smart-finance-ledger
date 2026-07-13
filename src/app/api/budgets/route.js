export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import prisma from '@/lib/prisma'
import { budgetSchema } from '@/lib/validations'
import { startOfMonth, endOfMonth } from 'date-fns'

// ─── GET /api/budgets ─────────────────────────────────────────────────────────
export async function GET(request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const month = searchParams.get('month') // e.g., "2024-01"
    
    let monthStart, monthEnd
    if (month) {
      const [year, m] = month.split('-').map(Number)
      monthStart = startOfMonth(new Date(year, m - 1, 1))
      monthEnd = endOfMonth(new Date(year, m - 1, 1))
    } else {
      monthStart = startOfMonth(new Date())
      monthEnd = endOfMonth(new Date())
    }

    const budgets = await prisma.budget.findMany({
      where: {
        userId: user.id,
        month: { gte: monthStart, lte: monthEnd },
      },
    })

    // Enrich with current spending per category
    const enriched = await Promise.all(
      budgets.map(async (budget) => {
        const spent = await prisma.transaction.aggregate({
          where: {
            userId: user.id,
            type: 'EXPENSE',
            category: budget.category,
            date: { gte: monthStart, lte: monthEnd },
          },
          _sum: { amount: true },
        })
        const spentAmount = spent._sum.amount || 0
        return {
          ...budget,
          spent: spentAmount,
          remaining: budget.limit - spentAmount,
          percentage: Math.min(100, Math.round((spentAmount / budget.limit) * 100)),
          isExceeded: spentAmount > budget.limit,
        }
      })
    )

    return NextResponse.json({ budgets: enriched })
  } catch (error) {
    console.error('[GET /api/budgets]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ─── POST /api/budgets ─────────────────────────────────────────────────────────
export async function POST(request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const parsed = budgetSchema.safeParse({
      ...body,
      limit: Number(body.limit),
    })

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', issues: parsed.error.issues },
        { status: 422 }
      )
    }

    const monthDate = startOfMonth(new Date(parsed.data.month))

    const budget = await prisma.budget.upsert({
      where: {
        userId_category_month: {
          userId: user.id,
          category: parsed.data.category,
          month: monthDate,
        },
      },
      update: { limit: parsed.data.limit },
      create: {
        userId: user.id,
        category: parsed.data.category,
        limit: parsed.data.limit,
        month: monthDate,
      },
    })

    return NextResponse.json({ budget }, { status: 201 })
  } catch (error) {
    console.error('[POST /api/budgets]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
