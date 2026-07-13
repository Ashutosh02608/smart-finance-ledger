/**
 * Diagnostics script to run the exact calculation steps of the 3 dashboard endpoints
 * for the demo user and print any exceptions.
 * Run: node scratch/test-endpoints.js
 */
const path = require('path')
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') })

const { initializeApp, cert } = require('firebase-admin/app')
const { getFirestore } = require('firebase-admin/firestore')
const { startOfMonth, endOfMonth, subMonths, format, isWithinInterval } = require('date-fns')

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

async function testDashboard() {
  console.log('\n--- Testing Dashboard Logic ---')
  const now = new Date()
  const monthStart = startOfMonth(now)
  const monthEnd = endOfMonth(now)

  const [userDoc, txsSnapshot, budgetsSnapshot, notifsSnapshot] = await Promise.all([
    db.collection('users').doc(DEMO_USER_ID).get(),
    db.collection('transactions').where('userId', '==', DEMO_USER_ID).get(),
    db.collection('budgets').where('userId', '==', DEMO_USER_ID).get(),
    db.collection('notifications').where('userId', '==', DEMO_USER_ID).where('read', '==', false).get(),
  ])

  console.log('User exists?', userDoc.exists)
  console.log('Transactions fetched:', txsSnapshot.size)
  console.log('Budgets fetched:', budgetsSnapshot.size)
  console.log('Unread notifications fetched:', notifsSnapshot.size)

  const allTransactions = txsSnapshot.docs.map(doc => {
    const data = doc.data()
    return {
      id: doc.id,
      ...data,
      date: parseFirestoreDate(data.date),
    }
  })

  let monthIncome = 0
  let monthExpense = 0
  let totalIncome = 0
  let totalExpense = 0

  allTransactions.forEach(tx => {
    const amount = tx.amount || 0
    const isThisMonth = tx.date >= monthStart && tx.date <= monthEnd

    if (tx.type === 'INCOME') {
      totalIncome += amount
      if (isThisMonth) monthIncome += amount
    } else if (tx.type === 'EXPENSE') {
      totalExpense += amount
      if (isThisMonth) monthExpense += amount
    }
  })

  const recentTransactions = [...allTransactions]
    .sort((a, b) => b.date - a.date)
    .slice(0, 5)
    .map(tx => ({
      ...tx,
      date: tx.date ? tx.date.toISOString() : null,
    }))

  const spentMap = {}
  allTransactions.forEach(tx => {
    if (tx.type === 'EXPENSE' && tx.date >= monthStart && tx.date <= monthEnd) {
      spentMap[tx.category] = (spentMap[tx.category] || 0) + tx.amount
    }
  })

  const enrichedBudgets = budgetsSnapshot.docs
    .filter(doc => {
      const mVal = parseFirestoreDate(doc.data().month)
      return mVal && mVal >= monthStart && mVal <= monthEnd
    })
    .map(doc => {
      const data = doc.data()
      const spentAmount = spentMap[data.category] || 0
      return {
        id: doc.id,
        category: data.category,
        limit: data.limit,
        month: parseFirestoreDate(data.month)?.toISOString() || null,
        spent: spentAmount,
        remaining: data.limit - spentAmount,
        percentage: Math.min(100, Math.round((spentAmount / data.limit) * 100)),
        isExceeded: spentAmount > data.limit,
      }
    })

  console.log('✅ Dashboard logic completed successfully!')
}

