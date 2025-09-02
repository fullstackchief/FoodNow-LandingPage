'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { useAuth } from '@/contexts/AuthContext'
import { 
  CheckCircleIcon, 
  ExclamationTriangleIcon, 
  ArrowPathIcon 
} from '@heroicons/react/24/outline'
import Link from 'next/link'

export default function PaymentCallbackPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const [status, setStatus] = useState<'verifying' | 'success' | 'failed'>('verifying')
  const [message, setMessage] = useState('')
  const [orderId, setOrderId] = useState<string>('')
  const [amount, setAmount] = useState<number>(0)

  useEffect(() => {
    const reference = searchParams.get('reference')
    const trxref = searchParams.get('trxref')
    
    // Get reference from either parameter
    const paymentReference = reference || trxref
    
    if (!paymentReference) {
      setStatus('failed')
      setMessage('Payment reference not found')
      return
    }

    verifyPayment(paymentReference)
  }, [searchParams])

  const verifyPayment = async (reference: string) => {
    try {
      // Get auth token for secure API call
      const { supabase } = await import('@/lib/supabase-client')
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.access_token) {
        setStatus('failed')
        setMessage('Authentication required for payment verification')
        return
      }

      // Call secure server-side verification API
      const response = await fetch('/api/payments/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ reference })
      })

      if (!response.ok) {
        const errorData = await response.json()
        setStatus('failed')
        setMessage(errorData.error || 'Payment verification failed')
        return
      }

      const result = await response.json()
      
      if (!result.success || !result.data) {
        setStatus('failed')
        setMessage('Payment verification failed')
        return
      }

      const paymentData = result.data

      if (paymentData.status === 'success') {
        setStatus('success')
        setMessage('Payment completed successfully!')
        setOrderId(paymentData.metadata?.order_id || '')
        setAmount(paymentData.amount / 100) // Convert from kobo to naira
      } else {
        setStatus('failed')
        setMessage(`Payment ${paymentData.status}: ${paymentData.gateway_response}`)
      }
    } catch (error) {
      console.error('[PROD ERROR] Error verifying Paystack payment', error)
      setStatus('failed')
      setMessage('An error occurred while verifying your payment')
    }
  }

  const renderContent = () => {
    switch (status) {
      case 'verifying':
        return (
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Verifying Payment</h1>
            <p className="text-gray-600">
              Please wait while we confirm your payment...
            </p>
          </div>
        )

      case 'success':
        return (
          <div className="text-center">
            <CheckCircleIcon className="w-20 h-20 text-green-500 mx-auto mb-6" />
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Payment Successful!</h1>
            <p className="text-lg text-gray-600 mb-6">
              Thank you! Your payment has been processed successfully.
            </p>
            
            <div className="bg-green-50 rounded-2xl p-6 mb-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600 mb-1">Amount Paid</p>
                  <p className="font-bold text-green-900">₦{amount.toLocaleString()}</p>
                </div>
                {orderId && (
                  <div>
                    <p className="text-gray-600 mb-1">Order ID</p>
                    <p className="font-mono text-green-900">#{orderId.slice(0, 8).toUpperCase()}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              {orderId && (
                <Link href={`/orders/${orderId}`} className="flex-1">
                  <button className="w-full btn-primary">
                    View Order Details
                  </button>
                </Link>
              )}
              <Link href="/explore" className="flex-1">
                <button className="w-full btn-outline">
                  Continue Shopping
                </button>
              </Link>
            </div>
          </div>
        )

      case 'failed':
        return (
          <div className="text-center">
            <ExclamationTriangleIcon className="w-20 h-20 text-red-500 mx-auto mb-6" />
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Payment Failed</h1>
            <p className="text-lg text-red-600 mb-6">
              {message || 'We were unable to process your payment. Please try again.'}
            </p>
            
            <div className="bg-red-50 rounded-2xl p-6 mb-8">
              <div className="text-sm text-red-800">
                <p className="mb-2">
                  <strong>What happened?</strong>
                </p>
                <p className="mb-4">
                  Your payment could not be completed. This could be due to insufficient funds,
                  card restrictions, or network issues.
                </p>
                <p>
                  <strong>Next steps:</strong>
                </p>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Check your account balance</li>
                  <li>Ensure your card is enabled for online transactions</li>
                  <li>Try a different payment method</li>
                  <li>Contact your bank if the issue persists</li>
                </ul>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <button 
                onClick={() => router.back()}
                className="flex-1 btn-primary"
              >
                Try Again
              </button>
              <Link href="/explore" className="flex-1">
                <button className="w-full btn-outline">
                  Continue Shopping
                </button>
              </Link>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-2xl w-full bg-white rounded-3xl shadow-premium p-8"
      >
        {renderContent()}

        {/* Contact Support */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="mt-8 pt-6 border-t border-gray-200 text-center"
        >
          <p className="text-sm text-gray-600">
            Need help? Contact our support team at{' '}
            <a href="mailto:support@foodnow.ng" className="text-orange-600 hover:underline">
              support@foodnow.ng
            </a>
          </p>
        </motion.div>
      </motion.div>
    </div>
  )
}