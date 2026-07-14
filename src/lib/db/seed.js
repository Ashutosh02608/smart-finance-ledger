/**
 * db:seed — Seeds Neon with a demo user and realistic transaction data.
 * Run after db:push: npm run db:seed
 * 
 * Requires: NEXT_PUBLIC_FIREBASE_API_KEY, NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
 *           NEXT_PUBLIC_FIREBASE_PROJECT_ID, DATABASE_URL
 */
import 'dotenv/config'
import { neon } from '@neondatabase/serverless'
import { subMonths, startOfMonth, addDays, format } from 'date-fns'

const sql = neon(process.env.DATABASE_URL)

const DEMO_USER_ID = 'demo-user-neon-001'
const DEMO_EMAIL = 'demo@smartfinance.app'
const DEMO_NAME = 'Demo User'

function nanoid(len = 20) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let id = ''
  for (let i = 0; i < len; i++) id += chars[Math.floor(Math.random() * chars.length)]
  return id
}

const EXPENSE_CATEGORIES = ['Food & Dining', 'Shopping', 'Transportation', 'Entertainment', 'Healthcare', 'Utilities', 'Rent', 'Education']
const INCOME_CATEGORIES = ['Salary', 'Freelance', 'Investment Returns', 'Business']

function randomAmount(min, max) { return Math.round((Math.random() * (max - min) + min) * 100) / 100 }
function randomItem(arr) { return arr[Math.floor(Math.random() * arr.length)] }

async function seed() {
  console.log('🌱 Seeding Neon database...')

  // Upsert demo user
  await sql`
    INSERT INTO users (id, email, name, currency, timezone)
    VALUES (${DEMO_USER_ID}, ${DEMO_EMAIL}, ${DEMO_NAME}, 'INR', 'Asia/Kolkata')
    ON CONFLICT (id) DO UPDATE SET name = ${DEMO_NAME}, updated_at = NOW()
  `
  console.log('✅ Demo user upserted:', DEMO_EMAIL)

  // Clear old demo data
  await sql`DELETE FROM transactions WHERE user_id = ${DEMO_USER_ID}`
  await sql`DELETE FROM budgets WHERE user_id = ${DEMO_USER_ID}`
  await sql`DELETE FROM notifications WHERE user_id = ${DEMO_USER_ID}`

  // Generate 6 months of transactions
  const txValues = []
  const now = new Date()

  for (let m = 5; m >= 0; m--) {
    const monthStart = startOfMonth(subMonths(now, m))

    // Salary income
    txValues.push({
      id: nanoid(), userId: DEMO_USER_ID,
      title: 'Monthly Salary', amount: randomAmount(55000, 75000),
      type: 'INCOME', category: 'Salary',
      date: addDays(monthStart, 1),
      paymentMethod: 'BANK_TRANSFER', notes: 'Regular monthly salary',
    })

    // Freelance income (some months)
    if (Math.random() > 0.4) {
      txValues.push({
        id: nanoid(), userId: DEMO_USER_ID,
        title: 'Freelance Project', amount: randomAmount(5000, 20000),
        type: 'INCOME', category: 'Freelance',
        date: addDays(monthStart, Math.floor(Math.random() * 20) + 5),
        paymentMethod: 'UPI', notes: null,
      })
    }

    // 8–15 expenses per month
    const expCount = Math.floor(Math.random() * 8) + 8
    for (let e = 0; e < expCount; e++) {
      const cat = randomItem(EXPENSE_CATEGORIES)
      const amountRange = { 'Rent': [12000, 25000], 'Food & Dining': [300, 3000], 'Shopping': [500, 8000], 'Transportation': [200, 2000], 'Entertainment': [200, 3000], 'Healthcare': [500, 5000], 'Utilities': [800, 3000], 'Education': [1000, 8000] }
      const [min, max] = amountRange[cat] || [200, 2000]
      txValues.push({
        id: nanoid(), userId: DEMO_USER_ID,
        title: `${cat} expense`, amount: randomAmount(min, max),
        type: 'EXPENSE', category: cat,
        date: addDays(monthStart, Math.floor(Math.random() * 28)),
        paymentMethod: randomItem(['CASH', 'CARD', 'UPI', 'NET_BANKING']),
        notes: null,
      })
    }
  }

  // Bulk insert transactions
  for (const tx of txValues) {
    await sql`
      INSERT INTO transactions (id, user_id, title, amount, type, category, date, payment_method, notes)
      VALUES (${tx.id}, ${tx.userId}, ${tx.title}, ${tx.amount}, ${tx.type}, ${tx.category}, ${tx.date}, ${tx.paymentMethod}, ${tx.notes})
    `
  }
  console.log(`✅ Inserted ${txValues.length} transactions`)

  // Budgets for this month
  const budgetCategories = [
    { category: 'Food & Dining', limit: 8000 },
    { category: 'Shopping', limit: 15000 },
    { category: 'Transportation', limit: 5000 },
    { category: 'Entertainment', limit: 5000 },
    { category: 'Utilities', limit: 4000 },
  ]
  const thisMonth = startOfMonth(now)
  for (const b of budgetCategories) {
    const id = `${DEMO_USER_ID}_${b.category}_${format(thisMonth, 'yyyy-MM')}`
    await sql`
      INSERT INTO budgets (id, user_id, category, "limit", month)
      VALUES (${id}, ${DEMO_USER_ID}, ${b.category}, ${b.limit}, ${thisMonth})
      ON CONFLICT (id) DO UPDATE SET "limit" = ${b.limit}
    `
  }
  console.log('✅ Budgets seeded')

  // Welcome notification
  await sql`
    INSERT INTO notifications (id, user_id, title, message, type, read)
    VALUES (${nanoid()}, ${DEMO_USER_ID}, 'Welcome to Smart Finance Ledger!', 'Demo data loaded. Explore the dashboard, budgets, and insights.', 'SUCCESS', FALSE)
  `
  console.log('✅ Welcome notification created')
  console.log('')
  console.log('🎉 Seed complete!')
  console.log(`   Demo login: ${DEMO_EMAIL} / password123`)
  console.log('   Note: Register this email in Firebase Auth manually or via the app signup.')
}

seed().catch(err => { console.error('❌ Seed failed:', err); process.exit(1) })
