'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { logErrorBoundary } from '@/lib/logger'
import { motion } from 'framer-motion'
import { ExclamationTriangleIcon, ArrowPathIcon, WifiIcon } from '@heroicons/react/24/outline'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onRetry?: () => void | Promise<void>
  retryText?: string
  showRetry?: boolean
}

interface State {
  hasError: boolean
  error?: Error
  isRetrying: boolean
  retryCount: number
}

/**
 * AsyncErrorBoundary - Specialized error boundary for async operations
 * Includes retry functionality and network-aware error handling
 */
class AsyncErrorBoundary extends Component<Props, State> {
  private maxRetries = 3

  constructor(props: Props) {
    super(props)
    this.state = { 
      hasError: false,
      isRetrying: false,
      retryCount: 0
    }
  }

  static getDerivedStateFromError(error: Error): State {
    return { 
      hasError: true, 
      error, 
      isRetrying: false,
      retryCount: 0
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log async errors with additional context
    logErrorBoundary(error, {
      ...errorInfo,
      component: 'AsyncErrorBoundary',
      isOnline: navigator.onLine,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString()
    })
    
    this.setState({ error, isRetrying: false })
  }

  handleRetry = async () => {
    if (this.state.retryCount >= this.maxRetries) {
      return
    }

    this.setState({ isRetrying: true, retryCount: this.state.retryCount + 1 })

    try {
      // Call custom retry function if provided
      if (this.props.onRetry) {
        await this.props.onRetry()
      }
      
      // Wait a bit before resetting error state
      await new Promise(resolve => setTimeout(resolve, 500))
      
      this.setState({ 
        hasError: false, 
        error: undefined, 
        isRetrying: false 
      })
    } catch (error) {
      this.setState({ 
        hasError: true, 
        error: error instanceof Error ? error : new Error('Retry failed'),
        isRetrying: false 
      })
    }
  }

  handleFullReload = () => {
    window.location.reload()
  }

  getErrorType = (): 'network' | 'timeout' | 'unknown' => {
    if (!this.state.error) return 'unknown'
    
    const message = this.state.error.message.toLowerCase()
    
    if (message.includes('network') || message.includes('fetch') || !navigator.onLine) {
      return 'network'
    }
    
    if (message.includes('timeout') || message.includes('aborted')) {
      return 'timeout'
    }
    
    return 'unknown'
  }

  renderErrorContent = () => {
    const errorType = this.getErrorType()
    const canRetry = this.props.showRetry !== false && this.state.retryCount < this.maxRetries
    
    const errorMessages = {
      network: {
        title: 'Connection Problem',
        description: 'Please check your internet connection and try again.',
        icon: WifiIcon
      },
      timeout: {
        title: 'Request Timed Out',
        description: 'The request took too long to complete. Please try again.',
        icon: ArrowPathIcon
      },
      unknown: {
        title: 'Something Went Wrong',
        description: 'We encountered an unexpected error. Please try again.',
        icon: ExclamationTriangleIcon
      }
    }

    const { title, description, icon: IconComponent } = errorMessages[errorType]

    return (
      <div className="min-h-[300px] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-sm w-full text-center"
        >
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <IconComponent className="w-6 h-6 text-orange-600" />
            </div>
            
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {title}
            </h3>
            
            <p className="text-gray-600 text-sm mb-4">
              {description}
            </p>

            {/* Network status indicator */}
            {errorType === 'network' && (
              <div className="flex items-center justify-center mb-4">
                <div className={`w-2 h-2 rounded-full mr-2 ${navigator.onLine ? 'bg-green-500' : 'bg-red-500'}`} />
                <span className="text-xs text-gray-500">
                  {navigator.onLine ? 'Connected' : 'Offline'}
                </span>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex flex-col gap-2">
              {canRetry && (
                <button
                  onClick={this.handleRetry}
                  disabled={this.state.isRetrying}
                  className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-300 transition-colors font-medium text-sm"
                >
                  {this.state.isRetrying ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                      Retrying...
                    </>
                  ) : (
                    <>
                      <ArrowPathIcon className="w-4 h-4 mr-2" />
                      {this.props.retryText || 'Try Again'} 
                      {this.state.retryCount > 0 && ` (${this.state.retryCount}/${this.maxRetries})`}
                    </>
                  )}
                </button>
              )}
              
              {this.state.retryCount >= this.maxRetries && (
                <button
                  onClick={this.handleFullReload}
                  className="flex items-center justify-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium text-sm"
                >
                  Reload Page
                </button>
              )}
            </div>

            {/* Retry counter */}
            {this.state.retryCount > 0 && canRetry && (
              <p className="text-xs text-gray-400 mt-3">
                Attempt {this.state.retryCount + 1} of {this.maxRetries + 1}
              </p>
            )}
          </div>
        </motion.div>
      </div>
    )
  }

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback
      }

      return this.renderErrorContent()
    }

    return this.props.children
  }
}

export default AsyncErrorBoundary

// Hook for handling async errors in components
export function useAsyncError() {
  const [, setError] = React.useState<Error>()
  
  return React.useCallback((error: Error) => {
    setError(() => {
      throw error
    })
  }, [])
}