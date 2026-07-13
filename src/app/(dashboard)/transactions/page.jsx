'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Plus, Filter, Download, Trash2, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, TrendingUp, TrendingDown, MoreHorizontal, Edit, Trash } from 'lucide-react'
import axios from 'axios'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge, Skeleton, EmptyState } from '@/components/ui/index'
import { ConfirmDialog } from '@/components/ui/Modal'
import { TransactionModal } from '@/components/dashboard/TransactionModal'
import { toast } from '@/components/ui/Toaster'
import { formatCurrency, formatDate, debounce, highlightText } from '@/lib/utils'
import { cn } from '@/lib/utils'

const SORT_OPTIONS = [
  { key: 'date', label: 'Date' },
  { key: 'amount', label: 'Amount' },
  { key: 'title', label: 'Title' },
]

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState([])
  const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 1, limit: 20 })
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState({ type: '', category: '', startDate: '', endDate: '' })
  const [sortBy, setSortBy] = useState('date')
  const [sortDir, setSortDir] = useState('desc')
  const [selected, setSelected] = useState([])
  const [filterOpen, setFilterOpen] = useState(false)
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [editTx, setEditTx] = useState(null)
  const [deleteTx, setDeleteTx] = useState(null)
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [actionMenuId, setActionMenuId] = useState(null)
  const [currency, setCurrency] = useState('INR')

  const debouncedSearch = useRef(debounce((q) => fetchTransactions(1, q), 400)).current

  const fetchTransactions = useCallback(async (page = 1, searchQ = search) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page, limit: 20, search: searchQ,
        sortBy, sortDir,
        ...(filters.type && { type: filters.type }),
        ...(filters.category && { category: filters.category }),
        ...(filters.startDate && { startDate: filters.startDate }),
        ...(filters.endDate && { endDate: filters.endDate }),
      })
      const res = await axios.get(`/api/transactions?${params}`)
      setTransactions(res.data.transactions)
      setPagination(res.data.pagination)
    } catch {
      toast.error('Failed to load transactions')
    } finally {
      setLoading(false)
    }
  }, [search, filters, sortBy, sortDir])

  useEffect(() => { fetchTransactions() }, [sortBy, sortDir, filters])

  const handleSearch = (q) => {
    setSearch(q)
    debouncedSearch(q)
  }

  const handleSort = (key) => {
    if (sortBy === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortBy(key); setSortDir('desc') }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await axios.delete(`/api/transactions/${deleteTx.id}`)
      toast.success('Transaction deleted', {
        action: { label: 'Undo', onClick: () => {} }, // Undo placeholder
      })
      fetchTransactions()
      setDeleteTx(null)
    } catch {
      toast.error('Failed to delete transaction')
    } finally {
      setDeleting(false)
    }
  }

  const handleBulkDelete = async () => {
    setDeleting(true)
    try {
      await axios.delete('/api/transactions', { data: { ids: selected } })
      toast.success(`${selected.length} transactions deleted`)
      setSelected([])
      setBulkDeleteOpen(false)
      fetchTransactions()
    } catch {
      toast.error('Bulk delete failed')
    } finally {
      setDeleting(false)
    }
  }

  const handleExport = () => {
    const params = new URLSearchParams({ type: 'transactions' })
    window.open(`/api/export?${params}`, '_blank')
  }

  const toggleSelect = (id) => {
    setSelected(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id])
  }

  const toggleSelectAll = () => {
    setSelected(selected.length === transactions.length ? [] : transactions.map(t => t.id))
  }

  const SortIcon = ({ field }) => sortBy === field
    ? sortDir === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
    : null

  return (
    <>
      <div className="max-w-7xl mx-auto space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">Transactions</h1>
            <p className="text-sm text-[var(--text-secondary)] mt-1">{pagination.total} total records</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" leftIcon={<Download className="w-3.5 h-3.5" />} onClick={handleExport}>
              Export CSV
            </Button>
            <Button size="sm" leftIcon={<Plus className="w-3.5 h-3.5" />} onClick={() => setAddModalOpen(true)}>
              Add Transaction
            </Button>
          </div>
        </div>

        {/* Search + Filters */}
        <div className="card p-4 space-y-3">
          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                placeholder="Search by title, category, notes..."
                leftIcon={<Search className="w-3.5 h-3.5" />}
                value={search}
                onChange={e => handleSearch(e.target.value)}
              />
            </div>
            <Button
              variant={filterOpen ? 'brand' : 'secondary'}
              size="md"
              leftIcon={<Filter className="w-3.5 h-3.5" />}
              onClick={() => setFilterOpen(!filterOpen)}
            >
              Filters
            </Button>
          </div>

          <AnimatePresence>
            {filterOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
                  <select
                    value={filters.type}
                    onChange={e => setFilters(f => ({ ...f, type: e.target.value }))}
                    className="h-9 rounded-lg border border-[var(--border-default)] bg-[var(--bg-secondary)] text-[var(--text-primary)] text-sm px-3 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                  >
                    <option value="">All Types</option>
                    <option value="INCOME">Income</option>
                    <option value="EXPENSE">Expense</option>
                  </select>
                  <input
                    type="date"
                    value={filters.startDate}
                    onChange={e => setFilters(f => ({ ...f, startDate: e.target.value }))}
                    className="h-9 rounded-lg border border-[var(--border-default)] bg-[var(--bg-secondary)] text-[var(--text-primary)] text-sm px-3 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                    placeholder="From"
                  />
                  <input
                    type="date"
                    value={filters.endDate}
                    onChange={e => setFilters(f => ({ ...f, endDate: e.target.value }))}
                    className="h-9 rounded-lg border border-[var(--border-default)] bg-[var(--bg-secondary)] text-[var(--text-primary)] text-sm px-3 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                    placeholder="To"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setFilters({ type: '', category: '', startDate: '', endDate: '' })}
                  >
                    Clear Filters
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Bulk Actions */}
        <AnimatePresence>
          {selected.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-violet-500/10 border border-violet-500/30"
            >
              <span className="text-sm text-violet-300 font-medium">{selected.length} selected</span>
              <Button
                variant="danger"
                size="sm"
                leftIcon={<Trash2 className="w-3.5 h-3.5" />}
                onClick={() => setBulkDeleteOpen(true)}
              >
                Delete Selected
              </Button>
              <button onClick={() => setSelected([])} className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] ml-auto">
                Deselect all
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Table */}
        <div className="card overflow-hidden">
          {/* Table Header */}
          <div className="grid grid-cols-[auto_1fr_auto_auto_auto_auto] gap-4 items-center px-4 py-2.5 border-b border-[var(--border-subtle)] bg-[var(--bg-secondary)]">
            <input
              type="checkbox"
              checked={selected.length === transactions.length && transactions.length > 0}
              onChange={toggleSelectAll}
              className="w-4 h-4 accent-violet-500"
            />
            <button onClick={() => handleSort('title')} className="flex items-center gap-1 text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wide hover:text-[var(--text-primary)] text-left">
              Description <SortIcon field="title" />
            </button>
            <button onClick={() => handleSort('date')} className="flex items-center gap-1 text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wide hover:text-[var(--text-primary)]">
              Date <SortIcon field="date" />
            </button>
            <span className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wide">Category</span>
            <button onClick={() => handleSort('amount')} className="flex items-center gap-1 text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wide hover:text-[var(--text-primary)]">
              Amount <SortIcon field="amount" />
            </button>
            <span />
          </div>

          {/* Rows */}
          {loading ? (
            <div className="divide-y divide-[var(--border-subtle)]">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="grid grid-cols-[auto_1fr_auto_auto_auto_auto] gap-4 items-center px-4 py-3">
                  <Skeleton className="w-4 h-4 rounded" />
                  <div className="space-y-1.5"><Skeleton className="h-3.5 w-40" /><Skeleton className="h-3 w-24" /></div>
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-5 w-16 rounded-full" />
                  <Skeleton className="h-3.5 w-20" />
                  <Skeleton className="h-7 w-7 rounded-lg" />
                </div>
              ))}
            </div>
          ) : transactions.length === 0 ? (
            <EmptyState
              icon={<TrendingUp className="w-7 h-7" />}
              title="No transactions found"
              description={search ? `No results for "${search}"` : "Add your first transaction to get started."}
              action={!search && <Button size="sm" onClick={() => setAddModalOpen(true)} leftIcon={<Plus className="w-3.5 h-3.5" />}>Add Transaction</Button>}
            />
          ) : (
            <div className="divide-y divide-[var(--border-subtle)]">
              <AnimatePresence>
                {transactions.map((tx, i) => (
                  <motion.div
                    key={tx.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.02 }}
                    className={cn(
                      'grid grid-cols-[auto_1fr_auto_auto_auto_auto] gap-4 items-center px-4 py-3 hover:bg-[var(--bg-secondary)] transition-colors group',
                      selected.includes(tx.id) && 'bg-violet-500/5'
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={selected.includes(tx.id)}
                      onChange={() => toggleSelect(tx.id)}
                      className="w-4 h-4 accent-violet-500"
                    />
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center shrink-0', tx.type === 'INCOME' ? 'bg-emerald-500/15' : 'bg-red-500/15')}>
                        {tx.type === 'INCOME' ? <TrendingUp className="w-3.5 h-3.5 text-emerald-400" /> : <TrendingDown className="w-3.5 h-3.5 text-red-400" />}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-[var(--text-primary)] truncate" dangerouslySetInnerHTML={{ __html: highlightText(tx.title, search) }} />
                        {tx.notes && <p className="text-xs text-[var(--text-muted)] truncate">{tx.notes}</p>}
                      </div>
                    </div>
                    <span className="text-xs text-[var(--text-muted)] whitespace-nowrap">{formatDate(tx.date)}</span>
                    <Badge variant={tx.type === 'INCOME' ? 'income' : 'expense'}>{tx.category}</Badge>
                    <span className={cn('text-sm font-semibold whitespace-nowrap', tx.type === 'INCOME' ? 'text-emerald-400' : 'text-red-400')}>
                      {tx.type === 'INCOME' ? '+' : '-'}{formatCurrency(tx.amount, currency)}
                    </span>
                    {/* Action Menu */}
                    <div className="relative">
                      <button
                        onClick={() => setActionMenuId(actionMenuId === tx.id ? null : tx.id)}
                        className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-[var(--text-muted)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)] transition-all"
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                      <AnimatePresence>
                        {actionMenuId === tx.id && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="absolute right-0 top-full mt-1 w-36 bg-[var(--bg-card)] border border-[var(--border-default)] rounded-xl shadow-lg overflow-hidden z-20 py-1"
                          >
                            <button
                              onClick={() => { setEditTx(tx); setActionMenuId(null) }}
                              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]"
                            >
                              <Edit className="w-3.5 h-3.5" /> Edit
                            </button>
                            <button
                              onClick={() => { setDeleteTx(tx); setActionMenuId(null) }}
                              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-400 hover:bg-red-500/10"
                            >
                              <Trash className="w-3.5 h-3.5" /> Delete
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}

          {/* Pagination */}
          {!loading && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-[var(--border-subtle)]">
              <p className="text-xs text-[var(--text-muted)]">
                Showing {((pagination.page - 1) * pagination.limit) + 1}–{Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  leftIcon={<ChevronLeft className="w-3.5 h-3.5" />}
                  disabled={pagination.page === 1}
                  onClick={() => fetchTransactions(pagination.page - 1)}
                >
                  Previous
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  rightIcon={<ChevronRight className="w-3.5 h-3.5" />}
                  disabled={pagination.page === pagination.totalPages}
                  onClick={() => fetchTransactions(pagination.page + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <TransactionModal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onSuccess={fetchTransactions}
      />
      {editTx && (
        <TransactionModal
          isOpen={!!editTx}
          onClose={() => setEditTx(null)}
          onSuccess={() => { fetchTransactions(); setEditTx(null) }}
          editData={editTx}
        />
      )}
      <ConfirmDialog
        isOpen={!!deleteTx}
        onClose={() => setDeleteTx(null)}
        onConfirm={handleDelete}
        isLoading={deleting}
        title="Delete Transaction?"
        description={`This will permanently delete "${deleteTx?.title}". This cannot be undone.`}
      />
      <ConfirmDialog
        isOpen={bulkDeleteOpen}
        onClose={() => setBulkDeleteOpen(false)}
        onConfirm={handleBulkDelete}
        isLoading={deleting}
        title={`Delete ${selected.length} Transactions?`}
        description="This will permanently delete all selected transactions."
      />
    </>
  )
}
