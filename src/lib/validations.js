import { z } from 'zod'

export const transactionSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title too long'),
  amount: z
    .number({ invalid_type_error: 'Amount must be a number' })
    .positive('Amount must be positive')
    .max(10_000_000, 'Amount too large'),
  type: z.enum(['INCOME', 'EXPENSE'], { required_error: 'Type is required' }),
  category: z.string().min(1, 'Category is required'),
  date: z.string().or(z.date()),
  notes: z.string().max(500, 'Notes too long').optional().nullable(),
  paymentMethod: z.enum(['CASH', 'CARD', 'BANK_TRANSFER', 'UPI', 'NET_BANKING']).default('CASH'),
})

export const transactionUpdateSchema = transactionSchema.partial()

export const budgetSchema = z.object({
  category: z.string().min(1, 'Category is required'),
  limit: z
    .number({ invalid_type_error: 'Limit must be a number' })
    .positive('Limit must be positive')
    .max(10_000_000, 'Limit too large'),
  month: z.string().or(z.date()), // First day of month
})

export const categorySchema = z.object({
  name: z.string().min(1, 'Name is required').max(50, 'Name too long'),
  type: z.enum(['INCOME', 'EXPENSE']),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color hex').default('#6366f1'),
  icon: z.string().default('tag'),
})

export const profileSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  currency: z.string().default('INR'),
  timezone: z.string().default('Asia/Kolkata'),
  emailOnBudgetExceeded: z.boolean().default(true),
  emailOnLargeExpense: z.boolean().default(true),
  emailOnMonthlySummary: z.boolean().default(true),
})

export const notificationPrefsSchema = z.object({
  emailOnBudgetExceeded: z.boolean(),
  emailOnLargeExpense: z.boolean(),
  emailOnMonthlySummary: z.boolean(),
})
