import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

/**
 * Format a number as currency
 */
export function formatCurrency(amount, currency = 'INR') {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount)
}

/**
 * Format a date nicely
 */
export function formatDate(date, options = {}) {
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    ...options,
  }).format(new Date(date))
}

/**
 * Format a date as relative time (e.g., "2 days ago")
 */
export function formatRelativeTime(date) {
  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })
  const diff = (new Date(date) - new Date()) / 1000

  if (Math.abs(diff) < 60) return rtf.format(Math.round(diff), 'second')
  if (Math.abs(diff) < 3600) return rtf.format(Math.round(diff / 60), 'minute')
  if (Math.abs(diff) < 86400) return rtf.format(Math.round(diff / 3600), 'hour')
  if (Math.abs(diff) < 2592000) return rtf.format(Math.round(diff / 86400), 'day')
  return rtf.format(Math.round(diff / 2592000), 'month')
}

/**
 * Debounce a function
 */
export function debounce(fn, delay = 300) {
  let timer
  return (...args) => {
    clearTimeout(timer)
    timer = setTimeout(() => fn(...args), delay)
  }
}

/**
 * Get first day of a given month
 */
export function getMonthStart(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

/**
 * Get last day of a given month
 */
export function getMonthEnd(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999)
}

/**
 * Generate a temporary local ID for optimistic updates
 */
export function generateTempId() {
  return `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Truncate text
 */
export function truncate(str, length = 40) {
  return str.length > length ? str.slice(0, length) + '…' : str
}

/**
 * Calculate percentage change
 */
export function percentChange(current, previous) {
  if (!previous || previous === 0) return 0
  return ((current - previous) / previous) * 100
}

/**
 * Group transactions by date
 */
export function groupByDate(transactions) {
  return transactions.reduce((acc, tx) => {
    const key = new Date(tx.date).toLocaleDateString('en-IN')
    if (!acc[key]) acc[key] = []
    acc[key].push(tx)
    return acc
  }, {})
}

/**
 * Highlight matching text in a string
 */
export function highlightText(text, query) {
  if (!query) return text
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
  return text.replace(regex, '<mark class="bg-violet-500/30 text-violet-200 rounded px-0.5">$1</mark>')
}

// Default categories
export const DEFAULT_CATEGORIES = {
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

export const PAYMENT_METHODS = ['CASH', 'CARD', 'BANK_TRANSFER', 'UPI', 'NET_BANKING']

export const PAYMENT_METHOD_LABELS = {
  CASH: 'Cash',
  CARD: 'Card',
  BANK_TRANSFER: 'Bank Transfer',
  UPI: 'UPI',
  NET_BANKING: 'Net Banking',
}
