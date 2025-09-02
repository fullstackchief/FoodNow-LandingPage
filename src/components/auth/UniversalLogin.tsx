'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { 
  signInUser, 
  getCurrentUserProfile,
  getDashboardRoute,
  type UserRole 
} from '@/lib/authService'
import { 
  EyeIcon, 
  EyeSlashIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline'

interface UniversalLoginProps {
  redirectTo?: string
  expectedRole?: UserRole
}

const UniversalLogin = ({ redirectTo, expectedRole }: UniversalLoginProps) => {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const validateForm = (): string | null => {
    if (!formData.email.trim()) return 'Email is required'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) return 'Invalid email format'
    if (!formData.password) return 'Password is required'
    
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const validationError = validateForm()
    if (validationError) {
      setError(validationError)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // Sign in user
      const { data: user, error: signInError } = await signInUser(formData.email, formData.password)

      if (signInError || !user) {
        setError(signInError || 'Failed to sign in')
        return
      }

      // Get user profile to determine role and redirect
      const { data: profile, error: profileError } = await getCurrentUserProfile()

      if (profileError || !profile) {
        setError('Failed to load user profile')
        return
      }

      // Check if user account is active
      if (!profile.is_active) {
        setError('Your account has been deactivated. Please contact support.')
        return
      }

      // Check if expected role matches (if specified)
      if (expectedRole && profile.user_role !== expectedRole) {
        setError(`This login is for ${expectedRole} accounts only. Your account type is ${profile.user_role}.`)
        return
      }

      // Redirect based on role or custom redirect
      const destination = redirectTo || getDashboardRoute(profile.user_role || 'customer')
      router.push(destination)
    } catch (error) {
      console.error('Login error:', error)
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  // Get role-specific branding
  const getRoleBranding = () => {
    if (expectedRole) {
      const branding = {
        customer: {
          title: 'Welcome back',
          subtitle: 'Sign in to order delicious food',
          color: 'orange'
        },
        restaurant_owner: {
          title: 'Partner Portal',
          subtitle: 'Sign in to manage your restaurant',
          color: 'blue'
        },
        rider: {
          title: 'Rider Portal',
          subtitle: 'Sign in to start delivering',
          color: 'green'
        }
      }

      return branding[expectedRole]
    }

    return {
      title: 'Welcome back',
      subtitle: 'Sign in to your FoodNow account',
      color: 'orange'
    }
  }

  const branding = getRoleBranding()

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            {branding.title}
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {branding.subtitle}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-3xl shadow-premium p-8"
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleInputChange}
                className="mt-1 w-full px-3 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="Enter your email"
              />
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="mt-1 relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full px-3 py-3 pr-12 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                  ) : (
                    <EyeIcon className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            {/* Forgot Password Link */}
            <div className="text-right">
              <Link 
                href="/auth/forgot-password" 
                className="text-sm font-medium text-orange-600 hover:text-orange-500"
              >
                Forgot your password?
              </Link>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed group"
            >
              {isLoading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Signing in...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center space-x-2">
                  <span>Sign In</span>
                  <ArrowRightIcon className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              )}
            </button>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Don&apos;t have an account?</span>
              </div>
            </div>

            {/* Register Links */}
            <div className="space-y-3">
              {expectedRole ? (
                <Link
                  href={`/auth/register?role=${expectedRole}`}
                  className="w-full btn-outline text-center"
                >
                  Create {expectedRole === 'restaurant_owner' ? 'Partner' : expectedRole} Account
                </Link>
              ) : (
                <>
                  <Link
                    href="/auth/register"
                    className="w-full btn-outline text-center"
                  >
                    Create Customer Account
                  </Link>
                  <div className="grid grid-cols-2 gap-3">
                    <Link
                      href="/auth/register?role=restaurant_owner"
                      className="text-center py-2 px-4 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      Partner Portal
                    </Link>
                    <Link
                      href="/auth/register?role=rider"
                      className="text-center py-2 px-4 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      Rider Portal
                    </Link>
                  </div>
                </>
              )}
            </div>
          </form>
        </motion.div>

        {/* Role-specific Help Text */}
        {expectedRole && expectedRole !== 'customer' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-center"
          >
            <p className="text-sm text-gray-600">
              {expectedRole === 'restaurant_owner' && 'Need help with your restaurant account? '}
              {expectedRole === 'rider' && 'Need help with your rider account? '}
              <Link href="/support" className="font-medium text-orange-600 hover:text-orange-500">
                Contact Support
              </Link>
            </p>
          </motion.div>
        )}
      </div>
    </div>
  )
}

export default UniversalLogin