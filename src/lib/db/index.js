import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import * as schema from './schema'

// Cached connection for serverless (avoids new connection per request)
const globalForDb = globalThis

if (!globalForDb.neonDb) {
  if (!process.env.DATABASE_URL) {
    console.error('[Neon] DATABASE_URL is not set. Database operations will fail.')
  }
  const sql = neon(process.env.DATABASE_URL || 'postgresql://placeholder')
  globalForDb.neonDb = drizzle(sql, { schema })
}

export const db = globalForDb.neonDb
