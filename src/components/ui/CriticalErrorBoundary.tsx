'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { logErrorBoundary } from '@/lib/logger'
import { motion } from 'framer-motion'
import { 
  ExclamationTriangleIcon, 
  ShieldExclamationIcon, 
  ArrowLeftIcon,
  HomeIcon 
} from '@heroicons/react/24/outline'

interface Props {
  children: ReactNode
  section: 'payment' | 'checkout' | 'auth' | 'admin' | 'critical'
  fallback?: ReactNode
  redirectPath?: string
}

interface State {
  hasError: boolean
  error?: Error
  errorInfo?: ErrorInfo
}

/**
 * CriticalErrorBoundary - For sensitive areas like payments, auth, admin
 * Provides enhanced security messaging and safe recovery options
 */
class CriticalErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Enhanced logging for critical sections
    logErrorBoundary(error, {
      ...errorInfo,
      component: 'CriticalErrorBoundary',
      section: this.props.section,
      isCritical: true,
      securityRelevant: true,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    })
    
    // For payment/checkout errors, also log to a separate monitoring system
    if (['payment', 'checkout'].includes(this.props.section)) {
      // In production, this would send to a real-time monitoring service
      console.error(`[CRITICAL-${this.props.section.toUpperCase()}]`, {
        error: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      })
    }

    this.setState({ error, errorInfo })
  }

  handleSafeNavigation = () => {
    const safePath = this.props.redirectPath || '/'
    window.location.href = safePath
  }

  handleGoBack = () => {
    if (window.history.length > 1) {
      window.history.back()
    } else {
      this.handleSafeNavigation()
    }
  }

  getSectionConfig = () => {
    const configs = {
      payment: {
        title: 'Payment Security Error',
        description: 'For your security, the payment process has been interrupted. Your payment information remains safe and was not processed.',
        icon: ShieldExclamationIcon,
        color: 'red',
        showDetails: false,
        actions: [
          { label: 'Return to Cart', action: () => window.location.href = '/cart' },
          { label: 'Go Home', action: this.handleSafeNavigation }
        ]
      },
      checkout: {
        title: 'Checkout Error',
        description: 'We encountered an issue during checkout. Your information is safe and no charges were made.',
        icon: ExclamationTriangleIcon,
        color: 'orange',
        showDetails: false,
        actions: [
          { label: 'Try Again', action: () => window.location.reload() },
          { label: 'Go Back', action: this.handleGoBack }
        ]
      },
      auth: {
        title: 'Authentication Error',
        description: 'There was a problem with the authentication system. Please try logging in again.',
        icon: ShieldExclamationIcon,
        color: 'yellow',
        showDetails: false,
        actions: [
          { label: 'Try Login Again', action: () => window.location.href = '/auth/login' },
          { label: 'Go Home', action: this.handleSafeNavigation }
        ]
      },
      admin: {
        title: 'Admin System Error',
        description: 'The admin system encountered an error. This has been logged for investigation.',
        icon: ShieldExclamationIcon,
        color: 'red',
        showDetails: true,
        actions: [
          { label: 'Return to Dashboard', action: () => window.location.href = '/admin' },
          { label: 'Logout Safely', action: () => window.location.href = '/auth/logout' }
        ]
      },
      critical: {
        title: 'Critical System Error',
        description: 'A critical error has occurred. Our team has been notified and is investigating.',
        icon: ExclamationTriangleIcon,
        color: 'red',
        showDetails: false,
        actions: [
          { label: 'Refresh Page', action: () => window.location.reload() },
          { label: 'Go Home', action: this.handleSafeNavigation }
        ]
      }
    }

    return configs[this.props.section]
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      const config = this.getSectionConfig()
      const colorClasses = {
        red: {
          bg: 'bg-red-100',
          icon: 'text-red-600',
          button: 'bg-red-600 hover:bg-red-700',
          secondary: 'bg-gray-100 hover:bg-gray-200 text-gray-700'
        },
        orange: {
          bg: 'bg-orange-100',
          icon: 'text-orange-600',
          button: 'bg-orange-600 hover:bg-orange-700',
          secondary: 'bg-gray-100 hover:bg-gray-200 text-gray-700'
        },
        yellow: {
          bg: 'bg-yellow-100',
          icon: 'text-yellow-600',
          button: 'bg-yellow-600 hover:bg-yellow-700',
          secondary: 'bg-gray-100 hover:bg-gray-200 text-gray-700'
        }
      }

      const colors = colorClasses[config.color as keyof typeof colorClasses]

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-lg w-full"
          >
            <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-200">
              {/* Icon */}
              <div className={`w-16 h-16 ${colors.bg} rounded-full flex items-center justify-center mx-auto mb-6`}>
                <config.icon className={`w-8 h-8 ${colors.icon}`} />
              </div>
              
              {/* Title */}
              <h2 className="text-xl font-bold text-gray-900 mb-4 text-center">
                {config.title}
              </h2>
              
              {/* Description */}
              <p className="text-gray-600 mb-6 text-center leading-relaxed">
                {config.description}
              </p>

              {/* Error details for admin */}
              {config.showDetails && this.state.error && process.env.NODE_ENV === 'development' && (
                <div className="mb-6">
                  <details className="bg-gray-50 rounded-lg p-4 text-sm">
                    <summary className="font-medium cursor-pointer text-gray-700 mb-2">
                      Technical Details (Development Mode)
                    </summary>
                    <div className="text-xs text-gray-600 space-y-2">
                      <div>
                        <strong>Error:</strong> {this.state.error.message}
                      </div>
                      <div>
                        <strong>Section:</strong> {this.props.section}
                      </div>
                      <div>
                        <strong>Timestamp:</strong> {new Date().toLocaleString()}
                      </div>
                    </div>
                  </details>
                </div>
              )}

              {/* Security notice for payment/checkout */}
              {['payment', 'checkout'].includes(this.props.section) && (
                <div className="mb-6 p-3 bg-blue-50 rounded-xl border border-blue-200">
                  <p className="text-xs text-blue-700 flex items-center">
                    <ShieldExclamationIcon className="w-4 h-4 mr-2" />
                    <span>
                      <strong>Security Notice:</strong> No payment information was compromised. 
                      All transactions are secured with bank-level encryption.
                    </span>
                  </p>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                {config.actions.map((action, index) => (
                  <button
                    key={action.label}
                    onClick={action.action}
                    className={`flex items-center justify-center px-4 py-2 rounded-lg font-medium transition-colors ${
                      index === 0 
                        ? `${colors.button} text-white` 
                        : colors.secondary
                    }`}
                  >
                    {index === 0 && <HomeIcon className="w-4 h-4 mr-2" />}
                    {index === 1 && <ArrowLeftIcon className="w-4 h-4 mr-2" />}
                    {action.label}
                  </button>
                ))}
              </div>

              {/* Footer message */}
              <div className="mt-6 pt-4 border-t border-gray-200">
                <p className="text-xs text-gray-500 text-center">
                  If this problem persists, please contact support at{' '}
                  <a href="mailto:support@foodnow.ng" className="text-blue-600 hover:underline">
                    support@foodnow.ng
                  </a>
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      )
    }

    return this.props.children
  }
}

export default CriticalErrorBoundary