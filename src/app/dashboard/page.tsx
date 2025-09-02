'use client'

import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import Navigation from '@/components/layout/Navigation'
import CustomerDashboard from '@/components/dashboard/CustomerDashboard'
import RestaurantDashboard from '@/components/dashboard/RestaurantDashboard'
import RiderDashboard from '@/components/dashboard/RiderDashboard'

export default function DashboardPage() {
  const { user, userRole, isAuthenticated, isAdminAuthenticated } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login?redirect=/dashboard')
    }
    
    // Redirect admins to admin system
    if (isAdminAuthenticated) {
      router.push('/admin-system/dashboard')
    }
  }, [isAuthenticated, isAdminAuthenticated, router])

  // Role-based dashboard rendering
  const renderDashboardContent = () => {
    switch (userRole) {
      case 'restaurant_owner':
        return <RestaurantDashboard />
      case 'rider':
        return <RiderDashboard />
      case 'customer':
      default:
        return <CustomerDashboard />
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-green-50 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-orange-600 rounded-3xl mx-auto mb-4 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          </div>
          <p className="text-gray-600 font-medium">Loading your dashboard...</p>
        </motion.div>
      </div>
    )
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-orange-50/30 via-white to-green-50/30">
        <Navigation />
        
        <div className="pt-20 pb-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {renderDashboardContent()}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}