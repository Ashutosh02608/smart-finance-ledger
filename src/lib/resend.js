import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = process.env.RESEND_FROM_EMAIL || 'Smart Finance <noreply@smartfinance.app>'

// ─── Welcome Email ────────────────────────────────────────────────────────────
export async function sendWelcomeEmail({ to, name }) {
  return resend.emails.send({
    from: FROM,
    to,
    subject: '👋 Welcome to Smart Finance Ledger!',
    html: `
      <div style="font-family:Inter,sans-serif;max-width:600px;margin:0 auto;background:#0f172a;color:#f1f5f9;padding:40px;border-radius:16px">
        <div style="text-align:center;margin-bottom:32px">
          <div style="background:linear-gradient(135deg,#6366f1,#8b5cf6);width:64px;height:64px;border-radius:16px;display:inline-flex;align-items:center;justify-content:center;font-size:28px;margin-bottom:16px">💰</div>
          <h1 style="color:#f1f5f9;font-size:24px;margin:0">Welcome, ${name}!</h1>
        </div>
        <p style="color:#94a3b8;line-height:1.6">Your Smart Finance account is ready. Start tracking your income, expenses, and building a healthier financial future.</p>
        <div style="background:#1e293b;border-radius:12px;padding:24px;margin:24px 0">
          <h3 style="color:#f1f5f9;margin:0 0 16px">What you can do:</h3>
          <ul style="color:#94a3b8;line-height:2;padding-left:20px">
            <li>Track income & expenses</li>
            <li>Set monthly budgets per category</li>
            <li>View your Financial Health Score</li>
            <li>Get AI-powered spending insights</li>
          </ul>
        </div>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" style="display:block;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;text-align:center;padding:16px;border-radius:10px;text-decoration:none;font-weight:600;margin-top:24px">Open Dashboard →</a>
        <p style="color:#475569;font-size:12px;text-align:center;margin-top:32px">Smart Finance Ledger • Manage your money wisely</p>
      </div>
    `,
  })
}

// ─── Budget Exceeded Email ─────────────────────────────────────────────────────
export async function sendBudgetExceededEmail({ to, name, category, limit, spent, currency = 'INR' }) {
  const symbol = currency === 'INR' ? '₹' : '$'
  const overflow = spent - limit
  return resend.emails.send({
    from: FROM,
    to,
    subject: `⚠️ Budget Exceeded: ${category}`,
    html: `
      <div style="font-family:Inter,sans-serif;max-width:600px;margin:0 auto;background:#0f172a;color:#f1f5f9;padding:40px;border-radius:16px">
        <div style="background:#7f1d1d;border:1px solid #ef4444;border-radius:12px;padding:20px;margin-bottom:24px">
          <h2 style="color:#fca5a5;margin:0 0 8px">⚠️ Budget Exceeded</h2>
          <p style="color:#fca5a5;margin:0">Your ${category} budget has been exceeded.</p>
        </div>
        <div style="background:#1e293b;border-radius:12px;padding:24px">
          <div style="display:flex;justify-content:space-between;margin-bottom:12px">
            <span style="color:#94a3b8">Budget Limit</span>
            <span style="color:#f1f5f9;font-weight:600">${symbol}${limit.toLocaleString()}</span>
          </div>
          <div style="display:flex;justify-content:space-between;margin-bottom:12px">
            <span style="color:#94a3b8">Amount Spent</span>
            <span style="color:#ef4444;font-weight:600">${symbol}${spent.toLocaleString()}</span>
          </div>
          <div style="display:flex;justify-content:space-between;border-top:1px solid #334155;padding-top:12px">
            <span style="color:#94a3b8">Over Budget</span>
            <span style="color:#ef4444;font-weight:700">${symbol}${overflow.toLocaleString()}</span>
          </div>
        </div>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/budgets" style="display:block;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;text-align:center;padding:16px;border-radius:10px;text-decoration:none;font-weight:600;margin-top:24px">Review Budgets →</a>
      </div>
    `,
  })
}

