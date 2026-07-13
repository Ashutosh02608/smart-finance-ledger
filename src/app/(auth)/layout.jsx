import Link from 'next/link'
import { TrendingUp } from 'lucide-react'

export const metadata = {
  title: 'Authentication',
}

export default function AuthLayout({ children }) {
  return (
    <div className="min-h-screen flex" style={{ background: 'var(--bg-primary)' }}>
      {/* Left: Brand Panel */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #0a0f1e 0%, #1a1040 100%)' }}>
        <div className="absolute inset-0 opacity-30" style={{
          backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(99, 102, 241, 0.4) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(139, 92, 246, 0.3) 0%, transparent 50%)',
        }} />
        <div className="relative z-10 flex flex-col justify-center p-12">
          <div className="flex items-center gap-3 mb-12">
            <div className="w-10 h-10 rounded-xl gradient-brand flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white">Smart Finance</span>
          </div>
          <h1 className="text-4xl font-bold text-white leading-tight mb-6">
            Take control of your <span className="text-gradient">finances</span>
          </h1>
          <p className="text-lg text-slate-300 mb-10">
            Track income, manage budgets, and get AI-powered spending insights — all in one beautiful dashboard.
          </p>
          <div className="space-y-4">
            {[
              '📊 Real-time financial analytics',
              '🎯 Smart budget tracking & alerts',
              '🧠 AI spending insights',
              '💯 Financial health score',
              '🔄 Works offline too',
            ].map(f => (
              <div key={f} className="flex items-center gap-3 text-slate-300 text-sm">
                <div className="w-1.5 h-1.5 rounded-full bg-violet-400 shrink-0" />
                {f}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right: Auth Form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 rounded-xl gradient-brand flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold text-[var(--text-primary)]">Smart Finance</span>
          </div>
          {children}
        </div>
      </div>
    </div>
  )
}
