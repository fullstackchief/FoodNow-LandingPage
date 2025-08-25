'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { useEnhancedAdmin } from '@/contexts/EnhancedAdminContext'
import { ShieldExclamationIcon, ArrowLeftIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import EnhancedAdminLoginModal from '@/components/ui/EnhancedAdminLoginModal'

interface EnhancedAdminRouteProps {
  children: React.ReactNode
  requiredPermission?: {
    category: string
    action: string
  }
  requiredRole?: 'super_admin' | 'admin' | 'moderator'
}

const EnhancedAdminRoute = ({ children, requiredPermission, requiredRole }: EnhancedAdminRouteProps) => {
  const { 
    isAuthenticated, 
    currentAdmin, 
    isSessionExpired, 
    getRemainingSessionTime,
    hasPermission,
    hasRole,
    logout 
  } = useEnhancedAdmin()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [sessionTimeWarning, setSessionTimeWarning] = useState(false)

  useEffect(() => {
    // Add a small delay to check admin status
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 500)

    return () => clearTimeout(timer)
  }, [])

  // Session timeout monitoring
  useEffect(() => {
    if (!isAuthenticated || !currentAdmin) return

    const checkSession = () => {
      if (isSessionExpired()) {
        logout()
        return
      }

      const remainingTime = getRemainingSessionTime()
      
      // Show warning when 10 minutes or less remaining
      if (remainingTime <= 10 && remainingTime > 0) {
        setSessionTimeWarning(true)
      } else {
        setSessionTimeWarning(false)
      }
    }

    checkSession()
    const interval = setInterval(checkSession, 30000) // Check every 30 seconds

    return () => clearInterval(interval)
  }, [isAuthenticated, currentAdmin, isSessionExpired, getRemainingSessionTime, logout])

  // Password expiration check
  const isPasswordExpired = currentAdmin && currentAdmin.mustChangePassword
  const needsPasswordChange = currentAdmin && isPasswordExpired

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="w-20 h-20 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-6"></div>
          <p className="text-gray-600 text-lg">Securing admin portal...</p>
          <p className="text-gray-500 text-sm mt-2">Verifying credentials and permissions</p>
        </motion.div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full mx-4"
        >
          <div className="bg-white/70 backdrop-blur-xl rounded-3xl shadow-2xl p-8 text-center border border-white/20">
            <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <ShieldExclamationIcon className="w-12 h-12 text-red-600" />
            </div>
            
            <h1 className="text-3xl font-black text-gray-900 mb-4">Admin Portal Access</h1>
            <p className="text-gray-600 mb-8 leading-relaxed">
              This is a secure administrative area. Please authenticate with your admin credentials to continue.
            </p>
            
            <div className="space-y-4">
              <button
                onClick={() => setShowLoginModal(true)}
                className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold py-4 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg shadow-blue-500/30"
              >
                Admin Login
              </button>
              
              <button
                onClick={() => router.push('/')}
                className="flex items-center justify-center space-x-2 w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-6 rounded-xl transition-colors"
              >
                <ArrowLeftIcon className="w-4 h-4" />
                <span>Return to Website</span>
              </button>
            </div>
            
            <div className="mt-8 p-4 bg-yellow-50 rounded-xl border border-yellow-200">
              <div className="flex items-center justify-center space-x-2 text-yellow-800 mb-2">
                <ExclamationTriangleIcon className="w-5 h-5" />
                <span className="font-semibold">Security Notice</span>
              </div>
              <p className="text-yellow-700 text-sm">
                All admin activities are monitored and logged. Unauthorized access attempts will be reported.
              </p>
            </div>
          </div>
        </motion.div>

        <EnhancedAdminLoginModal
          isOpen={showLoginModal}
          onClose={() => setShowLoginModal(false)}
        />
      </div>
    )
  }

  // Check role requirements
  if (requiredRole && !hasRole(requiredRole)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full mx-4"
        >
          <div className="bg-white/70 backdrop-blur-xl rounded-3xl shadow-2xl p-8 text-center border border-white/20">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <ShieldExclamationIcon className="w-10 h-10 text-red-600" />
            </div>
            
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Insufficient Privileges</h1>
            <p className="text-gray-600 mb-8">
              This section requires <span className="font-semibold text-red-600">{requiredRole}</span> level access. 
              Your current role: <span className="font-semibold">{currentAdmin?.role}</span>
            </p>
            
            <button
              onClick={() => router.back()}
              className="flex items-center justify-center space-x-2 w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 px-6 rounded-xl transition-colors"
            >
              <ArrowLeftIcon className="w-4 h-4" />
              <span>Go Back</span>
            </button>
          </div>
        </motion.div>
      </div>
    )
  }

  // Check specific permission requirements
  if (requiredPermission && !hasPermission(requiredPermission.category as any, requiredPermission.action as any)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full mx-4"
        >
          <div className="bg-white/70 backdrop-blur-xl rounded-3xl shadow-2xl p-8 text-center border border-white/20">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <ShieldExclamationIcon className="w-10 h-10 text-red-600" />
            </div>
            
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Permission Denied</h1>
            <p className="text-gray-600 mb-8">
              You don't have permission to access this feature. Required: <span className="font-semibold">{requiredPermission.category}.{requiredPermission.action}</span>
            </p>
            
            <button
              onClick={() => router.back()}
              className="flex items-center justify-center space-x-2 w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 px-6 rounded-xl transition-colors"
            >
              <ArrowLeftIcon className="w-4 h-4" />
              <span>Go Back</span>
            </button>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="relative">
      {/* Session timeout warning */}
      {sessionTimeWarning && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed top-4 right-4 z-50 bg-yellow-500 text-white px-6 py-3 rounded-xl shadow-lg"
        >
          <div className="flex items-center space-x-2">
            <ExclamationTriangleIcon className="w-5 h-5" />
            <span className="font-medium">
              Session expires in {getRemainingSessionTime()} minutes
            </span>
          </div>
        </motion.div>
      )}

      {/* Password change requirement */}
      {needsPasswordChange && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-red-500 text-white px-6 py-3 rounded-xl shadow-lg"
        >
          <div className="flex items-center space-x-2">
            <ExclamationTriangleIcon className="w-5 h-5" />
            <span className="font-medium">
              Password change required
            </span>
          </div>
        </motion.div>
      )}

      {children}
    </div>
  )
}

export default EnhancedAdminRoute