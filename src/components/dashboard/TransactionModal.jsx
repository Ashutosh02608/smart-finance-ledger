'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Input, Textarea, Select } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { toast } from '@/components/ui/Toaster'
import axios from 'axios'
import { DEFAULT_CATEGORIES, PAYMENT_METHOD_LABELS } from '@/lib/utils'
import { format } from 'date-fns'

const schema = z.object({
  title: z.string().min(1, 'Title is required').max(100),
  amount: z.string().min(1, 'Amount is required').refine(v => !isNaN(Number(v)) && Number(v) > 0, 'Must be a positive number'),
  type: z.enum(['INCOME', 'EXPENSE']),
  category: z.string().min(1, 'Category is required'),
  date: z.string().min(1, 'Date is required'),
  notes: z.string().max(500).optional(),
  paymentMethod: z.enum(['CASH', 'CARD', 'BANK_TRANSFER', 'UPI', 'NET_BANKING']),
})

export function TransactionModal({ isOpen, onClose, onSuccess, editData }) {
  const [loading, setLoading] = useState(false)
  const isEdit = !!editData

  const { register, handleSubmit, watch, reset, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: editData ? {
      ...editData,
      amount: String(editData.amount),
      date: format(new Date(editData.date), 'yyyy-MM-dd'),
    } : {
      type: 'EXPENSE',
      date: format(new Date(), 'yyyy-MM-dd'),
      paymentMethod: 'CASH',
    },
  })

  const txType = watch('type')
  const categories = DEFAULT_CATEGORIES[txType] || []

  const onSubmit = async (data) => {
    setLoading(true)
    try {
      if (isEdit) {
        await axios.put(`/api/transactions/${editData.id}`, { ...data, amount: Number(data.amount) })
        toast.success('Transaction updated')
      } else {
        await axios.post('/api/transactions', { ...data, amount: Number(data.amount) })
        toast.success('Transaction added', { description: `${data.title} — ₹${Number(data.amount).toLocaleString()}` })
      }
      reset()
      onSuccess?.()
      onClose()
    } catch (e) {
      const msg = e.response?.data?.error || 'Something went wrong'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? 'Edit Transaction' : 'Add Transaction'}
      description={isEdit ? 'Update the transaction details below.' : 'Record a new income or expense entry.'}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Type Toggle */}
        <div className="flex rounded-lg border border-[var(--border-default)] overflow-hidden p-1 gap-1">
          {['EXPENSE', 'INCOME'].map(t => (
            <label
              key={t}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-sm font-medium cursor-pointer transition-all ${
                txType === t
                  ? t === 'INCOME'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-red-500/20 text-red-400 border border-red-500/30'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
              }`}
            >
              <input type="radio" value={t} {...register('type')} className="sr-only" />
              {t === 'INCOME' ? '↑ Income' : '↓ Expense'}
            </label>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Title"
            placeholder="e.g., Lunch at café"
            error={errors.title?.message}
            {...register('title')}
            wrapperClassName="col-span-2"
          />
          <Input
            label="Amount (₹)"
            type="number"
            step="0.01"
            placeholder="0.00"
            error={errors.amount?.message}
            {...register('amount')}
          />
          <Input
            label="Date"
            type="date"
            error={errors.date?.message}
            {...register('date')}
          />
          <Select
            label="Category"
            error={errors.category?.message}
            {...register('category')}
          >
            <option value="">Select category</option>
            {categories.map(c => (
              <option key={c.name} value={c.name}>{c.name}</option>
            ))}
          </Select>
          <Select
            label="Payment Method"
            error={errors.paymentMethod?.message}
            {...register('paymentMethod')}
          >
            {Object.entries(PAYMENT_METHOD_LABELS).map(([val, label]) => (
              <option key={val} value={val}>{label}</option>
            ))}
          </Select>
        </div>

        <Textarea
          label="Notes (optional)"
          placeholder="Add any additional details..."
          rows={2}
          error={errors.notes?.message}
          {...register('notes')}
        />

        <div className="flex gap-3 justify-end pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" isLoading={loading}>
            {isEdit ? 'Update Transaction' : 'Add Transaction'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
