'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { 
  ArrowLeftIcon,
  ClockIcon,
  MapPinIcon,
  PhoneIcon,
  CreditCardIcon,
  ReceiptRefundIcon,
  ChatBubbleLeftIcon,
  StarIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid'
import Navigation from '@/components/layout/Navigation'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import OptimizedImage from '@/components/ui/OptimizedImage'
import { getOrderById, subscribeToOrderUpdates, cancelOrder, rateOrder } from '@/lib/orderService'
import type { OrderWithItems } from '@/types'
import { useAuth } from '@/contexts/AuthContext'
import { devLog, prodLog } from '@/lib/logger'

const statusSteps = [
  { key: 'pending', label: 'Order Placed', icon: '📝' },
  { key: 'confirmed', label: 'Confirmed', icon: '✅' },
  { key: 'preparing', label: 'Preparing', icon: '👨‍🍳' },
  { key: 'ready', label: 'Ready', icon: '📦' },
  { key: 'picked_up', label: 'Out for Delivery', icon: '🏍️' },
  { key: 'delivered', label: 'Delivered', icon: '✔️' }
]

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  preparing: 'bg-orange-100 text-orange-800',
  ready: 'bg-green-100 text-green-800',
  picked_up: 'bg-purple-100 text-purple-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800'
}

interface PageProps {
  params: Promise<{ id: string }>
}

