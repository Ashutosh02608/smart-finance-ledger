import { initializeApp, getApps, cert } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'

const serviceAccount = {
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_PRIVATE_KEY
    ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
    : undefined,
}

// Initialize Firebase Admin SDK
let app
if (getApps().length === 0) {
  const isValidPrivateKey = 
    serviceAccount.privateKey && 
    serviceAccount.privateKey.includes('-----BEGIN PRIVATE KEY-----') &&
    serviceAccount.privateKey.length > 200 &&
    !serviceAccount.privateKey.includes('placeholder')

  if (serviceAccount.clientEmail && isValidPrivateKey) {
    app = initializeApp({
      credential: cert(serviceAccount),
      projectId: serviceAccount.projectId,
    })
  } else {
    // Fallback to Application Default Credentials or mock setup for static compilation / local dev
    app = initializeApp({
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'mock-project-id',
    })
  }
} else {
  app = getApps()[0]
}

const auth = getAuth(app)

// Cache Firestore DB instance globally to avoid duplicate settings() calls during dev hot-reloads
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