// ─── Large Expense Alert Email ─────────────────────────────────────────────────
export async function sendLargeExpenseEmail({ to, name, title, amount, category, currency = 'INR' }) {
  const symbol = currency === 'INR' ? '₹' : '$'
  return resend.emails.send({
    from: FROM,
    to,
    subject: `🚨 Large Expense Detected: ${symbol}${amount.toLocaleString()}`,
    html: `
      <div style="font-family:Inter,sans-serif;max-width:600px;margin:0 auto;background:#0f172a;color:#f1f5f9;padding:40px;border-radius:16px">
        <h2 style="color:#f1f5f9">Large Expense Alert</h2>
        <p style="color:#94a3b8">Hi ${name}, a large expense was just recorded on your account.</p>
        <div style="background:#1e293b;border-radius:12px;padding:24px;margin:20px 0">
          <p style="color:#94a3b8;margin:0 0 8px">Transaction</p>
          <h3 style="color:#f1f5f9;margin:0 0 16px">${title}</h3>
          <div style="display:flex;justify-content:space-between">
            <span style="color:#94a3b8">Amount</span>
            <span style="color:#f97316;font-weight:700;font-size:20px">${symbol}${amount.toLocaleString()}</span>
          </div>
          <div style="display:flex;justify-content:space-between;margin-top:8px">
            <span style="color:#94a3b8">Category</span>
            <span style="color:#f1f5f9">${category}</span>
          </div>
        </div>
        <p style="color:#94a3b8">If this wasn't you, please review your account immediately.</p>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/transactions" style="display:block;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;text-align:center;padding:16px;border-radius:10px;text-decoration:none;font-weight:600;margin-top:24px">View Transactions →</a>
      </div>
    `,
  })
}

// ─── Monthly Summary Email ─────────────────────────────────────────────────────
export async function sendMonthlySummaryEmail({ to, name, month, totalIncome, totalExpense, savings, healthScore, currency = 'INR' }) {
  const symbol = currency === 'INR' ? '₹' : '$'
  const savingsRate = totalIncome > 0 ? ((savings / totalIncome) * 100).toFixed(1) : 0
  return resend.emails.send({
    from: FROM,
    to,
    subject: `📊 Your ${month} Financial Summary`,
    html: `
      <div style="font-family:Inter,sans-serif;max-width:600px;margin:0 auto;background:#0f172a;color:#f1f5f9;padding:40px;border-radius:16px">
        <h2 style="color:#f1f5f9">Monthly Summary — ${month}</h2>
        <p style="color:#94a3b8">Hi ${name}, here's your financial overview for ${month}.</p>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin:24px 0">
          <div style="background:#1e293b;border-radius:12px;padding:20px">
            <p style="color:#94a3b8;margin:0 0 8px;font-size:13px">Total Income</p>
            <p style="color:#22c55e;font-size:22px;font-weight:700;margin:0">${symbol}${totalIncome.toLocaleString()}</p>
          </div>
          <div style="background:#1e293b;border-radius:12px;padding:20px">
            <p style="color:#94a3b8;margin:0 0 8px;font-size:13px">Total Expenses</p>
            <p style="color:#ef4444;font-size:22px;font-weight:700;margin:0">${symbol}${totalExpense.toLocaleString()}</p>
          </div>
          <div style="background:#1e293b;border-radius:12px;padding:20px">
            <p style="color:#94a3b8;margin:0 0 8px;font-size:13px">Net Savings</p>
            <p style="color:#6366f1;font-size:22px;font-weight:700;margin:0">${symbol}${savings.toLocaleString()}</p>
          </div>
          <div style="background:#1e293b;border-radius:12px;padding:20px">
            <p style="color:#94a3b8;margin:0 0 8px;font-size:13px">Health Score</p>
            <p style="color:#f59e0b;font-size:22px;font-weight:700;margin:0">${healthScore}/100</p>
          </div>
        </div>
        <p style="color:#94a3b8">Savings Rate: <strong style="color:#22c55e">${savingsRate}%</strong></p>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/analytics" style="display:block;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;text-align:center;padding:16px;border-radius:10px;text-decoration:none;font-weight:600;margin-top:24px">View Full Analytics →</a>
      </div>
    `,
  })
}
