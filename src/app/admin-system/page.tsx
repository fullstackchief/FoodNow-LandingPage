'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { useAuth } from '@/contexts/AuthContext'
import Button from '@/components/ui/Button'
import { 
  LockClosedIcon, 
  EyeIcon, 
  EyeSlashIcon,
  ShieldCheckIcon,
  CommandLineIcon
} from '@heroicons/react/24/outline'

export default function AdminSystemLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { loginAsAdmin, isAdminAuthenticated, adminUser } = useAuth()
  const router = useRouter()


  // Redirect if already authenticated
  useEffect(() => {
    if (isAdminAuthenticated && adminUser) {
      router.push('/admin-system/dashboard')
    }
  }, [isAdminAuthenticated, adminUser, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const result = await loginAsAdmin(email, password)
      if (result.success) {
        // Direct admin authentication successful - redirect handled by useEffect
        setEmail('')
        setPassword('')
        setError('')
      } else {
        setError(result.error || 'Invalid administrator credentials. Please verify your email and password.')
      }
    } catch {
      setError('Authentication failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  // Don't render if already authenticated (will redirect)
  if (isAdminAuthenticated && adminUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Redirecting to admin dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full space-y-8"
      >
        {/* Header */}
        <div className="text-center">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="flex items-center justify-center mb-6"
          >
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-2xl">
              <CommandLineIcon className="w-8 h-8 text-white" />
            </div>
          </motion.div>
          
          <motion.h2
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="text-3xl font-bold text-white mb-2"
          >
            System Administration
          </motion.h2>
          
          <motion.p
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="text-blue-200"
          >
            Secure access to administrative functions
          </motion.p>
        </div>

        {/* Login Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 p-8"
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field */}
            <div>
              <label className="block text-sm font-medium text-blue-100 mb-2">
                Administrator Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent backdrop-blur-sm"
                placeholder="Enter your admin email"
                required
                disabled={isLoading}
              />
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-sm font-medium text-blue-100 mb-2">
                Administrator Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 pr-12 bg-white/10 border border-white/20 rounded-xl text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent backdrop-blur-sm"
                  placeholder="Enter your admin password"
                  required
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 text-blue-200 hover:text-white transition-colors"
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeSlashIcon className="w-5 h-5" />
                  ) : (
                    <EyeIcon className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-4 bg-red-500/20 border border-red-500/30 rounded-xl"
              >
                <p className="text-red-200 text-sm flex items-center space-x-2">
                  <ShieldCheckIcon className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </p>
              </motion.div>
            )}

            {/* Security Notice */}
            <div className="p-4 bg-amber-500/20 border border-amber-500/30 rounded-xl">
              <div className="flex items-start space-x-2">
                <LockClosedIcon className="w-4 h-4 text-amber-200 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-amber-200 text-sm font-medium mb-1">
                    Secure Authentication Required
                  </p>
                  <p className="text-amber-300 text-xs">
                    This system uses advanced security protocols. All access attempts are logged and monitored.
                  </p>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              theme="admin"
              variant="primary"
              fullWidth
              loading={isLoading}
              disabled={!email || !password}
              icon={!isLoading ? <LockClosedIcon className="w-5 h-5" /> : undefined}
            >
              {isLoading ? 'Authenticating...' : 'Access System'}
            </Button>
          </form>
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.5 }}
          className="text-center"
        >
          <p className="text-blue-300 text-xs">
            © {new Date().getFullYear()} FoodNow Administration System
          </p>
          <p className="text-blue-400 text-xs mt-1">
            Authorized personnel only
          </p>
        </motion.div>
      </motion.div>

    </div>
  )
}