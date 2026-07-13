'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Home, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/Button'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: 'var(--bg-primary)' }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center max-w-md"
      >
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, type: 'spring' }}
          className="text-8xl font-black text-gradient mb-4"
        >
          404
        </motion.div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-3">Page not found</h1>
        <p className="text-[var(--text-secondary)] mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="flex gap-3 justify-center">
          <Link href="/dashboard">
            <Button leftIcon={<Home className="w-4 h-4" />}>Go to Dashboard</Button>
          </Link>
          <Button variant="secondary" onClick={() => window.history.back()} leftIcon={<ArrowLeft className="w-4 h-4" />}>
            Go Back
          </Button>
        </div>
      </motion.div>
    </div>
  )
}
