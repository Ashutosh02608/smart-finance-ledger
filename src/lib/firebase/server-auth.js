import { cookies } from 'next/headers'
import { auth } from './admin'

/**
 * Retrieve and verify the current logged-in Firebase user session on the server.
 * Returns null if unauthorized or expired.
 */
export async function getSessionUser() {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('__session')?.value

    if (!token) {
      return null
    }

    // Verify the Firebase ID token using Admin SDK
    const decodedToken = await auth.verifyIdToken(token)

    return {
      id: decodedToken.uid, // Map Firebase 'uid' to 'id' for DB schema compatibility
      email: decodedToken.email,
      name: decodedToken.name || decodedToken.email.split('@')[0],
    }
  } catch (error) {
    console.error('[getSessionUser Error]', error.message)
    return null
  }
}
