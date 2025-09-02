'use client'

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { XMarkIcon } from '@heroicons/react/24/outline'

type ToastType = 'success' | 'error' | 'warning' | 'info'

interface Toast {
  id: string
  type: ToastType
  title: string
  description?: string
  duration?: number
  action?: {
    label: string
    onClick: () => void
  }
}

interface ToastContextType {
  toasts: Toast[]
  addToast: (toast: Omit<Toast, 'id'>) => void
  removeToast: (id: string) => void
  clearAll: () => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export const useToast = () => {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within ToastProvider')
  }
  return context
}

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<Toast[]>([])

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }, [])

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9)
    const newToast = { ...toast, id }

    setToasts(prev => [...prev, newToast])

    // Auto remove after duration (default 5 seconds)
    const duration = toast.duration || 5000
    setTimeout(() => {
      removeToast(id)
    }, duration)
  }, [removeToast])

  const clearAll = useCallback(() => {
    setToasts([])
  }, [])

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, clearAll }}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  )
}

const ToastContainer = ({ 
  toasts, 
  removeToast 
}: { 
  toasts: Toast[]
  removeToast: (id: string) => void 
}) => {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
      <AnimatePresence>
        {toasts.map(toast => (
          <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
        ))}
      </AnimatePresence>
    </div>
  )
}

const ToastItem = ({ 
  toast, 
  onRemove 
}: { 
  toast: Toast
  onRemove: (id: string) => void 
}) => {
  const typeStyles = {
    success: {
      bg: 'bg-emerald-50 border-emerald-200',
      icon: '✅',
      titleColor: 'text-emerald-800',
      descColor: 'text-emerald-600'
    },
    error: {
      bg: 'bg-red-50 border-red-200',
      icon: '❌',
      titleColor: 'text-red-800', 
      descColor: 'text-red-600'
    },
    warning: {
      bg: 'bg-yellow-50 border-yellow-200',
      icon: '⚠️',
      titleColor: 'text-yellow-800',
      descColor: 'text-yellow-600'
    },
    info: {
      bg: 'bg-blue-50 border-blue-200',
      icon: 'ℹ️',
      titleColor: 'text-blue-800',
      descColor: 'text-blue-600'
    }
  }

  const style = typeStyles[toast.type]

  return (
    <motion.div
      initial={{ opacity: 0, x: 100, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 100, scale: 0.9 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={`
        ${style.bg} border rounded-2xl shadow-lg p-4 backdrop-blur-sm
        min-w-[320px] max-w-sm
      `}
    >
      <div className="flex items-start gap-3">
        <span className="text-lg flex-shrink-0 mt-0.5">{style.icon}</span>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h4 className={`font-semibold text-sm ${style.titleColor}`}>
              {toast.title}
            </h4>
            <button
              onClick={() => onRemove(toast.id)}
              className="text-gray-400 hover:text-gray-600 p-0.5 rounded-full hover:bg-white/50 transition-colors flex-shrink-0"
            >
              <XMarkIcon className="w-4 h-4" />
            </button>
          </div>
          
          {toast.description && (
            <p className={`text-xs mt-1 ${style.descColor}`}>
              {toast.description}
            </p>
          )}
          
          {toast.action && (
            <button
              onClick={toast.action.onClick}
              className={`text-xs font-medium mt-2 ${style.titleColor} hover:underline`}
            >
              {toast.action.label}
            </button>
          )}
        </div>
      </div>
    </motion.div>
  )
}

// Helper hooks for common toast types
export const useSuccessToast = () => {
  const { addToast } = useToast()
  
  return useCallback((title: string, description?: string) => {
    addToast({ type: 'success', title, description })
  }, [addToast])
}

export const useErrorToast = () => {
  const { addToast } = useToast()
  
  return useCallback((title: string, description?: string) => {
    addToast({ type: 'error', title, description })
  }, [addToast])
}

export const useWarningToast = () => {
  const { addToast } = useToast()
  
  return useCallback((title: string, description?: string) => {
    addToast({ type: 'warning', title, description })
  }, [addToast])
}

export const useInfoToast = () => {
  const { addToast } = useToast()
  
  return useCallback((title: string, description?: string) => {
    addToast({ type: 'info', title, description })  
  }, [addToast])
}

export default ToastProvider