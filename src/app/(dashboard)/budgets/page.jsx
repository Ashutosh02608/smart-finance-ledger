'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, AlertTriangle, TrendingDown, Target, Edit, Trash } from 'lucide-react'
import axios from 'axios'
import { Button } from '@/components/ui/Button'
import { Input, Select } from '@/components/ui/Input'
import { Modal, ConfirmDialog } from '@/components/ui/Modal'
import { Badge, Skeleton, EmptyState } from '@/components/ui/index'
import { toast } from '@/components/ui/Toaster'
import { formatCurrency, DEFAULT_CATEGORIES } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { calculatePredictions } from '@/lib/predictions'
import { format } from 'date-fns'

const ALL_EXPENSE_CATS = DEFAULT_CATEGORIES.EXPENSE.map(c => c.name)

export default function BudgetsPage() {
  const [budgets, setBudgets] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editBudget, setEditBudget] = useState(null)
  const [deleteBudget, setDeleteBudget] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [month, setMonth] = useState(format(new Date(), 'yyyy-MM'))
  const [form, setForm] = useState({ category: '', limit: '', month })
  const [saving, setSaving] = useState(false)

  const fetchBudgets = async () => {
    setLoading(true)
    try {
      const res = await axios.get(`/api/budgets?month=${month}`)
      setBudgets(res.data.budgets)
    } catch {
      toast.error('Failed to load budgets')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchBudgets() }, [month])

  const handleSave = async () => {
    if (!form.category || !form.limit) return toast.warning('Fill all fields')
    setSaving(true)
    try {
      if (editBudget) {
        await axios.put(`/api/budgets/${editBudget.id}`, { limit: Number(form.limit) })
        toast.success('Budget updated')
      } else {
        await axios.post('/api/budgets', { ...form, limit: Number(form.limit), month: `${month}-01` })
        toast.success('Budget created')
      }
      setModalOpen(false)
      setEditBudget(null)
      setForm({ category: '', limit: '', month })
      fetchBudgets()
    } catch (e) {
      toast.error(e.response?.data?.error || 'Failed to save budget')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await axios.delete(`/api/budgets/${deleteBudget.id}`)
      toast.success('Budget deleted')
      setDeleteBudget(null)
      fetchBudgets()
    } catch {
      toast.error('Failed to delete budget')
    } finally {
      setDeleting(false)
    }
  }

  // Smart predictions
  const totalSpent = budgets.reduce((s, b) => s + b.spent, 0)
  const totalLimit = budgets.reduce((s, b) => s + b.limit, 0)
  const predictions = calculatePredictions({
    totalSpentThisMonth: totalSpent,
    budgets: budgets.map(b => ({ category: b.category, limit: b.limit, spent: b.spent })),
  })

  return (
    <>
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">Budgets</h1>
            <p className="text-sm text-[var(--text-secondary)] mt-1">Set and track monthly spending limits</p>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="month"
              value={month}
              onChange={e => setMonth(e.target.value)}
              className="h-9 rounded-lg border border-[var(--border-default)] bg-[var(--bg-secondary)] text-[var(--text-primary)] text-sm px-3 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
            />
            <Button leftIcon={<Plus className="w-4 h-4" />} onClick={() => { setEditBudget(null); setForm({ category: '', limit: '', month }); setModalOpen(true) }}>
              New Budget
            </Button>
          </div>
        </div>

        {/* Prediction Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Daily Burn Rate', value: formatCurrency(predictions.dailyBurnRate), color: 'text-amber-400' },
            { label: 'Projected Month-End', value: formatCurrency(predictions.projectedMonthEndSpend), color: 'text-red-400' },
            { label: 'Projected Savings', value: formatCurrency(predictions.projectedSavings), color: 'text-emerald-400' },
            { label: 'Month Progress', value: `${predictions.completionPercent}%`, color: 'text-violet-400' },
          ].map(item => (
            <div key={item.label} className="card p-4">
              <p className="text-xs text-[var(--text-muted)] mb-1">{item.label}</p>
              <p className={`text-lg font-bold ${item.color}`}>{item.value}</p>
            </div>
          ))}
        </div>

        {/* Budget Cards */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => <div key={i} className="card p-5"><Skeleton className="h-40 w-full" /></div>)}
          </div>
        ) : budgets.length === 0 ? (
          <div className="card">
            <EmptyState
              icon={<Target className="w-7 h-7" />}
              title="No budgets for this month"
              description="Create budgets to track and control your spending"
              action={<Button onClick={() => setModalOpen(true)} leftIcon={<Plus className="w-3.5 h-3.5" />}>Create Budget</Button>}
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {budgets.map((budget) => {
              const prediction = predictions.budgetPredictions.find(p => p.category === budget.category)
              return (
                <motion.div
                  key={budget.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn('card p-5', budget.isExceeded && 'border-red-500/30')}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        {budget.isExceeded && <AlertTriangle className="w-4 h-4 text-amber-400" />}
                        <h3 className="font-semibold text-[var(--text-primary)]">{budget.category}</h3>
                      </div>
                      <p className="text-xs text-[var(--text-muted)] mt-0.5">
                        {formatCurrency(budget.spent)} of {formatCurrency(budget.limit)} spent
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Badge variant={budget.isExceeded ? 'danger' : budget.percentage > 80 ? 'warning' : 'success'}>
                        {budget.percentage}%
                      </Badge>
                      <button onClick={() => { setEditBudget(budget); setForm({ category: budget.category, limit: String(budget.limit), month }); setModalOpen(true) }} className="p-1.5 rounded-lg text-[var(--text-muted)] hover:bg-[var(--bg-tertiary)] transition-colors">
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => setDeleteBudget(budget)} className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-red-400 hover:bg-red-500/10 transition-colors">
                        <Trash className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="h-2.5 bg-[var(--bg-tertiary)] rounded-full overflow-hidden mb-2">
                    <motion.div
                      className={cn('h-full rounded-full', budget.isExceeded ? 'bg-gradient-to-r from-red-600 to-red-400' : budget.percentage > 80 ? 'bg-gradient-to-r from-amber-500 to-amber-400' : 'bg-gradient-to-r from-violet-600 to-violet-400')}
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, budget.percentage)}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                    />
                  </div>

                  <div className="flex justify-between text-xs text-[var(--text-muted)]">
                    <span className={budget.isExceeded ? 'text-red-400 font-medium' : ''}>
                      {budget.isExceeded ? `Over by ${formatCurrency(Math.abs(budget.remaining))}` : `${formatCurrency(budget.remaining)} remaining`}
                    </span>
                    {prediction && (
                      <span className={cn(prediction.willExceed ? 'text-amber-400' : 'text-emerald-400')}>
                        Projected: {formatCurrency(prediction.projectedSpend)}
                      </span>
                    )}
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>

      {/* Budget Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editBudget ? 'Edit Budget' : 'New Budget'} size="sm">
        <div className="space-y-4">
          <Select
            label="Category"
            value={form.category}
            onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
            disabled={!!editBudget}
          >
            <option value="">Select category</option>
            {ALL_EXPENSE_CATS.map(c => <option key={c} value={c}>{c}</option>)}
          </Select>
          <Input
            label="Monthly Limit (₹)"
            type="number"
            min="1"
            placeholder="e.g., 5000"
            value={form.limit}
            onChange={e => setForm(f => ({ ...f, limit: e.target.value }))}
          />
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button isLoading={saving} onClick={handleSave}>{editBudget ? 'Update' : 'Create'} Budget</Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteBudget}
        onClose={() => setDeleteBudget(null)}
        onConfirm={handleDelete}
        isLoading={deleting}
        title="Delete Budget?"
        description={`Remove budget for "${deleteBudget?.category}"?`}
      />
    </>
  )
}
