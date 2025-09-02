/**
 * Email Verification Guards
 * ========================
 * Protects certain actions and routes for unverified users
 */

import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase-client'
import { prodLog, devLog } from '@/lib/logger'

/**
 * Hook to check if current user is verified
 */
export function useVerificationStatus() {
  const { user, supabaseUser, isAuthenticated } = useAuth()
  const [isVerified, setIsVerified] = useState<boolean | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const checkVerificationStatus = async () => {
      if (!isAuthenticated || !supabaseUser) {
        setIsVerified(null)
        setIsLoading(false)
        return
      }

      try {
        // Check Supabase auth verification status first
        const emailConfirmed = !!supabaseUser.email_confirmed_at
        
        // Also check database verification status if user profile exists
        let dbVerified = false
        if (user) {
          dbVerified = user.is_verified || false
        }

        const finalVerificationStatus = emailConfirmed || dbVerified
        setIsVerified(finalVerificationStatus)
        
        devLog.info('Verification status checked', {
          userId: supabaseUser.id,
          emailConfirmed,
          dbVerified,
          finalStatus: finalVerificationStatus
        })
      } catch (error) {
        prodLog.error('Failed to check verification status', error, {
          userId: supabaseUser?.id
        })
        setIsVerified(false)
      } finally {
        setIsLoading(false)
      }
    }

    checkVerificationStatus()
  }, [user, supabaseUser, isAuthenticated])

  return { isVerified, isLoading }
}

/**
 * Hook to enforce email verification for certain actions
 */
export function useRequireVerification(redirectPath?: string) {
  const { isAuthenticated } = useAuth()
  const { isVerified, isLoading } = useVerificationStatus()
  const router = useRouter()
  const [shouldRedirect, setShouldRedirect] = useState(false)

  useEffect(() => {
    if (isLoading) return

    if (!isAuthenticated) {
      // Not authenticated - redirect to login
      router.push('/auth/login')
      return
    }

    if (isVerified === false) {
      // Authenticated but not verified
      setShouldRedirect(true)
      const targetPath = redirectPath || '/auth/verify-email?required=true'
      router.push(targetPath)
    }
  }, [isAuthenticated, isVerified, isLoading, router, redirectPath])

  return {
    isVerified,
    isLoading,
    shouldRedirect,
    canAccess: isAuthenticated && isVerified === true
  }
}

/**
 * Higher-order component to protect routes requiring verification
 */
export function withVerificationRequired<T extends object>(
  WrappedComponent: React.ComponentType<T>,
  options?: {
    redirectPath?: string
    showLoadingScreen?: boolean
  }
) {
  return function VerificationGuardedComponent(props: T) {
    const { canAccess, isLoading } = useRequireVerification(options?.redirectPath)

    if (isLoading && options?.showLoadingScreen !== false) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
        </div>
      )
    }

    if (!canAccess) {
      return null // Will be redirected
    }

    return <WrappedComponent {...props} />
  }
}

/**
 * Verification reminder component for unverified users
 */
export function VerificationReminder({ 
  className = '',
  onDismiss,
  showResendButton = true 
}: {
  className?: string
  onDismiss?: () => void
  showResendButton?: boolean
}) {
  const { supabaseUser } = useAuth()
  const { isVerified, isLoading } = useVerificationStatus()
  const [isResending, setIsResending] = useState(false)
  const [resendMessage, setResendMessage] = useState('')

  const handleResendVerification = async () => {
    if (!supabaseUser?.email) return

    setIsResending(true)
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: supabaseUser.email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/verify-email`
        }
      })

      if (error) {
        if (error.message?.includes('already confirmed')) {
          setResendMessage('Your email is already verified!')
        } else if (error.message?.includes('rate limit')) {
          setResendMessage('Please wait before requesting another email.')
        } else {
          setResendMessage('Failed to send verification email.')
        }
      } else {
        setResendMessage('Verification email sent! Check your inbox.')
      }
    } catch (error) {
      prodLog.error('Resend verification failed in reminder', error)
      setResendMessage('Failed to send verification email.')
    } finally {
      setIsResending(false)
    }
  }

  if (isLoading || isVerified !== false) {
    return null
  }

  return (
    <div className={`bg-yellow-50 border border-yellow-200 rounded-lg p-4 ${className}`}>
      <div className="flex">
        <div className="flex-shrink-0">
          <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="ml-3 flex-1">
          <p className="text-sm text-yellow-800 font-medium">
            Please verify your email address
          </p>
          <p className="text-sm text-yellow-700 mt-1">
            Some features are limited until you verify your email. Check your inbox for a verification link.
          </p>
          {resendMessage && (
            <p className="text-sm text-yellow-700 mt-2 font-medium">
              {resendMessage}
            </p>
          )}
          {showResendButton && (
            <div className="mt-3 flex space-x-3">
              <button
                onClick={handleResendVerification}
                disabled={isResending}
                className="text-sm font-medium text-yellow-800 hover:text-yellow-900 disabled:opacity-50"
              >
                {isResending ? 'Sending...' : 'Resend verification email'}
              </button>
              <a
                href="/auth/verify-email"
                className="text-sm font-medium text-yellow-800 hover:text-yellow-900"
              >
                Go to verification page
              </a>
            </div>
          )}
        </div>
        {onDismiss && (
          <div className="ml-auto pl-3">
            <div className="-mx-1.5 -my-1.5">
              <button
                onClick={onDismiss}
                className="inline-flex rounded-md p-1.5 text-yellow-500 hover:bg-yellow-100 focus:outline-none focus:ring-2 focus:ring-yellow-600 focus:ring-offset-2 focus:ring-offset-yellow-50"
              >
                <span className="sr-only">Dismiss</span>
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * Actions that require email verification
 */
export const VERIFICATION_REQUIRED_ACTIONS = [
  'place_order',
  'save_payment_method',
  'write_review',
  'update_profile_email',
  'delete_account',
  'apply_for_restaurant_owner',
  'apply_for_rider'
] as const

export type VerificationRequiredAction = typeof VERIFICATION_REQUIRED_ACTIONS[number]

/**
 * Check if an action requires verification
 */
export function requiresVerification(action: VerificationRequiredAction): boolean {
  return VERIFICATION_REQUIRED_ACTIONS.includes(action)
}

/**
 * Utility function to check verification status server-side
 */
export async function checkServerSideVerification(userId: string): Promise<boolean> {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('is_verified')
      .eq('id', userId)
      .single()

    if (error || !user) {
      prodLog.error('Failed to check server-side verification', error, { userId })
      return false
    }

    return (user as any).is_verified || false
  } catch (error) {
    prodLog.error('Exception in server-side verification check', error, { userId })
    return false
  }
}

export default {
  useVerificationStatus,
  useRequireVerification,
  withVerificationRequired,
  VerificationReminder,
  requiresVerification,
  checkServerSideVerification
}