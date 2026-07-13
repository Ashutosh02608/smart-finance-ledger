/**
 * Prisma seed script — populates realistic demo data
 * Run: npx prisma db seed
 */
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

const DEMO_USER_ID = 'demo-user-seed-id'
const DEMO_EMAIL = 'demo@smartfinance.app'

async function main() {
  console.log('🌱 Seeding database...')

  // Create demo user
  const user = await prisma.user.upsert({
    where: { id: DEMO_USER_ID },
    update: {},
    create: {
      id: DEMO_USER_ID,
      email: DEMO_EMAIL,
      name: 'Demo User',
      currency: 'INR',
    },
  })

  // Create default categories
  const categories = [
    // Income
    { name: 'Salary', type: 'INCOME', color: '#22c55e', icon: 'briefcase', isCustom: false },
    { name: 'Freelance', type: 'INCOME', color: '#06b6d4', icon: 'laptop', isCustom: false },
    { name: 'Business', type: 'INCOME', color: '#6366f1', icon: 'building', isCustom: false },
    { name: 'Investments', type: 'INCOME', color: '#f59e0b', icon: 'trending-up', isCustom: false },
    // Expense
    { name: 'Food', type: 'EXPENSE', color: '#f97316', icon: 'utensils', isCustom: false },
    { name: 'Rent', type: 'EXPENSE', color: '#ef4444', icon: 'home', isCustom: false },
    { name: 'Shopping', type: 'EXPENSE', color: '#ec4899', icon: 'shopping-bag', isCustom: false },
    { name: 'Entertainment', type: 'EXPENSE', color: '#8b5cf6', icon: 'music', isCustom: false },
    { name: 'Travel', type: 'EXPENSE', color: '#06b6d4', icon: 'plane', isCustom: false },
    { name: 'Utilities', type: 'EXPENSE', color: '#f59e0b', icon: 'zap', isCustom: false },
    { name: 'Medical', type: 'EXPENSE', color: '#ef4444', icon: 'heart', isCustom: false },
    { name: 'Education', type: 'EXPENSE', color: '#3b82f6', icon: 'book-open', isCustom: false },
    { name: 'Others', type: 'EXPENSE', color: '#94a3b8', icon: 'more-horizontal', isCustom: false },
  ]

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { userId_name_type: { userId: user.id, name: cat.name, type: cat.type } },
      update: {},
      create: { userId: user.id, ...cat },
    })
  }

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

  // Bulk insert
  for (const tx of transactions) {
    await prisma.transaction.create({ data: { userId: user.id, ...tx } })
  }

  // Create budgets for current month
  const budgets = [
    { category: 'Food', limit: 8000 },
    { category: 'Shopping', limit: 5000 },
    { category: 'Entertainment', limit: 2000 },
    { category: 'Travel', limit: 3000 },
    { category: 'Utilities', limit: 3000 },
  ]

  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  for (const b of budgets) {
    await prisma.budget.upsert({
      where: { userId_category_month: { userId: user.id, category: b.category, month: monthStart } },
      update: {},
      create: { userId: user.id, category: b.category, limit: b.limit, month: monthStart },
    })
  }

  // Welcome notification
  await prisma.notification.create({
    data: {
      userId: user.id,
      title: 'Welcome to Smart Finance Ledger!',
      message: 'Your demo account is ready. Explore the dashboard to see your financial overview.',
      type: 'SUCCESS',
    },
  })

  console.log(`✅ Seeded: ${transactions.length} transactions, ${budgets.length} budgets, ${categories.length} categories`)
  console.log(`Demo user: ${DEMO_EMAIL}`)
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
