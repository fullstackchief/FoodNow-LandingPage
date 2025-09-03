'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { 
  ClockIcon, 
  MapPinIcon, 
  ArrowRightIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  StarIcon,
  ReceiptRefundIcon
} from '@heroicons/react/24/outline'
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid'
import { supabase } from '@/lib/supabase-client'
import { useAuth } from '@/contexts/AuthContext'
import { devLog, prodLog } from '@/lib/logger'
import OptimizedImage from '@/components/ui/OptimizedImage'

interface OrderHistoryItem {
  id: string
  order_number: string
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'picked_up' | 'delivered' | 'cancelled'
  total: number
  created_at: string
  rating: number | null
  restaurant: {
    id: string
    name: string
    image_url: string
  }
  items: {
    name: string
    quantity: number
    image_url: string
  }[]
  item_count: number
}

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  preparing: 'bg-orange-100 text-orange-800',
  ready: 'bg-green-100 text-green-800',
  picked_up: 'bg-purple-100 text-purple-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800'
}

const statusLabels = {
  pending: 'Order Placed',
  confirmed: 'Confirmed',
  preparing: 'Preparing',
  ready: 'Ready for Pickup',
  picked_up: 'Out for Delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled'
}

interface OrderHistoryProps {
  className?: string
}

const OrderHistory = ({ className = '' }: OrderHistoryProps) => {
  const { user } = useAuth()
  const [orders, setOrders] = useState<OrderHistoryItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'amount'>('newest')

  const fetchOrderHistory = async () => {
      if (!user) return

      setIsLoading(true)
      setError(null)

      try {
        devLog.info('Fetching order history', { userId: user.id })

        const { data, error: fetchError } = await supabase
          .from('orders')
          .select(`
            id,
            order_number,
            status,
            total,
            rating,
            created_at,
            restaurants!inner(
              id,
              name,
              image_url
            ),
            order_items(
              quantity,
              menu_items!inner(
                name,
                image_url
              )
            )
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })

        if (fetchError) {
          prodLog.error('Failed to fetch order history', fetchError, { userId: user.id })
          setError('Failed to load order history')
          return
        }

        // Transform the data for display
        const orderHistory: OrderHistoryItem[] = (data || []).map((order: any) => ({
          id: order.id,
          order_number: order.order_number,
          status: order.status,
          total: order.total,
          rating: order.rating,
          created_at: order.created_at,
          restaurant: {
            id: order.restaurants.id,
            name: order.restaurants.name,
            image_url: order.restaurants.image_url
          },
          items: order.order_items.map((item: any) => ({
            name: item.menu_items.name,
            quantity: item.quantity,
            image_url: item.menu_items.image_url
          })),
          item_count: order.order_items.reduce((sum: number, item: any) => sum + item.quantity, 0)
        }))

        setOrders(orderHistory)
        
        prodLog.info('Order history loaded successfully', {
          userId: user.id,
          orderCount: orderHistory.length
        })

      } catch (err) {
        prodLog.error('Error fetching order history', err, { userId: user.id })
        setError('An unexpected error occurred')
      } finally {
        setIsLoading(false)
      }
    }

  useEffect(() => {
    fetchOrderHistory()
  }, [user])

  const filteredOrders = orders.filter(order => {
    // Search filter
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase()
      const matchesSearch = 
        order.order_number.toLowerCase().includes(searchLower) ||
        order.restaurant.name.toLowerCase().includes(searchLower) ||
        order.items.some(item => item.name.toLowerCase().includes(searchLower))
      
      if (!matchesSearch) return false
    }

    // Status filter
    if (statusFilter !== 'all' && order.status !== statusFilter) {
      return false
    }

    return true
  }).sort((a, b) => {
    switch (sortBy) {
      case 'newest':
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      case 'oldest':
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      case 'amount':
        return b.total - a.total
      default:
        return 0
    }
  })

  const handleReorder = async (orderId: string) => {
    try {
      // Find the order to reorder
      const orderToReorder = orders.find(order => order.id === orderId)
      if (!orderToReorder) {
        console.error('Order not found for reorder')
        return
      }

      // Fetch complete order details including menu items
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          restaurants!inner(id, name),
          order_items(
            quantity,
            price,
            customizations,
            menu_items!inner(
              id,
              name,
              price,
              description,
              image_url,
              customization_options
            )
          )
        `)
        .eq('id', orderId)
        .single()

      if (error || !data) {
        console.error('Failed to fetch order details for reorder:', error)
        return
      }

      // Transform order items back to cart format
      const cartItems = (data as any).order_items.map((item: any) => ({
        id: item.menu_items.id,
        name: item.menu_items.name,
        price: item.menu_items.price,
        description: item.menu_items.description,
        image_url: item.menu_items.image_url,
        quantity: item.quantity,
        customizations: item.customizations || {},
        customization_options: item.menu_items.customization_options
      }))

      // Store in localStorage for cart restoration
      const reorderData = {
        restaurant: {
          id: (data as any).restaurants.id,
          name: (data as any).restaurants.name
        },
        items: cartItems,
        timestamp: Date.now()
      }

      localStorage.setItem('reorder_data', JSON.stringify(reorderData))

      // Navigate to restaurant page to restore cart
      window.location.href = `/restaurant/${(data as any).restaurants.id}?reorder=true`

    } catch (error) {
      console.error('Error during reorder process:', error)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 1) {
      return 'Today'
    } else if (diffDays === 2) {
      return 'Yesterday'
    } else if (diffDays <= 7) {
      return `${diffDays - 1} days ago`
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
      })
    }
  }

  const renderStarRating = (rating: number | null, orderId: string) => {
    if (rating) {
      return (
        <div className="flex items-center">
          {[1, 2, 3, 4, 5].map((star) => (
            <StarSolidIcon
              key={star}
              className={`w-4 h-4 ${
                star <= rating ? 'text-yellow-400' : 'text-gray-300'
              }`}
            />
          ))}
          <span className="ml-1 text-sm text-gray-600">({rating})</span>
        </div>
      )
    }

    return (
      <Link href={`/orders/${orderId}?tab=review`}>
        <button className="flex items-center text-sm text-orange-600 hover:text-orange-700">
          <StarIcon className="w-4 h-4 mr-1" />
          Rate Order
        </button>
      </Link>
    )
  }

  if (isLoading) {
    return (
      <div className={`bg-white rounded-2xl shadow-sm p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-6"></div>
          {[1, 2, 3].map((i) => (
            <div key={i} className="border border-gray-100 rounded-xl p-4 mb-4">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-gray-200 rounded-xl"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`bg-white rounded-2xl shadow-sm p-6 ${className}`}>
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">❌</span>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Unable to Load Orders</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => {
              setError(null)
              setIsLoading(true)
              fetchOrderHistory()
            }}
            className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-white rounded-2xl shadow-sm ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Order History</h2>
          <div className="text-sm text-gray-600">
            {filteredOrders.length} of {orders.length} orders
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search orders..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>
          
          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="delivered">Delivered</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="preparing">Preparing</option>
              <option value="cancelled">Cancelled</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="amount">Highest Amount</option>
            </select>
          </div>
        </div>
      </div>

      {/* Order List */}
      <div className="p-6">
        {filteredOrders.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <ReceiptRefundIcon className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {orders.length === 0 ? 'No orders yet' : 'No orders found'}
            </h3>
            <p className="text-gray-600 mb-6">
              {orders.length === 0 
                ? "You haven't placed any orders yet. Start exploring restaurants!"
                : "Try adjusting your search or filters to find what you're looking for."
              }
            </p>
            {orders.length === 0 && (
              <Link href="/explore">
                <button className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-lg font-medium transition-colors">
                  Browse Restaurants
                </button>
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order, index) => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="border border-gray-100 rounded-xl p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-4">
                    <OptimizedImage
                      src={order.restaurant.image_url || '/images/restaurants/default.jpg'}
                      alt={order.restaurant.name}
                      width={64}
                      height={64}
                      className="w-16 h-16 rounded-xl object-cover"
                    />
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">
                        {order.restaurant.name}
                      </h3>
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <span>#{order.order_number}</span>
                        <span>•</span>
                        <span>{order.item_count} item{order.item_count !== 1 ? 's' : ''}</span>
                        <span>•</span>
                        <span>{formatDate(order.created_at)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="font-semibold text-gray-900 mb-2">
                      ₦{order.total.toLocaleString()}
                    </div>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      statusColors[order.status]
                    }`}>
                      {statusLabels[order.status]}
                    </span>
                  </div>
                </div>

                {/* Order Items Preview */}
                <div className="mb-4">
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    {order.items.slice(0, 3).map((item, idx) => (
                      <span key={idx}>
                        {item.quantity}x {item.name}
                        {idx < Math.min(order.items.length, 3) - 1 && ', '}
                      </span>
                    ))}
                    {order.items.length > 3 && (
                      <span>and {order.items.length - 3} more...</span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <div>
                    {renderStarRating(order.rating, order.id)}
                  </div>

                  <div className="flex items-center space-x-3">
                    {order.status === 'delivered' && (
                      <button
                        onClick={() => handleReorder(order.id)}
                        className="text-sm text-orange-600 hover:text-orange-700 font-medium"
                      >
                        Reorder
                      </button>
                    )}
                    
                    <Link href={`/orders/${order.id}`}>
                      <button className="flex items-center text-sm text-gray-600 hover:text-gray-900 font-medium">
                        View Details
                        <ArrowRightIcon className="w-4 h-4 ml-1" />
                      </button>
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default OrderHistory