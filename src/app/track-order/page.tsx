'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { 
  MagnifyingGlassIcon,
  ClockIcon, 
  MapPinIcon, 
  TruckIcon,
  CheckCircleIcon,
  PhoneIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline'
import Navigation from '@/components/layout/Navigation'
import { supabase } from '@/lib/supabase-client'
import { devLog, prodLog } from '@/lib/logger'
import OptimizedImage from '@/components/ui/OptimizedImage'

interface TrackingData {
  id: string
  order_number: string
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'picked_up' | 'delivered' | 'cancelled'
  total: number
  estimated_delivery_time: string
  created_at: string
  delivery_info: any
  tracking_updates: any[]
  restaurant: {
    name: string
    phone: string
    address: string
    image_url: string
  }
  rider: {
    name: string
    phone: string
  } | null
  items: {
    name: string
    quantity: number
    image_url: string
  }[]
}

const statusSteps = [
  { key: 'pending', label: 'Order Placed', icon: CheckCircleIcon },
  { key: 'confirmed', label: 'Confirmed', icon: CheckCircleIcon },
  { key: 'preparing', label: 'Preparing', icon: ClockIcon },
  { key: 'ready', label: 'Ready', icon: CheckCircleIcon },
  { key: 'picked_up', label: 'Out for Delivery', icon: TruckIcon },
  { key: 'delivered', label: 'Delivered', icon: CheckCircleIcon }
]

