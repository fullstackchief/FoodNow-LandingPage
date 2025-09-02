'use client'

import { motion } from 'framer-motion'
import { 
  ExclamationTriangleIcon, 
  ArrowPathIcon,
  HomeIcon,
  WifiIcon
} from '@heroicons/react/24/outline'

/**
 * Collection of pre-built error fallback components
 * for different sections of the application
 */

interface ErrorFallbackProps {
  error?: Error
  resetError?: () => void
  onHome?: () => void
}

// Minimal error fallback for small components
export function MinimalErrorFallback({ resetError }: ErrorFallbackProps) {
  return (
    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
      <div className="flex items-center">
        <ExclamationTriangleIcon className="w-5 h-5 text-red-600 mr-2" />
        <p className="text-sm text-red-700">Something went wrong</p>
        {resetError && (
          <button 
            onClick={resetError}
            className="ml-auto text-sm text-red-600 hover:text-red-800 font-medium"
          >
            Retry
          </button>
        )}
      </div>
    </div>
  )
}

// Card-style error fallback for sections
export function CardErrorFallback({ error, resetError }: ErrorFallbackProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white border border-gray-200 rounded-xl p-6 text-center"
    >
      <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <ExclamationTriangleIcon className="w-6 h-6 text-orange-600" />
      </div>
      
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        Unable to Load Content
      </h3>
      
      <p className="text-gray-600 text-sm mb-4">
        This section couldn&apos;t be loaded. Please try again.
      </p>
      
      {resetError && (
        <button
          onClick={resetError}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          <ArrowPathIcon className="w-4 h-4 mr-2" />
          Try Again
        </button>
      )}
    </motion.div>
  )
}

// Network error fallback
export function NetworkErrorFallback({ resetError }: ErrorFallbackProps) {
  const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white border border-gray-200 rounded-xl p-6 text-center"
    >
      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <WifiIcon className="w-6 h-6 text-blue-600" />
      </div>
      
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        {isOnline ? 'Connection Problem' : 'No Internet Connection'}
      </h3>
      
      <p className="text-gray-600 text-sm mb-4">
        {isOnline 
          ? 'Unable to reach our servers. Please check your connection and try again.'
          : 'Please check your internet connection and try again.'
        }
      </p>

      <div className="flex items-center justify-center mb-4">
        <div className={`w-2 h-2 rounded-full mr-2 ${isOnline ? 'bg-green-500' : 'bg-red-500'}`} />
        <span className="text-xs text-gray-500">
          {isOnline ? 'Online' : 'Offline'}
        </span>
      </div>
      
      {resetError && (
        <button
          onClick={resetError}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          <ArrowPathIcon className="w-4 h-4 mr-2" />
          Try Again
        </button>
      )}
    </motion.div>
  )
}

// Restaurant/food section error fallback
export function RestaurantErrorFallback({ resetError, onHome }: ErrorFallbackProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white border border-gray-200 rounded-xl p-8 text-center"
    >
      <div className="text-6xl mb-4">🍽️</div>
      
      <h3 className="text-xl font-semibold text-gray-900 mb-2">
        Oops! Kitchen Closed Temporarily
      </h3>
      
      <p className="text-gray-600 mb-6">
        We&apos;re having trouble loading this restaurant&apos;s menu. 
        Don&apos;t worry, we&apos;re working on getting it back up!
      </p>
      
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        {resetError && (
          <button
            onClick={resetError}
            className="inline-flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium"
          >
            <ArrowPathIcon className="w-4 h-4 mr-2" />
            Try Again
          </button>
        )}
        <button
          onClick={onHome || (() => window.location.href = '/')}
          className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
        >
          <HomeIcon className="w-4 h-4 mr-2" />
          Browse Other Restaurants
        </button>
      </div>
    </motion.div>
  )
}

// Cart error fallback
export function CartErrorFallback({ resetError }: ErrorFallbackProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white border border-gray-200 rounded-xl p-8 text-center"
    >
      <div className="text-6xl mb-4">🛒</div>
      
      <h3 className="text-xl font-semibold text-gray-900 mb-2">
        Cart Unavailable
      </h3>
      
      <p className="text-gray-600 mb-6">
        We&apos;re having trouble loading your cart. Your items are safe - just refresh to see them.
      </p>
      
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        {resetError && (
          <button
            onClick={resetError}
            className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
          >
            <ArrowPathIcon className="w-4 h-4 mr-2" />
            Reload Cart
          </button>
        )}
        <button
          onClick={() => window.location.href = '/'}
          className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
        >
          <HomeIcon className="w-4 h-4 mr-2" />
          Continue Shopping
        </button>
      </div>
    </motion.div>
  )
}