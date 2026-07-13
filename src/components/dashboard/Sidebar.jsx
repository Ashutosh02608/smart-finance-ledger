'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, ArrowLeftRight, PiggyBank, BarChart2,
  Bell, Settings, ChevronLeft, ChevronRight, TrendingUp, X
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useState, useEffect } from 'react'

const NAV_ITEMS = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/transactions', icon: ArrowLeftRight, label: 'Transactions' },
  { href: '/budgets', icon: PiggyBank, label: 'Budgets' },
  { href: '/analytics', icon: BarChart2, label: 'Analytics' },
  { href: '/notifications', icon: Bell, label: 'Notifications', badge: true },
  { href: '/settings', icon: Settings, label: 'Settings' },
]

export function Sidebar({ unreadCount = 0, isMobileOpen, onMobileClose }) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  // Auto-collapse on small screens
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) setCollapsed(true)
    }
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className={cn('flex items-center gap-3 px-4 py-5 border-b border-[var(--sidebar-border)]', collapsed && 'justify-center px-3')}>
        <div className="w-8 h-8 rounded-xl gradient-brand flex items-center justify-center text-white shrink-0">
          <TrendingUp className="w-4 h-4" />
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              className="overflow-hidden"
            >
              <span className="text-sm font-bold text-[var(--text-primary)] whitespace-nowrap">Smart Finance</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-2 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map(({ href, icon: Icon, label, badge }) => {
          const isActive = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
          return (
            <Link key={href} href={href} onClick={onMobileClose}>
              <motion.div
                whileHover={{ x: 2 }}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 cursor-pointer relative group',
                  collapsed && 'justify-center px-2',
                  isActive
                    ? 'bg-violet-500/15 text-violet-400'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]'
                )}
              >
                <Icon className="w-4.5 h-4.5 shrink-0 w-[18px] h-[18px]" />

                <AnimatePresence>
                  {!collapsed && (
                    <motion.span
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: 'auto' }}
                      exit={{ opacity: 0, width: 0 }}
                      className="text-sm font-medium whitespace-nowrap overflow-hidden"
                    >
                      {label}
                    </motion.span>
                  )}
                </AnimatePresence>

                {/* Notification badge */}
                {badge && unreadCount > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className={cn(
                      'absolute top-2 text-[10px] font-bold text-white rounded-full flex items-center justify-center',
                      collapsed ? 'right-1 w-4 h-4 bg-red-500' : 'right-2 min-w-[18px] h-[18px] px-1 bg-red-500 ml-auto'
                    )}
                  >
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </motion.span>
                )}

                {/* Tooltip on collapse */}
                {collapsed && (
                  <div className="absolute left-full ml-2 px-2 py-1 rounded-md bg-[var(--bg-tertiary)] border border-[var(--border-default)] text-xs font-medium text-[var(--text-primary)] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                    {label}
                  </div>
                )}
              </motion.div>
            </Link>
          )
        })}
      </nav>

      {/* Collapse toggle (desktop) */}
      <div className="p-2 border-t border-[var(--sidebar-border)] hidden lg:block">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            'flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors',
            collapsed && 'justify-center'
          )}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <><ChevronLeft className="w-4 h-4" /><span>Collapse</span></>}
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop Sidebar */}
      <motion.aside
        animate={{ width: collapsed ? 64 : 240 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="hidden lg:flex flex-col h-screen sticky top-0 border-r border-[var(--sidebar-border)] bg-[var(--sidebar-bg)] shrink-0 overflow-hidden"
      >
        {sidebarContent}
      </motion.aside>

      {/* Mobile Sidebar Drawer */}
      <AnimatePresence>
        {isMobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-40 lg:hidden"
              onClick={onMobileClose}
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="fixed left-0 top-0 bottom-0 w-64 bg-[var(--sidebar-bg)] border-r border-[var(--sidebar-border)] z-50 lg:hidden"
            >
              <button
                onClick={onMobileClose}
                className="absolute top-4 right-4 p-1.5 rounded-lg text-[var(--text-muted)] hover:bg-[var(--bg-tertiary)]"
              >
                <X className="w-4 h-4" />
              </button>
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
