'use client'

import { motion } from 'framer-motion'

// Skeleton loader for cards
export const CardSkeleton = ({ className = "" }: { className?: string }) => (
  <div className={`bg-white rounded-3xl p-6 shadow-lg border border-gray-100 ${className}`}>
    <div className="animate-pulse">
      <div className="w-full h-48 bg-gray-200 rounded-2xl mb-4"></div>
      <div className="space-y-3">
        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        <div className="h-3 bg-gray-200 rounded w-full"></div>
        <div className="h-3 bg-gray-200 rounded w-5/6"></div>
      </div>
    </div>
  </div>
)

// Premium button loading state
export const ButtonLoading = ({ 
  children, 
  isLoading, 
  className = "",
  ...props 
}: { 
  children: React.ReactNode
  isLoading: boolean 
  className?: string
  [key: string]: unknown
}) => (
  <motion.button
    whileHover={!isLoading ? { scale: 1.05 } : {}}
    whileTap={!isLoading ? { scale: 0.95 } : {}}
    disabled={isLoading}
    className={`relative overflow-hidden ${className} ${isLoading ? 'cursor-not-allowed opacity-80' : ''}`}
    {...props}
  >
    <span className={`transition-opacity duration-200 ${isLoading ? 'opacity-0' : 'opacity-100'}`}>
      {children}
    </span>
    
    {isLoading && (
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="flex space-x-1">
          <motion.div
            className="w-2 h-2 bg-current rounded-full"
            animate={{ scale: [0.8, 1.2, 0.8] }}
            transition={{ duration: 1, repeat: Infinity, delay: 0 }}
          />
          <motion.div
            className="w-2 h-2 bg-current rounded-full"
            animate={{ scale: [0.8, 1.2, 0.8] }}
            transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
          />
          <motion.div
            className="w-2 h-2 bg-current rounded-full"
            animate={{ scale: [0.8, 1.2, 0.8] }}
            transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
          />
        </div>
      </div>
    )}
  </motion.button>
)

// Page transition loading
export const PageLoader = () => (
  <div className="fixed inset-0 bg-white z-50 flex items-center justify-center">
    <div className="text-center">
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
        className="w-20 h-20 bg-gradient-to-br from-orange-500 to-red-500 rounded-3xl flex items-center justify-center mb-4 mx-auto"
      >
        <span className="text-white font-black text-2xl">F</span>
      </motion.div>
      <motion.p 
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="text-gray-600 font-medium"
      >
        Loading amazing food...
      </motion.p>
    </div>
  </div>
)

// Form field with error state
export const FormField = ({ 
  label, 
  error, 
  children, 
  className = "" 
}: { 
  label?: string
  error?: string
  children: React.ReactNode
  className?: string 
}) => (
  <div className={`space-y-2 ${className}`}>
    {label && (
      <label className="block text-sm font-semibold text-gray-700">
        {label}
      </label>
    )}
    <div className="relative">
      {children}
    </div>
    {error && (
      <motion.p
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-sm text-red-600 flex items-center space-x-1"
      >
        <span>⚠️</span>
        <span>{error}</span>
      </motion.p>
    )}
  </div>
)

// Success toast
export const SuccessToast = ({ 
  message, 
  visible, 
  onClose 
}: { 
  message: string
  visible: boolean
  onClose: () => void 
}) => (
  <motion.div
    initial={{ opacity: 0, y: 50, scale: 0.9 }}
    animate={{ 
      opacity: visible ? 1 : 0, 
      y: visible ? 0 : 50,
      scale: visible ? 1 : 0.9 
    }}
    className={`fixed bottom-6 right-6 bg-green-500 text-white px-6 py-4 rounded-2xl shadow-2xl z-50 flex items-center space-x-3 ${!visible ? 'pointer-events-none' : ''}`}
  >
    <span className="text-xl">✅</span>
    <span className="font-semibold">{message}</span>
    <button 
      onClick={onClose}
      className="text-white/80 hover:text-white ml-2"
    >
      ✕
    </button>
  </motion.div>
)

// Error toast
export const ErrorToast = ({ 
  message, 
  visible, 
  onClose 
}: { 
  message: string
  visible: boolean
  onClose: () => void 
}) => (
  <motion.div
    initial={{ opacity: 0, y: 50, scale: 0.9 }}
    animate={{ 
      opacity: visible ? 1 : 0, 
      y: visible ? 0 : 50,
      scale: visible ? 1 : 0.9 
    }}
    className={`fixed bottom-6 right-6 bg-red-500 text-white px-6 py-4 rounded-2xl shadow-2xl z-50 flex items-center space-x-3 ${!visible ? 'pointer-events-none' : ''}`}
  >
    <span className="text-xl">❌</span>
    <span className="font-semibold">{message}</span>
    <button 
      onClick={onClose}
      className="text-white/80 hover:text-white ml-2"
    >
      ✕
    </button>
  </motion.div>
)