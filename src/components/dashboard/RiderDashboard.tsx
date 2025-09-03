'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import Button from '@/components/ui/Button'
import {
  TruckIcon,
  BanknotesIcon,
  ClockIcon,
  MapPinIcon,
  StarIcon,
  CheckCircleIcon,
  ArrowTrendingUpIcon,
  PowerIcon
} from '@heroicons/react/24/outline'

export default function RiderDashboard() {
  const { user } = useAuth()
  const [isOnline, setIsOnline] = useState(true)
  const [availableOrders, setAvailableOrders] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (user && user.user_role === 'rider') {
      fetchAvailableOrders()
      fetchRiderStats()
      fetchRecentDeliveries()
      startLocationTracking()
    }
  }, [user])

  // Auto-refresh data every 30 seconds when online
  useEffect(() => {
    if (!user || !isOnline) return

    const interval = setInterval(() => {
      fetchAvailableOrders()
      fetchRiderStats()
    }, 30000) // 30 seconds

    return () => clearInterval(interval)
  }, [user, isOnline])

  const startLocationTracking = () => {
    if (!navigator.geolocation) {
      console.warn('Geolocation not supported')
      return
    }

    // Update location every 2 minutes when online
    const locationInterval = setInterval(() => {
      if (isOnline) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            try {
              await fetch('/api/riders/location', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  riderId: user?.id,
                  latitude: position.coords.latitude,
                  longitude: position.coords.longitude,
                  accuracy: position.coords.accuracy
                })
              })
            } catch (error) {
              console.error('Failed to update location:', error)
            }
          },
          (error) => {
            console.warn('Location update failed:', error)
          },
          {
            enableHighAccuracy: false,
            timeout: 10000,
            maximumAge: 60000 // Use cached location up to 1 minute
          }
        )
      }
    }, 120000) // 2 minutes

    // Cleanup on unmount
    return () => clearInterval(locationInterval)
  }

  const fetchAvailableOrders = async () => {
    try {
      const response = await fetch(`/api/riders/orders/available?riderId=${user?.id}`)
      if (response.ok) {
        const data = await response.json()
        setAvailableOrders(data.orders || [])
      }
    } catch (error) {
      console.error('Failed to fetch available orders:', error)
    }
  }

  const fetchRiderStats = async () => {
    try {
      const response = await fetch(`/api/riders/performance?riderId=${user?.id}&timeframe=week&includeScore=true`)
      if (response.ok) {
        const data = await response.json()
        if (data.success && data.data) {
          updateStatsWithRealData(data.data)
        }
      }
    } catch (error) {
      console.error('Failed to fetch rider stats:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchRecentDeliveries = async () => {
    try {
      const response = await fetch(`/api/riders/orders/history?riderId=${user?.id}&limit=5`)
      if (response.ok) {
        const data = await response.json()
        if (data.success && data.deliveries) {
          setRecentDeliveries(data.deliveries)
        }
      }
    } catch (error) {
      console.error('Failed to fetch recent deliveries:', error)
    }
  }

  const updateStatsWithRealData = (performanceData: any) => {
    const metrics = performanceData.metrics
    const score = performanceData.performanceScore

    setRiderStats([
      {
        title: 'Today\'s Deliveries',
        value: String(metrics?.deliveries_today || 0),
        icon: TruckIcon,
        color: 'bg-blue-500',
        change: metrics?.deliveries_today > 0 ? `${metrics.deliveries_today} completed` : 'Start accepting orders'
      },
      {
        title: 'Today\'s Earnings',
        value: `₦${(metrics?.earnings_today || 0).toLocaleString()}`,
        icon: BanknotesIcon,
        color: 'bg-green-500',
        change: metrics?.earnings_today > 0 ? 'Well done!' : 'Complete deliveries to earn'
      },
      {
        title: 'Performance Score',
        value: score?.overallScore ? `${score.overallScore}/100` : 'New',
        icon: StarIcon,
        color: 'bg-yellow-500',
        change: score?.trends?.trendDirection === 'up' ? '↗️ Improving' : score?.trends?.trendDirection === 'down' ? '↘️ Needs attention' : 'Complete deliveries for rating'
      },
      {
        title: 'This Week',
        value: `₦${(metrics?.earnings_this_week || 0).toLocaleString()}`,
        icon: ArrowTrendingUpIcon,
        color: 'bg-purple-500',
        change: 'Weekly earnings'
      }
    ])
  }

  const handleAcceptOrder = async (orderId: string) => {
    try {
      // Get current location for better assignment
      let latitude, longitude
      if (navigator.geolocation) {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 })
        }).catch(() => null)
        
        if (position) {
          latitude = position.coords.latitude
          longitude = position.coords.longitude
        }
      }

      const response = await fetch('/api/riders/orders/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          orderId, 
          riderId: user?.id,
          latitude,
          longitude
        })
      })

      if (response.ok) {
        const result = await response.json()
        setAvailableOrders(prev => prev.filter(order => order.id !== orderId))
        fetchAvailableOrders()
        fetchRiderStats() // Refresh stats after accepting order
        alert(`Order ${result.order?.order_number || orderId} accepted successfully!`)
      } else {
        const error = await response.json()
        alert(`Failed to accept order: ${error.error}`)
      }
    } catch (error) {
      console.error('Error accepting order:', error)
      alert('Failed to accept order. Please try again.')
    }
  }

  const handleToggleOnlineStatus = async () => {
    try {
      // Get current location
      let latitude, longitude
      if (navigator.geolocation) {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 })
        }).catch(() => null)
        
        if (position) {
          latitude = position.coords.latitude
          longitude = position.coords.longitude
        }
      }

      const response = await fetch('/api/riders/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          riderId: user?.id, 
          isOnline: !isOnline,
          latitude,
          longitude
        })
      })

      if (response.ok) {
        const result = await response.json()
        setIsOnline(!isOnline)
        fetchAvailableOrders() // Refresh available orders
        
        if (result.warning) {
          alert(result.warning)
        }
      } else {
        const error = await response.json()
        alert(`Failed to update status: ${error.error}`)
      }
    } catch (error) {
      console.error('Error updating online status:', error)
      alert('Failed to update status. Please try again.')
    }
  }

  const [riderStats, setRiderStats] = useState([
    {
      title: 'Today\'s Deliveries',
      value: '0',
      icon: TruckIcon,
      color: 'bg-blue-500',
      change: 'Start accepting orders'
    },
    {
      title: 'Today\'s Earnings',
      value: '₦0',
      icon: BanknotesIcon,
      color: 'bg-green-500',
      change: 'Complete deliveries to earn'
    },
    {
      title: 'Average Rating',
      value: 'New',
      icon: StarIcon,
      color: 'bg-yellow-500',
      change: 'Complete deliveries for ratings'
    },
    {
      title: 'This Week',
      value: '₦0',
      icon: ArrowTrendingUpIcon,
      color: 'bg-purple-500',
      change: 'Weekly earnings'
    }
  ])

  const [recentDeliveries, setRecentDeliveries] = useState<any[]>([])

  return (
    <div className="space-y-8">
      {/* Rider Status Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-blue-500 to-green-500 rounded-3xl p-8 text-white"
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">Hey {user?.first_name}!</h2>
            <p className="text-blue-100">Ready to earn more today?</p>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className={`flex items-center space-x-2 px-4 py-2 rounded-2xl ${
              isOnline ? 'bg-green-500/20 border border-green-300' : 'bg-gray-500/20 border border-gray-300'
            }`}>
              <div className={`w-3 h-3 rounded-full ${isOnline ? 'bg-green-300' : 'bg-gray-300'}`}></div>
              <span className="font-medium">{isOnline ? 'Online' : 'Offline'}</span>
            </div>
            
            <Button
              onClick={handleToggleOnlineStatus}
              theme="rider"
              variant={isOnline ? "outline" : "primary"}
              size="sm"
              className={`p-3 rounded-xl ${
                isOnline 
                  ? 'bg-red-500 hover:bg-red-600 text-white border-red-500' 
                  : ''
              }`}
              icon={<PowerIcon className="w-6 h-6" />}
            >
              {isOnline ? 'Go Offline' : 'Go Online'}
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {riderStats.map((stat, index) => (
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
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">{stat.value}</h3>
            <p className="text-gray-600 text-sm mb-1">{stat.title}</p>
            {stat.change && <p className="text-xs text-green-600">{stat.change}</p>}
          </motion.div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Available Orders */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl shadow-sm p-6 border border-gray-100"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900 flex items-center space-x-2">
              <TruckIcon className="w-6 h-6 text-blue-600" />
              <span>Available Orders</span>
            </h3>
            <div className="text-sm text-gray-500">{availableOrders.length} available</div>
          </div>

          <div className="space-y-4">
            {availableOrders.map((order) => (
              <div key={order.id} className="p-4 border border-gray-200 rounded-2xl hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="font-semibold text-gray-900">#{order.id}</p>
                    <p className="text-sm text-gray-600">{order.restaurant.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-600">₦{order.earnings}</p>
                    <p className="text-xs text-gray-500">{order.distance} • {order.time}</p>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-600">{order.itemCount || order.items} items</p>
                  <Button 
                    theme="rider" 
                    variant="primary" 
                    size="sm"
                    onClick={() => handleAcceptOrder(order.id)}
                  >
                    Accept Order
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Recent Deliveries */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl shadow-sm p-6 border border-gray-100"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900 flex items-center space-x-2">
              <CheckCircleIcon className="w-6 h-6 text-green-600" />
              <span>Recent Deliveries</span>
            </h3>
            <Link 
              href="/dashboard/orders"
              className="text-green-600 hover:text-green-700 font-medium"
            >
              View All
            </Link>
          </div>

          <div className="space-y-4">
            {recentDeliveries.map((delivery) => (
              <div key={delivery.id} className="p-4 bg-gray-50 rounded-2xl">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-900">#{delivery.id}</p>
                    <p className="text-sm text-gray-600">{delivery.restaurant}</p>
                    <p className="text-xs text-gray-500">{delivery.time}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900">₦{delivery.earnings}</p>
                    <div className="flex items-center space-x-1">
                      {[...Array(delivery.rating)].map((_, i) => (
                        <StarIcon key={i} className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Earnings Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-3xl shadow-sm p-6 border border-gray-100"
      >
        <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center space-x-2">
          <BanknotesIcon className="w-6 h-6 text-green-600" />
          <span>Earnings Breakdown</span>
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">
              ₦{(riderStats.find(s => s.title.includes('Today'))?.value.replace(/[^0-9]/g, '') || '0')}
            </p>
            <p className="text-gray-600">Today</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">
              ₦{(riderStats.find(s => s.title.includes('Week'))?.value.replace(/[^0-9]/g, '') || '0')}
            </p>
            <p className="text-gray-600">This Week</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">₦0</p>
            <p className="text-gray-600">This Month</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">{recentDeliveries.length}</p>
            <p className="text-gray-600">Recent Deliveries</p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}