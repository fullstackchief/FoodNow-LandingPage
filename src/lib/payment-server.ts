/**
 * Server-side Payment Service Configuration
 * =========================================
 * This file handles server-side payment operations with secure API keys
 * IMPORTANT: This file should NEVER be imported on the client side
 */

import { supabaseServerClient } from '@/lib/supabase-server'
const typedSupabase = supabaseServerClient as any
import { devLog, prodLog } from '@/lib/logger'

// Server-only payment configuration
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY
const PAYSTACK_BASE_URL = 'https://api.paystack.co'

// Types for server-side payment operations
export interface ServerPaymentData {
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

export interface PaystackServerResponse {
  status: boolean
  message: string
  data: any
}

// Generate unique payment reference (server-side)
export const generateServerPaymentReference = (orderId: string): string => {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 8)
  return `FN_${orderId.substring(0, 8)}_${timestamp}_${random}`.toUpperCase()
}

/**
 * Initialize payment on server-side (secure)
 * Returns initialization data to send to client
 */
export const initializeServerPayment = async (
  paymentData: ServerPaymentData
): Promise<{ success: boolean; data?: any; error?: string }> => {
  try {
    if (!PAYSTACK_SECRET_KEY) {
      throw new Error('Payment service not configured - missing secret key')
    }

    const reference = generateServerPaymentReference(paymentData.orderId)
    const amountInKobo = Math.round(paymentData.amount * 100) // Convert naira to kobo

    devLog.info('Server: Initializing payment', {
      reference,
      orderId: paymentData.orderId,
      userId: paymentData.userId,
      amount: paymentData.amount,
      amountInKobo
    })

    const requestData = {
      email: paymentData.email,
      amount: amountInKobo,
      currency: 'NGN',
      reference,
      callback_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/payment/callback`,
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

    const result: PaystackServerResponse = await response.json()

    if (!result.status) {
      throw new Error(result.message || 'Failed to initialize payment')
    }

    // Store payment reference in database
    await typedSupabase
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

    devLog.info('Server: Payment initialization successful', {
      reference,
      orderId: paymentData.orderId,
      amount: paymentData.amount
    })

    // Return only client-safe data (no secret keys)
    return { 
      success: true, 
      data: {
        reference,
        authorization_url: result.data.authorization_url,
        access_code: result.data.access_code,
        // Client needs these for the popup
        amount: amountInKobo,
        email: paymentData.email,
        currency: 'NGN'
      }
    }
  } catch (error) {
    prodLog.error('Server: Error initializing payment', error, {
      orderId: paymentData.orderId,
      userId: paymentData.userId,
      amount: paymentData.amount
    })
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Payment initialization failed' 
    }
  }
}

/**
 * Verify payment on server-side (secure)
 */
export const verifyServerPayment = async (
  reference: string
): Promise<{ success: boolean; data?: any; error?: string }> => {
  try {
    devLog.info('Server: Starting payment verification', { reference })

    if (!PAYSTACK_SECRET_KEY) {
      throw new Error('Payment service not configured - missing secret key')
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

    const result: PaystackServerResponse = await response.json()

    if (!result.status) {
      throw new Error(result.message || 'Failed to verify payment')
    }

    // Update payment transaction in database
    const { error: updateError } = await typedSupabase
      .from('payment_transactions')
      .update({
        status: result.data.status,
        gateway_response: JSON.stringify(result.data),
        authorization_code: result.data.authorization?.authorization_code,
        card_last4: result.data.authorization?.last4,
        card_brand: result.data.authorization?.card_type,
        card_bank: result.data.authorization?.bank
      })
      .eq('transaction_reference', reference)

    if (updateError) {
      prodLog.error('Server: Error updating payment transaction', updateError, {
        reference,
        status: result.data.status,
        transactionId: result.data.id
      })
    }

    // Update order status if payment was successful
    if (result.data.status === 'success') {
      const orderId = result.data.metadata?.order_id
      if (orderId) {
        await typedSupabase
          .from('orders')
          .update({
            payment_status: 'completed',
            status: 'accepted'
          })
          .eq('id', orderId)
        
        prodLog.info('Server: Payment verification successful and order updated', {
          reference,
          orderId,
          amount: result.data.amount,
          transactionId: result.data.id,
          channel: result.data.channel
        })
      }
    } else {
      prodLog.warn('Server: Payment verification completed but payment was not successful', {
        reference,
        status: result.data.status,
        gatewayResponse: result.data.gateway_response
      })
    }

    return { success: true, data: result.data }
  } catch (error) {
    prodLog.error('Server: Error verifying payment', error, {
      reference
    })
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Payment verification failed' 
    }
  }
}

/**
 * Get payment configuration for client (only safe values)
 */
export const getClientPaymentConfig = () => {
  return {
    publicKey: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY,
    currency: 'NGN',
    channels: ['card', 'bank', 'ussd', 'qr', 'mobile_money', 'bank_transfer'],
    environment: process.env.NODE_ENV
  }
}

/**
 * Format amount for display (convert kobo to naira)
 */
export const formatServerAmount = (amountInKobo: number): string => {
  const amountInNaira = amountInKobo / 100
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN'
  }).format(amountInNaira)
}