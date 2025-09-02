'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { useUnifiedCart } from '@/contexts/UnifiedCartContext'
import { 
  UserPlusIcon,
  ArrowRightIcon,
  ShoppingBagIcon,
  UserIcon,
  KeyIcon
} from '@heroicons/react/24/outline'

interface CheckoutAuthPromptProps {
  onAuthComplete?: () => void
}

const CheckoutAuthPrompt = ({ onAuthComplete: _onAuthComplete }: CheckoutAuthPromptProps) => {
  const { cartState, itemCount, total } = useUnifiedCart()
  const [authType, setAuthType] = useState<'login' | 'register'>('login')
  const [isMounted, setIsMounted] = useState(false)

  // Set mounted state after hydration to prevent SSR mismatch
  useEffect(() => {
    setIsMounted(true)
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          
          {/* Left Side - Cart Summary */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div className="text-center lg:text-left">
              <h1 className="text-3xl font-extrabold text-gray-900 mb-4">
                Almost there!
              </h1>
              <p className="text-lg text-gray-600">
                Sign in or create an account to complete your order
              </p>
            </div>

            {/* Cart Preview */}
            <div className="bg-white rounded-3xl shadow-premium p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                  <ShoppingBagIcon className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">Your Order</h3>
                  <p className="text-sm text-gray-600">
                    {isMounted ? (
                      `${itemCount} item${itemCount !== 1 ? 's' : ''} • ₦${total.toLocaleString()}`
                    ) : (
                      'Loading your order...'
                    )}
                  </p>
                </div>
              </div>

              <div className="space-y-3 max-h-48 overflow-y-auto">
                {isMounted ? (
                  cartState.items.map((item, index) => (
                    <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{item.name}</p>
                        {item.customizations && item.customizations.length > 0 && (
                          <p className="text-xs text-gray-500">
                            {item.customizations.join(', ')}
                          </p>
                        )}
                      </div>
                      <div className="text-right ml-4">
                        <p className="font-medium text-gray-900">x{item.quantity}</p>
                        <p className="text-sm text-gray-600">₦{(item.price * item.quantity).toLocaleString()}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-4 text-center text-gray-500">
                    <p>Loading cart items...</p>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex justify-between items-center">
                  <p className="font-bold text-lg text-gray-900">Total</p>
                  <p className="font-bold text-lg text-orange-600">
                    {isMounted ? `₦${total.toLocaleString()}` : '₦0'}
                  </p>
                </div>
              </div>

              {isMounted && cartState.restaurant && (
                <div className="mt-4 p-3 bg-gray-50 rounded-xl">
                  <p className="text-sm text-gray-600">From</p>
                  <p className="font-medium text-gray-900">{cartState.restaurant.name}</p>
                </div>
              )}
            </div>

            {/* Security Notice */}
            <div className="bg-blue-50 rounded-2xl p-4">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <KeyIcon className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-blue-900 mb-1">Why do I need an account?</h4>
                  <p className="text-sm text-blue-700">
                    We need your contact details to send order updates, process payments securely, 
                    and provide customer support if needed.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Right Side - Auth Options */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-6"
          >
            {/* Auth Type Selector */}
            <div className="flex bg-gray-100 rounded-2xl p-1">
              <button
                onClick={() => setAuthType('login')}
                className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all ${
                  authType === 'login'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Sign In
              </button>
              <button
                onClick={() => setAuthType('register')}
                className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all ${
                  authType === 'register'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Create Account
              </button>
            </div>

            {/* Auth Cards */}
            <div className="space-y-4">
              {authType === 'login' ? (
                <motion.div
                  key="login"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-3xl shadow-premium p-6"
                >
                  <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <UserIcon className="w-8 h-8 text-orange-600" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Welcome back!</h3>
                    <p className="text-gray-600">Sign in to your existing account</p>
                  </div>

                  <div className="space-y-4">
                    <Link href={`/auth/login?redirect=${encodeURIComponent('/checkout')}`}>
                      <button className="w-full btn-primary flex items-center justify-center space-x-2">
                        <span>Sign In to Continue</span>
                        <ArrowRightIcon className="w-4 h-4" />
                      </button>
                    </Link>

                    <div className="text-center">
                      <p className="text-sm text-gray-600">
                        Don&apos;t have an account?{' '}
                        <button
                          onClick={() => setAuthType('register')}
                          className="text-orange-600 hover:text-orange-700 font-medium"
                        >
                          Create one now
                        </button>
                      </p>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="register"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-3xl shadow-premium p-6"
                >
                  <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <UserPlusIcon className="w-8 h-8 text-green-600" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Join FoodNow</h3>
                    <p className="text-gray-600">Create your account in seconds</p>
                  </div>

                  <div className="space-y-4">
                    <Link href={`/auth/register?redirect=${encodeURIComponent('/checkout')}`}>
                      <button className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-2xl transition-colors flex items-center justify-center space-x-2">
                        <span>Create Account</span>
                        <UserPlusIcon className="w-4 h-4" />
                      </button>
                    </Link>

                    <div className="text-center">
                      <p className="text-sm text-gray-600">
                        Already have an account?{' '}
                        <button
                          onClick={() => setAuthType('login')}
                          className="text-orange-600 hover:text-orange-700 font-medium"
                        >
                          Sign in here
                        </button>
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 text-center">
                    <p className="text-xs text-gray-500">
                      By creating an account, you agree to our{' '}
                      <Link href="/terms" className="text-orange-600 hover:text-orange-700">
                        Terms of Service
                      </Link>
                    </p>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Cart Saved Notice */}
            <div className="text-center">
              <p className="text-sm text-gray-500">
                🛡️ Your cart is safely saved and will be restored after sign in
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

export default CheckoutAuthPrompt