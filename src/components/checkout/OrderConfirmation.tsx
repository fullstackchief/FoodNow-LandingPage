import Link from 'next/link'
import { motion } from 'framer-motion'
import { CheckCircleIcon } from '@heroicons/react/24/outline'
import Navigation from '@/components/layout/Navigation'
import { CartState } from '@/store/slices/cartSlice'

interface OrderConfirmationProps {
  createdOrderId: string | null
  cartState: CartState
  total: number
  isAuthenticated: boolean
  onClearCart: () => void
}

const OrderConfirmation = ({ 
  createdOrderId, 
  cartState, 
  total, 
  isAuthenticated, 
  onClearCart 
}: OrderConfirmationProps) => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="pt-24 pb-12">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl shadow-premium p-8"
          >
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircleIcon className="w-10 h-10 text-green-600" />
            </div>
            
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Order Confirmed!</h1>
            <p className="text-lg text-gray-600 mb-6">
              Your order has been placed successfully. You&apos;ll receive a confirmation shortly.
            </p>

            <div className="bg-gray-50 rounded-2xl p-6 mb-8">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600 mb-1">Order Number</p>
                  <p className="font-semibold text-gray-900">{createdOrderId ? `#${createdOrderId.slice(-8).toUpperCase()}` : '#PENDING'}</p>
                </div>
                <div>
                  <p className="text-gray-600 mb-1">Estimated Delivery</p>
                  <p className="font-semibold text-gray-900">{cartState.restaurant?.deliveryTime || '25-35 min'}</p>
                </div>
                <div>
                  <p className="text-gray-600 mb-1">Restaurant</p>
                  <p className="font-semibold text-gray-900">{cartState.restaurant?.name || 'Restaurant'}</p>
                </div>
                <div>
                  <p className="text-gray-600 mb-1">Total Amount</p>
                  <p className="font-semibold text-orange-600">₦{total.toLocaleString()}</p>
                </div>
              </div>
            </div>

            {/* Post-Order Account Creation for Guests */}
            {!isAuthenticated && (
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 mb-8">
                <div className="text-center mb-4">
                  <h3 className="text-lg font-semibold text-blue-900 mb-2">
                    Create Account for Easy Reordering
                  </h3>
                  <p className="text-sm text-blue-700">
                    Track your order, save favorites, and checkout faster next time. All your order details are ready!
                  </p>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3">
                  <Link href={`/auth/signup?prefill=checkout&orderId=${createdOrderId}`} className="flex-1">
                    <button className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
                      Create Account
                    </button>
                  </Link>
                  <button 
                    onClick={() => localStorage.setItem('skipAccountCreation', 'true')}
                    className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg font-medium transition-colors"
                  >
                    Maybe Later
                  </button>
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-4">
              <button 
                className="flex-1 btn-outline"
                onClick={() => {
                  onClearCart()
                  window.location.href = '/explore'
                }}
              >
                Order Again
              </button>
              {createdOrderId ? (
                <Link href={`/orders/${createdOrderId}`} className="flex-1">
                  <button className="w-full btn-primary">
                    Track Order
                  </button>
                </Link>
              ) : (
                <Link href="/dashboard/orders" className="flex-1">
                  <button className="w-full btn-primary">
                    View Orders
                  </button>
                </Link>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

export default OrderConfirmation