/**
 * Firebase Firestore seed script — populates realistic demo data
 * Run: node src/lib/firebase/seed.js
 */
require('dotenv').config({ path: '.env.local' })
const { db } = require('./admin')
const { startOfMonth } = require('date-fns')

const DEMO_USER_ID = 'demo-user-seed-id'
const DEMO_EMAIL = 'demo@smartfinance.app'

const DEFAULT_CATEGORIES = {
  INCOME: [
    { name: 'Salary', icon: 'briefcase', color: '#22c55e' },
    { name: 'Freelance', icon: 'laptop', color: '#06b6d4' },
    { name: 'Business', icon: 'building', color: '#6366f1' },
    { name: 'Investments', icon: 'trending-up', color: '#f59e0b' },
    { name: 'Other Income', icon: 'plus-circle', color: '#84cc16' },
  ],
  EXPENSE: [
    { name: 'Food', icon: 'utensils', color: '#f97316' },
    { name: 'Rent', icon: 'home', color: '#ef4444' },
    { name: 'Shopping', icon: 'shopping-bag', color: '#ec4899' },
    { name: 'Entertainment', icon: 'music', color: '#8b5cf6' },
    { name: 'Travel', icon: 'plane', color: '#06b6d4' },
    { name: 'Utilities', icon: 'zap', color: '#f59e0b' },
    { name: 'Medical', icon: 'heart', color: '#ef4444' },
    { name: 'Education', icon: 'book-open', color: '#3b82f6' },
    { name: 'Others', icon: 'more-horizontal', color: '#94a3b8' },
  ],
}

async function deleteCollection(collectionRef) {
  const snapshot = await collectionRef.get()
  const batch = db.batch()
  snapshot.docs.forEach(doc => batch.delete(doc.ref))
  await batch.commit()
}

async function main() {
  console.log('🌱 Seeding Firestore database...')

  // Clear existing demo records
  const collections = ['users', 'transactions', 'budgets', 'notifications', 'categories']
  for (const name of collections) {
    await deleteCollection(db.collection(name))
  }

  // Create demo user doc
  const userRef = db.collection('users').doc(DEMO_USER_ID)
  await userRef.set({
    email: DEMO_EMAIL,
    name: 'Demo User',
    currency: 'INR',
    timezone: 'Asia/Kolkata',
    emailOnBudgetExceeded: true,
    emailOnLargeExpense: true,
    emailOnMonthlySummary: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  })

  // Seed default categories
  const batch = db.batch()
  
  const defaultCategories = [
    ...DEFAULT_CATEGORIES.INCOME.map(c => ({ ...c, type: 'INCOME', isCustom: false, userId: DEMO_USER_ID })),
    ...DEFAULT_CATEGORIES.EXPENSE.map(c => ({ ...c, type: 'EXPENSE', isCustom: false, userId: DEMO_USER_ID })),
  ]

  defaultCategories.forEach(cat => {
    const ref = db.collection('categories').doc(`${DEMO_USER_ID}_${cat.name}_${cat.type}`)
    batch.set(ref, { ...cat, createdAt: new Date() })
  })

  // Generate 6 months of transactions
  const now = new Date()
  const transactions = []

  for (let m = 5; m >= 0; m--) {
    const month = new Date(now.getFullYear(), now.getMonth() - m, 1)
    const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate()

    // Salary income
    transactions.push({
      title: 'Monthly Salary',
      amount: 75000 + Math.round(Math.random() * 5000),
      type: 'INCOME',
      category: 'Salary',
      date: new Date(month.getFullYear(), month.getMonth(), 1),
      paymentMethod: 'BANK_TRANSFER',
    })

    // Freelance occasionally
    if (Math.random() > 0.4) {
      transactions.push({
        title: 'Freelance Project',
        amount: 15000 + Math.round(Math.random() * 20000),
        type: 'INCOME',
        category: 'Freelance',
        date: new Date(month.getFullYear(), month.getMonth(), Math.ceil(Math.random() * 25)),
        paymentMethod: 'UPI',
      })
    }

    // Regular expenses
    const expenseTemplates = [
      { title: 'Grocery Shopping', category: 'Food', min: 2000, max: 5000 },
      { title: 'Restaurant', category: 'Food', min: 500, max: 2000 },
      { title: 'House Rent', category: 'Rent', min: 15000, max: 15000 },
      { title: 'Electricity Bill', category: 'Utilities', min: 800, max: 1500 },
      { title: 'Amazon Shopping', category: 'Shopping', min: 1000, max: 5000 },
      { title: 'Netflix', category: 'Entertainment', min: 649, max: 649 },
      { title: 'Spotify', category: 'Entertainment', min: 119, max: 119 },
      { title: 'Petrol', category: 'Travel', min: 500, max: 1500 },
      { title: 'Zomato/Swiggy', category: 'Food', min: 300, max: 1000 },
      { title: 'Mobile Recharge', category: 'Utilities', min: 299, max: 599 },
    ]

    for (const template of expenseTemplates) {
      const day = 1 + Math.floor(Math.random() * (daysInMonth - 1))
      transactions.push({
        title: template.title,
        amount: template.min + Math.round(Math.random() * (template.max - template.min)),
        type: 'EXPENSE',
        category: template.category,
        date: new Date(month.getFullYear(), month.getMonth(), day),
        paymentMethod: ['CASH', 'CARD', 'UPI'][Math.floor(Math.random() * 3)],
      })
    }
  }

  // Add all transactions to batch
  transactions.forEach(tx => {
    const ref = db.collection('transactions').doc()
    batch.set(ref, {
      userId: DEMO_USER_ID,
      ...tx,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
  })

  // Create budgets for current month
  const budgets = [
    { category: 'Food', limit: 8000 },
    { category: 'Shopping', limit: 5000 },
    { category: 'Entertainment', limit: 2000 },
    { category: 'Travel', limit: 3000 },
    { category: 'Utilities', limit: 3000 },
  ]

  const monthStart = startOfMonth(now)
  budgets.forEach(b => {
    const docId = `${DEMO_USER_ID}_${b.category}_${monthStart.toISOString().slice(0, 7)}`
    const ref = db.collection('budgets').doc(docId)
    batch.set(ref, {
      userId: DEMO_USER_ID,
      category: b.category,
      limit: b.limit,
      month: monthStart,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
  })

  // Onboarding welcome notification
  const notifRef = db.collection('notifications').doc()
  batch.set(notifRef, {
    userId: DEMO_USER_ID,
    title: 'Welcome to Smart Finance Ledger!',
    message: 'Your demo account is ready. Explore the dashboard to see your financial overview.',
    type: 'SUCCESS',
    read: false,
    createdAt: new Date(),
  })

  await batch.commit()

  console.log(`✅ Seeded: ${transactions.length} transactions, ${budgets.length} budgets, ${defaultCategories.length} categories`)
  console.log(`Demo user: ${DEMO_EMAIL}`)
}

main().catch(console.error)
