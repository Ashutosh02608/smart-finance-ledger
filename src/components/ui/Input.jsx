'use client'

import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

export const Input = forwardRef(function Input(
  { label, error, leftIcon, rightIcon, className, wrapperClassName, ...props },
  ref
) {
  return (
    <div className={cn('flex flex-col gap-1.5', wrapperClassName)}>
      {label && (
        <label className="text-sm font-medium text-[var(--text-primary)]">
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        {leftIcon && (
          <div className="absolute left-3 text-[var(--text-muted)] pointer-events-none">
            {leftIcon}
          </div>
        )}
        <input
          ref={ref}
          className={cn(
            'w-full h-10 rounded-lg border bg-[var(--bg-secondary)] text-[var(--text-primary)] text-sm',
            'placeholder:text-[var(--text-placeholder)]',
            'border-[var(--border-default)]',
            'focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500',
            'transition-all duration-150',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            leftIcon && 'pl-9',
            rightIcon && 'pr-9',
            !leftIcon && 'px-3',
            error && 'border-red-500 focus:ring-red-500/50',
            className
          )}
          {...props}
        />
        {rightIcon && (
          <div className="absolute right-3 text-[var(--text-muted)]">
            {rightIcon}
          </div>
        )}
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  )
})

export const Textarea = forwardRef(function Textarea(
  { label, error, className, wrapperClassName, ...props },
  ref
) {
  return (
    <div className={cn('flex flex-col gap-1.5', wrapperClassName)}>
      {label && <label className="text-sm font-medium text-[var(--text-primary)]">{label}</label>}
      <textarea
        ref={ref}
        className={cn(
          'w-full rounded-lg border bg-[var(--bg-secondary)] text-[var(--text-primary)] text-sm px-3 py-2',
          'placeholder:text-[var(--text-placeholder)]',
          'border-[var(--border-default)]',
          'focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500',
          'transition-all duration-150 resize-none',
          error && 'border-red-500',
          className
        )}
        {...props}
      />
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  )
})

export const Select = forwardRef(function Select(
  { label, error, children, className, wrapperClassName, ...props },
  ref
) {
  return (
    <div className={cn('flex flex-col gap-1.5', wrapperClassName)}>
      {label && <label className="text-sm font-medium text-[var(--text-primary)]">{label}</label>}
      <select
        ref={ref}
        className={cn(
          'w-full h-10 rounded-lg border bg-[var(--bg-secondary)] text-[var(--text-primary)] text-sm px-3',
          'border-[var(--border-default)]',
          'focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500',
          'transition-all duration-150',
          error && 'border-red-500',
          className
        )}
        {...props}
      >
        {children}
      </select>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  )
})
