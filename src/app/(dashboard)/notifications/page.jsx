'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, CheckCheck, Trash2, AlertTriangle, CheckCircle, Info, AlertOctagon } from 'lucide-react'
import axios from 'axios'
import { Button } from '@/components/ui/Button'
import { Skeleton, EmptyState } from '@/components/ui/index'
import { Badge } from '@/components/ui/index'
import { ConfirmDialog } from '@/components/ui/Modal'
import { toast } from '@/components/ui/Toaster'
import { formatRelativeTime } from '@/lib/utils'
import { cn } from '@/lib/utils'

const TYPE_CONFIG = {
  SUCCESS: { icon: <CheckCircle className="w-4 h-4" />, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  INFO: { icon: <Info className="w-4 h-4" />, color: 'text-blue-400', bg: 'bg-blue-500/10' },
  WARNING: { icon: <AlertTriangle className="w-4 h-4" />, color: 'text-amber-400', bg: 'bg-amber-500/10' },
  ALERT: { icon: <AlertOctagon className="w-4 h-4" />, color: 'text-red-400', bg: 'bg-red-500/10' },
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [clearAllOpen, setClearAllOpen] = useState(false)
  const [clearing, setClearing] = useState(false)

  const fetch = async () => {
    try {
      const res = await axios.get('/api/notifications')
      setNotifications(res.data.notifications)
      setUnreadCount(res.data.unreadCount)
    } catch {
      toast.error('Failed to load notifications')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetch() }, [])

  const markAllRead = async () => {
    await axios.patch('/api/notifications')
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    setUnreadCount(0)
    toast.success('All notifications marked as read')
  }

  const deleteNotification = async (id) => {
    try {
      await axios.delete('/api/notifications', { data: { ids: [id] } })
      setNotifications(prev => prev.filter(n => n.id !== id))
    } catch {
      toast.error('Failed to delete notification')
    }
  }

  const clearAll = async () => {
    setClearing(true)
    try {
      await axios.delete('/api/notifications', { data: {} })
      setNotifications([])
      setUnreadCount(0)
      setClearAllOpen(false)
      toast.success('All notifications cleared')
    } catch {
      toast.error('Failed to clear notifications')
    } finally {
      setClearing(false)
    }
  }

  return (
    <>
      <div className="max-w-3xl mx-auto space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">Notifications</h1>
            <p className="text-sm text-[var(--text-secondary)] mt-1">
              {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up!'}
            </p>
          </div>
          <div className="flex gap-2">
            {unreadCount > 0 && (
              <Button variant="secondary" size="sm" leftIcon={<CheckCheck className="w-3.5 h-3.5" />} onClick={markAllRead}>
                Mark All Read
              </Button>
            )}
            {notifications.length > 0 && (
              <Button variant="ghost" size="sm" leftIcon={<Trash2 className="w-3.5 h-3.5" />} onClick={() => setClearAllOpen(true)}>
                Clear All
              </Button>
            )}
          </div>
        </div>

        <div className="card overflow-hidden">
          {loading ? (
            <div className="divide-y divide-[var(--border-subtle)]">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex gap-3 p-4">
                  <Skeleton className="w-9 h-9 rounded-xl shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-3.5 w-48" />
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <EmptyState
              icon={<Bell className="w-7 h-7" />}
              title="No notifications"
              description="You're all caught up! Notifications will appear here for budget alerts, expense summaries, and more."
            />
          ) : (
            <div className="divide-y divide-[var(--border-subtle)]">
              <AnimatePresence>
                {notifications.map((n) => {
                  const config = TYPE_CONFIG[n.type] || TYPE_CONFIG.INFO
                  return (
                    <motion.div
                      key={n.id}
                      layout
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, height: 0 }}
                      className={cn('flex items-start gap-3 p-4 hover:bg-[var(--bg-secondary)] transition-colors group', !n.read && 'bg-violet-500/5')}
                    >
                      <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center shrink-0', config.bg, config.color)}>
                        {config.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-[var(--text-primary)]">{n.title}</p>
                          {!n.read && <div className="w-1.5 h-1.5 rounded-full bg-violet-400 shrink-0" />}
                        </div>
                        <p className="text-sm text-[var(--text-secondary)] mt-0.5">{n.message}</p>
                        <p className="text-xs text-[var(--text-muted)] mt-1">{formatRelativeTime(n.createdAt)}</p>
                      </div>
                      <button
                        onClick={() => deleteNotification(n.id)}
                        className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-[var(--text-muted)] hover:text-red-400 hover:bg-red-500/10 transition-all shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        isOpen={clearAllOpen}
        onClose={() => setClearAllOpen(false)}
        onConfirm={clearAll}
        isLoading={clearing}
        title="Clear All Notifications?"
        description="This will permanently delete all your notifications."
        confirmLabel="Clear All"
      />
    </>
  )
}
