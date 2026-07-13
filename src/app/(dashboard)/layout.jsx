'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sidebar } from '@/components/dashboard/Sidebar'
import { TopNav } from '@/components/dashboard/TopNav'
import { OfflineBanner } from '@/components/dashboard/OfflineBanner'
import axios from 'axios'

export default function DashboardLayout({ children }) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [dashData, setDashData] = useState(null)

  useEffect(() => {
    axios.get('/api/dashboard')
      .then(res => setDashData(res.data))
      .catch(() => {})
  }, [])

  const markAllRead = async () => {
    try {
      await axios.patch('/api/notifications')
      setDashData(prev => prev ? { ...prev, unreadNotifications: 0 } : prev)
    } catch {}
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg-primary)' }}>
      <Sidebar
        unreadCount={dashData?.unreadNotifications || 0}
        isMobileOpen={mobileNavOpen}
        onMobileClose={() => setMobileNavOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <OfflineBanner />
        <TopNav
          user={dashData?.user}
          unreadCount={dashData?.unreadNotifications || 0}
          notifications={[]}
          onMenuClick={() => setMobileNavOpen(true)}
          onNotificationRead={markAllRead}
        />

        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  )
}
