'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { WifiOff, RefreshCw, Check } from 'lucide-react'
import { getSyncQueue } from '@/lib/db-local'

export function OfflineBanner() {
  const [isOnline, setIsOnline] = useState(true)
  const [isSyncing, setIsSyncing] = useState(false)
  const [pendingCount, setPendingCount] = useState(0)
  const [syncDone, setSyncDone] = useState(false)

  useEffect(() => {
    setIsOnline(navigator.onLine)

    const handleOnline = async () => {
      setIsOnline(true)
      await syncPendingChanges()
    }
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  useEffect(() => {
    if (!isOnline) {
      const interval = setInterval(async () => {
        const queue = await getSyncQueue()
        setPendingCount(queue.length)
      }, 2000)
      return () => clearInterval(interval)
    }
  }, [isOnline])

  async function syncPendingChanges() {
    const { getSyncQueue, removeSyncQueueItem } = await import('@/lib/db-local')
    const queue = await getSyncQueue()
    if (queue.length === 0) return

    setIsSyncing(true)
    setPendingCount(queue.length)

    for (const item of queue) {
      try {
        if (item.type === 'CREATE') {
          await fetch(`/api/${item.entity}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(item.payload) })
        } else if (item.type === 'UPDATE') {
          await fetch(`/api/${item.entity}/${item.payload.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(item.payload) })
        } else if (item.type === 'DELETE') {
          await fetch(`/api/${item.entity}/${item.payload.id}`, { method: 'DELETE' })
        }
        await removeSyncQueueItem(item.id)
        setPendingCount(prev => Math.max(0, prev - 1))
      } catch {}
    }

    setIsSyncing(false)
    setSyncDone(true)
    setTimeout(() => setSyncDone(false), 3000)
  }

  return (
    <AnimatePresence>
      {(!isOnline || isSyncing || syncDone) && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="overflow-hidden"
        >
          <div className={`flex items-center gap-2 px-4 py-2 text-xs font-medium ${
            syncDone ? 'bg-emerald-600/15 text-emerald-400' :
            isSyncing ? 'bg-violet-600/15 text-violet-400' :
            'bg-amber-600/15 text-amber-400'
          }`}>
            {syncDone ? (
              <><Check className="w-3.5 h-3.5" /> All changes synced successfully</>
            ) : isSyncing ? (
              <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Syncing {pendingCount} pending change{pendingCount !== 1 ? 's' : ''}…</>
            ) : (
              <><WifiOff className="w-3.5 h-3.5" /> You are offline. {pendingCount > 0 ? `${pendingCount} change${pendingCount !== 1 ? 's' : ''} pending sync.` : 'Changes will sync when you reconnect.'}</>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
