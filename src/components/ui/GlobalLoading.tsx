'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { usePageLoading } from '@/hooks/useLoading'

const GlobalPageLoader = () => {
  const { isPageLoading } = usePageLoading()

  return (
    <AnimatePresence>
      {isPageLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-white z-50 flex items-center justify-center"
        >
          <div className="text-center">
            {/* Animated Logo */}
            <motion.div
              animate={{ 
                scale: [1, 1.2, 1],
                rotate: [0, 360] 
              }}
              transition={{ 
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut" 
              }}
              className="w-20 h-20 bg-gradient-to-br from-orange-500 to-red-500 rounded-3xl flex items-center justify-center mb-6 mx-auto shadow-2xl"
            >
              <span className="text-white font-black text-2xl">F</span>
            </motion.div>

            {/* Loading Text */}
            <motion.h2
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="text-2xl font-bold text-gray-800 mb-2"
            >
              FoodNow
            </motion.h2>

            <motion.p 
              animate={{ opacity: [0.3, 0.8, 0.3] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}
              className="text-gray-600 font-medium"
            >
              Loading delicious food...
            </motion.p>

            {/* Progress Bar */}
            <div className="mt-6 w-64 h-1 bg-gray-200 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-orange-500 to-red-500 rounded-full"
                animate={{
                  x: ['-100%', '100%']
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// Loading overlay for specific components
interface LoadingOverlayProps {
  isLoading: boolean
  children: React.ReactNode
  className?: string
  loadingText?: string
  size?: 'sm' | 'md' | 'lg'
}

export const LoadingOverlay = ({
  isLoading,
  children,
  className = '',
  loadingText = 'Loading...',
  size = 'md'
}: LoadingOverlayProps) => {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8', 
    lg: 'w-12 h-12'
  }

  return (
    <div className={`relative ${className}`}>
      {children}
      
      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center rounded-lg z-10"
          >
            <div className="text-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  ease: "linear"
                }}
                className={`${sizeClasses[size]} border-4 border-orange-200 border-t-orange-500 rounded-full mb-2 mx-auto`}
              />
              <p className="text-sm text-gray-600 font-medium">{loadingText}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// Skeleton loader for cards with different variants
interface SkeletonCardProps {
  variant?: 'restaurant' | 'menu-item' | 'review' | 'order'
  className?: string
}

export const SkeletonCard = ({ variant = 'restaurant', className = '' }: SkeletonCardProps) => {
  const variants = {
    restaurant: (
      <div className={`bg-white rounded-3xl p-6 shadow-lg border border-gray-100 ${className}`}>
        <div className="animate-pulse">
          <div className="w-20 h-20 bg-gray-200 rounded-2xl mb-4"></div>
          <div className="space-y-3">
            <div className="h-6 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            <div className="flex gap-4 mt-4">
              <div className="h-3 bg-gray-200 rounded w-16"></div>
              <div className="h-3 bg-gray-200 rounded w-20"></div>
            </div>
          </div>
        </div>
      </div>
    ),
    
    'menu-item': (
      <div className={`bg-white rounded-2xl p-4 shadow-md border border-gray-100 ${className}`}>
        <div className="animate-pulse flex gap-4">
          <div className="w-16 h-16 bg-gray-200 rounded-xl"></div>
          <div className="flex-1 space-y-2">
            <div className="h-5 bg-gray-200 rounded w-3/4"></div>
            <div className="h-3 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          </div>
        </div>
      </div>
    ),
    
    review: (
      <div className={`bg-white rounded-2xl p-4 shadow-sm border border-gray-100 ${className}`}>
        <div className="animate-pulse">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
            <div className="space-y-1 flex-1">
              <div className="h-4 bg-gray-200 rounded w-1/3"></div>
              <div className="h-3 bg-gray-200 rounded w-20"></div>
            </div>
          </div>
          <div className="space-y-2">
            <div className="h-3 bg-gray-200 rounded w-full"></div>
            <div className="h-3 bg-gray-200 rounded w-4/5"></div>
          </div>
        </div>
      </div>
    ),

    order: (
      <div className={`bg-white rounded-2xl p-4 shadow-md border border-gray-100 ${className}`}>
        <div className="animate-pulse">
          <div className="flex justify-between items-start mb-4">
            <div className="space-y-2">
              <div className="h-5 bg-gray-200 rounded w-32"></div>
              <div className="h-4 bg-gray-200 rounded w-24"></div>
            </div>
            <div className="h-6 bg-gray-200 rounded-full w-20"></div>
          </div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="flex justify-between mt-4">
              <div className="h-4 bg-gray-200 rounded w-20"></div>
              <div className="h-5 bg-gray-200 rounded w-16"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return variants[variant]
}

// Loading grid for multiple skeleton cards
interface SkeletonGridProps {
  variant?: 'restaurant' | 'menu-item' | 'review' | 'order'
  count?: number
  columns?: number
  className?: string
}

export const SkeletonGrid = ({
  variant = 'restaurant',
  count = 6,
  columns = 3,
  className = ''
}: SkeletonGridProps) => {
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'
  }

  return (
    <div className={`grid ${gridCols[columns as keyof typeof gridCols]} gap-6 ${className}`}>
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonCard key={index} variant={variant} />
      ))}
    </div>
  )
}

export default GlobalPageLoader