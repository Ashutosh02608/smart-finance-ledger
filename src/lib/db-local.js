import { openDB } from 'idb'

const DB_NAME = 'smart-finance-db'
const DB_VERSION = 1

let dbPromise = null

function getDB() {
  if (typeof window === 'undefined') return null
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // Transactions store
        if (!db.objectStoreNames.contains('transactions')) {
          const txStore = db.createObjectStore('transactions', { keyPath: 'id' })
          txStore.createIndex('userId', 'userId')
          txStore.createIndex('date', 'date')
          txStore.createIndex('type', 'type')
        }

        // Sync queue store
        if (!db.objectStoreNames.contains('sync_queue')) {
          db.createObjectStore('sync_queue', { keyPath: 'id', autoIncrement: true })
        }

        // Cache meta store (for timestamps, pagination cursors)
        if (!db.objectStoreNames.contains('cache_meta')) {
          db.createObjectStore('cache_meta', { keyPath: 'key' })
        }

        // Dashboard cache store
        if (!db.objectStoreNames.contains('dashboard_cache')) {
          db.createObjectStore('dashboard_cache', { keyPath: 'key' })
        }
      },
    })
  }
  return dbPromise
}

// ─── Transactions ─────────────────────────────────────────────────────────────
export async function cacheTransactions(transactions) {
  const db = await getDB()
  if (!db) return
  const tx = db.transaction('transactions', 'readwrite')
  await Promise.all([
    ...transactions.map(t => tx.store.put(t)),
    tx.done,
  ])
}

export async function getCachedTransactions() {
  const db = await getDB()
  if (!db) return []
  return db.getAll('transactions')
}

export async function upsertLocalTransaction(transaction) {
  const db = await getDB()
  if (!db) return
  await db.put('transactions', transaction)
}

export async function deleteLocalTransaction(id) {
  const db = await getDB()
  if (!db) return
  await db.delete('transactions', id)
}

// ─── Sync Queue ───────────────────────────────────────────────────────────────
export async function enqueueSyncAction(action) {
  // action: { type: 'CREATE' | 'UPDATE' | 'DELETE', entity: string, payload: object, tempId?: string }
  const db = await getDB()
  if (!db) return
  await db.add('sync_queue', {
    ...action,
    enqueuedAt: new Date().toISOString(),
    retries: 0,
  })
}

export async function getSyncQueue() {
  const db = await getDB()
  if (!db) return []
  return db.getAll('sync_queue')
}

export async function removeSyncQueueItem(id) {
  const db = await getDB()
  if (!db) return
  await db.delete('sync_queue', id)
}

export async function clearSyncQueue() {
  const db = await getDB()
  if (!db) return
  await db.clear('sync_queue')
}

// ─── Dashboard Cache ──────────────────────────────────────────────────────────
export async function cacheDashboardData(key, data) {
  const db = await getDB()
  if (!db) return
  await db.put('dashboard_cache', {
    key,
    data,
    cachedAt: new Date().toISOString(),
  })
}

export async function getCachedDashboardData(key) {
  const db = await getDB()
  if (!db) return null
  const entry = await db.get('dashboard_cache', key)
  return entry ? entry.data : null
}

export async function clearAllCaches() {
  const db = await getDB()
  if (!db) return
  await Promise.all([
    db.clear('transactions'),
    db.clear('sync_queue'),
    db.clear('dashboard_cache'),
    db.clear('cache_meta'),
  ])
}
