/**
 * db:push — Creates tables in Neon if they don't exist.
 * Run once after setting DATABASE_URL: npm run db:push
 */
import 'dotenv/config'
import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

async function push() {
  console.log('📦 Creating tables in Neon PostgreSQL...')

  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL,
      name TEXT,
      currency VARCHAR(10) DEFAULT 'INR',
      timezone TEXT DEFAULT 'Asia/Kolkata',
      email_on_budget_exceeded BOOLEAN DEFAULT TRUE,
      email_on_large_expense BOOLEAN DEFAULT TRUE,
      email_on_monthly_summary BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `

  await sql`
    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      amount NUMERIC(12, 2) NOT NULL,
      type VARCHAR(10) NOT NULL,
      category TEXT NOT NULL,
      date TIMESTAMP NOT NULL,
      payment_method VARCHAR(20) DEFAULT 'CASH',
      notes TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `

  await sql`
    CREATE TABLE IF NOT EXISTS budgets (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      category TEXT NOT NULL,
      "limit" NUMERIC(12, 2) NOT NULL,
      month TIMESTAMP NOT NULL,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `

  await sql`
    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      type VARCHAR(20) DEFAULT 'INFO',
      read BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `

  // Indexes for performance
  await sql`CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id)`
  await sql`CREATE INDEX IF NOT EXISTS idx_budgets_user_id ON budgets(user_id)`
  await sql`CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id)`

  console.log('✅ Tables created successfully!')
}

push().catch(err => { console.error('❌ Migration failed:', err); process.exit(1) })
