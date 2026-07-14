import { pgTable, text, numeric, timestamp, boolean, varchar, integer } from 'drizzle-orm/pg-core'

// ─── Users ────────────────────────────────────────────────────────────────────
export const users = pgTable('users', {
  id: text('id').primaryKey(), // Firebase UID
  email: text('email').notNull(),
  name: text('name'),
  currency: varchar('currency', { length: 10 }).default('INR'),
  timezone: text('timezone').default('Asia/Kolkata'),
  emailOnBudgetExceeded: boolean('email_on_budget_exceeded').default(true),
  emailOnLargeExpense: boolean('email_on_large_expense').default(true),
  emailOnMonthlySummary: boolean('email_on_monthly_summary').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
})

// ─── Transactions ─────────────────────────────────────────────────────────────
export const transactions = pgTable('transactions', {
  id: text('id').primaryKey(), // nanoid
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
  type: varchar('type', { length: 10 }).notNull(), // INCOME | EXPENSE
  category: text('category').notNull(),
  date: timestamp('date').notNull(),
  paymentMethod: varchar('payment_method', { length: 20 }).default('CASH'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
})

// ─── Budgets ──────────────────────────────────────────────────────────────────
export const budgets = pgTable('budgets', {
  id: text('id').primaryKey(), // deterministic: userId_category_YYYY-MM
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  category: text('category').notNull(),
  limit: numeric('limit', { precision: 12, scale: 2 }).notNull(),
  month: timestamp('month').notNull(), // first day of month
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
})

// ─── Notifications ────────────────────────────────────────────────────────────
export const notifications = pgTable('notifications', {
  id: text('id').primaryKey(), // nanoid
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  message: text('message').notNull(),
  type: varchar('type', { length: 20 }).default('INFO'), // INFO | SUCCESS | WARNING | ERROR
  read: boolean('read').default(false),
  createdAt: timestamp('created_at').defaultNow(),
})