async function testInsights() {
  console.log('\n--- Testing Insights Logic ---')
  const { calculateHealthScore } = require('../src/lib/health-score')
  const { calculatePredictions, generateInsights } = require('../src/lib/predictions')

  const now = new Date()
  const monthStart = startOfMonth(now)
  const monthEnd = endOfMonth(now)

  const [txsSnapshot, budgetsSnapshot] = await Promise.all([
    db.collection('transactions').where('userId', '==', DEMO_USER_ID).get(),
    db.collection('budgets').where('userId', '==', DEMO_USER_ID).get(),
  ])

  const allTransactions = txsSnapshot.docs.map(doc => {
    const data = doc.data()
    return {
      id: doc.id,
      ...data,
      date: parseFirestoreDate(data.date),
    }
  }).filter(tx => tx.date !== null)

  let monthIncome = 0
  let monthExpense = 0
  const currentCategoryMap = {}

  allTransactions.forEach(tx => {
    if (isWithinInterval(tx.date, { start: monthStart, end: monthEnd })) {
      if (tx.type === 'INCOME') {
        monthIncome += tx.amount || 0
      } else if (tx.type === 'EXPENSE') {
        monthExpense += tx.amount || 0
        currentCategoryMap[tx.category] = (currentCategoryMap[tx.category] || 0) + (tx.amount || 0)
      }
    }
  })

  const budgetsWithSpent = budgetsSnapshot.docs
    .filter(doc => {
      const mVal = parseFirestoreDate(doc.data().month)
      return mVal && mVal >= monthStart && mVal <= monthEnd
    })
    .map(doc => {
      const data = doc.data()
      const spent = currentCategoryMap[data.category] || 0
      return {
        id: doc.id,
        category: data.category,
        limit: data.limit,
        month: parseFirestoreDate(data.month)?.toISOString() || null,
        spent,
      }
    })

  let allTimeIncome = 0
  let allTimeExpense = 0
  allTransactions.forEach(tx => {
    if (tx.type === 'INCOME') allTimeIncome += tx.amount || 0
    if (tx.type === 'EXPENSE') allTimeExpense += tx.amount || 0
  })
  const totalNetSavings = allTimeIncome - allTimeExpense

  const sixMonthsAgo = subMonths(monthStart, 6)
  let historicExpenseTotal = 0
  allTransactions.forEach(tx => {
    if (tx.type === 'EXPENSE' && isWithinInterval(tx.date, { start: sixMonthsAgo, end: monthStart })) {
      historicExpenseTotal += tx.amount || 0
    }
  })
  const avgMonthlyExpense = historicExpenseTotal / 6

  const last3MonthsHadIncome = [1, 2, 3].map(offset => {
    const mStart = startOfMonth(subMonths(now, offset))
    const mEnd = endOfMonth(subMonths(now, offset))
    return allTransactions.some(tx => 
      tx.type === 'INCOME' && isWithinInterval(tx.date, { start: mStart, end: mEnd })
    )
  })

  const healthScore = calculateHealthScore({
    monthIncome,
    monthExpense,
    budgets: budgetsWithSpent,
    totalNetSavings,
    avgMonthlyExpense,
    last3MonthsHadIncome,
  })

  const predictions = calculatePredictions({
    totalSpentThisMonth: monthExpense,
    totalIncomeThisMonth: monthIncome,
    budgets: budgetsWithSpent,
  })

  const lastMonthStart = startOfMonth(subMonths(now, 1))
  const lastMonthEnd = endOfMonth(subMonths(now, 1))
  const lastCategoryMap = {}

  allTransactions.forEach(tx => {
    if (tx.type === 'EXPENSE' && isWithinInterval(tx.date, { start: lastMonthStart, end: lastMonthEnd })) {
      lastCategoryMap[tx.category] = (lastCategoryMap[tx.category] || 0) + (tx.amount || 0)
    }
  })

  const currentMonthByCategory = Object.entries(currentCategoryMap).map(([category, total]) => ({ category, total }))
  const lastMonthByCategory = Object.entries(lastCategoryMap).map(([category, total]) => ({ category, total }))

  const insights = generateInsights({
    currentMonthByCategory,
    lastMonthByCategory,
    dailyBurnRate: predictions.dailyBurnRate,
    totalIncome: monthIncome,
    totalExpense: monthExpense,
  })

  console.log('✅ Insights logic completed successfully!')
}

async function testAnalytics() {
  console.log('\n--- Testing Analytics Logic ---')
  const now = new Date()
  const months = 6

  const txSnapshot = await db.collection('transactions')
    .where('userId', '==', DEMO_USER_ID)
    .get()

  const allTransactions = txSnapshot.docs.map(doc => {
    const data = doc.data()
    return {
      id: doc.id,
      ...data,
      date: parseFirestoreDate(data.date),
    }
  }).filter(tx => tx.date !== null)

  const results = []

  for (let i = months - 1; i >= 0; i--) {
    const monthDate = subMonths(now, i)
    const mStart = startOfMonth(monthDate)
    const mEnd = endOfMonth(monthDate)

    let income = 0
    let expense = 0
    const categorySpentMap = {}

    allTransactions.forEach(tx => {
      if (isWithinInterval(tx.date, { start: mStart, end: mEnd })) {
        if (tx.type === 'INCOME') {
          income += tx.amount || 0
        } else if (tx.type === 'EXPENSE') {
          expense += tx.amount || 0
          categorySpentMap[tx.category] = (categorySpentMap[tx.category] || 0) + (tx.amount || 0)
        }
      }
    })

    const byCategory = Object.entries(categorySpentMap)
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount)

    results.push({
      month: format(monthDate, 'MMM yyyy'),
      income,
      expense,
      savings: income - expense,
      byCategory,
    })
  }

  const currMonthStart = startOfMonth(now)
  const currMonthEnd = endOfMonth(now)

  const dailySpentMap = {}
  allTransactions.forEach(tx => {
    if (tx.type === 'EXPENSE' && isWithinInterval(tx.date, { start: currMonthStart, end: currMonthEnd })) {
      const dateKey = format(tx.date, 'yyyy-MM-dd')
      dailySpentMap[dateKey] = (dailySpentMap[dateKey] || 0) + (tx.amount || 0)
    }
  })

  const dailySpending = Object.entries(dailySpentMap)
    .map(([dateStr, amount]) => ({
      sortDate: new Date(dateStr),
      date: format(new Date(dateStr), 'd MMM'),
      amount,
    }))
    .sort((a, b) => a.sortDate - b.sortDate)
    .map(({ date, amount }) => ({ date, amount }))

  console.log('✅ Analytics logic completed successfully!')
}

async function run() {
  try {
    await testDashboard()
    await testInsights()
    await testAnalytics()
    console.log('\n🌟 All diagnostics tests completed successfully! No server-side crashes.')
  } catch (err) {
    console.error('\n💥 CRASH DETECTED during diagnostics run:')
    console.error(err)
  }
}

run()
