'use client'

import { useState, useEffect, useRef } from 'react'
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
  DocumentTextIcon,
  PhoneIcon,
  PlayIcon,
  PauseIcon
} from '@heroicons/react/24/outline'
import type { OrderWithItems } from '@/types'

interface OrderQueueProps {
  orders: OrderWithItems[]
  restaurantId: string
  onOrderUpdate: () => void
}

interface CountdownTimerProps {
  orderId: string
  orderCreatedAt: string
  onTimeout: () => void
  onManualAction: () => void
}

const CountdownTimer = ({ orderId, orderCreatedAt, onTimeout, onManualAction }: CountdownTimerProps) => {
  const [timeLeft, setTimeLeft] = useState(30)
  const [isActive, setIsActive] = useState(true)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    const orderTime = new Date(orderCreatedAt).getTime()
    const now = Date.now()
    const elapsed = Math.floor((now - orderTime) / 1000)
    const remaining = Math.max(0, 30 - elapsed)
    
    setTimeLeft(remaining)
    
    if (remaining <= 0) {
      onTimeout()
      return
    }

    if (isActive && remaining > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            onTimeout()
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [orderCreatedAt, isActive, onTimeout])

  const handleManualAction = () => {
    setIsActive(false)
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }
    onManualAction()
  }

  if (timeLeft <= 0) {
    return (
      <div className="flex items-center space-x-2 text-red-600">
        <XCircleIcon className="w-4 h-4" />
        <span className="text-sm font-medium">Auto-confirmed</span>
      </div>
    )
  }

  const urgencyColor = timeLeft <= 10 ? 'text-red-600' : timeLeft <= 20 ? 'text-orange-600' : 'text-green-600'
  const urgencyBg = timeLeft <= 10 ? 'bg-red-100' : timeLeft <= 20 ? 'bg-orange-100' : 'bg-green-100'

  return (
    <div className="flex items-center space-x-3">
      <div className={`flex items-center space-x-2 px-3 py-1 rounded-lg ${urgencyBg}`}>
        <ClockIcon className={`w-4 h-4 ${urgencyColor}`} />
        <span className={`text-sm font-bold ${urgencyColor}`}>
          {timeLeft}s
        </span>
      </div>
      <div className="flex space-x-2">
        <button
          onClick={handleManualAction}
          className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-lg text-sm font-medium transition-colors"
        >
          Accept
        </button>
        <button
          onClick={handleManualAction}
          className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-lg text-sm font-medium transition-colors"
        >
          Reject
        </button>
      </div>
    </div>
  )
}

