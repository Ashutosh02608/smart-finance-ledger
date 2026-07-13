import { Inter } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/components/providers/ThemeProvider'
import { AuthProvider } from '@/components/providers/AuthProvider'
import { Toaster } from '@/components/ui/Toaster'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata = {
  title: {
    default: 'Smart Finance Ledger',
    template: '%s | Smart Finance Ledger',
  },
  description:
    'A modern personal finance application to track income, expenses, budgets, and gain AI-powered spending insights.',
  keywords: ['finance', 'budget', 'expense tracker', 'personal finance', 'money management'],
  openGraph: {
    title: 'Smart Finance Ledger',
    description: 'Track your finances smarter with AI-powered insights.',
    type: 'website',
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`} style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
        <ThemeProvider>
          <AuthProvider>
            {children}
            <Toaster />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}

