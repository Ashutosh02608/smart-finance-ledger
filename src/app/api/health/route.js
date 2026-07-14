import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  // Try to decode the base64 service account
  let base64Status = 'NOT_SET'
  let parsedAccount = null
  if (process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
    try {
      const json = Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64, 'base64').toString('utf-8')
      parsedAccount = JSON.parse(json)
      base64Status = 'OK'
    } catch (e) {
      base64Status = `PARSE_ERROR: ${e.message}`
    }
  }

  // Try to verify Admin SDK works
  let adminStatus = 'NOT_TESTED'
  try {
    const { db } = await import('@/lib/firebase/admin')
    if (db) {
      // Try a lightweight Firestore read
      await db.collection('_health').limit(1).get()
      adminStatus = 'OK'
    } else {
      adminStatus = 'DB_IS_NULL (no credentials)'
    }
  } catch (e) {
    adminStatus = `ERROR: ${e.message}`
  }

  return NextResponse.json({
    ok: true,
    timestamp: new Date().toISOString(),
    env: {
      // Public Firebase config
      NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'MISSING ❌',
      NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? 'SET ✅' : 'MISSING ❌',
      NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ? 'SET ✅' : 'MISSING ❌',
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'MISSING ❌',

      // Admin credentials
      FIREBASE_SERVICE_ACCOUNT_BASE64: base64Status,
      base64_parsed_project_id: parsedAccount?.project_id || 'N/A',
      base64_parsed_client_email: parsedAccount?.client_email
        ? parsedAccount.client_email.substring(0, 30) + '...'
        : 'N/A',
      base64_parsed_key_length: parsedAccount?.private_key?.length || 0,
      base64_parsed_key_valid: parsedAccount?.private_key?.includes('-----BEGIN PRIVATE KEY-----') || false,

      // Fallback individual vars
      FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL
        ? process.env.FIREBASE_CLIENT_EMAIL.substring(0, 30) + '...'
        : 'MISSING',
      FIREBASE_PRIVATE_KEY_SET: !!process.env.FIREBASE_PRIVATE_KEY,
      FIREBASE_PRIVATE_KEY_LENGTH: process.env.FIREBASE_PRIVATE_KEY?.length || 0,

      // Firestore connectivity
      admin_sdk_firestore: adminStatus,
    },
  })
}
