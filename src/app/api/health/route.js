import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const privateKey = process.env.FIREBASE_PRIVATE_KEY
  const normalizedKey = privateKey?.replace(/\\n/g, '\n')

  return NextResponse.json({
    ok: true,
    env: {
      NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'MISSING',
      FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL
        ? `${process.env.FIREBASE_CLIENT_EMAIL.substring(0, 20)}...`
        : 'MISSING',
      FIREBASE_PRIVATE_KEY_SET: !!privateKey,
      FIREBASE_PRIVATE_KEY_LENGTH: privateKey?.length || 0,
      FIREBASE_PRIVATE_KEY_HAS_HEADER: normalizedKey?.includes('-----BEGIN PRIVATE KEY-----') || false,
      FIREBASE_PRIVATE_KEY_HAS_FOOTER: normalizedKey?.includes('-----END PRIVATE KEY-----') || false,
      RESEND_API_KEY_SET: !!process.env.RESEND_API_KEY,
      NODE_ENV: process.env.NODE_ENV,
    },
  })
}
