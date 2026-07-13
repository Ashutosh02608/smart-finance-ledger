'use client'

import { createContext, useContext, useState, useCallback } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react'
import { cn } from '@/lib/utils'

const ToastContext = createContext(null)

const ICONS = {
  success: <CheckCircle className="w-4 h-4 text-emerald-400" />,
  error: <XCircle className="w-4 h-4 text-red-400" />,
  warning: <AlertTriangle className="w-4 h-4 text-amber-400" />,
  info: <Info className="w-4 h-4 text-blue-400" />,
}

export function Toaster() {
  const [toasts, setToasts] = useState([])

  const dismiss = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const toast = useCallback(({ title, description, type = 'info', duration = 4000, action }) => {
    const id = Date.now() + Math.random()
    setToasts(prev => [...prev.slice(-4), { id, title, description, type, action }])
    setTimeout(() => dismiss(id), duration)
    return id
  }, [dismiss])

  // Expose globally
  if (typeof window !== 'undefined') {
    window.__toast = toast
  }

  return (
    <>
      <ToastContext.Provider value={{ toast, dismiss }}>
        {null}
      </ToastContext.Provider>
      <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 w-80 sm:w-96">
        <AnimatePresence mode="popLayout">
          {toasts.map(t => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95, x: 20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className={cn(
                'relative flex items-start gap-3 p-4 rounded-xl shadow-lg border',
                'bg-[var(--bg-card)] border-[var(--border-default)]',
              )}
            >
              <span className="mt-0.5 shrink-0">{ICONS[t.type]}</span>
              <div className="flex-1 min-w-0">
                {t.title && <p className="text-sm font-semibold text-[var(--text-primary)]">{t.title}</p>}
                {t.description && <p className="text-xs text-[var(--text-secondary)] mt-0.5">{t.description}</p>}
                {t.action && (
                  <button
                    onClick={() => { t.action.onClick(); dismiss(t.id) }}
                    className="mt-2 text-xs font-medium text-violet-400 hover:text-violet-300 transition-colors"
                  >
                    {t.action.label}
                  </button>
                )}
              </div>
              <button
                onClick={() => dismiss(t.id)}
                className="shrink-0 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </>
  )
}

// Imperative toast API — call from anywhere
export const toast = {
  success: (title, opts) => window.__toast?.({ title, type: 'success', ...opts }),
  error: (title, opts) => window.__toast?.({ title, type: 'error', ...opts }),
  warning: (title, opts) => window.__toast?.({ title, type: 'warning', ...opts }),
  info: (title, opts) => window.__toast?.({ title, type: 'info', ...opts }),
}
