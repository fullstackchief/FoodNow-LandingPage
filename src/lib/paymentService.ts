import { typedSupabase as supabase } from '@/lib/supabase-client'
import { devLog, prodLog } from '@/lib/logger'

// Paystack API configuration
const PAYSTACK_PUBLIC_KEY = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY
const PAYSTACK_BASE_URL = 'https://api.paystack.co'

// Types for Paystack integration
export interface PaystackPaymentData {
  amount: number // Amount in kobo (multiply naira by 100)
  email: string
  currency: string
  reference: string
  callback_url?: string
  metadata?: Record<string, any>
  channels?: string[]
  split_code?: string
}

export interface PaystackInitializeResponse {
  status: boolean
  message: string
  data: {
    authorization_url: string
    access_code: string
    reference: string
  }
}

export interface PaystackVerifyResponse {
  status: boolean
  message: string
  data: {
    id: number
    domain: string
    status: 'success' | 'failed' | 'abandoned'
    reference: string
    amount: number
    message: string | null
    gateway_response: string
    paid_at: string
    created_at: string
    channel: string
    currency: string
    ip_address: string
    metadata: Record<string, any>
    log: any
    fees: number
    fees_split: any
    authorization: {
      authorization_code: string
      bin: string
      last4: string
      exp_month: string
      exp_year: string
      channel: string
      card_type: string
      bank: string
      country_code: string
      brand: string
      reusable: boolean
      signature: string
      account_name: string | null
    }
    customer: {
      id: number
      first_name: string
      last_name: string
      email: string
      customer_code: string
      phone: string | null
      metadata: Record<string, any>
      risk_action: string
      international_format_phone: string | null
    }
    plan: any
    order_id: string | null
    paidAt: string
    createdAt: string
    requested_amount: number
    pos_transaction_data: any
    source: any
    fees_breakdown: any
    connect: any
    transaction_date: string
    plan_object: any
    subaccount: any
  }
}

export interface CreatePaymentData {
  orderId: string
  amount: number // Amount in naira (will be converted to kobo)
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

// Generate unique payment reference
export const generatePaymentReference = (orderId: string): string => {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 8)
  return `FN_${orderId.substring(0, 8)}_${timestamp}_${random}`.toUpperCase()
}

// Initialize Paystack payment
export const initializePaystackPayment = async (
  paymentData: CreatePaymentData
): Promise<{ success: boolean; data?: PaystackInitializeResponse; error?: string }> => {
  const reference = generatePaymentReference(paymentData.orderId)
  
  try {
    if (!PAYSTACK_SECRET_KEY) {
      throw new Error('Paystack secret key not configured')
    }
    const amountInKobo = Math.round(paymentData.amount * 100) // Convert naira to kobo

    devLog.info('Initializing payment', {
      reference,
      orderId: paymentData.orderId,
      userId: paymentData.userId,
      amount: paymentData.amount,
      amountInKobo
    })

    const requestData: PaystackPaymentData = {
      email: paymentData.email,
      amount: amountInKobo,
      currency: 'NGN',
      reference,
      callback_url: `${window.location.origin}/payment/callback`,
      metadata: {
        order_id: paymentData.orderId,
        user_id: paymentData.userId,
        customer_name: paymentData.customerName,
        order_items: paymentData.orderItems,
        delivery_address: paymentData.deliveryAddress,
        custom_fields: [
          {
            display_name: 'Order ID',
            variable_name: 'order_id',
            value: paymentData.orderId
          },
          {
            display_name: 'Customer Name',
            variable_name: 'customer_name',
            value: paymentData.customerName
          }
        ]
      },
      channels: ['card', 'bank', 'ussd', 'qr', 'mobile_money', 'bank_transfer']
    }

    const response = await fetch(`${PAYSTACK_BASE_URL}/transaction/initialize`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestData)
    })

    if (!response.ok) {
      const errorData = await response.text()
      throw new Error(`Paystack API error: ${response.status} - ${errorData}`)
    }

    const result: PaystackInitializeResponse = await response.json()

    if (!result.status) {
      throw new Error(result.message || 'Failed to initialize payment')
    }

    // Store payment reference in database
    await supabase
      .from('payment_transactions')
      .insert({
        transaction_reference: reference,
        order_id: paymentData.orderId,
        user_id: paymentData.userId,
        amount: amountInKobo,
        currency: 'NGN',
        status: 'pending',
        payment_method: 'card',
        gateway_reference: result.data.access_code,
        gateway_response: JSON.stringify(result.data),
        metadata: requestData.metadata
      })

    devLog.info('Payment initialization successful', {
      reference,
      orderId: paymentData.orderId,
      amount: paymentData.amount
    })

    return { success: true, data: result }
  } catch (error) {
    prodLog.error('Error initializing Paystack payment', error, {
      orderId: paymentData.orderId,
      userId: paymentData.userId,
      amount: paymentData.amount,
      reference: reference || 'not_generated'
    })
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    }
  }
}

