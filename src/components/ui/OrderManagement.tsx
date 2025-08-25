'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
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
  DocumentTextIcon
} from '@heroicons/react/24/outline'

interface OrderItem {
  id: string
  name: string
  quantity: number
  price: number
  notes?: string
  customizations?: string[]
}

interface Order {
  id: string
  orderNumber: string
  customerName: string
  customerPhone: string
  customerAddress: string
  items: OrderItem[]
  totalAmount: number
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'picked_up' | 'delivered' | 'cancelled'
  orderTime: string
  estimatedTime: number
  riderId?: string
  riderName?: string
  riderPhone?: string
  paymentMethod: 'cash' | 'card' | 'transfer'
  paymentStatus: 'pending' | 'paid' | 'failed'
  notes?: string
  priority: 'normal' | 'high' | 'urgent'
}

interface OrderManagementProps {
  restaurantId?: string
}

const OrderManagement = ({ restaurantId: _restaurantId = 'rest-001' }: OrderManagementProps) => {
  const [orders, setOrders] = useState<Order[]>([])
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [showOrderDetail, setShowOrderDetail] = useState(false)
  const [filter, setFilter] = useState<'all' | 'pending' | 'confirmed' | 'preparing' | 'ready'>('all')
  const [soundEnabled, setSoundEnabled] = useState(true)

  // Simulate real-time order updates
  useEffect(() => {
    // Initialize with mock orders
    const mockOrders: Order[] = [
      {
        id: 'ord-001',
        orderNumber: 'FN-2024-001',
        customerName: 'Sarah Johnson',
        customerPhone: '+234 803 456 7890',
        customerAddress: '15 Victoria Island Road, Lagos',
        items: [
          {
            id: 'item-1',
            name: 'Jollof Rice with Chicken',
            quantity: 2,
            price: 3500,
            notes: 'Extra spicy',
            customizations: ['Extra chicken', 'Less pepper']
          },
          {
            id: 'item-2',
            name: 'Fried Plantain',
            quantity: 1,
            price: 1000
          }
        ],
        totalAmount: 8000,
        status: 'pending',
        orderTime: new Date(Date.now() - 300000).toISOString(),
        estimatedTime: 25,
        paymentMethod: 'transfer',
        paymentStatus: 'paid',
        priority: 'normal'
      },
      {
        id: 'ord-002',
        orderNumber: 'FN-2024-002',
        customerName: 'Michael Okonkwo',
        customerPhone: '+234 901 234 5678',
        customerAddress: '8 Lekki Phase 1, Lagos',
        items: [
          {
            id: 'item-3',
            name: 'Pepper Soup',
            quantity: 1,
            price: 4000,
            customizations: ['Extra fish', 'Hot pepper']
          }
        ],
        totalAmount: 4000,
        status: 'preparing',
        orderTime: new Date(Date.now() - 900000).toISOString(),
        estimatedTime: 15,
        paymentMethod: 'cash',
        paymentStatus: 'pending',
        priority: 'high'
      },
      {
        id: 'ord-003',
        orderNumber: 'FN-2024-003',
        customerName: 'Amina Hassan',
        customerPhone: '+234 702 345 6789',
        customerAddress: '22 Allen Avenue, Ikeja',
        items: [
          {
            id: 'item-4',
            name: 'Suya Combo',
            quantity: 1,
            price: 2500
          },
          {
            id: 'item-5',
            name: 'Chapman Drink',
            quantity: 2,
            price: 800
          }
        ],
        totalAmount: 4100,
        status: 'ready',
        orderTime: new Date(Date.now() - 1800000).toISOString(),
        estimatedTime: 5,
        riderId: 'rider-001',
        riderName: 'David Okonkwo',
        riderPhone: '+234 812 345 6789',
        paymentMethod: 'card',
        paymentStatus: 'paid',
        priority: 'urgent'
      }
    ]
    setOrders(mockOrders)

    // Simulate new orders coming in
    const interval = setInterval(() => {
      if (Math.random() > 0.7) { // 30% chance every 10 seconds
        const newOrder: Order = {
          id: `ord-${Date.now()}`,
          orderNumber: `FN-2024-${String(Date.now()).slice(-3)}`,
          customerName: ['John Doe', 'Jane Smith', 'Ibrahim Ali', 'Grace Eze'][Math.floor(Math.random() * 4)],
          customerPhone: '+234 8XX XXX XXXX',
          customerAddress: ['12 Banana Island', '5 Victoria Island', '8 Lekki Phase 2'][Math.floor(Math.random() * 3)] + ', Lagos',
          items: [
            {
              id: `item-${Date.now()}`,
              name: ['Jollof Rice', 'Fried Rice', 'Ofada Rice', 'Pepper Soup'][Math.floor(Math.random() * 4)],
              quantity: Math.floor(Math.random() * 3) + 1,
              price: Math.floor(Math.random() * 3000) + 2000
            }
          ],
          totalAmount: Math.floor(Math.random() * 5000) + 3000,
          status: 'pending',
          orderTime: new Date().toISOString(),
          estimatedTime: Math.floor(Math.random() * 30) + 15,
          paymentMethod: ['cash', 'card', 'transfer'][Math.floor(Math.random() * 3)] as 'cash' | 'card' | 'transfer',
          paymentStatus: Math.random() > 0.3 ? 'paid' : 'pending',
          priority: Math.random() > 0.8 ? 'high' : 'normal'
        }

        setOrders(prev => [newOrder, ...prev])
        
        // Play notification sound
        if (soundEnabled) {
          // In a real app, you'd play an actual sound file
          console.log('🔔 New order received!')
        }
      }
    }, 10000)

    return () => clearInterval(interval)
  }, [soundEnabled])

  const updateOrderStatus = (orderId: string, newStatus: Order['status']) => {
    setOrders(prev => prev.map(order => 
      order.id === orderId ? { ...order, status: newStatus } : order
    ))
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

  const getPriorityColor = (priority: Order['priority']) => {
    switch (priority) {
      case 'high': return 'bg-orange-500'
      case 'urgent': return 'bg-red-500'
      default: return 'bg-gray-400'
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

  const getTimeColor = (orderTime: string, estimatedTime: number) => {
    const orderDate = new Date(orderTime)
    const now = new Date()
    const minutesPassed = Math.floor((now.getTime() - orderDate.getTime()) / (1000 * 60))
    
    if (minutesPassed > estimatedTime + 10) return 'text-red-600'
    if (minutesPassed > estimatedTime) return 'text-orange-600'
    return 'text-green-600'
  }

  const formatTime = (isoString: string) => {
    return new Date(isoString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const filteredOrders = orders.filter(order => {
    if (filter === 'all') return true
    return order.status === filter
  })

  const OrderDetailModal = () => {
    if (!selectedOrder || !showOrderDetail) return null

    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Order Details</h2>
              <p className="text-gray-600">{selectedOrder.orderNumber}</p>
            </div>
            <button
              onClick={() => setShowOrderDetail(false)}
              className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
            >
              <XCircleIcon className="w-6 h-6 text-gray-500" />
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* Status and Priority */}
            <div className="flex items-center justify-between">
              <div className={`flex items-center space-x-2 px-3 py-1 rounded-full border ${getStatusColor(selectedOrder.status)}`}>
                {getStatusIcon(selectedOrder.status)}
                <span className="capitalize font-medium">{selectedOrder.status}</span>
              </div>
              <div className={`w-3 h-3 rounded-full ${getPriorityColor(selectedOrder.priority)}`} title={`${selectedOrder.priority} priority`}></div>
            </div>

            {/* Customer Info */}
            <div className="bg-gray-50 rounded-xl p-4">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center space-x-2">
                <UserIcon className="w-5 h-5 text-gray-600" />
                <span>Customer Information</span>
              </h3>
              <div className="space-y-2 text-sm">
                <p><span className="font-medium">Name:</span> {selectedOrder.customerName}</p>
                <p><span className="font-medium">Phone:</span> {selectedOrder.customerPhone}</p>
                <p><span className="font-medium">Address:</span> {selectedOrder.customerAddress}</p>
              </div>
            </div>

            {/* Order Items */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center space-x-2">
                <DocumentTextIcon className="w-5 h-5 text-gray-600" />
                <span>Order Items</span>
              </h3>
              <div className="space-y-3">
                {selectedOrder.items.map((item) => (
                  <div key={item.id} className="flex items-start justify-between p-3 bg-gray-50 rounded-xl">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{item.name}</h4>
                      <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                      {item.customizations && (
                        <p className="text-xs text-blue-600 mt-1">
                          {item.customizations.join(', ')}
                        </p>
                      )}
                      {item.notes && (
                        <p className="text-xs text-gray-500 mt-1 italic">&quot;{item.notes}&quot;</p>
                      )}
                    </div>
                    <span className="font-semibold text-gray-900">₦{(item.price * item.quantity).toLocaleString()}</span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-200">
                <span className="text-lg font-bold text-gray-900">Total</span>
                <span className="text-xl font-black text-green-600">₦{selectedOrder.totalAmount.toLocaleString()}</span>
              </div>
            </div>

            {/* Payment Info */}
            <div className="bg-gray-50 rounded-xl p-4">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center space-x-2">
                <BanknotesIcon className="w-5 h-5 text-gray-600" />
                <span>Payment Information</span>
              </h3>
              <div className="flex justify-between text-sm">
                <span>Payment Method:</span>
                <span className="capitalize font-medium">{selectedOrder.paymentMethod}</span>
              </div>
              <div className="flex justify-between text-sm mt-1">
                <span>Payment Status:</span>
                <span className={`capitalize font-medium ${
                  selectedOrder.paymentStatus === 'paid' ? 'text-green-600' : 
                  selectedOrder.paymentStatus === 'pending' ? 'text-orange-600' : 'text-red-600'
                }`}>
                  {selectedOrder.paymentStatus}
                </span>
              </div>
            </div>

            {/* Rider Info */}
            {selectedOrder.riderId && (
              <div className="bg-gray-50 rounded-xl p-4">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center space-x-2">
                  <TruckIcon className="w-5 h-5 text-gray-600" />
                  <span>Rider Information</span>
                </h3>
                <div className="space-y-2 text-sm">
                  <p><span className="font-medium">Name:</span> {selectedOrder.riderName}</p>
                  <p><span className="font-medium">Phone:</span> {selectedOrder.riderPhone}</p>
                </div>
              </div>
            )}

            {/* Order Actions */}
            <div className="flex space-x-3">
              {selectedOrder.status === 'pending' && (
                <>
                  <button
                    onClick={() => {
                      updateOrderStatus(selectedOrder.id, 'confirmed')
                      setShowOrderDetail(false)
                    }}
                    className="flex-1 bg-green-500 hover:bg-green-600 text-white py-3 rounded-xl font-medium transition-colors"
                  >
                    Confirm Order
                  </button>
                  <button
                    onClick={() => {
                      updateOrderStatus(selectedOrder.id, 'cancelled')
                      setShowOrderDetail(false)
                    }}
                    className="flex-1 bg-red-500 hover:bg-red-600 text-white py-3 rounded-xl font-medium transition-colors"
                  >
                    Cancel Order
                  </button>
                </>
              )}
              
              {selectedOrder.status === 'confirmed' && (
                <button
                  onClick={() => {
                    updateOrderStatus(selectedOrder.id, 'preparing')
                    setShowOrderDetail(false)
                  }}
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-xl font-medium transition-colors"
                >
                  Start Preparing
                </button>
              )}

              {selectedOrder.status === 'preparing' && (
                <button
                  onClick={() => {
                    updateOrderStatus(selectedOrder.id, 'ready')
                    setShowOrderDetail(false)
                  }}
                  className="w-full bg-green-500 hover:bg-green-600 text-white py-3 rounded-xl font-medium transition-colors"
                >
                  Mark as Ready
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Order Management</h2>
          <p className="text-gray-600">Manage incoming orders in real-time</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`flex items-center space-x-2 px-3 py-2 rounded-xl border transition-colors ${
              soundEnabled 
                ? 'bg-green-50 text-green-700 border-green-200' 
                : 'bg-gray-50 text-gray-700 border-gray-200'
            }`}
          >
            <span className="text-sm">🔔</span>
            <span className="text-sm font-medium">{soundEnabled ? 'Sound On' : 'Sound Off'}</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center space-x-1 bg-gray-100 rounded-xl p-1">
        {[
          { id: 'all', label: 'All Orders', count: orders.length },
          { id: 'pending', label: 'Pending', count: orders.filter(o => o.status === 'pending').length },
          { id: 'confirmed', label: 'Confirmed', count: orders.filter(o => o.status === 'confirmed').length },
          { id: 'preparing', label: 'Preparing', count: orders.filter(o => o.status === 'preparing').length },
          { id: 'ready', label: 'Ready', count: orders.filter(o => o.status === 'ready').length }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id as typeof filter)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === tab.id
                ? 'bg-white text-green-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <span>{tab.label}</span>
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${
              filter === tab.id ? 'bg-green-100' : 'bg-gray-200'
            }`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        <AnimatePresence>
          {filteredOrders.map((order, index) => (
            <motion.div
              key={order.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <div className={`w-3 h-3 rounded-full ${getPriorityColor(order.priority)}`}></div>
                    <h3 className="text-lg font-bold text-gray-900">{order.orderNumber}</h3>
                    <div className={`flex items-center space-x-1 px-2 py-1 rounded-full border text-xs font-medium ${getStatusColor(order.status)}`}>
                      {getStatusIcon(order.status)}
                      <span className="capitalize">{order.status}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4 text-sm text-gray-600 mb-2">
                    <span className="flex items-center space-x-1">
                      <UserIcon className="w-4 h-4" />
                      <span>{order.customerName}</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <ClockIcon className="w-4 h-4" />
                      <span className={getTimeColor(order.orderTime, order.estimatedTime)}>
                        {formatTime(order.orderTime)}
                      </span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <MapPinIcon className="w-4 h-4" />
                      <span>{order.estimatedTime} min</span>
                    </span>
                  </div>
                  
                  <div className="text-sm text-gray-600">
                    {order.items.map((item, idx) => (
                      <span key={item.id}>
                        {item.quantity}x {item.name}
                        {idx < order.items.length - 1 ? ', ' : ''}
                      </span>
                    ))}
                  </div>
                </div>
                
                <div className="text-right ml-4">
                  <p className="text-2xl font-black text-green-600 mb-2">₦{order.totalAmount.toLocaleString()}</p>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => {
                        setSelectedOrder(order)
                        setShowOrderDetail(true)
                      }}
                      className="flex items-center space-x-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-xl font-medium transition-colors text-sm"
                    >
                      <EyeIcon className="w-4 h-4" />
                      <span>View</span>
                    </button>
                    
                    {order.status === 'pending' && (
                      <button
                        onClick={() => updateOrderStatus(order.id, 'confirmed')}
                        className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-xl font-medium transition-colors text-sm"
                      >
                        Confirm
                      </button>
                    )}
                    
                    {order.status === 'confirmed' && (
                      <button
                        onClick={() => updateOrderStatus(order.id, 'preparing')}
                        className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl font-medium transition-colors text-sm"
                      >
                        Prepare
                      </button>
                    )}
                    
                    {order.status === 'preparing' && (
                      <button
                        onClick={() => updateOrderStatus(order.id, 'ready')}
                        className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-xl font-medium transition-colors text-sm"
                      >
                        Ready
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {filteredOrders.length === 0 && (
          <div className="text-center py-16">
            <DocumentTextIcon className="w-24 h-24 text-gray-300 mx-auto mb-6" />
            <h3 className="text-2xl font-bold text-gray-900 mb-4">No Orders Found</h3>
            <p className="text-gray-600">
              {filter === 'all' 
                ? 'No orders have been received yet.' 
                : `No ${filter} orders at the moment.`
              }
            </p>
          </div>
        )}
      </div>
      
      <OrderDetailModal />
    </div>
  )
}

export default OrderManagement