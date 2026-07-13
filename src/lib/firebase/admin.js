import { initializeApp, getApps, cert } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'

function getServiceAccount() {
  // Option 1: Full service account JSON stored as base64 (easiest Vercel setup)
  if (process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
    try {
      const json = Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64, 'base64').toString('utf-8')
      return JSON.parse(json)
    } catch (e) {
      console.error('[Firebase Admin] Failed to parse FIREBASE_SERVICE_ACCOUNT_BASE64:', e.message)
    }
  }

  // Option 2: Individual env vars (normalize private key — handles \n and real newlines)
  const privateKey = process.env.FIREBASE_PRIVATE_KEY
    ?.replace(/^"+|"+$/g, '')   // strip accidental surrounding quotes
    ?.replace(/\\n/g, '\n')     // convert literal \n to real newlines

  return {
    project_id: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    client_email: process.env.FIREBASE_CLIENT_EMAIL,
    private_key: privateKey,
  }
}

const sa = getServiceAccount()
const hasCredentials =
  sa?.client_email &&
  sa?.private_key &&
  sa.private_key.includes('-----BEGIN PRIVATE KEY-----') &&
  sa.private_key.length > 200

console.log('[Firebase Admin] Credential status:', {
  source: process.env.FIREBASE_SERVICE_ACCOUNT_BASE64 ? 'base64-json' : 'individual-vars',
  hasClientEmail: !!sa?.client_email,
  hasPrivateKey: !!sa?.private_key,
  keyValid: hasCredentials,
})

let app
if (getApps().length === 0) {
  if (hasCredentials) {
    app = initializeApp({
      credential: cert({
        projectId: sa.project_id,
        clientEmail: sa.client_email,
        privateKey: sa.private_key,
      }),
      projectId: sa.project_id,
    })
    console.log('[Firebase Admin] ✅ Initialized with credentials.')
  } else {
    console.error('[Firebase Admin] ❌ No valid credentials found. All API routes will return 401.')
    app = initializeApp({
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'missing-project',
    })
  }
} else {
  app = getApps()[0]
}

export const auth = getAuth(app)

const globalForFirebase = globalThis
let db
if (!globalForFirebase.firestoreDb) {
  db = getFirestore(app)
  try { db.settings({ ignoreUndefinedProperties: true }) } catch {}
  globalForFirebase.firestoreDb = db
} else {
  db = globalForFirebase.firestoreDb
}

export { db }
export default app
