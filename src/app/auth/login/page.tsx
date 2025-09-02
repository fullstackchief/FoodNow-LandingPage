'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Eye, EyeOff, Mail, Lock, AlertCircle, Loader2, ArrowLeft } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase-client'
import { devLog, prodLog } from '@/lib/logger'
import { userLoginSchema } from '@/lib/validations/auth'
import { validateData } from '@/lib/validations/utils'

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirect') || '/'
  const { login, isAuthenticated, user, isLoading: authLoading } = useAuth()
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false,
  })
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  // Redirect if already authenticated
  useEffect(() => {
    devLog.info('Auth check:', { 
      isAuthenticated, 
      hasUser: !!user, 
      userEmail: user?.email,
      authLoading 
    })
    
    // Only redirect if we're fully authenticated and not loading
    if (isAuthenticated && !authLoading) {
      devLog.info('Authenticated and not loading, redirecting...')
      const destination = redirectTo === '/auth/login' ? '/dashboard' : redirectTo
      devLog.info('Redirecting to:', destination)
      
      // Use React Router for proper state management
      router.push(destination)
    }
  }, [isAuthenticated, authLoading, redirectTo, router])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    // Validate form data using Zod schema
    const validation = validateData(userLoginSchema, formData, 'Login Form')
    
    if (!validation.success) {
      const firstError = validation.errors[0]
      setError(firstError.message)
      setIsLoading(false)
      return
    }

    prodLog.info('Login attempt initiated', { email: validation.data.email, redirectTo, action: 'login_attempt' })
    devLog.info('Form data:', { email: validation.data.email, redirectTo })

    try {
      const result = await login(formData.email, formData.password, formData.rememberMe)
      devLog.info('Login result:', result)
      
      if (result.success) {
        // Don't redirect immediately - let React handle it through the auth state change
        prodLog.info('Login successful', { email: formData.email, action: 'login_success' })
        devLog.info('Login successful, waiting for auth state update...')
        // The useEffect hook will handle redirecting once isAuthenticated becomes true
      } else {
        prodLog.error('Login failed', result.error, { email: formData.email, action: 'login_failure', errorType: 'auth_error' })
        setError(result.error || 'Login failed')
        setIsLoading(false)
      }
    } catch (error) {
      prodLog.error('Login exception occurred', error, { email: formData.email, action: 'login_exception', errorType: 'unexpected_error' })
      setError('An unexpected error occurred')
      setIsLoading(false)
    }
    // Don't set loading to false on success - let the auth context handle it
  }

  const handleOAuthLogin = async (provider: 'google' | 'facebook') => {
    setIsLoading(true)
    setError('')
    prodLog.info('OAuth login attempt initiated', { provider, action: 'oauth_attempt', redirectTo })
    
    try {
      // Check if OAuth is properly configured
      if (provider === 'google' && !process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID) {
        setError('Google OAuth is not configured. Please contact support.')
        return
      }
      
      if (provider === 'facebook' && !process.env.NEXT_PUBLIC_FACEBOOK_APP_ID) {
        setError('Facebook OAuth is not configured. Please contact support.')
        return
      }

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback?redirect=${encodeURIComponent(redirectTo)}`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
          // Request additional scopes for better profile information
          scopes: provider === 'google' 
            ? 'email profile openid'
            : 'email public_profile'
        },
      })

      if (error) {
        prodLog.error('OAuth login failed', error, { provider, action: 'oauth_failure', errorType: 'oauth_error' })
        
        // Provide more specific error messages
        if (error.message?.includes('Email not confirmed')) {
          setError(`Please verify your ${provider} email address first`)
        } else if (error.message?.includes('Invalid login credentials')) {
          setError(`${provider} login was cancelled or failed`)
        } else if (error.message?.includes('Provider not enabled')) {
          setError(`${provider} login is currently unavailable`)
        } else {
          setError(`Unable to connect to ${provider}. Please try again or use email login.`)
        }
        return
      }

      if (data?.url) {
        prodLog.info('OAuth login initiated successfully', { provider, action: 'oauth_initiated', redirectUrl: data.url })
        // Redirect will happen automatically, but we can also manually redirect if needed
        window.location.href = data.url
      } else {
        prodLog.warn('OAuth login succeeded but no redirect URL provided', { provider, action: 'oauth_no_redirect' })
        setError(`${provider} login setup incomplete. Please try email login.`)
      }
      
      // OAuth will redirect, so no need to handle success here
    } catch (error) {
      prodLog.error('OAuth login exception', error, { provider, action: 'oauth_exception', errorType: 'unexpected_error' })
      
      // Handle network or other errors
      if (error instanceof Error) {
        if (error.message.includes('Failed to fetch') || error.message.includes('Network')) {
          setError('Network error. Please check your connection and try again.')
        } else {
          setError(`${provider} login failed. Please try again or use email login.`)
        }
      } else {
        setError(`Unexpected error during ${provider} login. Please try email login.`)
      }
    } finally {
      setIsLoading(false)
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
          <h2 className="text-3xl font-extrabold text-gray-900">
            Welcome back!
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Sign in to your account to continue
          </p>
        </motion.div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white py-8 px-4 shadow-xl sm:rounded-lg sm:px-10"
        >
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-red-50 border border-red-200 rounded-md p-4"
              >
                <div className="flex">
                  <AlertCircle className="w-5 h-5 text-red-400" />
                  <div className="ml-3">
                    <p className="text-sm text-red-800">{error}</p>
                  </div>
                </div>
              </motion.div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                  placeholder="Enter your email"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={formData.password}
                  onChange={handleInputChange}
                  className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="rememberMe"
                  name="rememberMe"
                  type="checkbox"
                  checked={formData.rememberMe}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                />
                <label htmlFor="rememberMe" className="ml-2 block text-sm text-gray-900">
                  Remember me for 7 days
                </label>
              </div>
              <div className="text-sm">
                <Link
                  href="/auth/forgot-password"
                  className="font-medium text-orange-600 hover:text-orange-500"
                >
                  Forgot your password?
                </Link>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading || authLoading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {(isLoading || authLoading) ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  'Sign in'
                )}
              </button>
            </div>

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">Or continue with</span>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handleOAuthLogin('google')}
                  disabled={isLoading || authLoading}
                  className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                >
                  <span className="text-lg">🔍</span>
                  <span className="ml-2">Google</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleOAuthLogin('facebook')}
                  disabled={isLoading || authLoading}
                  className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                >
                  <span className="text-lg">📘</span>
                  <span className="ml-2">Facebook</span>
                </button>
              </div>
            </div>
          </form>

          <div className="mt-6">
            <div className="text-center">
              <span className="text-sm text-gray-600">
                Don&apos;t have an account?{' '}
                <Link
                  href={`/auth/signup${redirectTo !== '/' ? `?redirect=${encodeURIComponent(redirectTo)}` : ''}`}
                  className="font-medium text-orange-600 hover:text-orange-500"
                >
                  Sign up now
                </Link>
              </span>
            </div>
          </div>

        </motion.div>
      </div>
    </div>
  )
}