/**
 * Production-ready logging utility
 * Replaces console.log statements with proper logging
 */

// Development-only console logging
export const devLog = {
  info: (message: string, ...args: any[]) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[INFO] ${message}`, ...args)
    }
  },
  warn: (message: string, ...args: any[]) => {
    if (process.env.NODE_ENV === 'development') {
      console.warn(`[WARN] ${message}`, ...args)
    }
  },
  error: (message: string, error?: any) => {
    if (process.env.NODE_ENV === 'development') {
      console.error(`[ERROR] ${message}`, error)
    }
  },
  debug: (message: string, data?: any) => {
    if (process.env.NODE_ENV === 'development' && process.env.DEBUG === 'true') {
      console.log(`[DEBUG] ${message}`, data)
    }
  }
}

// Production error logging (will integrate with Sentry later)
export const prodLog = {
  error: (message: string, error?: any, context?: Record<string, any>) => {
    // For now, we'll prepare the structure for Sentry integration
    const errorData = {
      message,
      error: error?.message || error,
      stack: error?.stack,
      context,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV
    }

    // In development, still show errors
    if (process.env.NODE_ENV === 'development') {
      console.error(`[PROD ERROR] ${message}`, errorData)
    }

    // TODO: Send to Sentry in production
    // Sentry.captureException(error || new Error(message), { contexts: { extra: context } })
  },

  warn: (message: string, context?: Record<string, any>) => {
    const warnData = {
      message,
      context,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV
    }

    if (process.env.NODE_ENV === 'development') {
      console.warn(`[PROD WARN] ${message}`, warnData)
    }

    // TODO: Send to Sentry as warning
  },

  info: (message: string, context?: Record<string, any>) => {
    // Important production info (like successful payments, order updates)
    const infoData = {
      message,
      context,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV
    }

    if (process.env.NODE_ENV === 'development') {
      console.info(`[PROD INFO] ${message}`, infoData)
    }

    // TODO: Send to logging service for production monitoring
  }
}

// Utility function to safely log errors without exposing sensitive data
export const sanitizeForLogging = (data: any): any => {
  const sensitive = ['password', 'token', 'secret', 'key', 'authorization', 'cookie']
  
  if (typeof data !== 'object' || data === null) {
    return data
  }

  const sanitized = { ...data }
  
  Object.keys(sanitized).forEach(key => {
    const lowerKey = key.toLowerCase()
    if (sensitive.some(sensitiveKey => lowerKey.includes(sensitiveKey))) {
      sanitized[key] = '[REDACTED]'
    } else if (typeof sanitized[key] === 'object') {
      sanitized[key] = sanitizeForLogging(sanitized[key])
    }
  })

  return sanitized
}

// Error boundary logger
export const logErrorBoundary = (error: Error, errorInfo: any) => {
  // Handle empty or malformed error objects
  const safeError = error || new Error('Unknown error boundary error')
  const errorMessage = safeError.message || 'Error boundary triggered with empty error'
  const errorStack = safeError.stack || 'No stack trace available'
  
  // Provide more context if error is empty
  const contextData = {
    componentStack: errorInfo?.componentStack || 'No component stack available',
    errorBoundary: true,
    errorType: typeof error,
    hasErrorMessage: !!error?.message,
    hasErrorStack: !!error?.stack,
    originalError: error && Object.keys(error).length > 0 ? sanitizeForLogging(error) : 'Empty error object'
  }

  prodLog.error('React Error Boundary Caught Error', {
    message: errorMessage,
    stack: errorStack
  }, contextData)
}