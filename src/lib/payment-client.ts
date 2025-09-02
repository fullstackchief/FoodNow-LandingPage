/**
 * Client-side Payment Service
 * ===========================
 * Secure client-side payment handling using server endpoints
 * This replaces direct API calls with server-mediated requests
 */

import { devLog } from '@/lib/logger'

export interface CreatePaymentData {
  orderId: string
  amount: number // Amount in naira
  email: string
  userId: string
  customerName: string
  orderItems: Array<{
    name: string
    quantity: number
    price: number
  }>
  deliveryAddress?: {
    street: string
    area: string
    city: string
    state: string
  }
}

export interface PaymentInitResponse {
  success: boolean
  data?: {
    reference: string
    authorization_url: string
    access_code: string
    amount: number
    email: string
    currency: string
    config: {
      publicKey: string
      currency: string
      channels: string[]
      environment: string
    }
  }
  error?: string
}

export interface PaymentVerifyResponse {
  success: boolean
  data?: {
    reference: string
    status: string
    amount: number
    currency: string
    paid_at: string
    channel: string
    gateway_response: string
    metadata: Record<string, any>
  }
  error?: string
}

/**
 * Initialize payment using secure server endpoint
 */
export const initializePayment = async (
  paymentData: CreatePaymentData
): Promise<PaymentInitResponse> => {
  try {
    devLog.info('Client: Initializing payment via server', {
      orderId: paymentData.orderId,
      amount: paymentData.amount
    })

    // Get current Supabase session
    const { supabase } = await import('@/lib/supabase-client')
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session?.access_token) {
      throw new Error('No valid session found')
    }

    const response = await fetch('/api/payments/initialize', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      credentials: 'include',
      body: JSON.stringify(paymentData)
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || `HTTP ${response.status}`)
    }

    const result: PaymentInitResponse = await response.json()

    devLog.info('Client: Payment initialization response received', {
      success: result.success,
      reference: result.data?.reference
    })

    return result

  } catch (error) {
    console.error('Client: Payment initialization failed', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Payment initialization failed'
    }
  }
}

/**
 * Verify payment using secure server endpoint
 */
export const verifyPayment = async (
  reference: string
): Promise<PaymentVerifyResponse> => {
  try {
    devLog.info('Client: Verifying payment via server', { reference })

    const response = await fetch('/api/payments/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Include httpOnly cookies
      body: JSON.stringify({ reference })
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || `HTTP ${response.status}`)
    }

    const result: PaymentVerifyResponse = await response.json()

    devLog.info('Client: Payment verification response received', {
      success: result.success,
      status: result.data?.status,
      reference
    })

    return result

  } catch (error) {
    console.error('Client: Payment verification failed', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Payment verification failed'
    }
  }
}

/**
 * Generate unique payment reference (client-side)
 */
export const generatePaymentReference = (orderId: string): string => {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 8)
  return `FN_${orderId.substring(0, 8)}_${timestamp}_${random}`.toUpperCase()
}

/**
 * Format amount for display (convert kobo to naira)
 */
export const formatAmount = (amountInKobo: number): string => {
  const amountInNaira = amountInKobo / 100
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN'
  }).format(amountInNaira)
}

/**
 * Open Paystack popup using provided configuration
 * This only handles the client-side popup, all API calls go through server
 */
export const openPaystackPopup = (
  config: {
    publicKey: string
    email: string
    amount: number
    currency: string
    reference: string
    metadata?: Record<string, any>
    channels?: string[]
  },
  onSuccess: (reference: string) => void,
  onClose: () => void
) => {
  if (!config.publicKey) {
    throw new Error('Payment service not configured')
  }

  // Load Paystack inline script if not already loaded
  if (!window.PaystackPop) {
    const script = document.createElement('script')
    script.src = 'https://js.paystack.co/v1/inline.js'
    script.onload = () => initializePaystack()
    document.head.appendChild(script)
  } else {
    initializePaystack()
  }

  function initializePaystack() {
    const popup = window.PaystackPop.setup({
      key: config.publicKey,
      email: config.email,
      amount: config.amount,
      currency: config.currency,
      ref: config.reference,
      metadata: config.metadata,
      channels: config.channels,
      onSuccess: (transaction: any) => {
        onSuccess(transaction.reference)
      },
      onCancel: () => {
        onClose()
      }
    })

    popup.openIframe()
  }
}

// Declare Paystack window interface
declare global {
  interface Window {
    PaystackPop: {
      setup: (config: any) => {
        openIframe: () => void
      }
    }
  }
}