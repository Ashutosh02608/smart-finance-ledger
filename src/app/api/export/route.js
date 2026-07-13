export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import prisma from '@/lib/prisma'
import { startOfMonth, endOfMonth, format } from 'date-fns'

// ─── GET /api/export ──────────────────────────────────────────────────────────
export async function GET(request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'transactions' // transactions | budget
    const month = searchParams.get('month') // e.g., "2024-01"

    let where = { userId: user.id }
    if (month) {
      const [year, m] = month.split('-').map(Number)
      const mStart = startOfMonth(new Date(year, m - 1, 1))
      const mEnd = endOfMonth(new Date(year, m - 1, 1))
      where.date = { gte: mStart, lte: mEnd }
    }

    if (type === 'transactions') {
      const transactions = await prisma.transaction.findMany({
        where,
        orderBy: { date: 'desc' },
      })

      const csv = [
        ['Date', 'Title', 'Type', 'Category', 'Amount', 'Payment Method', 'Notes'].join(','),
        ...transactions.map(t => [
          format(new Date(t.date), 'yyyy-MM-dd'),
          `"${t.title.replace(/"/g, '""')}"`,
          t.type,
          t.category,
          t.amount,
          t.paymentMethod,
          t.notes ? `"${t.notes.replace(/"/g, '""')}"` : '',
        ].join(',')),
      ].join('\n')

      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="transactions-${month || 'all'}.csv"`,
        },
      })
    }

    return NextResponse.json({ error: 'Invalid export type' }, { status: 400 })
  } catch (error) {
    console.error('[GET /api/export]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