const OrderQueue = ({ orders, restaurantId, onOrderUpdate }: OrderQueueProps) => {
  const [selectedOrder, setSelectedOrder] = useState<OrderWithItems | null>(null)
  const [showOrderDetail, setShowOrderDetail] = useState(false)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [rejectionReason, setRejectionReason] = useState('')
  const [updating, setUpdating] = useState<string | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  // Play notification sound for new orders
  useEffect(() => {
    if (soundEnabled && typeof window !== 'undefined') {
      // Create audio element for notification
      audioRef.current = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBD+U2e3PfSgFJ3zJ7tyNOQcXY7jr6KFODBFLp+TxtmQcCDuS1+/MeysFJXfH8N2QQAoTXrTp66hUFAlHn+DyvmwoAzWj2O+8dyqUAA==')
      audioRef.current.volume = 0.3
    }
  }, [soundEnabled])

  const updateOrderStatus = async (orderId: string, newStatus: 'confirmed' | 'preparing' | 'ready' | 'cancelled', reason?: string) => {
    setUpdating(orderId)
    try {
      const response = await fetch(`/api/orders/restaurant/${orderId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: newStatus,
          restaurantId,
          rejectionReason: reason
        }),
      })

      const data = await response.json()

      if (data.success) {
        onOrderUpdate()
        setShowOrderDetail(false)
        setRejectionReason('')
      } else {
        console.error('Failed to update order:', data.error)
        alert('Failed to update order status')
      }
    } catch (error) {
      console.error('Error updating order:', error)
      alert('Error updating order status')
    } finally {
      setUpdating(null)
    }
  }

  const handleAutoAccept = (orderId: string) => {
    updateOrderStatus(orderId, 'confirmed')
  }

  const handleManualAction = () => {
    // This is called when user takes manual action, stopping the countdown
  }

  const playNotificationSound = () => {
    if (soundEnabled && audioRef.current) {
      audioRef.current.play().catch(e => console.log('Audio play failed:', e))
    }
  }

  const getStatusColor = (status: string) => {
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

  const getPriorityColor = (order: OrderWithItems) => {
    // Determine priority based on order value and time
    const orderTime = new Date(order.created_at).getTime()
    const now = Date.now()
    const minutesWaiting = Math.floor((now - orderTime) / (1000 * 60))
    
    if (order.total > 10000 || minutesWaiting > 15) return 'bg-red-500'
    if (order.total > 5000 || minutesWaiting > 10) return 'bg-orange-500'
    return 'bg-gray-400'
  }

  const getStatusIcon = (status: string) => {
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

  const formatTime = (isoString: string) => {
    return new Date(isoString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatOrderValue = (order: OrderWithItems) => {
    return order.order_items?.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0) || order.total
  }

  const OrderDetailModal = () => {
    if (!selectedOrder || !showOrderDetail) return null

    const customerInfo = selectedOrder.delivery_info?.customer || {}
    const orderValue = formatOrderValue(selectedOrder)

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
              <p className="text-gray-600">{selectedOrder.order_number}</p>
            </div>
            <button
              onClick={() => setShowOrderDetail(false)}
              className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
            >
              <XCircleIcon className="w-6 h-6 text-gray-500" />
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* Status and Auto-Accept Timer */}
            <div className="flex items-center justify-between">
              <div className={`flex items-center space-x-2 px-3 py-1 rounded-full border ${getStatusColor(selectedOrder.status)}`}>
                {getStatusIcon(selectedOrder.status)}
                <span className="capitalize font-medium">{selectedOrder.status}</span>
              </div>
              
              {selectedOrder.status === 'pending' && (
                <CountdownTimer
                  orderId={selectedOrder.id}
                  orderCreatedAt={selectedOrder.created_at}
                  onTimeout={() => handleAutoAccept(selectedOrder.id)}
                  onManualAction={handleManualAction}
                />
              )}
            </div>

            {/* Customer Info */}
            <div className="bg-gray-50 rounded-xl p-4">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center space-x-2">
                <UserIcon className="w-5 h-5 text-gray-600" />
                <span>Customer Information</span>
              </h3>
              <div className="space-y-2 text-sm">
                <p><span className="font-medium">Name:</span> {customerInfo?.first_name} {customerInfo?.last_name}</p>
                <p className="flex items-center space-x-2">
                  <span className="font-medium">Phone:</span> 
                  <span>{customerInfo?.phone}</span>
                  <a href={`tel:${customerInfo?.phone}`} className="text-green-600 hover:text-green-700">
                    <PhoneIcon className="w-4 h-4" />
                  </a>
                </p>
                <p><span className="font-medium">Address:</span> {selectedOrder.delivery_address}</p>
                {selectedOrder.special_instructions && (
                  <p><span className="font-medium">Instructions:</span> {selectedOrder.special_instructions}</p>
                )}
              </div>
            </div>

            {/* Order Items */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center space-x-2">
                <DocumentTextIcon className="w-5 h-5 text-gray-600" />
                <span>Order Items</span>
              </h3>
              <div className="space-y-3">
                {selectedOrder.order_items?.map((item: any) => (
                  <div key={item.id} className="flex items-start justify-between p-3 bg-gray-50 rounded-xl">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{item.menu_items?.name || 'Unknown Item'}</h4>
                      <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                      {item.customizations && (
                        <p className="text-xs text-blue-600 mt-1">
                          {typeof item.customizations === 'string' 
                            ? item.customizations 
                            : JSON.stringify(item.customizations)}
                        </p>
                      )}
                      {item.notes && (
                        <p className="text-xs text-gray-500 mt-1 italic">&quot;{item.notes}&quot;</p>
                      )}
                    </div>
                    <span className="font-semibold text-gray-900">₦{item.total_price.toLocaleString()}</span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-200">
                <span className="text-lg font-bold text-gray-900">Total</span>
                <span className="text-xl font-black text-green-600">₦{orderValue.toLocaleString()}</span>
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
                <span className="capitalize font-medium">{selectedOrder.payment_method}</span>
              </div>
              <div className="flex justify-between text-sm mt-1">
                <span>Payment Status:</span>
                <span className={`capitalize font-medium ${
                  selectedOrder.payment_status === 'paid' ? 'text-green-600' : 
                  selectedOrder.payment_status === 'pending' ? 'text-orange-600' : 'text-red-600'
                }`}>
                  {selectedOrder.payment_status}
                </span>
              </div>
            </div>

            {/* Order Actions */}
            <div className="space-y-3">
              {selectedOrder.status === 'pending' && (
                <div className="space-y-3">
                  <div className="flex space-x-3">
                    <button
                      onClick={() => updateOrderStatus(selectedOrder.id, 'confirmed')}
                      disabled={updating === selectedOrder.id}
                      className="flex-1 bg-green-500 hover:bg-green-600 disabled:bg-green-300 text-white py-3 rounded-xl font-medium transition-colors"
                    >
                      {updating === selectedOrder.id ? 'Confirming...' : 'Confirm Order'}
                    </button>
                  </div>
                  
                  {/* Rejection Reason */}
                  <div className="space-y-2">
                    <select
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    >
                      <option value="">Select rejection reason</option>
                      <option value="ingredients_unavailable">Ingredients unavailable</option>
                      <option value="kitchen_closed">Kitchen temporarily closed</option>
                      <option value="delivery_area_unavailable">Delivery area not available</option>
                      <option value="too_busy">Too busy to fulfill order</option>
                      <option value="payment_issue">Payment verification issue</option>
                      <option value="other">Other reason</option>
                    </select>
                    <button
                      onClick={() => updateOrderStatus(selectedOrder.id, 'cancelled', rejectionReason)}
                      disabled={!rejectionReason || updating === selectedOrder.id}
                      className="w-full bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white py-3 rounded-xl font-medium transition-colors"
                    >
                      {updating === selectedOrder.id ? 'Cancelling...' : 'Cancel Order'}
                    </button>
                  </div>
                </div>
              )}
              
              {selectedOrder.status === 'confirmed' && (
                <button
                  onClick={() => updateOrderStatus(selectedOrder.id, 'preparing')}
                  disabled={updating === selectedOrder.id}
                  className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white py-3 rounded-xl font-medium transition-colors"
                >
                  {updating === selectedOrder.id ? 'Starting...' : 'Start Preparing'}
                </button>
              )}

              {selectedOrder.status === 'preparing' && (
                <button
                  onClick={() => updateOrderStatus(selectedOrder.id, 'ready')}
                  disabled={updating === selectedOrder.id}
                  className="w-full bg-green-500 hover:bg-green-600 disabled:bg-green-300 text-white py-3 rounded-xl font-medium transition-colors"
                >
                  {updating === selectedOrder.id ? 'Updating...' : 'Mark as Ready'}
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
      {/* Sound Control */}
      <div className="flex justify-end">
        <button
          onClick={() => setSoundEnabled(!soundEnabled)}
          className={`flex items-center space-x-2 px-3 py-2 rounded-xl border transition-colors ${
            soundEnabled 
              ? 'bg-green-50 text-green-700 border-green-200' 
              : 'bg-gray-50 text-gray-700 border-gray-200'
          }`}
        >
          {soundEnabled ? <PlayIcon className="w-4 h-4" /> : <PauseIcon className="w-4 h-4" />}
          <span className="text-sm font-medium">{soundEnabled ? 'Sound On' : 'Sound Off'}</span>
        </button>
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        <AnimatePresence>
          {orders.map((order, index) => {
            const customerInfo = order.delivery_info?.customer || {}
            const orderValue = formatOrderValue(order)
            const orderTime = new Date(order.created_at)
            const minutesAgo = Math.floor((Date.now() - orderTime.getTime()) / (1000 * 60))

            return (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.05 }}
                className={`bg-white rounded-2xl shadow-lg border-2 p-6 hover:shadow-xl transition-all duration-300 ${
                  order.status === 'pending' ? 'border-yellow-200 ring-2 ring-yellow-100' : 'border-gray-100'
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <div className={`w-3 h-3 rounded-full ${getPriorityColor(order)}`}></div>
                      <h3 className="text-lg font-bold text-gray-900">{order.order_number}</h3>
                      <div className={`flex items-center space-x-1 px-2 py-1 rounded-full border text-xs font-medium ${getStatusColor(order.status)}`}>
                        {getStatusIcon(order.status)}
                        <span className="capitalize">{order.status}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4 text-sm text-gray-600 mb-2">
                      <span className="flex items-center space-x-1">
                        <UserIcon className="w-4 h-4" />
                        <span>{customerInfo?.first_name} {customerInfo?.last_name}</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <ClockIcon className="w-4 h-4" />
                        <span>{formatTime(order.created_at)} ({minutesAgo}m ago)</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <MapPinIcon className="w-4 h-4" />
                        <span>{order.delivery_address}</span>
                      </span>
                    </div>
                    
                    <div className="text-sm text-gray-600">
                      {order.order_items?.map((item: any, idx: number) => (
                        <span key={item.id}>
                          {item.quantity}x {item.menu_items?.name || 'Unknown Item'}
                          {idx < (order.order_items?.length || 0) - 1 ? ', ' : ''}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <div className="text-right ml-4">
                    <p className="text-2xl font-black text-green-600 mb-2">₦{orderValue.toLocaleString()}</p>
                    
                    {/* Auto-Accept Timer for Pending Orders */}
                    {order.status === 'pending' && (
                      <div className="mb-2">
                        <CountdownTimer
                          orderId={order.id}
                          orderCreatedAt={order.created_at}
                          onTimeout={() => handleAutoAccept(order.id)}
                          onManualAction={handleManualAction}
                        />
                      </div>
                    )}
                    
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
                      
                      {/* Quick Action Buttons */}
                      {order.status === 'pending' && (
                        <div className="flex space-x-1">
                          <button
                            onClick={() => updateOrderStatus(order.id, 'confirmed')}
                            disabled={updating === order.id}
                            className="bg-green-500 hover:bg-green-600 disabled:bg-green-300 text-white px-3 py-2 rounded-xl font-medium transition-colors text-sm"
                          >
                            {updating === order.id ? '...' : 'Accept'}
                          </button>
                        </div>
                      )}
                      
                      {order.status === 'confirmed' && (
                        <button
                          onClick={() => updateOrderStatus(order.id, 'preparing')}
                          disabled={updating === order.id}
                          className="bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white px-3 py-2 rounded-xl font-medium transition-colors text-sm"
                        >
                          {updating === order.id ? '...' : 'Prepare'}
                        </button>
                      )}
                      
                      {order.status === 'preparing' && (
                        <button
                          onClick={() => updateOrderStatus(order.id, 'ready')}
                          disabled={updating === order.id}
                          className="bg-green-500 hover:bg-green-600 disabled:bg-green-300 text-white px-3 py-2 rounded-xl font-medium transition-colors text-sm"
                        >
                          {updating === order.id ? '...' : 'Ready'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
      
      <OrderDetailModal />
    </div>
  )
}

export default OrderQueue