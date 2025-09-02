'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { XMarkIcon, LockClosedIcon, ShieldCheckIcon, ClockIcon } from '@heroicons/react/24/outline'
import { sendOTP, formatContactForDisplay, getOTPConfig } from '@/lib/otpService'
import { useAuth } from '@/contexts/AuthContext'

interface AdminOTPModalProps {
  isOpen: boolean
  onClose: () => void
  adminEmail: string
  onSuccess?: () => void
}

const AdminOTPModal = ({ isOpen, onClose, adminEmail, onSuccess }: AdminOTPModalProps) => {
  const [otpCode, setOtpCode] = useState(['', '', '', '', '', ''])
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [timeLeft, setTimeLeft] = useState(0)
  const [step, setStep] = useState<'sending' | 'verifying'>('sending')
  const { completeAdminOTP } = useAuth()
  
  const otpConfig = getOTPConfig()

  // Send OTP on mount
  useEffect(() => {
    if (isOpen && adminEmail) {
      sendOTPCode()
    }
  }, [isOpen, adminEmail])

  // Countdown timer for resend
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null
    if (timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((time) => time - 1)
      }, 1000)
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [timeLeft])

  const sendOTPCode = async () => {
    setIsLoading(true)
    setError('')
    setStep('sending')

    try {
      const result = await sendOTP(adminEmail, 'email', {
        shouldCreateUser: false,
        data: {
          role: 'admin',
          login_type: 'admin_otp'
        }
      })

      if (result.success) {
        setStep('verifying')
        setTimeLeft(otpConfig.rateLimitSeconds)
      } else {
        setError(result.error || 'Failed to send OTP. Please try again.')
      }
    } catch (err) {
      setError('Network error. Please check your connection.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleOTPChange = (index: number, value: string) => {
    if (value.length > 1) return // Prevent multiple characters
    
    const newOtp = [...otpCode]
    newOtp[index] = value

    setOtpCode(newOtp)
    setError('')

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`)
      nextInput?.focus()
    }

    // Auto-submit when all fields are filled
    if (newOtp.every(digit => digit) && newOtp.join('').length === 6) {
      verifyOTPCode(newOtp.join(''))
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otpCode[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`)
      prevInput?.focus()
    }
  }

  const verifyOTPCode = async (code?: string) => {
    const codeToVerify = code || otpCode.join('')
    if (codeToVerify.length !== 6) {
      setError('Please enter the complete 6-digit code.')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const result = await completeAdminOTP(adminEmail, codeToVerify)

      if (result.success) {
        // Clear form and close
        setOtpCode(['', '', '', '', '', ''])
        setError('')
        onSuccess?.()
        onClose()
      } else {
        setError(result.error || 'Invalid verification code. Please try again.')
      }
    } catch (err) {
      setError('Verification failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendOTP = async () => {
    if (timeLeft > 0) return

    setIsResending(true)
    await sendOTPCode()
    setIsResending(false)
  }

  const handleClose = () => {
    setOtpCode(['', '', '', '', '', ''])
    setError('')
    setStep('sending')
    setTimeLeft(0)
    onClose()
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/50 z-50"
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-green-500 to-green-600 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center">
                      <ShieldCheckIcon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-white">Admin Verification</h2>
                      <p className="text-green-100 text-sm">Enter the code sent to your email</p>
                    </div>
                  </div>
                  <button
                    onClick={handleClose}
                    className="p-2 hover:bg-white/10 rounded-xl transition-colors"
                  >
                    <XMarkIcon className="w-5 h-5 text-white" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                {step === 'sending' ? (
                  <div className="text-center">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Sending Verification Code</h3>
                    <p className="text-gray-600 text-sm">
                      Please wait while we send a secure code to {formatContactForDisplay(adminEmail, 'email')}
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Email Display */}
                    <div className="text-center mb-6">
                      <p className="text-gray-600 text-sm mb-2">Verification code sent to:</p>
                      <p className="font-medium text-gray-900">{formatContactForDisplay(adminEmail, 'email')}</p>
                    </div>

                    {/* OTP Input */}
                    <div className="mb-6">
                      <label className="block text-sm font-medium text-gray-700 mb-3 text-center">
                        Enter 6-digit verification code
                      </label>
                      <div className="flex justify-center space-x-3">
                        {otpCode.map((digit, index) => (
                          <input
                            key={index}
                            id={`otp-${index}`}
                            type="text"
                            value={digit}
                            onChange={(e) => handleOTPChange(index, e.target.value)}
                            onKeyDown={(e) => handleKeyDown(index, e)}
                            className="w-12 h-12 text-center text-lg font-bold border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                            maxLength={1}
                            disabled={isLoading}
                          />
                        ))}
                      </div>
                    </div>

                    {error && (
                      <div className="mb-4 p-3 bg-red-50 rounded-xl border border-red-200">
                        <p className="text-red-600 text-sm flex items-center space-x-1">
                          <span>⚠️</span>
                          <span>{error}</span>
                        </p>
                      </div>
                    )}

                    {/* Resend Section */}
                    <div className="mb-6 text-center">
                      {timeLeft > 0 ? (
                        <p className="text-gray-500 text-sm flex items-center justify-center space-x-1">
                          <ClockIcon className="w-4 h-4" />
                          <span>Resend code in {formatTime(timeLeft)}</span>
                        </p>
                      ) : (
                        <button
                          onClick={handleResendOTP}
                          disabled={isResending}
                          className="text-green-600 hover:text-green-700 text-sm font-medium disabled:text-gray-400"
                        >
                          {isResending ? 'Sending...' : 'Resend verification code'}
                        </button>
                      )}
                    </div>

                    {/* Security Notice */}
                    <div className="mb-6 p-3 bg-blue-50 rounded-xl border border-blue-200">
                      <p className="text-xs text-blue-700 mb-1 flex items-center space-x-1">
                        <span>🔐</span>
                        <span className="font-medium">Enhanced Security</span>
                      </p>
                      <p className="text-xs text-blue-600">
                        Code expires in {Math.floor(otpConfig.expirySeconds / 60)} minutes. Check your spam folder if not received.
                      </p>
                    </div>

                    {/* Buttons */}
                    <div className="flex space-x-3">
                      <button
                        type="button"
                        onClick={handleClose}
                        className="flex-1 py-3 px-4 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium transition-colors"
                        disabled={isLoading}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => verifyOTPCode()}
                        className="flex-1 py-3 px-4 bg-green-500 hover:bg-green-600 disabled:bg-green-300 text-white rounded-xl font-medium transition-colors flex items-center justify-center"
                        disabled={isLoading || otpCode.join('').length !== 6}
                      >
                        {isLoading ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin mr-2"></div>
                            Verifying...
                          </>
                        ) : (
                          <>
                            <LockClosedIcon className="w-4 h-4 mr-2" />
                            Verify
                          </>
                        )}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

export default AdminOTPModal