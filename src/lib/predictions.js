/**
 * Smart Budget Predictions Engine
 * Uses burn rate analysis to predict month-end spending and remaining budget.
 */

import { getDaysInMonth, getDate } from 'date-fns'

/**
 * @param {object} params
 * @param {number} params.totalSpentThisMonth  - Total expenses in the current month so far
 * @param {number} params.totalIncomeThisMonth - Total income in the current month so far
 * @param {Array}  params.budgets              - Array of { category, limit, spent }
 * @param {Date}   params.today                - Today's date (default: new Date())
 * @returns {object}                            Prediction data
 */
export function calculatePredictions({
  totalSpentThisMonth = 0,
  totalIncomeThisMonth = 0,
  budgets = [],
  today = new Date(),
}) {
  const daysInMonth = getDaysInMonth(today)
  const daysPassed = getDate(today)
  const daysRemaining = daysInMonth - daysPassed

  const dailyBurnRate = daysPassed > 0 ? totalSpentThisMonth / daysPassed : 0
  const projectedMonthEndSpend = dailyBurnRate * daysInMonth
  const projectedSavings = totalIncomeThisMonth - projectedMonthEndSpend
  const projectedRemainingBudget = totalIncomeThisMonth - projectedMonthEndSpend

  // Per-category budget predictions
  const budgetPredictions = budgets.map(budget => {
    const categoryDailyRate = daysPassed > 0 ? budget.spent / daysPassed : 0
    const projectedCategorySpend = categoryDailyRate * daysInMonth
    const projectedRemaining = budget.limit - projectedCategorySpend
    const willExceed = projectedCategorySpend > budget.limit
    const riskLevel =
      projectedCategorySpend > budget.limit * 1.2 ? 'HIGH' :
      projectedCategorySpend > budget.limit * 0.9 ? 'MEDIUM' : 'LOW'

    return {
      category: budget.category,
      limit: budget.limit,
      spent: budget.spent,
      projectedSpend: Math.round(projectedCategorySpend),
      projectedRemaining: Math.round(projectedRemaining),
      willExceed,
      riskLevel,
    }
  })

  return {
    dailyBurnRate: Math.round(dailyBurnRate),
    projectedMonthEndSpend: Math.round(projectedMonthEndSpend),
    projectedSavings: Math.round(projectedSavings),
    projectedRemainingBudget: Math.round(projectedRemainingBudget),
    daysPassed,
    daysRemaining,
    daysInMonth,
    budgetPredictions,
    completionPercent: Math.round((daysPassed / daysInMonth) * 100),
  }
}

/**
 * Generate AI-style spending insights from transaction history
 * @param {object} params
 * @param {Array} params.currentMonthByCategory  - { category, total } current month
 * @param {Array} params.lastMonthByCategory     - { category, total } last month
 * @param {number} params.dailyBurnRate
 * @param {number} params.totalIncome
 * @param {number} params.totalExpense
 * @returns {string[]} Array of insight strings
 */
export function generateInsights({
  currentMonthByCategory = [],
  lastMonthByCategory = [],
  dailyBurnRate = 0,
  totalIncome = 0,
  totalExpense = 0,
}) {
  const insights = []
  const currency = '₹'

  // Daily burn rate insight
  if (dailyBurnRate > 0) {
    insights.push(`Your average daily spending is ${currency}${dailyBurnRate.toLocaleString()}.`)
  }

  // Savings rate
  if (totalIncome > 0) {
    const savingsRate = ((totalIncome - totalExpense) / totalIncome * 100).toFixed(0)
    if (savingsRate > 30) {
      insights.push(`Great job! You are saving ${savingsRate}% of your income this month.`)
    } else if (savingsRate > 0) {
      insights.push(`You are saving ${savingsRate}% of income. Consider increasing savings to 30%.`)
    } else {
      insights.push(`⚠ Your expenses exceed your income this month by ${currency}${Math.abs(totalIncome - totalExpense).toLocaleString()}.`)
    }
  }

  // Category-level comparisons
  const lastMonthMap = {}
  lastMonthByCategory.forEach(c => { lastMonthMap[c.category] = c.total })

  currentMonthByCategory.forEach(({ category, total }) => {
    const lastTotal = lastMonthMap[category]
    if (!lastTotal || lastTotal === 0) return

    const changePct = ((total - lastTotal) / lastTotal * 100).toFixed(0)
    const absChange = Math.abs(changePct)

    if (changePct > 20) {
      insights.push(`You spent ${absChange}% more on ${category} compared to last month.`)
    } else if (changePct < -20) {
      insights.push(`You reduced ${category} spending by ${absChange}% — keep it up!`)
    }
  })

  // Top spending category
  if (currentMonthByCategory.length > 0) {
    const top = [...currentMonthByCategory].sort((a, b) => b.total - a.total)[0]
    insights.push(`${top.category} is your highest expense category this month at ${currency}${top.total.toLocaleString()}.`)
  }

  return insights.slice(0, 6) // Cap at 6 insights
}
