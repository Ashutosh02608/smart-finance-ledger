/**
 * Test CSV Export Logic standalone
 * Run: node scratch/test-csv.js
 */
const path = require('path')
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') })

const { initializeApp, cert } = require('firebase-admin/app')
const { getFirestore } = require('firebase-admin/firestore')
const { format } = require('date-fns')

const serviceAccount = {
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_PRIVATE_KEY
    ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
    : undefined,
}

const app = initializeApp({
  credential: cert(serviceAccount),
  projectId: serviceAccount.projectId,
})

const db = getFirestore(app)
db.settings({ ignoreUndefinedProperties: true })

const DEMO_USER_ID = 'demo-user-seed-id'

function parseFirestoreDate(dateField) {
  if (!dateField) return null
  if (typeof dateField.toDate === 'function') {
    return dateField.toDate()
  }
  const date = new Date(dateField)
  return isNaN(date.getTime()) ? null : date
}

async function testExport() {
  const snapshot = await db.collection('transactions')
    .where('userId', '==', DEMO_USER_ID)
    .get()

  console.log('Total transactions fetched for CSV:', snapshot.size)

  let list = snapshot.docs.map(doc => {
    const data = doc.data()
    return {
      id: doc.id,
      ...data,
      date: parseFirestoreDate(data.date),
    }
  }).filter(tx => tx.date !== null)

  console.log('Transactions with non-null date:', list.length)

  // Sort by date descending
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

  console.log('\n--- FIRST 5 ROWS OF GENERATED CSV ---')
  console.log(csv.split('\n').slice(0, 6).join('\n'))
  process.exit(0)
}

testExport().catch(err => {
  console.error(err)
  process.exit(1)
})
