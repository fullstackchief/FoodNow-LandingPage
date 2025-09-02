'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { logErrorBoundary } from '@/lib/logger'
import { motion } from 'framer-motion'
import { ExclamationTriangleIcon, ArrowPathIcon } from '@heroicons/react/24/outline'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  showDetails?: boolean
}

interface State {
  hasError: boolean
  error?: Error
  errorInfo?: ErrorInfo
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log the error to our logging system
    logErrorBoundary(error, errorInfo)
    
    this.setState({
      error,
      errorInfo
    })
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined })
  }

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback
      }

      // Default error UI
      return (
        <div className="min-h-[400px] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-md w-full text-center"
          >
            <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-200">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <ExclamationTriangleIcon className="w-8 h-8 text-red-600" />
              </div>
              
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Oops! Something went wrong
              </h2>
              
              <p className="text-gray-600 mb-6">
                We encountered an unexpected error. Don&apos;t worry, our team has been notified 
                and we&apos;re working on fixing it.
              </p>

              {/* Development-only error details */}
              {this.props.showDetails && process.env.NODE_ENV === 'development' && this.state.error && (
                <div className="text-left mb-6">
                  <details className="bg-gray-50 rounded-lg p-4 text-sm">
                    <summary className="font-medium cursor-pointer text-red-600 mb-2">
                      Error Details (Development Only)
                    </summary>
                    <pre className="whitespace-pre-wrap text-xs text-gray-700 overflow-auto">
                      {this.state.error.message}
                      {this.state.error.stack}
                    </pre>
                  </details>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={this.handleReset}
                  className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  <ArrowPathIcon className="w-4 h-4 mr-2" />
                  Try Again
                </button>
                
                <button
                  onClick={() => {
                    if (typeof window !== 'undefined') {
                      window.location.reload()
                    }
                  }}
                  className="flex items-center justify-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                >
                  Refresh Page
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary

// HOC for wrapping components with error boundary
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode,
  showDetails?: boolean
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary fallback={fallback} showDetails={showDetails}>
      <Component {...props} />
    </ErrorBoundary>
  )

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`
  
  return WrappedComponent
}