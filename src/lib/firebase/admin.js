import { initializeApp, getApps, cert } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'

// Normalize private key: handle both literal \n and actual newlines from Vercel
function normalizePrivateKey(key) {
  if (!key) return undefined
  // Remove surrounding quotes if accidentally included
  const stripped = key.replace(/^"+|"+$/g, '')
  // Replace literal \n sequences with real newlines
  return stripped.replace(/\\n/g, '\n')
}

const privateKey = normalizePrivateKey(process.env.FIREBASE_PRIVATE_KEY)
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID

const hasCredentials =
  clientEmail &&
  privateKey &&
  privateKey.includes('-----BEGIN PRIVATE KEY-----') &&
  privateKey.length > 200

// Log credential status on cold start (safe — doesn't log the key itself)
console.log('[Firebase Admin] Initializing...', {
  hasProjectId: !!projectId,
  hasClientEmail: !!clientEmail,
  hasPrivateKey: !!privateKey,
  keyLength: privateKey?.length,
  keyValid: hasCredentials,
})

// Initialize Firebase Admin SDK
let app
if (getApps().length === 0) {
  if (hasCredentials) {
    app = initializeApp({
      credential: cert({ projectId, clientEmail, privateKey }),
      projectId,
    })
    console.log('[Firebase Admin] Initialized with service account credentials.')
  } else {
    // No valid credentials — log clearly so Vercel logs show the root cause
    console.error(
      '[Firebase Admin] WARNING: Missing or invalid credentials. ' +
      'API routes requiring auth will return 401. ' +
      'Check FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY env vars.'
    )
    app = initializeApp({ projectId: projectId || 'missing-project-id' })
  }
} else {
  app = getApps()[0]
}

const auth = getAuth(app)

// Cache Firestore globally to avoid duplicate settings() calls during dev hot-reloads
const globalForFirebase = globalThis
let db

if (!globalForFirebase.firestoreDb) {
  db = getFirestore(app)
  try {
    db.settings({ ignoreUndefinedProperties: true })
  } catch (error) {
    console.warn('[Firestore Settings Warning]', error.message)
  }
  globalForFirebase.firestoreDb = db
} else {
  db = globalForFirebase.firestoreDb
}

export { app, auth, db }
export default app
