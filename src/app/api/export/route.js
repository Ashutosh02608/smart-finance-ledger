export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/firebase/server-auth'
import { db } from '@/lib/firebase/admin'
import { startOfMonth, endOfMonth, format, isWithinInterval } from 'date-fns'
import { parseFirestoreDate } from '@/lib/utils'

// ─── GET /api/export ──────────────────────────────────────────────────────────
export async function GET(request) {
  try {
    const user = await getSessionUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'transactions' // transactions | budget
    const month = searchParams.get('month') // e.g., "2024-01"

    let monthStart, monthEnd
    if (month) {
      const [year, m] = month.split('-').map(Number)
      monthStart = startOfMonth(new Date(year, m - 1, 1))
      monthEnd = endOfMonth(new Date(year, m - 1, 1))
    }

    if (type === 'transactions') {
      const snapshot = await db.collection('transactions')
        .where('userId', '==', user.id)
        .get()

      let list = snapshot.docs.map(doc => {
        const data = doc.data()
        return {
          id: doc.id,
          ...data,
          date: parseFirestoreDate(data.date),
        }
      }).filter(tx => tx.date !== null)

      // In-memory date filtering if month is specified
      if (month) {
        list = list.filter(tx => isWithinInterval(tx.date, { start: monthStart, end: monthEnd }))
      }

      // Sort by date descending in-memory
      list.sort((a, b) => b.date - a.date)

      const csv = [
        ['Date', 'Title', 'Type', 'Category', 'Amount', 'Payment Method', 'Notes'].join(','),
        ...list.map(t => [
          format(t.date, 'yyyy-MM-dd'),
          `"${(t.title || '').replace(/"/g, '""')}"`,
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
