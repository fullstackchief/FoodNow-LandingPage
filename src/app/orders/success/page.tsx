'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { 
  CheckCircleIcon, 
  ClockIcon, 
  MapPinIcon, 
  PhoneIcon,
  ReceiptRefundIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline'
import Navigation from '@/components/layout/Navigation'
import { supabase } from '@/lib/supabase-client'
import { useAuth } from '@/contexts/AuthContext'
import { devLog, prodLog } from '@/lib/logger'

interface OrderDetails {
  id: string
  order_number: string
  status: string
  total: number
  estimated_delivery_time: string
  delivery_info: any
  restaurant: {
    name: string
    phone: string
    address: string
  }
  items: {
    name: string
    quantity: number
    price: number
    customizations?: any[]
  }[]
}

const OrderSuccessPage = () => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  
  const orderId = searchParams.get('orderId')
  const paymentRef = searchParams.get('ref')
  
  const [order, setOrder] = useState<OrderDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchOrderDetails = async () => {
      if (!orderId) {
        setError('Order ID not found')
        setIsLoading(false)
        return
      }

      try {
        devLog.info('Fetching order details', { orderId, paymentRef })

        // Fetch order with related data
        const { data, error: fetchError } = await supabase
          .from('orders')
          .select(`
            *,
            restaurants!inner(name, phone_number, address),
            order_items(
              id,
              quantity,
              price,
              customizations,
              notes,
              menu_items!inner(name, image_url)
            )
          `)
          .eq('id', orderId)
          .single()

        if (fetchError) {
          prodLog.error('Failed to fetch order details', fetchError, { orderId })
          setError('Failed to load order details')
          return
        }

        if (!data) {
          setError('Order not found')
          return
        }

        // Transform the data for display
        const orderData = data as any
        const orderDetails: OrderDetails = {
          id: orderData.id,
          order_number: orderData.order_number,
          status: orderData.status,
          total: orderData.total,
          estimated_delivery_time: orderData.estimated_delivery_time,
          delivery_info: orderData.delivery_info,
          restaurant: {
            name: orderData.restaurants.name,
            phone: orderData.restaurants.phone_number || '',
            address: orderData.restaurants.address || ''
          },
          items: orderData.order_items.map((item: any) => ({
            name: item.menu_items.name,
            quantity: item.quantity,
            price: item.price,
            customizations: item.customizations
          }))
        }

        setOrder(orderDetails)
        
        prodLog.info('Order details loaded successfully', {
          orderId,
          orderNumber: orderDetails.order_number,
          total: orderDetails.total
        })

      } catch (err) {
        prodLog.error('Error fetching order details', err, { orderId })
        setError('An unexpected error occurred')
      } finally {
        setIsLoading(false)
      }
    }

    fetchOrderDetails()
  }, [orderId, paymentRef])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="pt-20 flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4" />
            <p className="text-gray-600">Loading order details...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="pt-20 flex items-center justify-center min-h-[60vh]">
          <div className="text-center max-w-md mx-auto px-4">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl text-red-600">❌</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Order Not Found</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <div className="space-y-3">
              <Link href="/dashboard">
                <button className="w-full bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-lg font-medium transition-colors">
                  Go to Dashboard
                </button>
              </Link>
              <Link href="/">
                <button className="w-full bg-gray-100 hover:bg-gray-200 text-gray-900 px-6 py-3 rounded-lg font-medium transition-colors">
                  Back to Home
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
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

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="pt-20 pb-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Success Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircleIcon className="w-12 h-12 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Order Confirmed!</h1>
            <p className="text-lg text-gray-600">Your order has been placed successfully.</p>
            <div className="mt-4 inline-flex items-center px-4 py-2 bg-gray-100 rounded-full">
              <span className="text-sm text-gray-600">Order #</span>
              <span className="ml-2 font-mono font-semibold text-orange-600">
                {order.order_number}
              </span>
            </div>
          </motion.div>

          {/* Order Status & Timeline */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl shadow-sm p-6 mb-8"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Order Status</h2>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-orange-100 text-orange-800 capitalize">
                {order.status.replace('_', ' ')}
              </span>
            </div>
            
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <div className="flex items-center">
                <ClockIcon className="w-5 h-5 mr-2" />
                <span>Est. delivery: {formatEstimatedTime(order.estimated_delivery_time)}</span>
              </div>
              <div className="flex items-center">
                <MapPinIcon className="w-5 h-5 mr-2" />
                <span>{order.delivery_info?.area || 'Delivery location'}</span>
              </div>
            </div>

            <div className="mt-6 flex space-x-4">
              <Link href={`/track-order?orderNumber=${order.order_number}`}>
                <button className="flex items-center px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium transition-colors">
                  Track Order
                  <ArrowRightIcon className="w-4 h-4 ml-2" />
                </button>
              </Link>
              <Link href={`/orders/${order.id}`}>
                <button className="flex items-center px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-lg font-medium transition-colors">
                  View Details
                  <ReceiptRefundIcon className="w-4 h-4 ml-2" />
                </button>
              </Link>
            </div>
          </motion.div>

          {/* Restaurant Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl shadow-sm p-6 mb-8"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Restaurant</h3>
            <div className="flex items-start justify-between">
              <div>
                <h4 className="font-medium text-gray-900">{order.restaurant.name}</h4>
                {order.restaurant.address && (
                  <p className="text-sm text-gray-600 mt-1">{order.restaurant.address}</p>
                )}
              </div>
              {order.restaurant.phone && (
                <a
                  href={`tel:${order.restaurant.phone}`}
                  className="flex items-center px-3 py-2 text-sm text-orange-600 hover:text-orange-700 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors"
                >
                  <PhoneIcon className="w-4 h-4 mr-2" />
                  Call
                </a>
              )}
            </div>
          </motion.div>

          {/* Order Summary */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-2xl shadow-sm p-6 mb-8"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h3>
            
            <div className="space-y-4">
              {order.items.map((item, index) => (
                <div key={index} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                  <div className="flex-1">
                    <div className="flex items-center">
                      <span className="inline-flex items-center justify-center w-6 h-6 bg-orange-100 text-orange-600 text-sm font-medium rounded-full mr-3">
                        {item.quantity}
                      </span>
                      <div>
                        <p className="font-medium text-gray-900">{item.name}</p>
                        {item.customizations && item.customizations.length > 0 && (
                          <p className="text-sm text-gray-600 mt-1">
                            {Array.isArray(item.customizations) 
                              ? item.customizations.join(', ')
                              : 'Customized'
                            }
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">
                      ₦{(item.price * item.quantity).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
              
              <div className="pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between text-lg font-bold text-gray-900">
                  <span>Total</span>
                  <span>₦{order.total.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Next Steps */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-blue-50 border border-blue-200 rounded-2xl p-6"
          >
            <h3 className="text-lg font-semibold text-blue-900 mb-3">What happens next?</h3>
            <ul className="space-y-2 text-sm text-blue-800">
              <li className="flex items-start">
                <span className="flex-shrink-0 w-5 h-5 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold mr-3 mt-0.5">1</span>
                The restaurant will confirm your order and start preparing your food
              </li>
              <li className="flex items-start">
                <span className="flex-shrink-0 w-5 h-5 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold mr-3 mt-0.5">2</span>
                You'll receive updates on your order status via SMS and email
              </li>
              <li className="flex items-start">
                <span className="flex-shrink-0 w-5 h-5 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold mr-3 mt-0.5">3</span>
                A rider will be assigned to pick up and deliver your order
              </li>
              <li className="flex items-start">
                <span className="flex-shrink-0 w-5 h-5 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold mr-3 mt-0.5">4</span>
                Track your delivery in real-time and get ready to enjoy your meal!
              </li>
            </ul>
          </motion.div>

        </div>
      </div>
    </div>
  )
}

export default OrderSuccessPage