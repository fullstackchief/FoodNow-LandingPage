'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  HomeIcon,
  TruckIcon,
  BanknotesIcon,
  ChartBarIcon,
  ClockIcon,
  CheckCircleIcon,
  MapPinIcon,
  StarIcon,
  ArrowTrendingUpIcon,
  BellIcon,
  UserCircleIcon,
  PowerIcon
} from '@heroicons/react/24/outline'
import Navigation from '@/components/layout/Navigation'

interface Delivery {
  id: string
  orderId: string
  customerName: string
  pickupLocation: string
  deliveryLocation: string
  distance: string
  earnings: number
  status: 'available' | 'accepted' | 'picked_up' | 'delivered'
  estimatedTime: string
  orderTime: string
  items: number
}

const RiderDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview')
  const [isOnline, setIsOnline] = useState(true)
  
  // Mock rider data
  const rider = {
    id: '1',
    name: 'David Okonkwo',
    image: '/api/placeholder/100/100',
    status: isOnline ? 'online' : 'offline',
    rating: 4.9,
    totalDeliveries: 1847,
    todayDeliveries: 12,
    todayEarnings: 18500,
    weeklyEarnings: 125000,
    monthlyEarnings: 487000,
    activeDelivery: null,
    vehicleType: 'Motorcycle',
    joinedDate: 'January 2024'
  }

  // Mock available deliveries
  const [availableDeliveries, setAvailableDeliveries] = useState<Delivery[]>([
    {
      id: 'DEL001',
      orderId: 'FN202401',
      customerName: 'Sarah Johnson',
      pickupLocation: 'Mama Cass Kitchen, Allen Avenue',
      deliveryLocation: 'Plot 45, Admiralty Way, Lekki Phase 1',
      distance: '5.2 km',
      earnings: 650,
      status: 'available',
      estimatedTime: '25 min',
      orderTime: '2 min ago',
      items: 3
    },
    {
      id: 'DEL002',
      orderId: 'FN202402',
      customerName: 'Mike Adenuga',
      pickupLocation: 'Chicken Republic, Victoria Island',
      deliveryLocation: '12 Banana Island Road, Ikoyi',
      distance: '3.8 km',
      earnings: 500,
      status: 'available',
      estimatedTime: '20 min',
      orderTime: '5 min ago',
      items: 2
    },
    {
      id: 'DEL003',
      orderId: 'FN202403',
      customerName: 'Funke Akindele',
      pickupLocation: 'Domino\'s Pizza, Lekki',
      deliveryLocation: '8 Chevron Drive, Lekki',
      distance: '2.1 km',
      earnings: 400,
      status: 'available',
      estimatedTime: '15 min',
      orderTime: '8 min ago',
      items: 1
    }
  ])

  // Mock completed deliveries
  const completedDeliveries = [
    { id: 'C001', customerName: 'John Doe', earnings: 550, time: '09:30 AM', rating: 5 },
    { id: 'C002', customerName: 'Mary Smith', earnings: 700, time: '10:15 AM', rating: 5 },
    { id: 'C003', customerName: 'Peter Obi', earnings: 450, time: '11:00 AM', rating: 4 },
    { id: 'C004', customerName: 'Grace Eze', earnings: 800, time: '12:30 PM', rating: 5 },
    { id: 'C005', customerName: 'Ahmed Musa', earnings: 600, time: '01:45 PM', rating: 5 }
  ]

  const weeklyStats = [
    { day: 'Mon', deliveries: 18, earnings: 22000 },
    { day: 'Tue', deliveries: 22, earnings: 28000 },
    { day: 'Wed', deliveries: 15, earnings: 19000 },
    { day: 'Thu', deliveries: 25, earnings: 32000 },
    { day: 'Fri', deliveries: 30, earnings: 38000 },
    { day: 'Sat', deliveries: 28, earnings: 35000 },
    { day: 'Sun', deliveries: 12, earnings: 15000 }
  ]

  const acceptDelivery = (deliveryId: string) => {
    setAvailableDeliveries(prev => 
      prev.map(delivery => 
        delivery.id === deliveryId 
          ? { ...delivery, status: 'accepted' as const }
          : delivery
      )
    )
  }

  const getStatusColor = (status: Delivery['status']) => {
    switch (status) {
      case 'available': return 'text-green-600 bg-green-100'
      case 'accepted': return 'text-blue-600 bg-blue-100'
      case 'picked_up': return 'text-orange-600 bg-orange-100'
      case 'delivered': return 'text-gray-600 bg-gray-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Online/Offline Toggle */}
      <div className="bg-white rounded-3xl shadow-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">Your Status</h3>
            <p className="text-sm text-gray-600">
              You are currently {isOnline ? 'receiving delivery requests' : 'not receiving requests'}
            </p>
          </div>
          <button
            onClick={() => setIsOnline(!isOnline)}
            className={`relative inline-flex h-12 w-24 items-center rounded-full transition-colors ${
              isOnline ? 'bg-green-500' : 'bg-gray-300'
            }`}
          >
            <span className={`inline-block h-10 w-10 transform rounded-full bg-white shadow-lg transition-transform ${
              isOnline ? 'translate-x-12' : 'translate-x-1'
            }`}>
              <PowerIcon className={`w-6 h-6 m-2 ${isOnline ? 'text-green-500' : 'text-gray-400'}`} />
            </span>
            <span className={`absolute text-xs font-bold text-white ${
              isOnline ? 'left-3' : 'right-3'
            }`}>
              {isOnline ? 'ON' : 'OFF'}
            </span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl shadow-premium p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-purple-100 rounded-2xl flex items-center justify-center">
              <TruckIcon className="w-6 h-6 text-purple-600" />
            </div>
            <span className="text-2xl font-black text-gray-900">{rider.todayDeliveries}</span>
          </div>
          <h3 className="text-sm font-medium text-gray-600">Today&apos;s Deliveries</h3>
          <p className="text-xs text-purple-600 mt-1">Target: 20 deliveries</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-3xl shadow-premium p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center">
              <BanknotesIcon className="w-6 h-6 text-green-600" />
            </div>
            <span className="text-2xl font-black text-gray-900">₦{rider.todayEarnings.toLocaleString()}</span>
          </div>
          <h3 className="text-sm font-medium text-gray-600">Today&apos;s Earnings</h3>
          <p className="text-xs text-green-600 mt-1">+15% from yesterday</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-3xl shadow-premium p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-orange-100 rounded-2xl flex items-center justify-center">
              <StarIcon className="w-6 h-6 text-orange-600" />
            </div>
            <span className="text-2xl font-black text-gray-900">{rider.rating}</span>
          </div>
          <h3 className="text-sm font-medium text-gray-600">Your Rating</h3>
          <p className="text-xs text-orange-600 mt-1">Excellent performance</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-3xl shadow-premium p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center">
              <ArrowTrendingUpIcon className="w-6 h-6 text-blue-600" />
            </div>
            <span className="text-2xl font-black text-gray-900">85%</span>
          </div>
          <h3 className="text-sm font-medium text-gray-600">Acceptance Rate</h3>
          <p className="text-xs text-blue-600 mt-1">Above average</p>
        </motion.div>
      </div>

      {/* Available Deliveries */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white rounded-3xl shadow-premium p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900">Available Deliveries</h3>
          <span className="text-sm text-gray-500">{availableDeliveries.length} new requests</span>
        </div>
        
        <div className="space-y-4">
          {availableDeliveries.map((delivery) => (
            <div key={delivery.id} className="border border-gray-200 rounded-2xl p-4 hover:border-purple-300 transition-colors">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h4 className="font-semibold text-gray-900">Order #{delivery.orderId}</h4>
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${getStatusColor(delivery.status)}`}>
                      {delivery.status === 'available' ? 'New' : delivery.status}
                    </span>
                    <span className="text-xs text-gray-500">{delivery.orderTime}</span>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex items-start space-x-2">
                      <div className="w-4 h-4 bg-green-500 rounded-full mt-0.5"></div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-700">Pickup</p>
                        <p className="text-gray-600">{delivery.pickupLocation}</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-2">
                      <div className="w-4 h-4 bg-red-500 rounded-full mt-0.5"></div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-700">Delivery</p>
                        <p className="text-gray-600">{delivery.deliveryLocation}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4 mt-3 text-sm text-gray-500">
                    <span className="flex items-center space-x-1">
                      <MapPinIcon className="w-4 h-4" />
                      <span>{delivery.distance}</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <ClockIcon className="w-4 h-4" />
                      <span>{delivery.estimatedTime}</span>
                    </span>
                    <span>{delivery.items} items</span>
                  </div>
                </div>
                
                <div className="text-right ml-4">
                  <p className="text-2xl font-bold text-purple-600 mb-2">₦{delivery.earnings}</p>
                  {delivery.status === 'available' && (
                    <button
                      onClick={() => acceptDelivery(delivery.id)}
                      className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-xl font-medium transition-colors"
                    >
                      Accept
                    </button>
                  )}
                  {delivery.status === 'accepted' && (
                    <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-xl font-medium transition-colors">
                      Navigate
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  )

  const renderEarnings = () => (
    <div className="space-y-6">
      {/* Earnings Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-3xl p-6 text-white shadow-xl">
          <h3 className="text-lg font-semibold mb-2">Today&apos;s Earnings</h3>
          <p className="text-3xl font-black mb-1">₦{rider.todayEarnings.toLocaleString()}</p>
          <p className="text-purple-100 text-sm">{rider.todayDeliveries} deliveries completed</p>
        </div>
        
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-3xl p-6 text-white shadow-xl">
          <h3 className="text-lg font-semibold mb-2">This Week</h3>
          <p className="text-3xl font-black mb-1">₦{rider.weeklyEarnings.toLocaleString()}</p>
          <p className="text-green-100 text-sm">150 deliveries completed</p>
        </div>
        
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-3xl p-6 text-white shadow-xl">
          <h3 className="text-lg font-semibold mb-2">This Month</h3>
          <p className="text-3xl font-black mb-1">₦{rider.monthlyEarnings.toLocaleString()}</p>
          <p className="text-blue-100 text-sm">623 deliveries completed</p>
        </div>
      </div>

      {/* Weekly Performance */}
      <div className="bg-white rounded-3xl shadow-premium p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-6">Weekly Performance</h3>
        <div className="space-y-4">
          {weeklyStats.map((day) => (
            <div key={day.day} className="flex items-center justify-between">
              <span className="font-medium text-gray-700 w-12">{day.day}</span>
              <div className="flex-1 mx-4">
                <div className="bg-gray-200 rounded-full h-8 relative overflow-hidden">
                  <div
                    className="absolute top-0 left-0 h-full bg-gradient-to-r from-purple-500 to-purple-600 rounded-full flex items-center justify-end pr-3"
                    style={{ width: `${(day.earnings / 40000) * 100}%` }}
                  >
                    <span className="text-xs text-white font-medium">{day.deliveries} trips</span>
                  </div>
                </div>
              </div>
              <span className="font-bold text-gray-900 w-24 text-right">₦{day.earnings.toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Today&apos;s Deliveries */}
      <div className="bg-white rounded-3xl shadow-premium p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-6">Today&apos;s Completed Deliveries</h3>
        <div className="space-y-3">
          {completedDeliveries.map((delivery) => (
            <div key={delivery.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                  <CheckCircleIcon className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">{delivery.customerName}</p>
                  <p className="text-sm text-gray-500">{delivery.time}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-gray-900">₦{delivery.earnings}</p>
                <div className="flex items-center space-x-1">
                  {[...Array(5)].map((_, i) => (
                    <StarIcon
                      key={i}
                      className={`w-3 h-3 ${
                        i < delivery.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  const tabs = [
    { id: 'overview', label: 'Overview', icon: HomeIcon },
    { id: 'earnings', label: 'Earnings', icon: BanknotesIcon },
    { id: 'deliveries', label: 'Deliveries', icon: TruckIcon },
    { id: 'performance', label: 'Performance', icon: ChartBarIcon }
  ]

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Header */}
      <section className="bg-gradient-to-r from-purple-50 to-purple-100 pt-24 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-purple-200 rounded-3xl flex items-center justify-center">
                <UserCircleIcon className="w-12 h-12 text-purple-600" />
              </div>
              <div>
                <h1 className="text-3xl font-black text-gray-900">{rider.name}</h1>
                <div className="flex items-center space-x-4 mt-2">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    isOnline 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-gray-100 text-gray-700'
                  }`}>
                    {isOnline ? 'Online' : 'Offline'}
                  </span>
                  <div className="flex items-center space-x-1">
                    <StarIcon className="w-4 h-4 text-yellow-400 fill-current" />
                    <span className="font-medium text-gray-900">{rider.rating}</span>
                  </div>
                  <span className="text-gray-600 text-sm">{rider.vehicleType}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <div className="relative">
                <button className="p-3 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
                  <BellIcon className="w-6 h-6 text-gray-600" />
                </button>
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                  <span className="text-xs font-bold text-white">3</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Tabs */}
      <section className="bg-white border-b border-gray-200 sticky top-20 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center space-x-8 overflow-x-auto scrollbar-hide">
            {tabs.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex items-center space-x-2 py-4 border-b-2 font-medium transition-colors whitespace-nowrap ${
                  activeTab === id
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{label}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {activeTab === 'overview' && renderOverview()}
          {activeTab === 'earnings' && renderEarnings()}
          {activeTab === 'deliveries' && (
            <div className="text-center py-16">
              <TruckIcon className="w-24 h-24 text-gray-300 mx-auto mb-6" />
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Delivery History</h3>
              <p className="text-gray-600">Your complete delivery history will appear here.</p>
            </div>
          )}
          {activeTab === 'performance' && (
            <div className="text-center py-16">
              <ChartBarIcon className="w-24 h-24 text-gray-300 mx-auto mb-6" />
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Performance Analytics</h3>
              <p className="text-gray-600">Detailed performance metrics and insights coming soon.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

export default RiderDashboard