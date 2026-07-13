'use client'

import { ThemeProvider as NextThemesProvider } from 'next-themes'

// React 19 throws a warning when next-themes injects its flash-prevention script.
// This override silences the warning in development, as it is a false-positive.
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  const originalError = console.error
  console.error = (...args) => {
    if (typeof args[0] === 'string' && args[0].includes('Encountered a script tag')) {
      return
    }
    originalError.apply(console, args)
  }
}

export function ThemeProvider({ children }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem
      disableTransitionOnChange={false}
    >
      {children}
    </NextThemesProvider>
  )
}

