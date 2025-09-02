'use client'

import { Suspense } from 'react'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import Navigation from '@/components/layout/Navigation'
import OrderHistory from '@/components/dashboard/OrderHistory'
import Link from 'next/link'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'
import { useAuth } from '@/contexts/AuthContext'

export default function OrdersPage() {
  const { userRole } = useAuth()

  const getPageTitle = () => {
    switch (userRole) {
      case 'restaurant_owner':
        return 'Restaurant Orders'
      case 'rider':
        return 'Delivery Queue'
      case 'customer':
      default:
        return 'Order History'
    }
  }

  const getPageDescription = () => {
    switch (userRole) {
      case 'restaurant_owner':
        return 'Manage incoming orders, update preparation status, and track restaurant performance'
      case 'rider':
        return 'View available deliveries, track your earnings, and manage delivery queue'
      case 'customer':
      default:
        return 'Track your orders, reorder favorites, and manage your delivery history'
    }
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        
        <div className="pt-20 pb-16">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            
            {/* Header */}
            <div className="mb-8">
              <Link 
                href="/dashboard"
                className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
              >
                <ArrowLeftIcon className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Link>
              
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">{getPageTitle()}</h1>
                  <p className="mt-2 text-gray-600">
                    {getPageDescription()}
                  </p>
                </div>
              </div>
            </div>

            {/* Role-based Order Management */}
            <Suspense
              fallback={
                <div className="bg-white rounded-2xl shadow-sm p-6">
                  <div className="animate-pulse">
                    <div className="h-6 bg-gray-200 rounded w-1/3 mb-6"></div>
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="border border-gray-100 rounded-xl p-4 mb-4">
                        <div className="flex items-center space-x-4">
                          <div className="w-16 h-16 bg-gray-200 rounded-xl"></div>
                          <div className="flex-1">
                            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              }
            >
              {/* For now, all roles use OrderHistory - can be enhanced later for specific needs */}
              <OrderHistory />
            </Suspense>
            
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}