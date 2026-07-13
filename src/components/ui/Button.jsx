'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { forwardRef } from 'react'

export const Button = forwardRef(function Button(
  { children, variant = 'primary', size = 'md', isLoading, leftIcon, rightIcon, className, ...props },
  ref
) {
  const base = 'inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 select-none'

  const variants = {
    primary: 'bg-gradient-to-r from-violet-600 to-violet-500 hover:from-violet-500 hover:to-violet-400 text-white shadow-sm hover:shadow-md active:scale-[0.98]',
    secondary: 'bg-[var(--bg-tertiary)] hover:bg-[var(--border-subtle)] text-[var(--text-primary)] border border-[var(--border-default)] hover:border-[var(--border-strong)]',
    ghost: 'text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]',
    danger: 'bg-red-600 hover:bg-red-500 text-white shadow-sm hover:shadow-md active:scale-[0.98]',
    outline: 'border border-violet-500/50 text-violet-400 hover:bg-violet-500/10 hover:border-violet-400',
    success: 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm',
  }

  const sizes = {
    xs: 'h-7 px-2.5 text-xs',
    sm: 'h-8 px-3 text-sm',
    md: 'h-10 px-4 text-sm',
    lg: 'h-11 px-6 text-base',
    icon: 'h-9 w-9 p-0',
    'icon-sm': 'h-7 w-7 p-0',
  }

  return (
    <motion.button
      ref={ref}
      whileTap={{ scale: 0.97 }}
      className={cn(base, variants[variant], sizes[size], className)}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading ? (
        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
      ) : leftIcon}
      {children}
      {!isLoading && rightIcon}
    </motion.button>
  )
})