export default function OrderDetailsPage({ params }: PageProps) {
  const [id, setId] = useState<string | null>(null)
  const router = useRouter()
  const { user } = useAuth()
  const [order, setOrder] = useState<OrderWithItems | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isRatingModalOpen, setIsRatingModalOpen] = useState(false)
  const [rating, setRating] = useState(0)
  const [reviewComment, setReviewComment] = useState('')
  const [isSubmittingRating, setIsSubmittingRating] = useState(false)
  const [isCancelling, setIsCancelling] = useState(false)

  useEffect(() => {
    params.then(({ id: paramId }) => setId(paramId))
  }, [params])

  useEffect(() => {
    if (!id) return
    const fetchOrderDetails = async () => {
      setIsLoading(true)
      setError(null)

      try {
        devLog.info('Fetching order details', { orderId: id })
        
        const { data, error: fetchError } = await getOrderById(id)

        if (fetchError) {
          setError(fetchError)
          return
        }

        if (!data) {
          setError('Order not found')
          return
        }

        setOrder(data)
        
        prodLog.info('Order details loaded successfully', {
          orderId: id,
          orderNumber: data.order_number,
          status: data.status
        })

      } catch (err) {
        prodLog.error('Error fetching order details', err, { orderId: id })
        setError('An unexpected error occurred')
      } finally {
        setIsLoading(false)
      }
    }

    if (id) {
      fetchOrderDetails()
    }
  }, [id])

  // Subscribe to real-time order updates
  useEffect(() => {
    if (!order) return

    const unsubscribe = subscribeToOrderUpdates(order.id, (updatedOrder) => {
      setOrder(prev => prev ? { ...prev, ...updatedOrder } : null)
      prodLog.info('Order status updated', {
        orderId: order.id,
        oldStatus: order.status,
        newStatus: updatedOrder.status
      })
    })

    return unsubscribe
  }, [order?.id])

  const handleCancelOrder = async () => {
    if (!order || isCancelling) return

    setIsCancelling(true)
    try {
      const { error } = await cancelOrder(order.id, 'Customer requested cancellation')
      
      if (error) {
        alert(`Failed to cancel order: ${error}`)
      } else {
        setOrder(prev => prev ? { ...prev, status: 'cancelled' } : null)
      }
    } catch (err) {
      alert('Failed to cancel order')
    } finally {
      setIsCancelling(false)
    }
  }

  const handleSubmitRating = async () => {
    if (!order || rating === 0 || isSubmittingRating) return

    setIsSubmittingRating(true)
    try {
      const { error } = await rateOrder(order.id, rating, reviewComment)
      
      if (error) {
        alert(`Failed to submit rating: ${error}`)
      } else {
        setOrder(prev => prev ? { ...prev, rating } : null)
        setIsRatingModalOpen(false)
        setRating(0)
        setReviewComment('')
      }
    } catch (err) {
      alert('Failed to submit rating')
    } finally {
      setIsSubmittingRating(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatEstimatedTime = (isoString: string) => {
    try {
      const date = new Date(isoString)
      return date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit', 
        hour12: true 
      })
    } catch {
      return 'Soon'
    }
  }

  const getStatusStepIndex = (status: string) => {
    return statusSteps.findIndex(step => step.key === status)
  }

  if (!id || isLoading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50">
          <Navigation />
          <div className="pt-20 flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4" />
              <p className="text-gray-600">Loading order details...</p>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  if (error || !order) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50">
          <Navigation />
          <div className="pt-20 flex items-center justify-center min-h-[60vh]">
            <div className="text-center max-w-md mx-auto px-4">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <ExclamationTriangleIcon className="w-8 h-8 text-red-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Order Not Found</h2>
              <p className="text-gray-600 mb-6">{error}</p>
              <div className="space-y-3">
                <Link href="/dashboard/orders">
                  <button className="w-full bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-lg font-medium transition-colors">
                    View All Orders
                  </button>
                </Link>
                <Link href="/dashboard">
                  <button className="w-full bg-gray-100 hover:bg-gray-200 text-gray-900 px-6 py-3 rounded-lg font-medium transition-colors">
                    Back to Dashboard
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  const currentStepIndex = getStatusStepIndex(order.status)
  const canCancel = ['pending', 'confirmed'].includes(order.status)
  const canRate = order.status === 'delivered' && !(order as any).rating

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        
        <div className="pt-20 pb-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            
            {/* Header */}
            <div className="mb-8">
              <Link 
                href="/dashboard/orders"
                className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
              >
                <ArrowLeftIcon className="w-4 h-4 mr-2" />
                Back to Orders
              </Link>
              
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">
                    Order #{order.order_number}
                  </h1>
                  <p className="mt-2 text-gray-600">
                    Placed on {formatDate(order.created_at)}
                  </p>
                </div>
                <div className="text-right">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                    statusColors[order.status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'
                  }`}>
                    {order.status.replace('_', ' ').toUpperCase()}
                  </span>
                  <div className="mt-2 text-2xl font-bold text-gray-900">
                    ₦{order.total.toLocaleString()}
                  </div>
                </div>
              </div>
            </div>

            {/* Order Status Timeline */}
            {order.status !== 'cancelled' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl shadow-sm p-6 mb-8"
              >
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Order Status</h2>
                
                <div className="relative">
                  <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200"></div>
                  <div 
                    className="absolute left-6 top-0 w-0.5 bg-orange-500 transition-all duration-500"
                    style={{ 
                      height: `${Math.max(0, currentStepIndex) * (100 / (statusSteps.length - 1))}%` 
                    }}
                  ></div>
                  
                  <div className="space-y-6">
                    {statusSteps.map((step, index) => {
                      const isCompleted = index <= currentStepIndex
                      const isCurrent = index === currentStepIndex
                      
                      return (
                        <div key={step.key} className="relative flex items-center">
                          <div className={`
                            relative z-10 flex items-center justify-center w-12 h-12 rounded-full text-lg
                            ${isCompleted 
                              ? 'bg-orange-500 text-white' 
                              : 'bg-gray-200 text-gray-400'
                            }
                          `}>
                            {step.icon}
                          </div>
                          
                          <div className="ml-4">
                            <h3 className={`font-medium ${
                              isCompleted ? 'text-gray-900' : 'text-gray-500'
                            }`}>
                              {step.label}
                            </h3>
                            {isCurrent && (
                              <p className="text-sm text-orange-600 mt-1">
                                {step.key === 'picked_up' 
                                  ? `Est. delivery: ${formatEstimatedTime(order.estimated_delivery_time || '')}`
                                  : 'In progress'
                                }
                              </p>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </motion.div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              {/* Restaurant & Delivery Info */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-2xl shadow-sm p-6"
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Restaurant</h3>
                
                {order.restaurants && (
                  <div className="flex items-start space-x-4 mb-6">
                    <OptimizedImage
                      src={order.restaurants.image_url || '/images/restaurants/default.jpg'}
                      alt={order.restaurants.name}
                      width={80}
                      height={80}
                      className="w-20 h-20 rounded-xl object-cover"
                    />
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{order.restaurants.name}</h4>
                      {order.restaurants.location && (
                        <p className="text-sm text-gray-600 mt-1 flex items-start">
                          <MapPinIcon className="w-4 h-4 mr-1 mt-0.5 flex-shrink-0" />
                          {(order.restaurants.location as any)?.address || 'Location available'}
                        </p>
                      )}
                      {order.restaurants.phone_number && (
                        <a
                          href={`tel:${order.restaurants.phone_number}`}
                          className="inline-flex items-center text-sm text-orange-600 hover:text-orange-700 mt-2"
                        >
                          <PhoneIcon className="w-4 h-4 mr-1" />
                          Call Restaurant
                        </a>
                      )}
                    </div>
                  </div>
                )}

                <div className="space-y-3 pt-4 border-t border-gray-100">
                  <h4 className="font-medium text-gray-900">Delivery Address</h4>
                  {order.delivery_address && (
                    <div className="text-sm text-gray-600">
                      <p>{order.delivery_address}</p>
                      {(order as any).delivery_instructions && (
                        <p className="mt-2 text-xs bg-gray-50 p-2 rounded">
                          <strong>Instructions:</strong> {(order as any).delivery_instructions}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>

              {/* Order Items */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-2xl shadow-sm p-6"
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Items</h3>
                
                <div className="space-y-4">
                  {order.order_items?.map((item: any, index: number) => (
                    <div key={index} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          <span className="inline-flex items-center justify-center w-8 h-8 bg-orange-100 text-orange-600 text-sm font-medium rounded-full">
                            {item.quantity}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {item.menu_items?.name || 'Menu Item'}
                          </p>
                          {item.customizations && item.customizations.length > 0 && (
                            <p className="text-sm text-gray-600 mt-1">
                              {Array.isArray(item.customizations) 
                                ? item.customizations.join(', ')
                                : 'Customized'
                              }
                            </p>
                          )}
                          {item.special_instructions && (
                            <p className="text-xs text-gray-500 mt-1">
                              Note: {item.special_instructions}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">
                          ₦{item.total_price?.toLocaleString() || (item.unit_price * item.quantity).toLocaleString()}
                        </p>
                        <p className="text-sm text-gray-500">
                          ₦{item.unit_price?.toLocaleString() || '0'} each
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Order Total Breakdown */}
                <div className="mt-6 pt-4 border-t border-gray-200 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal</span>
                    <span>₦{order.subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Delivery Fee</span>
                    <span>₦{order.delivery_fee.toLocaleString()}</span>
                  </div>
                  {(order as any).service_fee > 0 && (
                    <div className="flex justify-between text-sm">
                      <span>Service Fee</span>
                      <span>₦{(order as any).service_fee.toLocaleString()}</span>
                    </div>
                  )}
                  {order.discount > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Discount</span>
                      <span>-₦{order.discount.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-semibold text-lg pt-2 border-t border-gray-200">
                    <span>Total</span>
                    <span>₦{order.total.toLocaleString()}</span>
                  </div>
                </div>

                {/* Payment Method */}
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-sm text-gray-600">
                      <CreditCardIcon className="w-4 h-4 mr-2" />
                      Payment Method
                    </div>
                    <span className="text-sm font-medium text-gray-900 capitalize">
                      {order.payment_method.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-sm text-gray-600">Payment Status</span>
                    <span className={`text-sm font-medium capitalize ${
                      order.payment_status === 'paid' ? 'text-green-600' : 
                      order.payment_status === 'failed' ? 'text-red-600' : 'text-yellow-600'
                    }`}>
                      {order.payment_status}
                    </span>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Actions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-8 bg-white rounded-2xl shadow-sm p-6"
            >
              <div className="flex flex-col sm:flex-row gap-4 justify-between">
                <div className="flex flex-wrap gap-3">
                  {canCancel && (
                    <button
                      onClick={handleCancelOrder}
                      disabled={isCancelling}
                      className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-50"
                    >
                      {isCancelling ? 'Cancelling...' : 'Cancel Order'}
                    </button>
                  )}
                  
                  {canRate && (
                    <button
                      onClick={() => setIsRatingModalOpen(true)}
                      className="flex items-center px-4 py-2 text-sm font-medium text-orange-600 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors"
                    >
                      <StarIcon className="w-4 h-4 mr-2" />
                      Rate Order
                    </button>
                  )}

                  {order.status === 'delivered' && (
                    <Link href={`/orders/${order.id}/receipt`}>
                      <button className="flex items-center px-4 py-2 text-sm font-medium text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors">
                        <ReceiptRefundIcon className="w-4 h-4 mr-2" />
                        View Receipt
                      </button>
                    </Link>
                  )}
                </div>

                <div className="flex gap-3">
                  <Link href="/support">
                    <button className="flex items-center px-4 py-2 text-sm font-medium text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors">
                      <ChatBubbleLeftIcon className="w-4 h-4 mr-2" />
                      Get Help
                    </button>
                  </Link>
                </div>
              </div>
            </motion.div>

          </div>
        </div>

        {/* Rating Modal */}
        {isRatingModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-2xl p-6 w-full max-w-md"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Rate Your Order</h3>
              
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-3">How was your experience?</p>
                <div className="flex items-center space-x-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setRating(star)}
                      className="p-1"
                    >
                      {star <= rating ? (
                        <StarSolidIcon className="w-8 h-8 text-yellow-400" />
                      ) : (
                        <StarIcon className="w-8 h-8 text-gray-300" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Review (optional)
                </label>
                <textarea
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="Share your experience with other customers..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setIsRatingModalOpen(false)}
                  className="flex-1 px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitRating}
                  disabled={rating === 0 || isSubmittingRating}
                  className="flex-1 px-4 py-2 text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 rounded-lg transition-colors disabled:opacity-50"
                >
                  {isSubmittingRating ? 'Submitting...' : 'Submit Rating'}
                </button>
              </div>
            </motion.div>
          </div>
        )}

      </div>
    </ProtectedRoute>
  )
}