'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { CheckCircle, AlertCircle, Mail, Loader2, ArrowLeft, RefreshCw } from 'lucide-react'
import { supabase } from '@/lib/supabase-client'
import { devLog, prodLog } from '@/lib/logger'

export default function VerifyEmailPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [status, setStatus] = useState<'checking' | 'verifying' | 'success' | 'error' | 'expired' | 'pending'>('checking')
  const [message, setMessage] = useState('')
  const [isResending, setIsResending] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)
  
  const token = searchParams.get('token')
  const tokenHash = searchParams.get('token_hash')
  const type = searchParams.get('type')
  const email = searchParams.get('email')

  useEffect(() => {
    const initializeVerification = async () => {
      // Check if we have verification parameters
      if (token || tokenHash) {
        // Automatic verification from email link
        setStatus('verifying')
        await verifyEmail()
      } else {
        // Manual verification page - show pending status
        setStatus('pending')
        setMessage('Please check your email for a verification link.')
      }
    }

    initializeVerification()
  }, [token, tokenHash, type, email])

  const verifyEmail = async () => {
    if (!token && !tokenHash) {
      setStatus('error')
      setMessage('Invalid verification link. Please check your email for the correct link.')
      return
    }

    try {
      devLog.info('Email verification initiated from URL', { 
        hasToken: !!token,
        hasTokenHash: !!tokenHash,
        type,
        email
      })

      // Use Supabase's verifyOtp method
      const verificationToken = tokenHash || token
      const { data, error } = await supabase.auth.verifyOtp({
        token_hash: verificationToken!,
        type: 'signup'
      })

      if (error) {
        prodLog.error('Email verification failed', error, { 
          hasToken: !!token,
          hasTokenHash: !!tokenHash,
          type,
          action: 'client_email_verification_failure'
        })

        if (error.message?.includes('expired')) {
          setStatus('expired')
          setMessage('This verification link has expired. Please request a new one.')
        } else if (error.message?.includes('invalid')) {
          setStatus('error')
          setMessage('This verification link is invalid. Please check your email for the correct link.')
        } else {
          setStatus('error')
          setMessage('Email verification failed. Please try again or request a new verification email.')
        }
        return
      }

      if (data?.user) {
        // Update user profile to mark as verified
        const { error: updateError } = await (supabase
          .from('users') as any)
          .update({ 
            is_verified: true,
            email_verified_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', data.user.id)

        if (updateError) {
          devLog.warn('Failed to update user verification status', { 
            userId: data.user.id,
            error: updateError.message 
          })
        }

        setStatus('success')
        setMessage('Your email has been verified successfully!')
        
        prodLog.info('Email verification successful', { 
          userId: data.user.id,
          email: data.user.email,
          action: 'client_email_verification_success'
        })

        // Redirect to login after success
        setTimeout(() => {
          router.push('/auth/login?verified=true')
        }, 3000)
      } else {
        setStatus('error')
        setMessage('Verification failed. No user data received.')
      }
    } catch (error) {
      prodLog.error('Email verification exception', error, { 
        action: 'client_email_verification_exception'
      })
      setStatus('error')
      setMessage('An unexpected error occurred during verification.')
    }
  }

  const handleResendVerification = async () => {
    if (!email) {
      setMessage('Cannot resend verification email. Please provide your email address.')
      return
    }

    setIsResending(true)
    
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/verify-email`
        }
      })

      if (error) {
        if (error.message?.includes('rate limit')) {
          setMessage('Please wait before requesting another verification email.')
          setResendCooldown(300) // 5 minutes
        } else if (error.message?.includes('already confirmed')) {
          setMessage('This email is already verified! You can sign in now.')
          setStatus('success')
        } else {
          setMessage('Failed to resend verification email. Please try again later.')
        }
      } else {
        setMessage('Verification email sent! Please check your inbox.')
        setResendCooldown(60) // 1 minute cooldown for successful send
      }
    } catch (error) {
      prodLog.error('Resend verification email failed', error)
      setMessage('Failed to resend verification email. Please try again later.')
    } finally {
      setIsResending(false)
    }
  }

  // Countdown effect for resend cooldown
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => {
        setResendCooldown(resendCooldown - 1)
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [resendCooldown])

  const getStatusIcon = () => {
    switch (status) {
      case 'checking':
      case 'verifying':
        return <Loader2 className="w-16 h-16 animate-spin text-orange-600" />
      case 'success':
        return <CheckCircle className="w-16 h-16 text-green-600" />
      case 'error':
      case 'expired':
        return <AlertCircle className="w-16 h-16 text-red-600" />
      case 'pending':
      default:
        return <Mail className="w-16 h-16 text-orange-600" />
    }
  }

  const getStatusTitle = () => {
    switch (status) {
      case 'checking':
        return 'Checking verification...'
      case 'verifying':
        return 'Verifying Your Email...'
      case 'success':
        return 'Email Verified!'
      case 'expired':
        return 'Link Expired'
      case 'error':
        return 'Verification Failed'
      case 'pending':
      default:
        return 'Check Your Email'
    }
  }

  const getStatusColor = () => {
    switch (status) {
      case 'success':
        return 'text-green-600'
      case 'error':
      case 'expired':
        return 'text-red-600'
      case 'checking':
      case 'verifying':
        return 'text-orange-600'
      case 'pending':
      default:
        return 'text-gray-900'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-green-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-between items-center mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>
          <Link href="/" className="text-2xl font-bold text-orange-600">
            FoodNow
          </Link>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <h2 className={`text-3xl font-extrabold ${getStatusColor()}`}>
            {getStatusTitle()}
          </h2>
        </motion.div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white py-8 px-4 shadow-xl sm:rounded-lg sm:px-10"
        >
          <div className="text-center">
            <div className="mx-auto mb-6">
              {getStatusIcon()}
            </div>

            <div className="mb-6">
              <p className="text-gray-600 mb-4">
                {message || (status === 'pending' ? "We've sent you a verification link. Please check your email and click the link to verify your account." : "")}
              </p>

              {status === 'success' && (
                <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-6">
                  <div className="flex">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                    <div className="ml-3">
                      <p className="text-sm text-green-800">
                        You can now sign in to your account. Redirecting you to login page...
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {(status === 'expired' || status === 'error') && (
                <div className="bg-orange-50 border border-orange-200 rounded-md p-4 mb-6">
                  <div className="flex">
                    <Mail className="w-5 h-5 text-orange-400" />
                    <div className="ml-3 text-left">
                      <p className="text-sm text-orange-800 mb-2">
                        Need a new verification email?
                      </p>
                      {email && (
                        <button
                          onClick={handleResendVerification}
                          disabled={isResending || resendCooldown > 0}
                          className="inline-flex items-center gap-2 text-sm font-medium text-orange-600 hover:text-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isResending ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <RefreshCw className="w-4 h-4" />
                          )}
                          {resendCooldown > 0 
                            ? `Resend in ${resendCooldown}s` 
                            : isResending 
                              ? 'Sending...' 
                              : 'Resend Verification Email'
                          }
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {status === 'pending' && (
                <div className="space-y-4">
                  <button
                    onClick={handleResendVerification}
                    disabled={isResending || resendCooldown > 0}
                    className="inline-flex items-center gap-2 text-orange-600 hover:text-orange-700 font-medium disabled:opacity-50"
                  >
                    {isResending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <RefreshCw className="w-4 h-4" />
                    )}
                    {resendCooldown > 0 
                      ? `Resend in ${resendCooldown}s` 
                      : isResending 
                        ? 'Sending...' 
                        : 'Resend verification email'
                    }
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-4">
              {status === 'success' ? (
                <Link
                  href="/auth/login?verified=true"
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  Continue to Sign In
                </Link>
              ) : (
                <Link
                  href="/auth/login"
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
                >
                  Go to Sign In
                </Link>
              )}

              <Link
                href="/auth/signup"
                className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
              >
                Create New Account
              </Link>
            </div>
          </div>

          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500 mb-2">Troubleshooting:</p>
            <ul className="text-xs text-gray-600 space-y-1">
              <li>• Check your spam/junk folder</li>
              <li>• Ensure you clicked the latest verification link</li>
              <li>• Links expire after 24 hours for security</li>
              <li>• Contact support if issues persist</li>
            </ul>
          </div>
        </motion.div>
      </div>
    </div>
  )
}