'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { useAdmin } from '@/contexts/AdminContext'
import { ShieldExclamationIcon, ArrowLeftIcon } from '@heroicons/react/24/outline'

interface AdminRouteProps {
  children: React.ReactNode
}

const AdminRoute = ({ children }: AdminRouteProps) => {
  const { isAdmin } = useAdmin()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Add a small delay to check admin status from localStorage
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 100)

    return () => clearTimeout(timer)
  }, [])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Checking admin access...</p>
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full mx-4"
        >
          <div className="bg-white rounded-3xl shadow-xl p-8 text-center">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <ShieldExclamationIcon className="w-10 h-10 text-red-600" />
            </div>
            
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
            <p className="text-gray-600 mb-8">
              You need administrator privileges to access this page. Please log in with your admin credentials.
            </p>
            
            <div className="space-y-4">
              <button
                onClick={() => router.push('/')}
                className="flex items-center justify-center space-x-2 w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 px-6 rounded-xl transition-colors"
              >
                <ArrowLeftIcon className="w-4 h-4" />
                <span>Back to Home</span>
              </button>
              
              <p className="text-sm text-gray-500">
                Admin access can be found in the navigation menu
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    )
  }

  return <>{children}</>
}

export default AdminRoute