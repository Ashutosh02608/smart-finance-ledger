'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion } from 'framer-motion'
import { User, Bell, Palette, Trash2, Save, AlertTriangle } from 'lucide-react'
import axios from 'axios'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/Modal'
import { toast } from '@/components/ui/Toaster'
import { profileSchema } from '@/lib/validations'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

const TABS = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'appearance', label: 'Appearance', icon: Palette },
  { id: 'danger', label: 'Danger Zone', icon: Trash2 },
]

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('profile')
  const [user, setUser] = useState(null)
  const [saving, setSaving] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const router = useRouter()

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(profileSchema.partial()),
    defaultValues: { name: '', currency: 'INR', timezone: 'Asia/Kolkata', emailOnBudgetExceeded: true, emailOnLargeExpense: true, emailOnMonthlySummary: true },
  })

  useEffect(() => {
    axios.get('/api/user').then(res => {
      setUser(res.data.user)
      reset({
        name: res.data.user.name || '',
        currency: res.data.user.currency || 'INR',
        timezone: res.data.user.timezone || 'Asia/Kolkata',
        emailOnBudgetExceeded: res.data.user.emailOnBudgetExceeded,
        emailOnLargeExpense: res.data.user.emailOnLargeExpense,
        emailOnMonthlySummary: res.data.user.emailOnMonthlySummary,
      })
    }).catch(() => {})
  }, [reset])

  const onSave = async (data) => {
    setSaving(true)
    try {
      await axios.put('/api/user', data)
      toast.success('Settings saved')
    } catch {
      toast.error('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteAccount = async () => {
    setDeleting(true)
    try {
      await axios.delete('/api/user')
      const supabase = createClient()
      await supabase.auth.signOut()
      router.push('/')
      toast.success('Account deleted')
    } catch {
      toast.error('Failed to delete account')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <>
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Settings</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">Manage your account and preferences</p>
        </div>

        <div className="flex gap-1 border-b border-[var(--border-subtle)]">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium transition-all border-b-2 -mb-px',
                activeTab === tab.id
                  ? 'border-violet-500 text-violet-400'
                  : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]',
                tab.id === 'danger' && activeTab === 'danger' && 'border-red-500 text-red-400'
              )}
            >
              <tab.icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit(onSave)}>
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card p-6 space-y-4">
              <div className="flex items-center gap-4 pb-4 border-b border-[var(--border-subtle)]">
                <div className="w-16 h-16 rounded-2xl gradient-brand flex items-center justify-center text-white text-2xl font-bold">
                  {user?.name?.[0]?.toUpperCase() || '?'}
                </div>
                <div>
                  <p className="font-semibold text-[var(--text-primary)]">{user?.name}</p>
                  <p className="text-sm text-[var(--text-muted)]">{user?.email}</p>
                </div>
              </div>
              <Input label="Display Name" {...register('name')} error={errors.name?.message} placeholder="Your name" />
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-[var(--text-primary)]">Currency</label>
                  <select {...register('currency')} className="h-10 rounded-lg border border-[var(--border-default)] bg-[var(--bg-secondary)] text-[var(--text-primary)] text-sm px-3 focus:outline-none focus:ring-2 focus:ring-violet-500/50">
                    <option value="INR">INR (₹)</option>
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-[var(--text-primary)]">Timezone</label>
                  <select {...register('timezone')} className="h-10 rounded-lg border border-[var(--border-default)] bg-[var(--bg-secondary)] text-[var(--text-primary)] text-sm px-3 focus:outline-none focus:ring-2 focus:ring-violet-500/50">
                    <option value="Asia/Kolkata">IST (UTC+5:30)</option>
                    <option value="UTC">UTC</option>
                    <option value="America/New_York">EST (UTC-5)</option>
                    <option value="Europe/London">GMT</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end pt-2">
                <Button type="submit" isLoading={saving} leftIcon={<Save className="w-3.5 h-3.5" />}>Save Changes</Button>
              </div>
            </motion.div>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card p-6 space-y-4">
              <p className="text-sm text-[var(--text-secondary)]">Choose which email notifications you'd like to receive.</p>
              {[
                { key: 'emailOnBudgetExceeded', label: 'Budget Exceeded Alerts', desc: 'Get notified when spending exceeds a budget category' },
                { key: 'emailOnLargeExpense', label: 'Large Expense Alerts', desc: 'Get notified for expenses over ₹10,000' },
                { key: 'emailOnMonthlySummary', label: 'Monthly Summary', desc: 'Receive a monthly summary of your finances' },
              ].map(pref => (
                <div key={pref.key} className="flex items-center justify-between py-3 border-b border-[var(--border-subtle)] last:border-0">
                  <div>
                    <p className="text-sm font-medium text-[var(--text-primary)]">{pref.label}</p>
                    <p className="text-xs text-[var(--text-muted)]">{pref.desc}</p>
                  </div>
                  <input type="checkbox" {...register(pref.key)} className="w-4 h-4 accent-violet-500 cursor-pointer" />
                </div>
              ))}
              <div className="flex justify-end pt-2">
                <Button type="submit" isLoading={saving} leftIcon={<Save className="w-3.5 h-3.5" />}>Save Preferences</Button>
              </div>
            </motion.div>
          )}

          {/* Appearance Tab */}
          {activeTab === 'appearance' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card p-6">
              <p className="text-sm text-[var(--text-secondary)] mb-4">Theme is controlled by the toggle in the top navigation bar.</p>
              <div className="grid grid-cols-2 gap-3">
                {['dark', 'light'].map(t => (
                  <div key={t} className={cn('p-4 rounded-xl border-2 cursor-pointer', t === 'dark' ? 'bg-gray-900 border-violet-500' : 'bg-white border-gray-200')}>
                    <div className={cn('text-sm font-medium capitalize', t === 'dark' ? 'text-white' : 'text-gray-900')}>{t} Mode</div>
                    <div className="flex gap-1 mt-2">
                      {[1, 2, 3].map(i => (
                        <div key={i} className={cn('h-2 rounded-full flex-1', t === 'dark' ? 'bg-violet-500' : 'bg-violet-400')} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </form>

        {/* Danger Zone */}
        {activeTab === 'danger' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card p-6 border-red-500/30">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="w-5 h-5 text-red-400" />
              <h3 className="text-base font-semibold text-red-400">Danger Zone</h3>
            </div>
            <div className="flex items-center justify-between p-4 rounded-xl border border-red-500/20 bg-red-500/5">
              <div>
                <p className="text-sm font-semibold text-[var(--text-primary)]">Delete Account</p>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">Permanently delete your account and all associated data.</p>
              </div>
              <Button variant="danger" size="sm" onClick={() => setDeleteOpen(true)}>Delete Account</Button>
            </div>
          </motion.div>
        )}
      </div>

      <ConfirmDialog
        isOpen={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDeleteAccount}
        isLoading={deleting}
        title="Delete Your Account?"
        description="This will permanently delete all your data including transactions, budgets, and notifications. This cannot be undone."
        confirmLabel="Delete My Account"
      />
    </>
  )
}
