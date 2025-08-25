'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  XMarkIcon, 
  LockClosedIcon, 
  EyeIcon, 
  EyeSlashIcon, 
  EnvelopeIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon
} from '@heroicons/react/24/outline'
import { useEnhancedAdmin } from '@/contexts/EnhancedAdminContext'

interface EnhancedAdminLoginModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

const EnhancedAdminLoginModal = ({ isOpen, onClose, onSuccess }: EnhancedAdminLoginModalProps) => {
  const [email, setEmail] = useState('superadmin@foodnow.ng')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showCredentialsHint, setShowCredentialsHint] = useState(false)
  const [loginAttempts, setLoginAttempts] = useState(0)
  const { login } = useEnhancedAdmin()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const result = await login(email, password)
      
      if (result.success) {
        setEmail('')
        setPassword('')
        setLoginAttempts(0)
        onClose()
        if (onSuccess) onSuccess()
      } else {
        setError(result.error || 'Login failed')
        setLoginAttempts(prev => prev + 1)
        
        // Show credentials hint after 2 failed attempts
        if (loginAttempts >= 1) {
          setShowCredentialsHint(true)
        }
      }
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    setEmail('superadmin@foodnow.ng')
    setPassword('')
    setError('')
    setShowPassword(false)
    setShowCredentialsHint(false)
    setLoginAttempts(0)
    onClose()
  }

  const handleDemoLogin = () => {
    setEmail('superadmin@foodnow.ng')
    setPassword('FoodNow2025!')
    setShowCredentialsHint(false)
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm"
          onClick={handleClose}
        />

        {/* Modal */}
        <div className="flex min-h-screen items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-md bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center">
                  <LockClosedIcon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-gray-900">Admin Portal</h2>
                  <p className="text-sm text-gray-600">Secure authentication required</p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <XMarkIcon className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {/* Demo Credentials Hint */}
            {showCredentialsHint && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl"
              >
                <div className="flex items-start space-x-3">
                  <CheckCircleIcon className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-blue-900 mb-2">Demo Credentials</h3>
                    <div className="space-y-1 text-sm text-blue-800">
                      <p><span className="font-medium">Email:</span> superadmin@foodnow.ng</p>
                      <p><span className="font-medium">Password:</span> FoodNow2025!</p>
                    </div>
                    <button
                      onClick={handleDemoLogin}
                      className="mt-3 text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg transition-colors"
                    >
                      Auto-fill credentials
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center space-x-3"
              >
                <ExclamationTriangleIcon className="w-5 h-5 text-red-600" />
                <p className="text-red-800 text-sm font-medium">{error}</p>
              </motion.div>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email Input */}
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-3">
                  Admin Email Address
                </label>
                <div className="relative">
                  <EnvelopeIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@foodnow.ng"
                    required
                    className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-3">
                  Admin Password
                </label>
                <div className="relative">
                  <LockClosedIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your admin password"
                    required
                    className="w-full pl-12 pr-12 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? (
                      <EyeSlashIcon className="w-5 h-5" />
                    ) : (
                      <EyeIcon className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Login Button */}
              <motion.button
                type="submit"
                disabled={isLoading}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-bold py-4 px-6 rounded-xl transition-all duration-300 shadow-lg shadow-blue-500/30 disabled:shadow-none flex items-center justify-center space-x-2"
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Authenticating...</span>
                  </>
                ) : (
                  <>
                    <LockClosedIcon className="w-5 h-5" />
                    <span>Secure Login</span>
                  </>
                )}
              </motion.button>
            </form>

            {/* Security Notice */}
            <div className="mt-8 p-4 bg-gray-50 rounded-xl border border-gray-200">
              <div className="flex items-start space-x-3">
                <ClockIcon className="w-5 h-5 text-gray-500 mt-0.5" />
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-gray-900 mb-1">Security Information</h4>
                  <ul className="text-xs text-gray-600 space-y-1">
                    <li>• Sessions auto-expire for security</li>
                    <li>• Failed login attempts are monitored</li>
                    <li>• All admin activities are logged</li>
                    <li>• Password changes required every 15 days</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Development Notice */}
            <div className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
              <div className="flex items-center space-x-2">
                <ExclamationTriangleIcon className="w-4 h-4 text-yellow-600" />
                <p className="text-xs text-yellow-800">
                  <span className="font-semibold">Development Mode:</span> Demo credentials are pre-configured for testing.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  )
}

export default EnhancedAdminLoginModal