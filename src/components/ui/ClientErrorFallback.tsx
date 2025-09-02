'use client'

import { motion } from 'framer-motion'

interface ClientErrorFallbackProps {
  error?: Error
  resetError?: () => void
}

export default function ClientErrorFallback({ error, resetError }: ClientErrorFallbackProps) {
  const handleReload = () => {
    if (typeof window !== 'undefined') {
      window.location.reload()
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center p-8 max-w-md"
      >
        <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-200">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.314 18.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Service Temporarily Unavailable
          </h1>
          
          <p className="text-gray-600 mb-6">
            We're experiencing some technical difficulties. Please try again in a few moments.
          </p>

          {error && process.env.NODE_ENV === 'development' && (
            <div className="text-left mb-6">
              <details className="bg-gray-50 rounded-lg p-4 text-sm">
                <summary className="font-medium cursor-pointer text-red-600 mb-2">
                  Error Details (Development)
                </summary>
                <pre className="whitespace-pre-wrap text-xs text-gray-700 overflow-auto">
                  {error.message}
                </pre>
              </details>
            </div>
          )}
          
          <div className="flex flex-col sm:flex-row gap-3">
            {resetError && (
              <button 
                onClick={resetError}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Try Again
              </button>
            )}
            <button 
              onClick={handleReload}
              className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
            >
              Refresh Page
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}