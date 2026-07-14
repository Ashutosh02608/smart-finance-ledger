import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'

export const dynamic = 'force-dynamic'

export async function GET() {
  let dbStatus = 'NOT_TESTED'
  try {
    if (db) {
      // Test database connectivity by querying users table
      await db.select().from(users).limit(1)
      dbStatus = 'OK'
    } else {
      dbStatus = 'DB_IS_NULL'
    }
  } catch (e) {
    dbStatus = `ERROR: ${e.message}`
  }

  return NextResponse.json({
    ok: true,
    timestamp: new Date().toISOString(),
    env: {
      NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'MISSING ❌',
      NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? 'SET ✅' : 'MISSING ❌',
      NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ? 'SET ✅' : 'MISSING ❌',
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'MISSING ❌',
      DATABASE_URL_SET: !!process.env.DATABASE_URL,
      RESEND_API_KEY_SET: !!process.env.RESEND_API_KEY,
      database_connectivity: dbStatus,
    },
  })
}
