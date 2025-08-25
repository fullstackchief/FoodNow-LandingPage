'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  ArrowLeftIcon,
  ClockIcon,
  CheckCircleIcon,
  TruckIcon,
  MapPinIcon,
  PhoneIcon,
  StarIcon
} from '@heroicons/react/24/outline'
import Navigation from '@/components/layout/Navigation'

interface OrderStatus {
  step: number
  title: string
  description: string
  time: string
  completed: boolean
  current: boolean
}

const TrackOrderPage = () => {
  const [orderNumber, setOrderNumber] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [orderFound, setOrderFound] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Mock order data
  const mockOrder = {
    id: 'FN202401',
    restaurant: {
      name: 'Mama\'s Kitchen',
      phone: '+234 901 234 5678',
      address: 'Plot 123, Admiralty Way, Lekki Phase 1, Lagos'
    },
    items: [
      { name: 'Jollof Rice with Chicken', quantity: 2, price: 2500 },
      { name: 'Chapman Cocktail', quantity: 1, price: 1200 }
    ],
    total: 6200,
    deliveryAddress: 'Plot 45, Admiralty Way, Lekki Phase 1',
    customerPhone: '+234 902 345 6789',
    estimatedDeliveryTime: '20-30 min',
    orderTime: '2024-01-15 14:30',
    rider: {
      name: 'David Okafor',
      phone: '+234 903 456 7890',
      rating: 4.9
    }
  }

  const [orderStatuses, setOrderStatuses] = useState<OrderStatus[]>([
    {
      step: 1,
      title: 'Order Confirmed',
      description: 'Your order has been received and confirmed',
      time: '14:30',
      completed: true,
      current: false
    },
    {
      step: 2,
      title: 'Restaurant Accepted',
      description: 'Restaurant has accepted your order and started preparation',
      time: '14:32',
      completed: true,
      current: false
    },
    {
      step: 3,
      title: 'Preparing Your Order',
      description: 'Your delicious meal is being prepared with care',
      time: '14:35',
      completed: true,
      current: true
    },
    {
      step: 4,
      title: 'Out for Delivery',
      description: 'Your order is on the way to you',
      time: '',
      completed: false,
      current: false
    },
    {
      step: 5,
      title: 'Delivered',
      description: 'Enjoy your meal!',
      time: '',
      completed: false,
      current: false
    }
  ])

  const handleTrackOrder = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    if (orderNumber && phoneNumber) {
      setOrderFound(true)
    }
    
    setIsLoading(false)
  }

  // Simulate real-time updates
  useEffect(() => {
    if (orderFound) {
      const timer = setTimeout(() => {
        setOrderStatuses(prev => prev.map((status, index) => {
          if (index === 2) return { ...status, current: false, completed: true, time: '14:45' }
          if (index === 3) return { ...status, current: true, completed: true, time: '14:47' }
          return status
        }))
      }, 3000)

      return () => clearTimeout(timer)
    }
  }, [orderFound])

  if (!orderFound) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        
        <div className="pt-24 pb-12">
          <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center mb-8"
            >
              <h1 className="text-4xl font-black text-gray-900 mb-4">Track Your Order</h1>
              <p className="text-xl text-gray-600">
                Enter your order details to get real-time updates
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-3xl shadow-premium p-8"
            >
              <form onSubmit={handleTrackOrder} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Order Number *
                  </label>
                  <input
                    type="text"
                    value={orderNumber}
                    onChange={(e) => setOrderNumber(e.target.value)}
                    className="w-full p-4 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="e.g. FN202401"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="w-full p-4 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="+234 XXX XXX XXXX"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full btn-primary py-4 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Tracking Order...</span>
                    </div>
                  ) : (
                    'Track Order'
                  )}
                </button>
              </form>

              <div className="mt-8 text-center">
                <p className="text-sm text-gray-500 mb-4">
                  Don&apos;t have your order number? Check your SMS or email confirmation.
                </p>
                <Link href="/browse" className="text-orange-600 hover:text-orange-700 font-medium">
                  Place a New Order →
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Back Button */}
      <div className="pt-20 pb-4 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <button 
            onClick={() => setOrderFound(false)}
            className="inline-flex items-center space-x-2 text-gray-600 hover:text-orange-600 transition-colors"
          >
            <ArrowLeftIcon className="w-5 h-5" />
            <span>Track Another Order</span>
          </button>
        </div>
      </div>

      {/* Order Header */}
      <section className="bg-white pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <h1 className="text-3xl font-black text-gray-900 mb-2">Order #{mockOrder.id}</h1>
            <p className="text-gray-600">Estimated delivery: {mockOrder.estimatedDeliveryTime}</p>
          </motion.div>
        </div>
      </section>

      {/* Order Progress */}
      <section className="py-8 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-3xl shadow-premium p-8"
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-8">Order Progress</h2>
            
            <div className="relative">
              {/* Progress Line */}
              <div className="absolute left-8 top-8 bottom-8 w-0.5 bg-gray-200"></div>
              <div 
                className="absolute left-8 top-8 w-0.5 bg-orange-500 transition-all duration-1000"
                style={{ height: `${(orderStatuses.filter(s => s.completed).length - 1) * 25}%` }}
              ></div>

              {/* Status Steps */}
              <div className="space-y-8">
                {orderStatuses.map((status, index) => (
                  <motion.div
                    key={status.step}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-start space-x-4"
                  >
                    <div className={`relative w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                      status.completed
                        ? 'bg-orange-500'
                        : status.current
                        ? 'bg-orange-100 border-2 border-orange-500'
                        : 'bg-gray-100'
                    }`}>
                      {status.completed ? (
                        <CheckCircleIcon className="w-8 h-8 text-white" />
                      ) : status.current ? (
                        <div className="w-3 h-3 bg-orange-500 rounded-full animate-pulse"></div>
                      ) : status.step === 4 ? (
                        <TruckIcon className="w-8 h-8 text-gray-400" />
                      ) : (
                        <ClockIcon className="w-8 h-8 text-gray-400" />
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className={`text-lg font-semibold ${
                          status.completed || status.current ? 'text-gray-900' : 'text-gray-500'
                        }`}>
                          {status.title}
                        </h3>
                        {status.time && (
                          <span className="text-sm text-gray-500">{status.time}</span>
                        )}
                      </div>
                      <p className={`text-sm ${
                        status.completed || status.current ? 'text-gray-600' : 'text-gray-400'
                      }`}>
                        {status.description}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Order Details */}
      <section className="py-8 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Order Items */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="lg:col-span-2 bg-white rounded-3xl shadow-premium p-6"
            >
              <h3 className="text-xl font-bold text-gray-900 mb-6">Order Items</h3>
              
              <div className="space-y-4">
                {mockOrder.items.map((item, index) => (
                  <div key={index} className="flex justify-between items-center p-4 bg-gray-50 rounded-2xl">
                    <div>
                      <h4 className="font-medium text-gray-900">{item.name}</h4>
                      <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                    </div>
                    <span className="font-semibold text-gray-900">
                      ₦{(item.price * item.quantity).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>

              <div className="border-t border-gray-200 mt-6 pt-6">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold text-gray-900">Total</span>
                  <span className="text-xl font-bold text-orange-600">
                    ₦{mockOrder.total.toLocaleString()}
                  </span>
                </div>
              </div>
            </motion.div>

            {/* Contact & Delivery Info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="space-y-6"
            >
              {/* Restaurant Info */}
              <div className="bg-white rounded-3xl shadow-premium p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Restaurant</h3>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                      <span className="text-xl">🍽️</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{mockOrder.restaurant.name}</p>
                      <p className="text-sm text-gray-600">{mockOrder.restaurant.address}</p>
                    </div>
                  </div>
                  <a
                    href={`tel:${mockOrder.restaurant.phone}`}
                    className="flex items-center space-x-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                  >
                    <PhoneIcon className="w-5 h-5 text-orange-500" />
                    <span className="font-medium text-gray-900">{mockOrder.restaurant.phone}</span>
                  </a>
                </div>
              </div>

              {/* Rider Info */}
              <div className="bg-white rounded-3xl shadow-premium p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Your Rider</h3>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                      <span className="text-xl">🏍️</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{mockOrder.rider.name}</p>
                      <div className="flex items-center space-x-1">
                        <StarIcon className="w-4 h-4 text-yellow-400 fill-current" />
                        <span className="text-sm text-gray-600">{mockOrder.rider.rating}</span>
                      </div>
                    </div>
                  </div>
                  <a
                    href={`tel:${mockOrder.rider.phone}`}
                    className="flex items-center space-x-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                  >
                    <PhoneIcon className="w-5 h-5 text-blue-500" />
                    <span className="font-medium text-gray-900">{mockOrder.rider.phone}</span>
                  </a>
                </div>
              </div>

              {/* Delivery Address */}
              <div className="bg-white rounded-3xl shadow-premium p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Delivery Address</h3>
                <div className="flex items-start space-x-3">
                  <MapPinIcon className="w-5 h-5 text-green-500 flex-shrink-0 mt-1" />
                  <p className="text-gray-700">{mockOrder.deliveryAddress}</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default TrackOrderPage