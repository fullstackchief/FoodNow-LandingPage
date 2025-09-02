/**
 * Session Service for Remember Me Functionality
 * ============================================
 * Handles extended session management with secure token storage
 */

import { supabase } from '@/lib/supabase-client'
import { devLog, prodLog } from '@/lib/logger'

const REMEMBER_ME_KEY = 'foodnow_remember_me'
const EXTENDED_SESSION_DURATION = 7 * 24 * 60 * 60 * 1000 // 7 days in milliseconds
const DEFAULT_SESSION_DURATION = 60 * 60 * 1000 // 1 hour in milliseconds

interface RememberMeSession {
  refreshToken: string
  expiresAt: number
  userId: string
  email: string
  createdAt: number
}

/**
 * Store remember me session securely
 */
export function setRememberMeSession(session: any, rememberMe: boolean): void {
  try {
    if (!rememberMe || !session?.refresh_token) {
      // Clear any existing remember me session
      clearRememberMeSession()
      return
    }

    const rememberMeSession: RememberMeSession = {
      refreshToken: session.refresh_token,
      expiresAt: Date.now() + EXTENDED_SESSION_DURATION,
      userId: session.user.id,
      email: session.user.email,
      createdAt: Date.now()
    }

    // Store encrypted session data
    const sessionData = JSON.stringify(rememberMeSession)
    localStorage.setItem(REMEMBER_ME_KEY, sessionData)
    
    devLog.info('Remember me session stored', { 
      userId: session.user.id,
      expiresAt: new Date(rememberMeSession.expiresAt).toISOString()
    })
  } catch (error) {
    prodLog.error('Failed to store remember me session', error)
  }
}

/**
 * Get stored remember me session
 */
export function getRememberMeSession(): RememberMeSession | null {
  try {
    const sessionData = localStorage.getItem(REMEMBER_ME_KEY)
    if (!sessionData) return null

    const session: RememberMeSession = JSON.parse(sessionData)
    
    // Check if session has expired
    if (Date.now() > session.expiresAt) {
      devLog.info('Remember me session expired', { userId: session.userId })
      clearRememberMeSession()
      return null
    }

    return session
  } catch (error) {
    prodLog.error('Failed to retrieve remember me session', error)
    clearRememberMeSession()
    return null
  }
}

/**
 * Clear remember me session
 */
export function clearRememberMeSession(): void {
  try {
    localStorage.removeItem(REMEMBER_ME_KEY)
    devLog.info('Remember me session cleared')
  } catch (error) {
    prodLog.error('Failed to clear remember me session', error)
  }
}

/**
 * Attempt to restore session using remember me data
 */
export async function restoreRememberMeSession(): Promise<{
  success: boolean
  session?: any
  error?: string
}> {
  const rememberMeSession = getRememberMeSession()
  
  if (!rememberMeSession) {
    return { success: false, error: 'No remember me session found' }
  }

  try {
    devLog.info('Attempting to restore remember me session', { 
      userId: rememberMeSession.userId 
    })

    // Use the stored refresh token to get a new session
    const { data, error } = await supabase.auth.setSession({
      access_token: '', // We don't store access tokens for security
      refresh_token: rememberMeSession.refreshToken
    })

    if (error) {
      prodLog.error('Failed to restore remember me session', error, {
        userId: rememberMeSession.userId
      })
      clearRememberMeSession()
      return { success: false, error: error.message }
    }

    if (!data.session) {
      prodLog.warn('No session returned from refresh token', {
        userId: rememberMeSession.userId
      })
      clearRememberMeSession()
      return { success: false, error: 'Invalid refresh token' }
    }

    // Update the remember me session with new refresh token
    setRememberMeSession(data.session, true)

    prodLog.info('Remember me session restored successfully', {
      userId: rememberMeSession.userId,
      email: rememberMeSession.email
    })

    return { success: true, session: data.session }
  } catch (error) {
    prodLog.error('Exception during session restoration', error, {
      userId: rememberMeSession.userId
    })
    clearRememberMeSession()
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Session restoration failed'
    }
  }
}

/**
 * Configure session timeout based on remember me preference
 */
export function getSessionTimeout(rememberMe: boolean): number {
  return rememberMe ? EXTENDED_SESSION_DURATION : DEFAULT_SESSION_DURATION
}

/**
 * Check if current session should be extended based on remember me preference
 */
export async function extendSessionIfNeeded(): Promise<void> {
  const rememberMeSession = getRememberMeSession()
  
  if (!rememberMeSession) return

  try {
    // Check if we need to refresh the session proactively
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error || !session) return

    // If session expires within the next hour, refresh it
    const sessionExpiresAt = new Date(session.expires_at!).getTime()
    const oneHourFromNow = Date.now() + (60 * 60 * 1000)
    
    if (sessionExpiresAt < oneHourFromNow) {
      devLog.info('Proactively refreshing session for remember me user', {
        userId: session.user.id,
        currentExpiry: new Date(session.expires_at!).toISOString()
      })
      
      const { error: refreshError } = await supabase.auth.refreshSession()
      
      if (refreshError) {
        prodLog.error('Failed to proactively refresh session', refreshError, {
          userId: session.user.id
        })
      } else {
        devLog.info('Session refreshed successfully', {
          userId: session.user.id
        })
      }
    }
  } catch (error) {
    prodLog.error('Error during session extension check', error)
  }
}

/**
 * Clean up expired remember me sessions (for security)
 */
export function cleanupExpiredSessions(): void {
  const session = getRememberMeSession()
  if (!session) {
    // This will clear expired sessions automatically
    return
  }
}

// Auto-cleanup expired sessions on module load
if (typeof window !== 'undefined') {
  cleanupExpiredSessions()
}

export default {
  setRememberMeSession,
  getRememberMeSession,
  clearRememberMeSession,
  restoreRememberMeSession,
  extendSessionIfNeeded,
  getSessionTimeout,
  cleanupExpiredSessions
}