'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { onIdTokenChanged } from 'firebase/auth'
import { auth } from '@/lib/firebase/client'

const AuthContext = createContext({ user: null, loading: true })

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Listen for auth state changes & set session cookie
    const unsubscribe = onIdTokenChanged(auth, async (currentUser) => {
      try {
        if (currentUser) {
          setUser(currentUser)
          const token = await currentUser.getIdToken()
          // Set cookie with expiration (matches token expiry)
          document.cookie = `__session=${token}; path=/; max-age=3600; SameSite=Lax; Secure`
        } else {
          setUser(null)
          // Clear cookie
          document.cookie = '__session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax; Secure'
        }
      } catch (error) {
        console.error('Error handling auth state change:', error)
      } finally {
        setLoading(false)
      }
    })

    return () => unsubscribe()
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
