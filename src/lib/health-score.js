/**
 * Financial Health Score Calculator
 * Produces a score out of 100 with reasons and recommendations.
 *
 * Factors:
 *  - Savings Rate       (30 pts): (income - expense) / income
 *  - Expense Ratio      (25 pts): expense / income
 *  - Budget Discipline  (20 pts): % of budget categories not exceeded
 *  - Emergency Fund     (15 pts): net savings vs avg monthly expense
 *  - Income Consistency (10 pts): income present in past 3 months
 */

/**
 * @param {object} params
 * @param {number} params.monthIncome   - Total income this month
 * @param {number} params.monthExpense  - Total expense this month
 * @param {Array}  params.budgets       - Array of { category, limit, spent }
 * @param {number} params.totalNetSavings - All-time net (income - expense)
 * @param {number} params.avgMonthlyExpense - Average monthly expense over history
 * @param {boolean[]} params.last3MonthsHadIncome - Array of 3 booleans
 * @returns {{ score: number, reasons: string[], recommendations: string[], breakdown: object }}
 */
export function calculateHealthScore({
  monthIncome = 0,
  monthExpense = 0,
  budgets = [],
  totalNetSavings = 0,
  avgMonthlyExpense = 0,
  last3MonthsHadIncome = [false, false, false],
}) {
  const breakdown = {}
  const reasons = []
  const recommendations = []

  // ── 1. Savings Rate (30 points) ─────────────────────────────────────────────
  let savingsScore = 0
  if (monthIncome > 0) {
    const savingsRate = (monthIncome - monthExpense) / monthIncome
    savingsScore = Math.max(0, Math.min(30, Math.round(savingsRate * 100))) // 30 at 30%+
    if (savingsRate >= 0.3) {
      reasons.push('✓ Excellent savings rate (≥30%)')
    } else if (savingsRate >= 0.15) {
      reasons.push('✓ Decent savings rate')
      recommendations.push('Try to increase your savings rate to 30% of income.')
    } else if (savingsRate >= 0) {
      reasons.push('⚠ Low savings rate')
      recommendations.push('Aim to save at least 20% of your monthly income.')
    } else {
      reasons.push('✗ Spending exceeds income this month')
      recommendations.push('Cut discretionary spending — you are spending more than you earn.')
    }
  } else {
    reasons.push('⚠ No income recorded this month')
    recommendations.push('Record your income transactions for an accurate health score.')
  }
  breakdown.savingsRate = savingsScore

  // ── 2. Expense Ratio (25 points) ────────────────────────────────────────────
  let expenseScore = 0
  if (monthIncome > 0) {
    const expenseRatio = monthExpense / monthIncome
    // 25 pts at ≤50%, 0 pts at ≥90%
    expenseScore = Math.max(0, Math.round(((0.9 - expenseRatio) / 0.4) * 25))
    expenseScore = Math.min(25, expenseScore)
    if (expenseRatio <= 0.5) {
      reasons.push('✓ Healthy expense ratio (≤50% of income)')
    } else if (expenseRatio <= 0.7) {
      reasons.push('⚠ Moderate expense ratio')
      recommendations.push('Reduce expenses to below 70% of income for better financial health.')
    } else {
      reasons.push('✗ High expense ratio (>70% of income)')
      recommendations.push('Your expenses are critically high relative to income. Review all categories.')
    }
  }
  breakdown.expenseRatio = expenseScore

  // ── 3. Budget Discipline (20 points) ────────────────────────────────────────
  let budgetScore = 20
  if (budgets.length > 0) {
    const exceeded = budgets.filter(b => b.spent > b.limit)
    const disciplineRatio = 1 - exceeded.length / budgets.length
    budgetScore = Math.round(disciplineRatio * 20)
    if (exceeded.length === 0) {
      reasons.push('✓ All budgets within limits')
    } else if (exceeded.length <= Math.ceil(budgets.length * 0.3)) {
      reasons.push(`⚠ ${exceeded.length} budget(s) exceeded`)
      exceeded.forEach(b => recommendations.push(`Reduce ${b.category} spending (over by ₹${Math.round(b.spent - b.limit).toLocaleString()}).`))
    } else {
      reasons.push(`✗ ${exceeded.length}/${budgets.length} budgets exceeded`)
      recommendations.push('Create stricter spending limits and review your budgets.')
    }
  } else {
    budgetScore = 10 // Partial credit for no budgets set
    reasons.push('⚠ No budgets configured')
    recommendations.push('Set monthly budgets for each category to improve discipline.')
  }
  breakdown.budgetDiscipline = budgetScore

  // ── 4. Emergency Fund (15 points) ───────────────────────────────────────────
  let emergencyScore = 0
  if (avgMonthlyExpense > 0 && totalNetSavings > 0) {
    const monthsCovered = totalNetSavings / avgMonthlyExpense
    if (monthsCovered >= 6) {
      emergencyScore = 15
      reasons.push('✓ Strong emergency fund (≥6 months)')
    } else if (monthsCovered >= 3) {
      emergencyScore = 10
      reasons.push('✓ Adequate emergency fund (3–6 months)')
      recommendations.push('Build your emergency fund to cover 6 months of expenses.')
    } else if (monthsCovered >= 1) {
      emergencyScore = 5
      reasons.push('⚠ Small emergency fund (<3 months)')
      recommendations.push('Prioritize building an emergency fund of at least 3 months of expenses.')
    } else {
      reasons.push('✗ No meaningful emergency fund')
      recommendations.push('Start an emergency fund immediately — target 1 month of expenses first.')
    }
  } else if (totalNetSavings <= 0) {
    reasons.push('✗ Net savings is negative')
    recommendations.push('Focus on becoming cash-flow positive before building an emergency fund.')
  }
  breakdown.emergencyFund = emergencyScore

  // ── 5. Income Consistency (10 points) ───────────────────────────────────────
  const consistentMonths = last3MonthsHadIncome.filter(Boolean).length
  const consistencyScore = Math.round((consistentMonths / 3) * 10)
  if (consistentMonths === 3) {
    reasons.push('✓ Consistent income over last 3 months')
  } else if (consistentMonths === 2) {
    reasons.push('⚠ Income missing in 1 of last 3 months')
    recommendations.push('Ensure you log income every month for accurate tracking.')
  } else {
    reasons.push('✗ Inconsistent income pattern')
    recommendations.push('Work towards a stable, regular income stream.')
  }
  breakdown.incomeConsistency = consistencyScore

  const score = Math.min(
    100,
    savingsScore + expenseScore + budgetScore + emergencyScore + consistencyScore
  )

  return { score, reasons, recommendations, breakdown }
}

/**
 * Get a letter grade and color for the health score
 */
export function getScoreGrade(score) {
  if (score >= 85) return { grade: 'A', label: 'Excellent', color: '#22c55e' }
  if (score >= 70) return { grade: 'B', label: 'Good', color: '#84cc16' }
  if (score >= 55) return { grade: 'C', label: 'Fair', color: '#f59e0b' }
  if (score >= 40) return { grade: 'D', label: 'Poor', color: '#f97316' }
  return { grade: 'F', label: 'Critical', color: '#ef4444' }
}
