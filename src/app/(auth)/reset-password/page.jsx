'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { toast } from '@/components/ui/Toaster'
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react'

const schema = z.object({
  email: z.string().email('Invalid email address'),
})

export default function ResetPasswordPage() {
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
  })

  const onSubmit = async ({ email }) => {
    setLoading(true)
    const supabase = createClient()
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/update-password`,
      })
      if (error) throw error
      setSent(true)
    } catch (e) {
      toast.error(e.message || 'Failed to send reset email')
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="text-center">
        <div className="w-16 h-16 rounded-2xl bg-emerald-500/15 flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-8 h-8 text-emerald-400" />
        </div>
        <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2">Check your email</h2>
        <p className="text-sm text-[var(--text-secondary)] mb-8">
          We've sent a password reset link to your email address. Check your inbox and click the link to reset your password.
        </p>
        <Link href="/login">
          <Button variant="secondary" leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}>
            Back to Login
          </Button>
        </Link>
      </motion.div>
    )
  }

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2">Reset your password</h2>
      <p className="text-sm text-[var(--text-secondary)] mb-8">
        Enter your email and we'll send you a password reset link.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Email"
          type="email"
          placeholder="you@example.com"
          leftIcon={<Mail className="w-3.5 h-3.5" />}
          error={errors.email?.message}
          {...register('email')}
        />
        <Button type="submit" isLoading={loading} className="w-full">
          Send Reset Link
        </Button>
      </form>

      <div className="mt-6 text-center">
        <Link href="/login" className="text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] flex items-center justify-center gap-1.5 transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Login
        </Link>
      </div>
    </motion.div>
  )
}
