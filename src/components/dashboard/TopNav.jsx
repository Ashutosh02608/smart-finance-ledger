'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Bell, Sun, Moon, Menu, LogOut, Settings, User, X } from 'lucide-react'
import { useTheme } from 'next-themes'
import Link from 'next/link'
import { signOut } from 'firebase/auth'
import { auth } from '@/lib/firebase/client'
import { cn, formatRelativeTime } from '@/lib/utils'
import { toast } from '@/components/ui/Toaster'

export function TopNav({ user, unreadCount = 0, notifications = [], onMenuClick, onNotificationRead }) {
  const { theme, setTheme } = useTheme()
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [notifOpen, setNotifOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const router = useRouter()
  const searchRef = useRef(null)
  const notifRef = useRef(null)
  const profileRef = useRef(null)

  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false)
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Open search on Ctrl+K / Cmd+K
  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setSearchOpen(true)
        setTimeout(() => searchRef.current?.focus(), 100)
      }
      if (e.key === 'Escape') { setSearchOpen(false); setSearchQuery('') }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [])

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/transactions?search=${encodeURIComponent(searchQuery)}`)
      setSearchOpen(false)
      setSearchQuery('')
    }
  }

  const handleLogout = async () => {
    try {
      await signOut(auth)
      router.push('/login')
      toast.success('Signed out successfully')
    } catch (e) {
      toast.error('Failed to sign out')
    }
  }

  const isDark = theme === 'dark'
  const displayName = user?.name || user?.email?.split('@')[0] || 'User'
  const avatarLetter = displayName[0]?.toUpperCase()

  return (
    <>
      <header className="sticky top-0 z-30 h-14 flex items-center gap-3 px-4 bg-[var(--bg-primary)]/80 backdrop-blur-md border-b border-[var(--border-subtle)]">
        {/* Mobile menu button */}
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-lg text-[var(--text-muted)] hover:bg-[var(--bg-tertiary)] transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Search bar */}
        <div className="flex-1 max-w-md">
          <button
            onClick={() => { setSearchOpen(true); setTimeout(() => searchRef.current?.focus(), 100) }}
            className="flex items-center gap-2 w-full h-9 px-3 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-[var(--text-muted)] text-sm hover:border-[var(--border-default)] transition-colors"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Search transactions...</span>
            <span className="ml-auto text-xs text-[var(--text-muted)] hidden sm:block">⌘K</span>
          </button>
        </div>

        <div className="flex items-center gap-1 ml-auto">
          {/* Theme toggle */}
          <button
            onClick={() => setTheme(isDark ? 'light' : 'dark')}
            className="p-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors"
            aria-label="Toggle theme"
          >
            <AnimatePresence mode="wait">
              {mounted && (isDark ? (
                <motion.div key="sun" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}>
                  <Sun className="w-4 h-4" />
                </motion.div>
              ) : (
                <motion.div key="moon" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.15 }}>
                  <Moon className="w-4 h-4" />
                </motion.div>
              ))}
            </AnimatePresence>
          </button>

          {/* Notifications */}
          <div ref={notifRef} className="relative">
            <button
              onClick={() => setNotifOpen(!notifOpen)}
              className="relative p-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors"
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
              )}
            </button>

            <AnimatePresence>
              {notifOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.97 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full mt-2 w-80 rounded-xl bg-[var(--bg-card)] border border-[var(--border-default)] shadow-lg overflow-hidden"
                >
                  <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-subtle)]">
                    <p className="text-sm font-semibold text-[var(--text-primary)]">Notifications</p>
                    {unreadCount > 0 && (
                      <button
                        onClick={onNotificationRead}
                        className="text-xs text-violet-400 hover:text-violet-300 transition-colors"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>
                  <div className="max-h-80 overflow-y-auto divide-y divide-[var(--border-subtle)]">
                    {notifications.length === 0 ? (
                      <div className="py-8 text-center text-sm text-[var(--text-muted)]">No notifications</div>
                    ) : notifications.slice(0, 5).map(n => (
                      <div key={n.id} className={cn('px-4 py-3', !n.read && 'bg-violet-500/5')}>
                        <div className="flex items-start gap-2">
                          <div className={cn('w-1.5 h-1.5 rounded-full mt-1.5 shrink-0', n.read ? 'bg-transparent' : 'bg-violet-400')} />
                          <div>
                            <p className="text-sm font-medium text-[var(--text-primary)]">{n.title}</p>
                            <p className="text-xs text-[var(--text-secondary)] mt-0.5">{n.message}</p>
                            <p className="text-xs text-[var(--text-muted)] mt-1">{formatRelativeTime(n.createdAt)}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <Link href="/notifications" onClick={() => setNotifOpen(false)}>
                    <div className="px-4 py-3 border-t border-[var(--border-subtle)] text-center text-xs font-medium text-violet-400 hover:text-violet-300 transition-colors cursor-pointer">
                      View all notifications
                    </div>
                  </Link>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* User Avatar */}
          <div ref={profileRef} className="relative">
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="flex items-center gap-2 pl-2 pr-1 py-1 rounded-lg hover:bg-[var(--bg-tertiary)] transition-colors"
            >
              <div className="w-7 h-7 rounded-full gradient-brand flex items-center justify-center text-white text-xs font-bold">
                {avatarLetter}
              </div>
              <span className="text-sm text-[var(--text-primary)] hidden sm:block max-w-[100px] truncate">{displayName}</span>
            </button>

            <AnimatePresence>
              {profileOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.97 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full mt-2 w-52 rounded-xl bg-[var(--bg-card)] border border-[var(--border-default)] shadow-lg overflow-hidden py-1"
                >
                  <div className="px-3 py-2 border-b border-[var(--border-subtle)] mb-1">
                    <p className="text-sm font-semibold text-[var(--text-primary)] truncate">{displayName}</p>
                    <p className="text-xs text-[var(--text-muted)] truncate">{user?.email}</p>
                  </div>
                  <Link href="/settings" onClick={() => setProfileOpen(false)}>
                    <div className="flex items-center gap-2 px-3 py-2 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer">
                      <Settings className="w-3.5 h-3.5" />
                      Settings
                    </div>
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Sign out
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      {/* Global Search Modal */}
      <AnimatePresence>
        {searchOpen && (
          <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setSearchOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className="relative w-full max-w-lg bg-[var(--bg-card)] border border-[var(--border-default)] rounded-xl shadow-2xl overflow-hidden z-10"
            >
              <form onSubmit={handleSearch}>
                <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--border-subtle)]">
                  <Search className="w-5 h-5 text-[var(--text-muted)] shrink-0" />
                  <input
                    ref={searchRef}
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search by title, category, amount, notes…"
                    className="flex-1 bg-transparent text-[var(--text-primary)] placeholder:text-[var(--text-muted)] text-sm outline-none"
                  />
                  <button type="button" onClick={() => setSearchOpen(false)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </form>
              <div className="px-4 py-3 text-xs text-[var(--text-muted)]">
                Press <kbd className="px-1.5 py-0.5 rounded bg-[var(--bg-tertiary)] font-mono">Enter</kbd> to search all transactions
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  )
}
