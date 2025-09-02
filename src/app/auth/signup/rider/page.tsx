'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowLeft } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import RiderMultiStepRegistration from '@/components/auth/RiderMultiStepRegistration'
import { prodLog } from '@/lib/logger'

export default function RiderSignupPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirect') || '/dashboard'
  const { signup } = useAuth()

  const handleRegistrationComplete = async (data: any) => {
    try {
      prodLog.info('Rider registration initiated', {
        email: data.email,
        fullName: data.fullName,
        role: data.role,
        equipmentChoice: data.equipmentChoice
      })

      // Extract names from fullName
      const nameParts = data.fullName.trim().split(' ')
      const firstName = nameParts[0] || ''
      const lastName = nameParts.slice(1).join(' ') || ''

      // Register the user with Supabase
      const result = await signup({
        email: data.email,
        password: data.password,
        firstName,
        lastName,
        phone: data.phoneNumber
      } as any)
      
      if (result.success) {
        // TODO: Save additional rider data to database
        // This would include all the profile information, documents, guarantor details etc.
        prodLog.info('Rider registration data collected', {
          basicInfo: { email: data.email, fullName: data.fullName },
          profileComplete: !!data.nextOfKinFullName,
          bankingInfo: !!data.bankName,
          ninInfo: !!data.ninNumber,
          documentsUploaded: Object.keys(data.documents || {}).length,
          workPrefsSet: !!data.preferredZone1,
          guarantorVerified: !!data.guarantorOtp
        })

        // Redirect to email verification with role-specific redirect
        router.push(`/auth/verify-email?email=${encodeURIComponent(data.email)}&role=${data.role}&redirect=${encodeURIComponent(redirectTo)}`)
      } else {
        throw new Error(result.error || 'Registration failed')
      }
    } catch (error) {
      prodLog.error('Rider registration failed', error, {
        email: data.email,
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
            Join as a Delivery Partner
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Earn money on your schedule with flexible delivery opportunities
          </p>
        </motion.div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <RiderMultiStepRegistration
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