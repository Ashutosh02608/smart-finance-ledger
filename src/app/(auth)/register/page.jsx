'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { toast } from '@/components/ui/Toaster'
import { Eye, EyeOff, Mail, Lock } from 'lucide-react'
import axios from 'axios'

const schema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
})

export default function RegisterPage() {
  const [loading, setLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)
  const router = useRouter()

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
  })

  const onSubmit = async ({ email, password, name }) => {
    setLoading(true)
    const supabase = createClient()
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { name } },
      })

      if (error) throw error

      if (data.user) {
        // Seed our DB user record, default categories, and send welcome email
        await axios.post('/api/auth/register', {
          userId: data.user.id,
          email,
          name,
        })
        toast.success('Account created!', { description: 'Check your email to verify your account.' })
        router.push('/dashboard')
      }
    } catch (e) {
      toast.error(e.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2">Create your account</h2>
      <p className="text-sm text-[var(--text-secondary)] mb-8">
        Already have an account?{' '}
        <Link href="/login" className="text-violet-400 hover:text-violet-300 font-medium transition-colors">
          Sign in
        </Link>
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Full Name"
          placeholder="Ashutosh Sharma"
          error={errors.name?.message}
          {...register('name')}
        />
        <Input
          label="Email"
          type="email"
          placeholder="you@example.com"
          leftIcon={<Mail className="w-3.5 h-3.5" />}
          error={errors.email?.message}
          {...register('email')}
        />
        <Input
          label="Password"
          type={showPass ? 'text' : 'password'}
          placeholder="At least 6 characters"
          leftIcon={<Lock className="w-3.5 h-3.5" />}
          rightIcon={
            <button type="button" onClick={() => setShowPass(!showPass)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
              {showPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>
          }
          error={errors.password?.message}
          {...register('password')}
        />
        <Button type="submit" isLoading={loading} className="w-full">
          Create Account
        </Button>
      </form>

      <p className="text-xs text-[var(--text-muted)] text-center mt-6">
        By creating an account, you agree to our terms of service and privacy policy.
      </p>
    </motion.div>
  )
}
