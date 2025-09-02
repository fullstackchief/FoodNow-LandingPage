'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { 
  getCurrentUserProfile,
  getUserRoleApplications,
  type UserProfile
} from '@/lib/authService'

// TODO: Remove when role_applications table is implemented
type RoleApplication = {
  id: string
  user_id: string
  role: string
  requested_role: string
  status: string
  admin_notes?: string
  created_at: string
  updated_at: string
}
import {
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  DocumentTextIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline'

const VerificationPending = () => {
  const router = useRouter()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [applications, setApplications] = useState<RoleApplication[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadUserData()
  }, [])

  const loadUserData = async () => {
    try {
      // Load user profile
      const { data: userProfile, error: profileError } = await getCurrentUserProfile()
      
      if (profileError || !userProfile) {
        setError('Failed to load user profile')
        return
      }

      // If user is already verified, redirect to dashboard
      if (userProfile.is_verified && userProfile.user_role === 'customer') {
        router.push('/dashboard')
        return
      }

      setProfile(userProfile)

      // Load role applications
      const { data: userApplications, error: applicationsError } = await getUserRoleApplications()
      
      if (applicationsError) {
        console.error('Failed to load applications:', applicationsError)
      } else {
        setApplications(userApplications || [])
      }
    } catch (error) {
      console.error('Error loading user data:', error)
      setError('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <ClockIcon className="w-6 h-6 text-yellow-500" />
      case 'approved':
        return <CheckCircleIcon className="w-6 h-6 text-green-500" />
      case 'rejected':
        return <XCircleIcon className="w-6 h-6 text-red-500" />
      default:
        return <DocumentTextIcon className="w-6 h-6 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-50 text-yellow-800 border-yellow-200'
      case 'approved':
        return 'bg-green-50 text-green-800 border-green-200'
      case 'rejected':
        return 'bg-red-50 text-red-800 border-red-200'
      default:
        return 'bg-gray-50 text-gray-800 border-gray-200'
    }
  }

  const getMainMessage = () => {
    if (!profile) return { title: 'Loading...', message: '' }

    if (profile.user_role === 'customer' && !profile.is_verified) {
      return {
        title: 'Email Verification Required',
        message: 'Please check your email and click the verification link to activate your account.'
      }
    }

    if (applications.length === 0) {
      return {
        title: 'Account Under Review',
        message: `Your ${profile.user_role?.replace('_', ' ') || 'account'} is being reviewed. We'll notify you once it's approved.`
      }
    }

    const latestApp = applications[0]
    
    switch (latestApp.status) {
      case 'pending':
        return {
          title: 'Application Under Review',
          message: `Your application for ${latestApp.requested_role.replace('_', ' ')} role is being reviewed by our team.`
        }
      case 'approved':
        return {
          title: 'Application Approved!',
          message: `Congratulations! Your ${latestApp.requested_role.replace('_', ' ')} application has been approved.`
        }
      case 'rejected':
        return {
          title: 'Application Update',
          message: `Your ${latestApp.requested_role.replace('_', ' ')} application needs attention.`
        }
      default:
        return {
          title: 'Account Status',
          message: 'Please check your application status below.'
        }
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 flex items-center justify-center">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-lg font-medium text-gray-700">Loading your account status...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <XCircleIcon className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link href="/auth/login">
            <button className="btn-primary">Back to Login</button>
          </Link>
        </div>
      </div>
    )
  }

  const { title, message } = getMainMessage()

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <ClockIcon className="w-10 h-10 text-yellow-600" />
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 mb-4">{title}</h1>
          <p className="text-lg text-gray-600 max-w-xl mx-auto">{message}</p>
        </motion.div>

        {/* User Info Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-3xl shadow-premium p-6 mb-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-500">Name</label>
              <p className="text-gray-900">{profile?.first_name} {profile?.last_name}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Account Type</label>
              <p className="text-gray-900 capitalize">{profile?.user_role?.replace('_', ' ')}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Status</label>
              <p className="text-gray-900">{profile?.is_verified ? 'Verified' : 'Pending Verification'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Registered</label>
              <p className="text-gray-900">{new Date(profile?.created_at || '').toLocaleDateString()}</p>
            </div>
          </div>
        </motion.div>

        {/* Applications List */}
        {applications.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-3xl shadow-premium p-6 mb-6"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Applications</h3>
            <div className="space-y-4">
              {applications.map((application) => (
                <div key={application.id} className="border border-gray-200 rounded-2xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(application.status)}
                      <div>
                        <h4 className="font-medium text-gray-900 capitalize">
                          {application.requested_role.replace('_', ' ')} Application
                        </h4>
                        <p className="text-sm text-gray-500">
                          Applied {new Date(application.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <span className={`px-3 py-1 text-xs font-medium rounded-full border ${getStatusColor(application.status)}`}>
                      {application.status.toUpperCase()}
                    </span>
                  </div>
                  
                  {application.admin_notes && (
                    <div className="bg-gray-50 rounded-lg p-3 mt-3">
                      <p className="text-sm font-medium text-gray-700 mb-1">Admin Notes:</p>
                      <p className="text-sm text-gray-600">{application.admin_notes}</p>
                    </div>
                  )}
                  
                  {application.status === 'approved' && (
                    <div className="bg-green-50 rounded-lg p-3 mt-3">
                      <p className="text-sm text-green-700">
                        🎉 Your application has been approved! Your account has been updated.
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          {profile?.user_role === 'customer' && profile?.is_verified && (
            <Link href="/dashboard">
              <button className="btn-primary flex items-center space-x-2">
                <span>Go to Dashboard</span>
                <ArrowRightIcon className="w-4 h-4" />
              </button>
            </Link>
          )}
          
          {applications.some(app => app.status === 'rejected') && (
            <Link href="/auth/reapply">
              <button className="btn-primary">Reapply</button>
            </Link>
          )}
          
          <Link href="/support">
            <button className="btn-outline">Contact Support</button>
          </Link>
          
          <button
            onClick={() => window.location.reload()}
            className="btn-outline"
          >
            Refresh Status
          </button>
        </motion.div>

        {/* Help Text */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-center mt-8"
        >
          <p className="text-sm text-gray-500">
            Applications are typically reviewed within 24-48 hours. 
            You&apos;ll receive an email notification once your status changes.
          </p>
        </motion.div>
      </div>
    </div>
  )
}

export default VerificationPending