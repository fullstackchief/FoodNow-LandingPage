'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { useAuth } from '@/contexts/AuthContext'
import { 
  initializePayment, 
  verifyPayment, 
  openPaystackPopup,
  generatePaymentReference,
  type CreatePaymentData 
} from '@/lib/payment-client'
import { verifyPaystackPayment } from '@/lib/paymentService'
import { 
  CreditCardIcon, 
  CheckCircleIcon, 
  ExclamationTriangleIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline'

interface PaystackPaymentProps {
  paymentData: CreatePaymentData
  onSuccess: (reference: string) => void
  onError: (error: string) => void
  onCancel?: () => void
  className?: string
}

export default function PaystackPayment({ 
  paymentData, 
  onSuccess, 
  onError, 
  onCancel,
  className = '' 
}: PaystackPaymentProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [paymentStep, setPaymentStep] = useState<'init' | 'processing' | 'verifying' | 'success' | 'error'>('init')
  const [paymentReference, setPaymentReference] = useState<string>('')
  const [error, setError] = useState<string>('')
  const router = useRouter()
  const { user } = useAuth()

  const handlePayment = async () => {
    if (!user) {
      onError('User authentication required')
      return
    }

    setIsLoading(true)
    setPaymentStep('processing')
    setError('')

    try {
      // Initialize payment via secure server endpoint
      const result = await initializePayment(paymentData)
      
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to initialize payment')
      }

      const { reference, config } = result.data
      setPaymentReference(reference)

      // Open Paystack popup with server-provided config
      openPaystackPopup(
        {
          publicKey: config.publicKey,
          amount: result.data.amount, // Already in kobo from server
          email: result.data.email,
          currency: result.data.currency,
          reference,
          metadata: {
            order_id: paymentData.orderId,
            user_id: paymentData.userId,
            customer_name: paymentData.customerName
          },
          channels: config.channels
        },
        async (reference: string) => {
          // Payment successful, verify it
          setPaymentStep('verifying')
          await verifyAndCompletePayment(reference)
        },
        () => {
          // Payment cancelled
          setIsLoading(false)
          setPaymentStep('init')
          if (onCancel) onCancel()
        }
      )
    } catch (error) {
      console.error('Payment initialization error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Payment failed'
      setError(errorMessage)
      setPaymentStep('error')
      onError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const verifyAndCompletePayment = async (reference: string) => {
    try {
      // Verify payment via secure server endpoint
      const verificationResult = await verifyPayment(reference)
      
      if (!verificationResult.success || !verificationResult.data) {
        throw new Error(verificationResult.error || 'Payment verification failed')
      }

      const paymentData = verificationResult.data

      if (paymentData.status === 'success') {
        setPaymentStep('success')
        onSuccess(reference)
      } else {
        throw new Error(`Payment ${paymentData.status}: ${paymentData.gateway_response}`)
      }
    } catch (error) {
      console.error('Payment verification error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Payment verification failed'
      setError(errorMessage)
      setPaymentStep('error')
      onError(errorMessage)
    }
  }

  const retry = () => {
    setPaymentStep('init')
    setError('')
    setPaymentReference('')
  }

  const renderPaymentStep = () => {
    switch (paymentStep) {
      case 'init':
        return (
          <div className="text-center">
            <CreditCardIcon className="w-16 h-16 text-orange-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Ready to Pay
            </h3>
            <p className="text-gray-600 mb-6">
              You'll be redirected to Paystack to complete your payment securely
            </p>
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="flex justify-between items-center text-sm text-gray-600 mb-2">
                <span>Amount:</span>
                <span className="font-semibold">₦{paymentData.amount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center text-sm text-gray-600">
                <span>Payment Method:</span>
                <span>Card, Bank Transfer, USSD</span>
              </div>
            </div>
            <button
              onClick={handlePayment}
              disabled={isLoading}
              className="w-full btn-primary"
            >
              {isLoading ? (
                <div className="flex items-center justify-center space-x-2">
                  <ArrowPathIcon className="w-4 h-4 animate-spin" />
                  <span>Initializing...</span>
                </div>
              ) : (
                `Pay ₦${paymentData.amount.toLocaleString()}`
              )}
            </button>
          </div>
        )

      case 'processing':
        return (
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Processing Payment
            </h3>
            <p className="text-gray-600">
              Please complete your payment in the Paystack window
            </p>
          </div>
        )

      case 'verifying':
        return (
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Verifying Payment
            </h3>
            <p className="text-gray-600">
              Please wait while we confirm your payment...
            </p>
          </div>
        )

      case 'success':
        return (
          <div className="text-center">
            <CheckCircleIcon className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Payment Successful!
            </h3>
            <p className="text-gray-600 mb-4">
              Your payment has been processed successfully
            </p>
            {paymentReference && (
              <div className="bg-green-50 rounded-lg p-3">
                <p className="text-sm text-green-700">
                  Reference: <span className="font-mono">{paymentReference}</span>
                </p>
              </div>
            )}
          </div>
        )

      case 'error':
        return (
          <div className="text-center">
            <ExclamationTriangleIcon className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Payment Failed
            </h3>
            <p className="text-red-600 mb-6">
              {error || 'An error occurred while processing your payment'}
            </p>
            <div className="flex space-x-3">
              <button
                onClick={retry}
                className="flex-1 btn-outline"
              >
                Try Again
              </button>
              <button
                onClick={() => onCancel && onCancel()}
                className="flex-1 btn-secondary"
              >
                Cancel
              </button>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white rounded-3xl shadow-premium p-8 ${className}`}
    >
      <div className="max-w-md mx-auto">
        {renderPaymentStep()}
      </div>

      {/* Payment Security Notice */}
      {paymentStep === 'init' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-6 text-center"
        >
          <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
            <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
              <CheckCircleIcon className="w-3 h-3 text-white" />
            </div>
            <span>Secured by Paystack</span>
          </div>
          <p className="text-xs text-gray-400 mt-2">
            Your payment information is encrypted and secure
          </p>
        </motion.div>
      )}
    </motion.div>
  )
}

// Alternative component for using react-paystack (if needed)
export function PaystackButton({ 
  paymentData, 
  onSuccess, 
  onError, 
  onCancel,
  className = '',
  children 
}: PaystackPaymentProps & { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(false)
  
  const config = {
    reference: generatePaymentReference(paymentData.orderId),
    email: paymentData.email,
    amount: Math.round(paymentData.amount * 100), // Convert to kobo
    currency: 'NGN',
    publicKey: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY!,
    metadata: {
      order_id: paymentData.orderId,
      user_id: paymentData.userId,
      customer_name: paymentData.customerName,
      custom_fields: [
        {
          display_name: 'Order ID',
          variable_name: 'order_id',
          value: paymentData.orderId
        }
      ]
    },
    channels: ['card', 'bank', 'ussd', 'qr', 'mobile_money', 'bank_transfer']
  }

  const handlePaystackSuccessAction = async (reference: any) => {
    setIsLoading(true)
    try {
      // Verify payment
      const verificationResult = await verifyPaystackPayment(reference.reference)
      
      if (verificationResult.success && verificationResult.data?.status === 'success') {
        onSuccess(reference.reference)
      } else {
        onError('Payment verification failed')
      }
    } catch (error) {
      onError('Payment verification error')
    } finally {
      setIsLoading(false)
    }
  }

  const handlePaystackCloseAction = () => {
    if (onCancel) onCancel()
  }

  // Use react-paystack if available, fallback to custom implementation
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { PaystackButton: ReactPaystackButton } = require('react-paystack')
    
    return (
      <ReactPaystackButton
        {...config}
        onSuccess={handlePaystackSuccessAction}
        onClose={handlePaystackCloseAction}
        disabled={isLoading}
        className={className}
      >
        {children}
      </ReactPaystackButton>
    )
  } catch (error) {
    // Fallback to custom implementation
    return (
      <button
        onClick={() => {
          openPaystackPopup(
            config,
            handlePaystackSuccessAction,
            handlePaystackCloseAction
          )
        }}
        disabled={isLoading}
        className={className}
      >
        {children}
      </button>
    )
  }
}