'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useAppSelector } from '@/store'
import { saveCartForAuth } from '@/lib/cartPersistence'
import { motion } from 'framer-motion'
import { Loader2, ShoppingBag, UserPlus, Shield } from 'lucide-react'
import Link from 'next/link'

interface CheckoutAuthGuardProps {
  children: React.ReactNode
}

export default function CheckoutAuthGuard({ children }: CheckoutAuthGuardProps) {
  const { isAuthenticated, isLoading, user } = useAuth()
  const router = useRouter()
  const cartState = useAppSelector((state) => state.cart)

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        // Save cart before redirecting to auth
        saveCartForAuth(cartState)
        
        // Redirect to login with checkout redirect
        router.push('/auth/login?redirect=' + encodeURIComponent('/checkout'))
        return
      }

      // Check if user needs phone verification for payment
      if (user && !canUserMakePayment(user)) {
        // Save cart and redirect to verification
        saveCartForAuth(cartState)
        
        const verificationType = 'email' // Default to email verification for now
        router.push(`/auth/verify-otp?type=${verificationType}&redirect=${encodeURIComponent('/checkout')}`)
        return
      }
    }
  }, [isAuthenticated, isLoading, user, cartState, router])

  // Check if user can make payments - simplified for Supabase users
  const canUserMakePayment = (_user: unknown) => {
    // For now, allow all authenticated users to make payments
    // In the future, we could check email_confirmed_at or phone_confirmed_at
    return true
  }

  // Show loading while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-orange-600 mx-auto mb-4" />
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    )
  }

  // Show auth required message if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center"
        >
          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <UserPlus className="w-8 h-8 text-orange-600" />
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Sign In Required
          </h2>
          <p className="text-gray-600 mb-6">
            Please sign in to your account to proceed with checkout. We&apos;ll save your cart and bring you right back!
          </p>

          <div className="space-y-4">
            <Link
              href="/auth/login?redirect=/checkout"
              className="w-full bg-orange-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-orange-700 transition-colors flex items-center justify-center"
            >
              Sign In to Continue
            </Link>
            
            <Link
              href="/auth/signup?redirect=/checkout"
              className="w-full border-2 border-gray-300 text-gray-700 py-3 px-6 rounded-lg font-medium hover:border-orange-500 hover:text-orange-600 transition-colors flex items-center justify-center"
            >
              Create New Account
            </Link>

            <div className="pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-500">
                Your cart items are safely saved
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    )
  }

  // Show verification required message if user needs verification
  if (user && !canUserMakePayment(user)) {
    const needsEmailVerification = true // Default to needing email verification
    
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center"
        >
          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Shield className="w-8 h-8 text-orange-600" />
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Verification Required
          </h2>
          <p className="text-gray-600 mb-6">
            For secure payments, please verify your {needsEmailVerification ? 'email address' : 'phone number'} before proceeding to checkout.
          </p>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <ShoppingBag className="w-5 h-5 text-blue-600 mt-0.5" />
              </div>
              <div className="ml-3 text-left">
                <p className="text-sm text-blue-800">
                  <strong>Why verification?</strong>
                </p>
                <p className="text-sm text-blue-700 mt-1">
                  We verify your contact details to send order updates and ensure secure payment processing.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <Link
              href={`/auth/verify-otp?type=${needsEmailVerification ? 'email' : 'phone'}&redirect=/checkout`}
              className="w-full bg-orange-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-orange-700 transition-colors flex items-center justify-center"
            >
              Verify {needsEmailVerification ? 'Email' : 'Phone'} Now
            </Link>

            <div className="pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-500">
                Your cart is safely saved during verification
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    )
  }

  // User is authenticated and verified - show checkout
  return <>{children}</>
}