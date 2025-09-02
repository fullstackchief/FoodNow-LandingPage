'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { Smartphone, Mail, RefreshCw, CheckCircle, ArrowLeft, Clock } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { sendOTP as sendOTPService, verifyOTP as verifyOTPService, getOTPConfig, validateContact } from '@/lib/otpService'
import type { OTPType } from '@/lib/otpService'
import { devLog, prodLog } from '@/lib/logger'
import Link from 'next/link'

export default function VerifyOTPPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, supabaseUser } = useAuth()
  
  // Get verification type and redirect URL from search params
  const verificationType = (searchParams.get('type') as OTPType) || 'sms'
  const contactParam = searchParams.get('contact') || ''
  const redirectTo = searchParams.get('redirect') || '/browse'
  
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [isVerifying, setIsVerifying] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [timeLeft, setTimeLeft] = useState(getOTPConfig().expirySeconds) // From config
  const [otpSent, setOtpSent] = useState(false)
  const [actualContact, setActualContact] = useState('')

  // Format time remaining
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Send OTP
  const sendOTP = useCallback(async () => {
    if (!user) {
      router.push('/auth/login')
      return
    }

    setIsResending(true)
    setError('')

    // Determine contact info
    let contactInfo = contactParam
    if (!contactInfo) {
      contactInfo = verificationType === 'email' 
        ? (supabaseUser?.email || '') 
        : (user?.phone || '')
    }

    try {

      // Validate contact info
      if (!validateContact(contactInfo, verificationType)) {
        setError(`Invalid ${verificationType === 'email' ? 'email address' : 'phone number'}`)
        setIsResending(false)
        return
      }

      const result = await sendOTPService(contactInfo, verificationType, {
        shouldCreateUser: false // Don't create new users via OTP
      })

      if (result.success) {
        setOtpSent(true)
        setActualContact(contactInfo)
        setTimeLeft(getOTPConfig().expirySeconds) // Reset timer
        setError('') // Clear any previous errors
      } else {
        setError(result.error || 'Failed to send OTP')
      }
    } catch (error) {
      prodLog.error('OTP send error', error, {
        contactInfo: contactInfo?.replace(/./g, '*'), // Mask contact for security
        verificationType,
        userId: user?.id
      })
      setError('Failed to send OTP. Please try again.')
    } finally {
      setIsResending(false)
    }
  }, [contactParam, verificationType, supabaseUser, user])

  // Auto-send OTP on mount if user exists or contact is provided
  useEffect(() => {
    if ((user || contactParam) && !otpSent) {
      sendOTP()
    }
  }, [contactParam, user, otpSent, sendOTP])

  // Countdown timer
  useEffect(() => {
    if (otpSent && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft(prev => prev - 1)
      }, 1000)
      return () => clearInterval(timer)
    }
  }, [otpSent, timeLeft])

  // Handle OTP input change
  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return
    
    const newOtp = [...otp]
    newOtp[index] = value
    setOtp(newOtp)
    setError('')

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`)
      nextInput?.focus()
    }

    // Auto-verify when all fields filled
    if (newOtp.every(digit => digit) && newOtp.join('').length === 6) {
      devLog.info('Auto-verifying OTP after all fields filled')
      verifyOTPHandler(newOtp.join(''))
    }
  }

  // Handle backspace
  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`)
      prevInput?.focus()
    }
  }

  // Verify OTP
  const verifyOTPHandler = async (otpCode?: string) => {
    const code = otpCode || otp.join('')
    if (code.length !== 6) {
      setError('Please enter the complete 6-digit code')
      return
    }

    // Get the contact info that was used to send OTP
    const contactInfo = actualContact || contactParam || (verificationType === 'email' 
      ? (supabaseUser?.email || '') 
      : (user?.phone || ''))

    if (!contactInfo) {
      setError('Unable to determine contact information for verification')
      return
    }

    setIsVerifying(true)
    setError('')

    try {
      const result = await verifyOTPService(contactInfo, code, verificationType)

      if (result.success) {
        setSuccess(true)
        
        // If we got a new session, the user is now authenticated
        if (result.session) {
          // The session will be picked up by AuthContext automatically
          prodLog.info('OTP verification successful', {
            verificationType,
            userId: user?.id,
            sessionId: result.session.user?.id
          })
          devLog.info('OTP verification successful, user authenticated')
        }
        
        setTimeout(() => {
          // Redirect to specified page or browse
          router.push(redirectTo)
        }, 2000)
      } else {
        prodLog.warn('OTP verification failed', {
          error: result.error,
          verificationType,
          userId: user?.id,
          contactMasked: contactInfo?.replace(/./g, '*')
        })
        setError(result.error || 'Invalid verification code')
        // Clear OTP inputs on error
        setOtp(['', '', '', '', '', ''])
        const firstInput = document.getElementById('otp-0')
        firstInput?.focus()
      }
    } catch (error) {
      prodLog.error('OTP verification error', error, {
        verificationType,
        userId: user?.id,
        contactMasked: contactInfo?.replace(/./g, '*')
      })
      setError('Verification failed. Please try again.')
    } finally {
      setIsVerifying(false)
    }
  }

  // Redirect if no user
  if (!user) {
    router.push('/auth/login')
    return null
  }

  const contact = verificationType === 'email' ? supabaseUser?.email || 'your email' : user.phone || 'your phone'
  const Icon = verificationType === 'email' ? Mail : Smartphone

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-green-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white py-8 px-4 shadow-xl sm:rounded-lg sm:px-10 text-center"
          >
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-6">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Verification Complete! ✅
            </h2>
            <p className="text-gray-600 mb-6">
              Your {verificationType} has been successfully verified.
            </p>
            <p className="text-sm text-gray-500">
              Redirecting you to continue your order...
            </p>
          </motion.div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-green-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-between items-center mb-8">
          <Link
            href="/auth/login"
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to login
          </Link>
          <Link href="/" className="text-2xl font-bold text-orange-600">
            FoodNow
          </Link>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white py-8 px-4 shadow-xl sm:rounded-lg sm:px-10"
        >
          <div className="text-center mb-8">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-orange-100 mb-6">
              <Icon className="h-8 w-8 text-orange-600" />
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Verify Your {verificationType === 'email' ? 'Email' : 'Phone Number'}
            </h2>
            <p className="text-gray-600 mb-4">
              We sent a 6-digit verification code to
            </p>
            <p className="font-semibold text-gray-900 mb-6">
              {contact}
            </p>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg"
            >
              <p className="text-red-600 text-sm text-center">{error}</p>
            </motion.div>
          )}

          <form onSubmit={(e) => { e.preventDefault(); verifyOTPHandler(); }}>
            {/* OTP Input Fields */}
            <div className="flex justify-center space-x-3 mb-6">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  id={`otp-${index}`}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(index, e.target.value.replace(/\D/g, ''))}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className="w-12 h-12 text-center text-xl font-bold border-2 rounded-lg focus:border-orange-500 focus:ring-2 focus:ring-orange-500 focus:ring-opacity-50 transition-colors"
                  disabled={isVerifying}
                />
              ))}
            </div>

            {/* Timer */}
            {otpSent && timeLeft > 0 && (
              <div className="text-center mb-6">
                <div className="flex items-center justify-center text-sm text-gray-500">
                  <Clock className="w-4 h-4 mr-1" />
                  Code expires in {formatTime(timeLeft)}
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isVerifying || otp.some(digit => !digit)}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
            >
              {isVerifying ? (
                <div className="flex items-center">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Verifying...
                </div>
              ) : (
                'Verify Code'
              )}
            </button>
          </form>

          {/* Resend OTP */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600 mb-3">
              Didn&apos;t receive the code?
            </p>
            <button
              onClick={sendOTP}
              disabled={isResending || (otpSent && timeLeft > 540)} // Allow resend after 1 minute
              className="text-orange-600 hover:text-orange-500 font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center mx-auto transition-colors"
            >
              {isResending ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                  Sending...
                </>
              ) : (
                'Resend Code'
              )}
            </button>
            
            {otpSent && timeLeft > 540 && (
              <p className="text-xs text-gray-500 mt-2">
                Please wait {Math.ceil((timeLeft - 540) / 60)} minute(s) before requesting a new code
              </p>
            )}
          </div>

          {/* Help text */}
          <div className="mt-8 text-center">
            <p className="text-xs text-gray-500">
              Secure checkout requires verification to protect your account
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}