const TrackOrderPage = () => {
  const searchParams = useSearchParams()
  const orderNumberFromUrl = searchParams.get('orderNumber')
  
  const [orderNumber, setOrderNumber] = useState(orderNumberFromUrl || '')
  const [trackingData, setTrackingData] = useState<TrackingData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchOrderTracking = async (orderNum: string) => {
    if (!orderNum.trim()) {
      setError('Please enter a valid order number')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      devLog.info('Fetching order tracking', { orderNumber: orderNum })

      const { data, error: fetchError } = await supabase
        .from('orders')
        .select(`
          id,
          order_number,
          status,
          total,
          estimated_delivery_time,
          created_at,
          delivery_info,
          tracking_updates,
          restaurants!inner(
            name,
            phone_number,
            address,
            image_url
          ),
          riders(
            first_name,
            last_name,
            phone
          ),
          order_items(
            quantity,
            menu_items!inner(
              name,
              image_url
            )
          )
        `)
        .eq('order_number', orderNum)
        .single()

      if (fetchError) {
        if (fetchError.code === 'PGRST116') {
          setError('Order not found. Please check your order number.')
        } else {
          prodLog.error('Failed to fetch order tracking', fetchError, { orderNumber: orderNum })
          setError('Failed to load order details')
        }
        return
      }

      // Transform the data
      const orderData = data as any
      const tracking: TrackingData = {
        id: orderData.id,
        order_number: orderData.order_number,
        status: orderData.status,
        total: orderData.total,
        estimated_delivery_time: orderData.estimated_delivery_time,
        created_at: orderData.created_at,
        delivery_info: orderData.delivery_info,
        tracking_updates: orderData.tracking_updates || [],
        restaurant: {
          name: orderData.restaurants.name,
          phone: orderData.restaurants.phone_number || '',
          address: orderData.restaurants.address || '',
          image_url: orderData.restaurants.image_url || '/images/restaurants/default.jpg'
        },
        rider: orderData.riders ? {
          name: `${orderData.riders.first_name} ${orderData.riders.last_name}`,
          phone: orderData.riders.phone
        } : null,
        items: orderData.order_items.map((item: any) => ({
          name: item.menu_items.name,
          quantity: item.quantity,
          image_url: item.menu_items.image_url || '/images/food/default.jpg'
        }))
      }

      setTrackingData(tracking)
      
      prodLog.info('Order tracking loaded successfully', {
        orderNumber: orderNum,
        status: tracking.status
      })

    } catch (err) {
      prodLog.error('Error fetching order tracking', err, { orderNumber: orderNum })
      setError('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (orderNumberFromUrl) {
      fetchOrderTracking(orderNumberFromUrl)
    }
  }, [orderNumberFromUrl])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    fetchOrderTracking(orderNumber)
  }

  const getCurrentStepIndex = (status: string) => {
    return statusSteps.findIndex(step => step.key === status)
  }

  const formatEstimatedTime = (isoString: string) => {
    try {
      const date = new Date(isoString)
      return date.toLocaleString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit', 
        hour12: true,
        month: 'short',
        day: 'numeric'
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
          
          {/* Header */}
          <div className="mb-8">
            <Link 
              href="/"
              className="inline-flex items-center space-x-2 text-gray-600 hover:text-orange-600 transition-colors mb-4"
            >
              <ArrowLeftIcon className="w-5 h-5" />
              <span>Back to Home</span>
            </Link>
            
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Track Your Order</h1>
            <p className="text-gray-600">Enter your order number to see real-time updates</p>
          </div>

          {/* Search Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-sm p-6 mb-8"
          >
            <form onSubmit={handleSearch} className="flex gap-4">
              <div className="flex-1 relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Enter your order number (e.g., FN20241225001)"
                  value={orderNumber}
                  onChange={(e) => setOrderNumber(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
              <button
                type="submit"
                disabled={isLoading || !orderNumber.trim()}
                className="px-6 py-3 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
              >
                {isLoading ? 'Searching...' : 'Track Order'}
              </button>
            </form>
          </motion.div>

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-8"
            >
              <p className="text-red-800">{error}</p>
            </motion.div>
          )}

          {/* Tracking Results */}
          {trackingData && (
            <div className="space-y-8">
              
              {/* Order Status Timeline */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl shadow-sm p-6"
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">Order Status</h2>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-orange-100 text-orange-800 capitalize">
                    {trackingData.status.replace('_', ' ')}
                  </span>
                </div>

                {/* Status Timeline */}
                <div className="relative">
                  <div className="flex items-center justify-between">
                    {statusSteps.map((step, index) => {
                      const currentIndex = getCurrentStepIndex(trackingData.status)
                      const isCompleted = index <= currentIndex
                      const isCurrent = index === currentIndex
                      const IconComponent = step.icon

                      return (
                        <div key={step.key} className="flex flex-col items-center flex-1">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${
                            isCompleted 
                              ? 'bg-green-500 text-white' 
                              : isCurrent 
                              ? 'bg-orange-500 text-white animate-pulse' 
                              : 'bg-gray-200 text-gray-400'
                          }`}>
                            <IconComponent className="w-5 h-5" />
                          </div>
                          <p className={`text-xs text-center font-medium ${
                            isCompleted || isCurrent ? 'text-gray-900' : 'text-gray-400'
                          }`}>
                            {step.label}
                          </p>
                          {index < statusSteps.length - 1 && (
                            <div className={`absolute top-5 h-0.5 ${
                              isCompleted ? 'bg-green-500' : 'bg-gray-200'
                            }`} 
                            style={{
                              left: `${(index + 1) * (100 / statusSteps.length)}%`,
                              width: `${100 / statusSteps.length}%`,
                              transform: 'translateX(-50%)'
                            }}
                            />
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Estimated Delivery Time */}
                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center justify-center space-x-2 text-blue-800">
                    <ClockIcon className="w-5 h-5" />
                    <span className="font-medium">
                      Estimated Delivery: {formatEstimatedTime(trackingData.estimated_delivery_time)}
                    </span>
                  </div>
                </div>
              </motion.div>

              {/* Restaurant & Rider Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Restaurant Info */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="bg-white rounded-2xl shadow-sm p-6"
                >
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Restaurant</h3>
                  <div className="flex items-start space-x-4">
                    <OptimizedImage
                      src={trackingData.restaurant.image_url}
                      alt={trackingData.restaurant.name}
                      width={64}
                      height={64}
                      className="w-16 h-16 rounded-xl object-cover"
                    />
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 mb-1">
                        {trackingData.restaurant.name}
                      </h4>
                      {trackingData.restaurant.address && (
                        <p className="text-sm text-gray-600 mb-2">
                          {trackingData.restaurant.address}
                        </p>
                      )}
                      {trackingData.restaurant.phone && (
                        <a
                          href={`tel:${trackingData.restaurant.phone}`}
                          className="inline-flex items-center text-sm text-orange-600 hover:text-orange-700"
                        >
                          <PhoneIcon className="w-4 h-4 mr-1" />
                          Call Restaurant
                        </a>
                      )}
                    </div>
                  </div>
                </motion.div>

                {/* Rider Info */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-white rounded-2xl shadow-sm p-6"
                >
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Delivery Rider</h3>
                  {trackingData.rider ? (
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                          <TruckIcon className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{trackingData.rider.name}</p>
                          <p className="text-sm text-gray-600">Your delivery rider</p>
                        </div>
                      </div>
                      {trackingData.rider.phone && (
                        <a
                          href={`tel:${trackingData.rider.phone}`}
                          className="inline-flex items-center text-sm text-orange-600 hover:text-orange-700"
                        >
                          <PhoneIcon className="w-4 h-4 mr-1" />
                          Call Rider
                        </a>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-2">
                        <TruckIcon className="w-6 h-6 text-gray-400" />
                      </div>
                      <p className="text-sm text-gray-600">Rider will be assigned soon</p>
                    </div>
                  )}
                </motion.div>
              </div>

              {/* Order Summary */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white rounded-2xl shadow-sm p-6"
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h3>
                
                <div className="space-y-4">
                  {trackingData.items.map((item, index) => (
                    <div key={index} className="flex items-center space-x-4">
                      <OptimizedImage
                        src={item.image_url}
                        alt={item.name}
                        width={48}
                        height={48}
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{item.name}</p>
                        <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                      </div>
                    </div>
                  ))}
                  
                  <div className="pt-4 border-t border-gray-100">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-gray-900">Total</span>
                      <span className="font-bold text-gray-900">₦{trackingData.total.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* View Full Details Link */}
                <div className="mt-6 pt-4 border-t border-gray-100">
                  <Link 
                    href={`/orders/${trackingData.id}`}
                    className="inline-flex items-center text-orange-600 hover:text-orange-700 font-medium"
                  >
                    View Full Order Details
                    <ArrowLeftIcon className="w-4 h-4 ml-1 rotate-180" />
                  </Link>
                </div>
              </motion.div>
            </div>
          )}

          {/* Guest Information */}
          {!orderNumberFromUrl && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-blue-50 border border-blue-200 rounded-2xl p-6 text-center"
            >
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MagnifyingGlassIcon className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-blue-900 mb-2">Track Any Order</h3>
              <p className="text-blue-800 mb-4">
                Enter your order number to track your delivery in real-time. 
                You can find your order number in the confirmation SMS or email.
              </p>
              <p className="text-sm text-blue-700">
                Have an account? <Link href="/auth/login" className="font-medium underline">Sign in</Link> to see all your orders.
              </p>
            </motion.div>
          )}

        </div>
      </div>
    </div>
  )
}

export default TrackOrderPage