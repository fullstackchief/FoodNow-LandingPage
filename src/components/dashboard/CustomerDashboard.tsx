'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import DashboardCard from '@/components/ui/DashboardCard'
import StatsCard from '@/components/ui/StatsCard'
import QuickActions from '@/components/dashboard/QuickActions'
import RewardsWidget from '@/components/dashboard/RewardsWidget'
import AIRecommendations from '@/components/dashboard/AIRecommendations'
import { 
  ShoppingBagIcon, 
  HeartIcon, 
  ClockIcon,
  SparklesIcon,
  TrophyIcon,
  GiftIcon,
  CreditCardIcon
} from '@heroicons/react/24/outline'

export default function CustomerDashboard() {
  const { user } = useAuth()

  const customerStats = [
    { 
      title: 'Recent Orders', 
      value: '12', 
      icon: <ShoppingBagIcon className="w-6 h-6" />, 
      color: 'orange' as const
    },
    { 
      title: 'Favorite Restaurants', 
      value: '8', 
      icon: <HeartIcon className="w-6 h-6" />, 
      color: 'red' as const
    },
    { 
      title: 'Avg Delivery Time', 
      value: '22 min', 
      icon: <ClockIcon className="w-6 h-6" />, 
      color: 'green' as const
    },
    { 
      title: 'Reward Points', 
      value: '2,450', 
      icon: <SparklesIcon className="w-6 h-6" />, 
      color: 'purple' as const
    }
  ]

  const recentOrders = [
    {
      id: 'FN001',
      restaurant: 'Mama Cass Kitchen',
      status: 'delivered',
      total: 3500,
      date: '2 hours ago'
    },
    {
      id: 'FN002', 
      restaurant: 'Dragon Wok',
      status: 'preparing',
      total: 4200,
      date: '1 day ago'
    }
  ]

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-orange-500 to-red-500 rounded-3xl p-8 text-white"
      >
        <h2 className="text-2xl font-bold mb-2">Welcome back, {user?.first_name}!</h2>
        <p className="text-orange-100">Ready to discover delicious food near you?</p>
        <Link 
          href="/explore"
          className="inline-flex items-center mt-4 bg-white text-orange-600 px-6 py-3 rounded-2xl font-semibold hover:bg-orange-50 transition-colors"
        >
          Explore Restaurants
        </Link>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {customerStats.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <StatsCard {...stat} />
          </motion.div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Orders */}
        <DashboardCard
          title="Recent Orders"
          icon={<ShoppingBagIcon className="w-6 h-6" />}
        >
          <div className="space-y-4">
            {recentOrders.map((order) => (
              <div key={order.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                <div>
                  <p className="font-semibold text-gray-900">{order.restaurant}</p>
                  <p className="text-sm text-gray-600">#{order.id} • {order.date}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900">₦{order.total.toLocaleString()}</p>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    order.status === 'delivered' 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-orange-100 text-orange-700'
                  }`}>
                    {order.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </DashboardCard>

        {/* Quick Actions */}
        <QuickActions />
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <RewardsWidget />
        <AIRecommendations />
      </div>
    </div>
  )
}