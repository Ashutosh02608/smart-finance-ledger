'use client'

import { useState, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { toast } from '@/components/ui/Toaster'
import { Eye, EyeOff, Mail, Lock } from 'lucide-react'

const schema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

function LoginForm() {
  const [loading, setLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect') || '/dashboard'

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
  })

  const onSubmit = async ({ email, password }) => {
    setLoading(true)
    const supabase = createClient()
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      toast.success('Welcome back!')
      router.push(redirect)
      router.refresh()
    } catch (e) {
      toast.error(e.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2">Welcome back</h2>
      <p className="text-sm text-[var(--text-secondary)] mb-8">
        Don't have an account?{' '}
        <Link href="/register" className="text-violet-400 hover:text-violet-300 font-medium transition-colors">
          Sign up for free
        </Link>
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Email"
          type="email"
          placeholder="you@example.com"
          leftIcon={<Mail className="w-3.5 h-3.5" />}
          error={errors.email?.message}
          {...register('email')}
          autoComplete="email"
        />
        <div>
          <Input
            label="Password"
            type={showPass ? 'text' : 'password'}
            placeholder="Your password"
            leftIcon={<Lock className="w-3.5 h-3.5" />}
            rightIcon={
              <button type="button" onClick={() => setShowPass(!showPass)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                {showPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            }
            error={errors.password?.message}
            {...register('password')}
            autoComplete="current-password"
          />
          <div className="flex justify-end mt-1">
            <Link href="/reset-password" className="text-xs text-violet-400 hover:text-violet-300 transition-colors">
              Forgot password?
            </Link>
          </div>
        </div>
        <Button type="submit" isLoading={loading} className="w-full">
          Sign In
        </Button>
      </form>
    </motion.div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="space-y-4">
        <div className="h-8 bg-[var(--bg-tertiary)] skeleton rounded w-1/3 mb-2" />
        <div className="h-4 bg-[var(--bg-tertiary)] skeleton rounded w-1/2 mb-8" />
        <div className="h-10 bg-[var(--bg-tertiary)] skeleton rounded w-full animate-pulse" />
        <div className="h-10 bg-[var(--bg-tertiary)] skeleton rounded w-full animate-pulse" />
        <div className="h-10 bg-[var(--bg-tertiary)] skeleton rounded w-full animate-pulse" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}

