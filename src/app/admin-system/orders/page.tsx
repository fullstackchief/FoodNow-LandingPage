'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import Link from 'next/link'
import {
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  TruckIcon,
  MapPinIcon,
  BanknotesIcon,
  EyeIcon,
  ExclamationTriangleIcon,
  UserIcon,
  BuildingStorefrontIcon,
  PhoneIcon,
  ArrowLeftIcon,
  FunnelIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline'

interface Order {
  id: string
  order_number: string
  customer_name: string
  customer_phone: string
  customer_address: string
  restaurant_name: string
  restaurant_id: string
  rider_name?: string
  rider_id?: string
  rider_phone?: string
  total_amount: number
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'picked_up' | 'delivered' | 'cancelled'
  created_at: string
  estimated_delivery: string
  payment_method: string
  payment_status: string
  priority: 'normal' | 'high' | 'urgent'
  items: Array<{
    name: string
    quantity: number
    price: number
    customizations?: string[]
  }>
}

export default function AdminOrdersPage() {
  const { isAdminAuthenticated, adminUser } = useAuth()
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [showOrderDetail, setShowOrderDetail] = useState(false)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    if (!isAdminAuthenticated || !adminUser) {
      router.push('/admin-system')
      return
    }
    
    loadOrders()
    
    // Auto-refresh every 15 seconds for live order management
    const interval = setInterval(loadOrders, 15000)
    return () => clearInterval(interval)
  }, [isAdminAuthenticated, adminUser, router])

  const loadOrders = async () => {
    try {
      setLoading(true)
      
      // For now, use mock data. In production, this would fetch from API
      const mockOrders: Order[] = [
        {
          id: '1',
          order_number: 'FN-2024-001',
          customer_name: 'John Doe',
          customer_phone: '+234 803 456 7890',
          customer_address: '15 Victoria Island Road, Lagos',
          restaurant_name: 'Mama Cass Kitchen',
          restaurant_id: '550e8400-e29b-41d4-a716-446655440001',
          total_amount: 4500,
          status: 'preparing',
          created_at: new Date(Date.now() - 900000).toISOString(),
          estimated_delivery: new Date(Date.now() + 1200000).toISOString(),
          payment_method: 'card',
          payment_status: 'paid',
          priority: 'normal',
          rider_name: 'David Eze',
          rider_id: 'rider-001',
          rider_phone: '+234 812 345 6789',
          items: [
            { name: 'Jollof Rice with Chicken', quantity: 2, price: 3500 },
            { name: 'Fried Plantain', quantity: 1, price: 1000 }
          ]
        },
        {
          id: '2',
          order_number: 'FN-2024-002',
          customer_name: 'Sarah Johnson',
          customer_phone: '+234 901 234 5678',
          customer_address: '8 Lekki Phase 1, Lagos',
          restaurant_name: 'Dragon Wok',
          restaurant_id: 'rest-002',
          total_amount: 6200,
          status: 'pending',
          created_at: new Date(Date.now() - 300000).toISOString(),
          estimated_delivery: new Date(Date.now() + 1800000).toISOString(),
          payment_method: 'transfer',
          payment_status: 'paid',
          priority: 'high',
          items: [
            { name: 'Sweet and Sour Chicken', quantity: 1, price: 4500 },
            { name: 'Fried Rice', quantity: 1, price: 1700 }
          ]
        },
        {
          id: '3',
          order_number: 'FN-2024-003',
          customer_name: 'Michael Okonkwo',
          customer_phone: '+234 702 345 6789',
          customer_address: '22 Allen Avenue, Ikeja',
          restaurant_name: 'Pizza Paradise',
          restaurant_id: 'rest-003',
          total_amount: 3800,
          status: 'ready',
          created_at: new Date(Date.now() - 1800000).toISOString(),
          estimated_delivery: new Date(Date.now() + 600000).toISOString(),
          payment_method: 'cash',
          payment_status: 'pending',
          priority: 'urgent',
          items: [
            { name: 'Margherita Pizza', quantity: 1, price: 3800 }
          ]
        }
      ]
      
      setOrders(mockOrders)
    } catch (error) {
      console.error('Failed to load orders:', error)
    } finally {
      setLoading(false)
    }
  }

  const assignRiderToOrder = async (orderId: string) => {
    try {
      console.log('Assigning rider to order:', orderId)
      // Update order status locally for now
      setOrders(prev => prev.map(order => 
        order.id === orderId 
          ? { ...order, status: 'confirmed' as const, rider_name: 'Auto-assigned Rider' }
          : order
      ))
    } catch (error) {
      console.error('Failed to assign rider:', error)
    }
  }

  const updateOrderStatus = async (orderId: string, newStatus: Order['status']) => {
    try {
      setOrders(prev => prev.map(order => 
        order.id === orderId ? { ...order, status: newStatus } : order
      ))
    } catch (error) {
      console.error('Failed to update order status:', error)
    }
  }

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'confirmed': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'preparing': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'ready': return 'bg-green-100 text-green-800 border-green-200'
      case 'picked_up': return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'delivered': return 'bg-gray-100 text-gray-800 border-gray-200'
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getPriorityIcon = (priority: Order['priority']) => {
    switch (priority) {
      case 'high': return '🔸'
      case 'urgent': return '🔴'
      default: return '🔹'
    }
  }

  const getStatusIcon = (status: Order['status']) => {
    switch (status) {
      case 'pending': return <ClockIcon className="w-4 h-4" />
      case 'confirmed': return <CheckCircleIcon className="w-4 h-4" />
      case 'preparing': return <ExclamationTriangleIcon className="w-4 h-4" />
      case 'ready': return <CheckCircleIcon className="w-4 h-4" />
      case 'picked_up': return <TruckIcon className="w-4 h-4" />
      case 'delivered': return <CheckCircleIcon className="w-4 h-4" />
      case 'cancelled': return <XCircleIcon className="w-4 h-4" />
      default: return <ClockIcon className="w-4 h-4" />
    }
  }

  const filteredOrders = orders.filter(order => {
    const matchesFilter = filter === 'all' || order.status === filter
    const matchesSearch = searchTerm === '' || 
      order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.restaurant_name.toLowerCase().includes(searchTerm.toLowerCase())
    
    return matchesFilter && matchesSearch
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading orders...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center space-x-4">
              <Link href="/admin-system/dashboard" className="text-gray-500 hover:text-gray-700">
                <ArrowLeftIcon className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Order Management</h1>
                <p className="text-sm text-gray-600">Monitor and manage all platform orders</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>Live Updates</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Filters and Search */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex items-center space-x-1 bg-gray-100 rounded-xl p-1">
            {[
              { id: 'all', label: 'All Orders', count: orders.length },
              { id: 'pending', label: 'Pending', count: orders.filter(o => o.status === 'pending').length },
              { id: 'confirmed', label: 'Confirmed', count: orders.filter(o => o.status === 'confirmed').length },
              { id: 'preparing', label: 'Preparing', count: orders.filter(o => o.status === 'preparing').length },
              { id: 'ready', label: 'Ready', count: orders.filter(o => o.status === 'ready').length },
              { id: 'delivered', label: 'Delivered', count: orders.filter(o => o.status === 'delivered').length }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id)}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === tab.id
                    ? 'bg-white text-orange-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                  filter === tab.id ? 'bg-orange-100' : 'bg-gray-200'
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
          
          <div className="relative">
            <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search orders, customers, restaurants..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent w-64"
            />
          </div>
        </div>

        {/* Orders Grid */}
        <div className="space-y-4">
          {filteredOrders.map((order, index) => (
            <motion.div
              key={order.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all duration-300"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <span className="text-sm font-medium text-gray-500">#{order.order_number}</span>
                    <div className={`flex items-center space-x-1 px-2 py-1 rounded-full border text-xs font-medium ${getStatusColor(order.status)}`}>
                      {getStatusIcon(order.status)}
                      <span className="capitalize">{order.status.replace('_', ' ')}</span>
                    </div>
                    <span className="text-lg">{getPriorityIcon(order.priority)}</span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="flex items-start space-x-2">
                      <UserIcon className="w-4 h-4 text-gray-500 mt-0.5" />
                      <div>
                        <p className="font-medium text-gray-900">{order.customer_name}</p>
                        <p className="text-gray-600">{order.customer_phone}</p>
                        <p className="text-gray-500 text-xs">{order.customer_address}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-2">
                      <BuildingStorefrontIcon className="w-4 h-4 text-gray-500 mt-0.5" />
                      <div>
                        <p className="font-medium text-gray-900">{order.restaurant_name}</p>
                        <p className="text-gray-600">
                          {order.items.map(item => `${item.quantity}x ${item.name}`).join(', ')}
                        </p>
                      </div>
                    </div>
                    
                    {order.rider_name && (
                      <div className="flex items-start space-x-2">
                        <TruckIcon className="w-4 h-4 text-gray-500 mt-0.5" />
                        <div>
                          <p className="font-medium text-gray-900">{order.rider_name}</p>
                          <p className="text-gray-600">{order.rider_phone}</p>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-4 text-sm text-gray-600 mt-3">
                    <span className="flex items-center space-x-1">
                      <ClockIcon className="w-4 h-4" />
                      <span>{new Date(order.created_at).toLocaleTimeString()}</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <BanknotesIcon className="w-4 h-4" />
                      <span className="capitalize">{order.payment_method} • {order.payment_status}</span>
                    </span>
                  </div>
                </div>
                
                <div className="text-right ml-6">
                  <p className="text-2xl font-bold text-gray-900 mb-2">₦{order.total_amount.toLocaleString()}</p>
                  
                  <div className="flex flex-col space-y-2">
                    <button
                      onClick={() => {
                        setSelectedOrder(order)
                        setShowOrderDetail(true)
                      }}
                      className="flex items-center space-x-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded-lg text-sm font-medium transition-colors"
                    >
                      <EyeIcon className="w-4 h-4" />
                      <span>Details</span>
                    </button>
                    
                    {order.status === 'pending' && !order.rider_id && (
                      <button
                        onClick={() => assignRiderToOrder(order.id)}
                        className="bg-orange-500 hover:bg-orange-600 text-white px-3 py-1 rounded-lg text-sm font-medium transition-colors"
                      >
                        Assign Rider
                      </button>
                    )}
                    
                    {order.status === 'ready' && !order.rider_id && (
                      <button
                        onClick={() => assignRiderToOrder(order.id)}
                        className="bg-purple-500 hover:bg-purple-600 text-white px-3 py-1 rounded-lg text-sm font-medium transition-colors"
                      >
                        Find Rider
                      </button>
                    )}
                    
                    {(order.status === 'pending' || order.status === 'confirmed') && (
                      <button
                        onClick={() => updateOrderStatus(order.id, 'cancelled')}
                        className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-lg text-sm font-medium transition-colors"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
          
          {filteredOrders.length === 0 && (
            <div className="text-center py-16">
              <ClockIcon className="w-24 h-24 text-gray-300 mx-auto mb-6" />
              <h3 className="text-2xl font-bold text-gray-900 mb-4">No Orders Found</h3>
              <p className="text-gray-600">
                {filter === 'all' && searchTerm === ''
                  ? 'No orders have been received yet.'
                  : `No orders match your current filters.`
                }
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Order Detail Modal */}
      {showOrderDetail && selectedOrder && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Order #{selectedOrder.order_number}</h2>
                <p className="text-gray-600">Admin Management View</p>
              </div>
              <button
                onClick={() => setShowOrderDetail(false)}
                className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <XCircleIcon className="w-6 h-6 text-gray-500" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Status and Actions */}
              <div className="flex items-center justify-between">
                <div className={`flex items-center space-x-2 px-3 py-2 rounded-full border ${getStatusColor(selectedOrder.status)}`}>
                  {getStatusIcon(selectedOrder.status)}
                  <span className="capitalize font-medium">{selectedOrder.status.replace('_', ' ')}</span>
                </div>
                <div className="flex space-x-2">
                  {selectedOrder.status === 'pending' && (
                    <button
                      onClick={() => {
                        updateOrderStatus(selectedOrder.id, 'confirmed')
                        setShowOrderDetail(false)
                      }}
                      className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium"
                    >
                      Confirm Order
                    </button>
                  )}
                  {selectedOrder.status === 'confirmed' && (
                    <button
                      onClick={() => {
                        updateOrderStatus(selectedOrder.id, 'preparing')
                        setShowOrderDetail(false)
                      }}
                      className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium"
                    >
                      Start Preparing
                    </button>
                  )}
                  {(selectedOrder.status === 'pending' || selectedOrder.status === 'confirmed') && (
                    <button
                      onClick={() => {
                        updateOrderStatus(selectedOrder.id, 'cancelled')
                        setShowOrderDetail(false)
                      }}
                      className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium"
                    >
                      Cancel Order
                    </button>
                  )}
                </div>
              </div>

              {/* Order Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Customer Information */}
                <div className="bg-gray-50 rounded-xl p-4">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center space-x-2">
                    <UserIcon className="w-5 h-5 text-gray-600" />
                    <span>Customer Information</span>
                  </h3>
                  <div className="space-y-2 text-sm">
                    <p><span className="font-medium">Name:</span> {selectedOrder.customer_name}</p>
                    <p><span className="font-medium">Phone:</span> 
                      <a href={`tel:${selectedOrder.customer_phone}`} className="text-blue-600 hover:text-blue-800 ml-1">
                        {selectedOrder.customer_phone}
                      </a>
                    </p>
                    <p><span className="font-medium">Address:</span> {selectedOrder.customer_address}</p>
                  </div>
                </div>

                {/* Restaurant Information */}
                <div className="bg-gray-50 rounded-xl p-4">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center space-x-2">
                    <BuildingStorefrontIcon className="w-5 h-5 text-gray-600" />
                    <span>Restaurant Information</span>
                  </h3>
                  <div className="space-y-2 text-sm">
                    <p><span className="font-medium">Restaurant:</span> {selectedOrder.restaurant_name}</p>
                    <p><span className="font-medium">Order Time:</span> {new Date(selectedOrder.created_at).toLocaleString()}</p>
                    <p><span className="font-medium">Estimated Delivery:</span> {new Date(selectedOrder.estimated_delivery).toLocaleString()}</p>
                  </div>
                </div>
              </div>

              {/* Order Items */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Order Items</h3>
                <div className="space-y-3">
                  {selectedOrder.items.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                      <div>
                        <h4 className="font-medium text-gray-900">{item.name}</h4>
                        <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                        {item.customizations && (
                          <p className="text-xs text-blue-600 mt-1">{item.customizations.join(', ')}</p>
                        )}
                      </div>
                      <span className="font-semibold text-gray-900">₦{(item.price * item.quantity).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-200">
                  <span className="text-lg font-bold text-gray-900">Total Amount</span>
                  <span className="text-2xl font-black text-green-600">₦{selectedOrder.total_amount.toLocaleString()}</span>
                </div>
              </div>

              {/* Rider Information */}
              {selectedOrder.rider_name && (
                <div className="bg-gray-50 rounded-xl p-4">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center space-x-2">
                    <TruckIcon className="w-5 h-5 text-gray-600" />
                    <span>Delivery Information</span>
                  </h3>
                  <div className="space-y-2 text-sm">
                    <p><span className="font-medium">Rider:</span> {selectedOrder.rider_name}</p>
                    <p><span className="font-medium">Phone:</span>
                      <a href={`tel:${selectedOrder.rider_phone}`} className="text-blue-600 hover:text-blue-800 ml-1">
                        {selectedOrder.rider_phone}
                      </a>
                    </p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}