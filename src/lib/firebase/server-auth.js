import { createRemoteJWKSet, jwtVerify } from 'jose'
import { cookies } from 'next/headers'

const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID

// Google's public JWKS for Firebase ID tokens — no private key needed
const JWKS = createRemoteJWKSet(
  new URL('https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com')
)

/**
 * Verify Firebase ID token from session cookie using Google's public keys.
 * No firebase-admin or FIREBASE_PRIVATE_KEY required.
 */
export async function getSessionUser() {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('__session')?.value
    if (!token) return null

    const { payload } = await jwtVerify(token, JWKS, {
      issuer: `https://securetoken.google.com/${PROJECT_ID}`,
      audience: PROJECT_ID,
    })

    return {
      id: payload.sub,
      email: payload.email,
      name: payload.name || payload.email?.split('@')[0],
    }
  } catch (error) {
    console.error('[getSessionUser Error]', error.message)
    return null
  }
}
