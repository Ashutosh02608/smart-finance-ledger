/**
 * Diagnostics script to test Firestore connection and print the exact error trace.
 * Run: node scratch/debug-api.js
 */
const path = require('path')
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') })

const { initializeApp, cert } = require('firebase-admin/app')
const { getFirestore } = require('firebase-admin/firestore')

const serviceAccount = {
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_PRIVATE_KEY
    ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
    : undefined,
}

console.log('Project ID:', serviceAccount.projectId)
console.log('Client Email:', serviceAccount.clientEmail)
console.log('Private Key length:', serviceAccount.privateKey ? serviceAccount.privateKey.length : 0)

const isValidPrivateKey = 
  serviceAccount.privateKey && 
  serviceAccount.privateKey.includes('-----BEGIN PRIVATE KEY-----') &&
  serviceAccount.privateKey.length > 200 &&
  !serviceAccount.privateKey.includes('placeholder')

console.log('Is Private Key Valid?', isValidPrivateKey)

try {
  let app
  if (serviceAccount.clientEmail && isValidPrivateKey) {
    console.log('Initializing with cert...')
    app = initializeApp({
      credential: cert(serviceAccount),
      projectId: serviceAccount.projectId,
    })
  } else {
    console.log('Initializing without credentials (fallback)...')
    app = initializeApp({
      projectId: serviceAccount.projectId || 'mock-project-id',
    })
  }

  const db = getFirestore(app)
  db.settings({ ignoreUndefinedProperties: true })

  console.log('Attempting to query Firestore (users collection)...')
  db.collection('users').limit(1).get()
    .then(snapshot => {
      console.log('🎉 Query successful! Documents found:', snapshot.size)
      process.exit(0)
    })
    .catch(err => {
      console.error('❌ Query failed with error:')
      console.error(err)
      process.exit(1)
    })

} catch (error) {
  console.error('❌ Initialization failed with error:')
  console.error(error)
  process.exit(1)
}
