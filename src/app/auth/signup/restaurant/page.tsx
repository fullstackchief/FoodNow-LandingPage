'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowLeft } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import RestaurantMultiStepRegistration from '@/components/auth/RestaurantMultiStepRegistration'
import { prodLog } from '@/lib/logger'
import { submitRestaurantOwnerApplication } from '@/lib/authService'
import { supabase } from '@/lib/supabase-client'

export default function RestaurantSignupPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirect') || '/dashboard'
  const { signup } = useAuth()

  const handleRegistrationComplete = async (data: any) => {
    try {
      prodLog.info('Restaurant registration initiated', {
        email: data.ownerEmail,
        restaurantName: data.restaurantName,
        role: data.role
      })

      // Extract owner name from fullName
      const nameParts = data.ownerFullName.trim().split(' ')
      const firstName = nameParts[0] || ''
      const lastName = nameParts.slice(1).join(' ') || ''

      // Register the user with Supabase
      const result = await signup({
        email: data.ownerEmail,
        password: data.password,
        firstName,
        lastName,
        phone: data.ownerPhone
      } as any)
      
      if (result.success) {
        // Get the user ID from Supabase auth directly
        const { data: authUser } = await supabase.auth.getUser()
        const userId = authUser?.user?.id
        if (!userId) {
          throw new Error('User ID not available after registration')
        }

        // Prepare application data - convert File objects to URLs if needed
        const applicationData = {
          ...data,
          documents: {
            cacCertificate: data.documents.cacCertificate instanceof File ? 
              URL.createObjectURL(data.documents.cacCertificate) : data.documents.cacCertificate,
            ownerNinFront: data.documents.ownerNinFront instanceof File ? 
              URL.createObjectURL(data.documents.ownerNinFront) : data.documents.ownerNinFront,
            ownerNinBack: data.documents.ownerNinBack instanceof File ? 
              URL.createObjectURL(data.documents.ownerNinBack) : data.documents.ownerNinBack,
            restaurantPhoto1: data.documents.restaurantPhoto1 instanceof File ? 
              URL.createObjectURL(data.documents.restaurantPhoto1) : data.documents.restaurantPhoto1,
            restaurantPhoto2: data.documents.restaurantPhoto2 instanceof File ? 
              URL.createObjectURL(data.documents.restaurantPhoto2) : data.documents.restaurantPhoto2,
            restaurantPhoto3: data.documents.restaurantPhoto3 instanceof File ? 
              URL.createObjectURL(data.documents.restaurantPhoto3) : data.documents.restaurantPhoto3,
            ownerPhoto: data.documents.ownerPhoto instanceof File ? 
              URL.createObjectURL(data.documents.ownerPhoto) : data.documents.ownerPhoto,
          }
        }

        // Submit the restaurant application
        const applicationResult = await submitRestaurantOwnerApplication(userId, applicationData)
        
        if (!applicationResult.data) {
          prodLog.error('Restaurant application submission failed', {
            error: applicationResult.error,
            userId,
            restaurantName: data.restaurantName
          })
          // Note: User is already registered, so we still redirect to verification
          // The application can be resubmitted later
        } else {
          prodLog.info('Restaurant application submitted successfully', {
            userId,
            applicationId: applicationResult.data,
            restaurantName: data.restaurantName
          })
        }

        // Redirect to email verification with role-specific redirect
        router.push(`/auth/verify-email?email=${encodeURIComponent(data.ownerEmail)}&role=${data.role}&redirect=${encodeURIComponent(redirectTo)}`)
      } else {
        throw new Error(result.error || 'Registration failed')
      }
    } catch (error) {
      prodLog.error('Restaurant registration failed', error, {
        email: data.ownerEmail,
        role: data.role
      })
      throw error
    }
  }

  const handleCancel = () => {
    router.push('/auth/signup')
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
            Join as a Restaurant Partner
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Grow your business with FoodNow&apos;s delivery platform
          </p>
        </motion.div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <RestaurantMultiStepRegistration
            onComplete={handleRegistrationComplete}
            onCancel={handleCancel}
          />

          <div className="mt-6">
            <div className="text-center">
              <span className="text-sm text-gray-600">
                Already have an account?{' '}
                <Link
                  href={`/auth/login${redirectTo !== '/dashboard' ? `?redirect=${encodeURIComponent(redirectTo)}` : ''}`}
                  className="font-medium text-orange-600 hover:text-orange-500"
                >
                  Sign in
                </Link>
              </span>
            </div>
            <div className="text-center mt-2">
              <Link
                href="/auth/signup"
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Looking to order food? Sign up as a customer
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}