// Verify Paystack payment
export const verifyPaystackPayment = async (
  reference: string
): Promise<{ success: boolean; data?: PaystackVerifyResponse['data']; error?: string }> => {
  try {
    devLog.info('Starting payment verification', { reference })

    if (!PAYSTACK_SECRET_KEY) {
      throw new Error('Paystack secret key not configured')
    }

    const response = await fetch(`${PAYSTACK_BASE_URL}/transaction/verify/${reference}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      }
    })

    if (!response.ok) {
      const errorData = await response.text()
      throw new Error(`Paystack API error: ${response.status} - ${errorData}`)
    }

    const result: PaystackVerifyResponse = await response.json()

    if (!result.status) {
      throw new Error(result.message || 'Failed to verify payment')
    }

    // Update payment transaction in database
    const { error: updateError } = await supabase
      .from('payment_transactions')
      .update({
        status: result.data.status === 'success' ? 'completed' : 'failed',
        gateway_response: JSON.stringify(result.data),
        authorization_code: result.data.authorization?.authorization_code,
        card_last4: result.data.authorization?.last4,
        card_brand: result.data.authorization?.card_type,
        card_bank: result.data.authorization?.bank
      })
      .eq('transaction_reference', reference)

    if (updateError) {
      prodLog.error('Error updating payment transaction', updateError, {
        reference,
        status: result.data.status,
        transactionId: result.data.id
      })
    }

    // Update order status if payment was successful
    if (result.data.status === 'success') {
      const orderId = result.data.metadata?.order_id
      if (orderId) {
        await supabase
          .from('orders')
          .update({
            payment_status: 'paid',
            status: 'confirmed'
          })
          .eq('id', orderId)
        
        prodLog.info('Payment verification successful and order updated', {
          reference,
          orderId,
          amount: result.data.amount,
          transactionId: result.data.id,
          channel: result.data.channel
        })
      }
    } else {
      prodLog.warn('Payment verification completed but payment was not successful', {
        reference,
        status: result.data.status,
        gatewayResponse: result.data.gateway_response
      })
    }

    return { success: true, data: result.data }
  } catch (error) {
    prodLog.error('Error verifying Paystack payment', error, {
      reference
    })
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    }
  }
}

// Get payment transaction by reference
export const getPaymentTransaction = async (reference: string) => {
  try {
    const { data, error } = await supabase
      .from('payment_transactions')
      .select('*')
      .eq('transaction_reference', reference)
      .single()

    if (error) {
      prodLog.error('Error fetching payment transaction', error, {
        reference
      })
      return { success: false, error: error.message }
    }

    devLog.info('Payment transaction retrieved successfully', {
      reference,
      status: (data as any).status
    })

    return { success: true, data }
  } catch (error) {
    prodLog.error('Error fetching payment transaction', error, {
      reference
    })
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    }
  }
}

// Get customer payment methods (saved cards)
export const getCustomerPaymentMethods = async (email: string) => {
  try {
    if (!PAYSTACK_SECRET_KEY) {
      throw new Error('Paystack secret key not configured')
    }

    const response = await fetch(`${PAYSTACK_BASE_URL}/customer/${email}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      }
    })

    if (!response.ok) {
      if (response.status === 404) {
        // Customer doesn't exist, return empty array
        return { success: true, data: [] }
      }
      const errorData = await response.text()
      throw new Error(`Paystack API error: ${response.status} - ${errorData}`)
    }

    const result = await response.json()

    if (!result.status) {
      throw new Error(result.message || 'Failed to fetch customer payment methods')
    }

    // Extract saved authorizations (cards)
    const paymentMethods = result.data.authorizations || []

    devLog.info('Customer payment methods retrieved successfully', {
      email,
      paymentMethodsCount: paymentMethods.length
    })

    return { success: true, data: paymentMethods }
  } catch (error) {
    prodLog.error('Error fetching customer payment methods', error, {
      email
    })
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    }
  }
}

// Charge authorization (for saved cards)
export const chargeAuthorization = async (
  authorizationCode: string,
  amount: number,
  email: string,
  reference: string,
  metadata?: Record<string, any>
): Promise<{ success: boolean; data?: any; error?: string }> => {
  try {
    if (!PAYSTACK_SECRET_KEY) {
      throw new Error('Paystack secret key not configured')
    }

    const amountInKobo = Math.round(amount * 100)

    const requestData = {
      authorization_code: authorizationCode,
      email,
      amount: amountInKobo,
      currency: 'NGN',
      reference,
      metadata
    }

    const response = await fetch(`${PAYSTACK_BASE_URL}/transaction/charge_authorization`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestData)
    })

    if (!response.ok) {
      const errorData = await response.text()
      throw new Error(`Paystack API error: ${response.status} - ${errorData}`)
    }

    const result = await response.json()

    if (!result.status) {
      throw new Error(result.message || 'Failed to charge authorization')
    }

    devLog.info('Authorization charge successful', {
      reference,
      amount,
      email,
      status: result.data.status
    })

    return { success: true, data: result.data }
  } catch (error) {
    prodLog.error('Error charging authorization', error, {
      authorizationCode,
      amount,
      email,
      reference
    })
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    }
  }
}

// Format amount for display (convert kobo to naira)
export const formatAmount = (amountInKobo: number): string => {
  const amountInNaira = amountInKobo / 100
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN'
  }).format(amountInNaira)
}

// Client-side payment popup using Paystack inline
export const openPaystackPopup = (
  paymentData: PaystackPaymentData,
  onSuccess: (reference: string) => void,
  onClose: () => void
) => {
  if (!PAYSTACK_PUBLIC_KEY) {
    throw new Error('Paystack public key not configured')
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
      key: PAYSTACK_PUBLIC_KEY!,
      email: paymentData.email,
      amount: paymentData.amount,
      currency: paymentData.currency,
      ref: paymentData.reference,
      metadata: paymentData.metadata,
      channels: paymentData.channels,
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