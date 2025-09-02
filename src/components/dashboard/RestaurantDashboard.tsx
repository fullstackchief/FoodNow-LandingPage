'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import {
  ClipboardDocumentListIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  BellIcon,
  PlusIcon,
  EyeIcon,
  EyeSlashIcon,
  StarIcon,
  TruckIcon
} from '@heroicons/react/24/outline'

export default function RestaurantDashboard() {
  const { user } = useAuth()
  const [activeOrders, setActiveOrders] = useState(3)

  const restaurantStats = [
    {
      title: 'Today\'s Orders',
      value: '24',
      icon: ClipboardDocumentListIcon,
      color: 'bg-blue-500',
      change: '+12%'
    },
    {
      title: 'Today\'s Revenue',
      value: '₦45,600',
      icon: CurrencyDollarIcon,
      color: 'bg-green-500',
      change: '+8%'
    },
    {
      title: 'Average Rating',
      value: '4.8',
      icon: StarIcon,
      color: 'bg-yellow-500',
      change: '+0.2'
    },
    {
      title: 'Active Orders',
      value: activeOrders.toString(),
      icon: TruckIcon,
      color: 'bg-orange-500'
    }
  ]

  const pendingOrders = [
    {
      id: 'ORD001',
      customer: 'Adebayo J.',
      items: ['Jollof Rice Special', 'Chapman'],
      total: 4200,
      time: '5 min ago',
      status: 'pending'
    },
    {
      id: 'ORD002',
      customer: 'Kemi O.',
      items: ['Pepper Soup', 'Fried Rice'],
      total: 5800,
      time: '8 min ago',
      status: 'preparing'
    }
  ]

  const menuItems = [
    { name: 'Jollof Rice Special', available: true, orders: 12 },
    { name: 'Pepper Soup', available: true, orders: 8 },
    { name: 'Grilled Chicken', available: false, orders: 0 }
  ]

  return (
    <div className="space-y-8">
      {/* Restaurant Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-green-500 to-blue-500 rounded-3xl p-8 text-white"
      >
        <h2 className="text-2xl font-bold mb-2">Restaurant Dashboard</h2>
        <p className="text-green-100">Manage your orders, menu, and restaurant performance</p>
        
        <div className="flex space-x-4 mt-6">
          <Link
            href="/dashboard/orders"
            className="bg-white text-green-600 px-6 py-3 rounded-2xl font-semibold hover:bg-green-50 transition-colors"
          >
            View All Orders
          </Link>
          <button className="bg-green-600 text-white px-6 py-3 rounded-2xl font-semibold hover:bg-green-700 transition-colors">
            Add Menu Item
          </button>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {restaurantStats.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 ${stat.color} rounded-2xl flex items-center justify-center`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
              {stat.change && (
                <span className="text-sm text-green-600 font-medium">{stat.change}</span>
              )}
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">{stat.value}</h3>
            <p className="text-gray-600 text-sm">{stat.title}</p>
          </motion.div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Active Orders */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl shadow-sm p-6 border border-gray-100"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900 flex items-center space-x-2">
              <ClipboardDocumentListIcon className="w-6 h-6 text-blue-600" />
              <span>Active Orders</span>
            </h3>
            <Link 
              href="/dashboard/orders"
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              View All
            </Link>
          </div>

          <div className="space-y-4">
            {pendingOrders.map((order) => (
              <div key={order.id} className="p-4 bg-gray-50 rounded-2xl">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="font-semibold text-gray-900">#{order.id}</p>
                    <p className="text-sm text-gray-600">{order.customer} • {order.time}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    order.status === 'pending' 
                      ? 'bg-yellow-100 text-yellow-700' 
                      : 'bg-blue-100 text-blue-700'
                  }`}>
                    {order.status}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-2">{order.items.join(', ')}</p>
                <p className="font-bold text-gray-900">₦{order.total.toLocaleString()}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Menu Management */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl shadow-sm p-6 border border-gray-100"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900 flex items-center space-x-2">
              <ChartBarIcon className="w-6 h-6 text-green-600" />
              <span>Menu Items</span>
            </h3>
            <button className="flex items-center space-x-2 bg-green-500 text-white px-4 py-2 rounded-xl hover:bg-green-600 transition-colors">
              <PlusIcon className="w-4 h-4" />
              <span>Add Item</span>
            </button>
          </div>

          <div className="space-y-3">
            {menuItems.map((item, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <div>
                  <p className="font-medium text-gray-900">{item.name}</p>
                  <p className="text-sm text-gray-600">{item.orders} orders today</p>
                </div>
                <div className="flex items-center space-x-3">
                  <span className={`w-3 h-3 rounded-full ${
                    item.available ? 'bg-green-500' : 'bg-red-500'
                  }`}></span>
                  <button className="text-gray-400 hover:text-gray-600">
                    {item.available ? <EyeIcon className="w-4 h-4" /> : <EyeSlashIcon className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Performance Insights */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-3xl shadow-sm p-6 border border-gray-100"
      >
        <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center space-x-2">
          <ChartBarIcon className="w-6 h-6 text-purple-600" />
          <span>Performance Insights</span>
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-4">
            <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <TruckIcon className="w-8 h-8 text-blue-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">22 min</p>
            <p className="text-gray-600">Avg Prep Time</p>
          </div>
          
          <div className="text-center p-4">
            <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <StarIcon className="w-8 h-8 text-green-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">4.8</p>
            <p className="text-gray-600">Customer Rating</p>
          </div>
          
          <div className="text-center p-4">
            <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <CurrencyDollarIcon className="w-8 h-8 text-purple-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">₦145k</p>
            <p className="text-gray-600">This Week</p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}