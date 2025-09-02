import { NextRequest, NextResponse } from 'next/server'
import { createHmac } from 'crypto'
import { createClient } from '@supabase/supabase-js'
import { devLog, prodLog } from '@/lib/logger'
import { validateData } from '@/lib/validations'
import { paystackWebhookSchema } from '@/lib/validations/webhooks'
import { applyRateLimit, rateLimiters } from '@/lib/rateLimiter'

// Server-side only - service role key for database operations
const supabaseService = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

// Paystack webhook secret from environment variables
const PAYSTACK_WEBHOOK_SECRET = process.env.WEBHOOK_SECRET_PAYSTACK

// Types for Paystack webhook events
interface PaystackWebhookEvent {
  event: string
  data: {
    id: number
    domain: string
    status: 'success' | 'failed' | 'abandoned'
    reference: string
    amount: number
    message: string | null
    gateway_response: string
    paid_at: string | null
    created_at: string
    channel: string
    currency: string
    ip_address?: string
    metadata: {
      order_id?: string
      user_id?: string
      customer_name?: string
      custom_fields?: Array<{
        display_name: string
        variable_name: string
        value: string
      }>
    }
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
    } | null
    customer: {
      id: number
      first_name: string | null
      last_name: string | null
      email: string
      customer_code: string
      phone: string | null
      metadata: any
      risk_action: string
    }
    plan: any
    subaccount: any
    order_id: string | null
    paidAt: string | null
    createdAt: string
    requested_amount: number
  }
}

// Verify Paystack webhook signature
function verifyPaystackSignature(payload: string, signature: string): boolean {
  if (!PAYSTACK_WEBHOOK_SECRET) {
    prodLog.error('Paystack webhook secret not configured')
    return false
  }

  const hash = createHmac('sha512', PAYSTACK_WEBHOOK_SECRET)
    .update(payload)
    .digest('hex')

  return hash === signature
}

// Handle charge.success event
async function handleChargeSuccess(data: PaystackWebhookEvent['data']) {
  try {
    devLog.info('Processing charge.success for reference:', data.reference)

    // Update payment transaction
    const { error: paymentError } = await supabaseService
      .from('payment_transactions')
      .update({
        status: data.status,
        paid_at: data.paid_at,
        gateway_response: data.gateway_response,
        channel: data.channel,
        fees: data.fees,
        authorization_code: data.authorization?.authorization_code,
        last4: data.authorization?.last4,
        card_type: data.authorization?.card_type,
        bank: data.authorization?.bank,
        verified_at: new Date().toISOString()
      })
      .eq('reference', data.reference)

    if (paymentError) {
      prodLog.error('Error updating payment transaction:', paymentError, { reference: data.reference })
      return false
    }

    // Update order status if payment was successful
    if (data.status === 'success' && data.metadata.order_id) {
      const { error: orderError } = await supabaseService
        .from('orders')
        .update({
          payment_status: 'paid',
          status: 'confirmed',
          payment_reference: data.reference,
          paid_at: data.paid_at
        })
        .eq('id', data.metadata.order_id)

      if (orderError) {
        prodLog.error('Error updating order:', orderError, { orderId: data.metadata.order_id, reference: data.reference })
        return false
      }

      devLog.info('Order updated successfully:', data.metadata.order_id)
    }

    return true
  } catch (error) {
    prodLog.error('Error handling charge.success:', error, { reference: data.reference })
    return false
  }
}

// Handle charge.failed event
async function handleChargeFailed(data: PaystackWebhookEvent['data']) {
  try {
    devLog.info('Processing charge.failed for reference:', data.reference)

    // Update payment transaction
    const { error: paymentError } = await supabaseService
      .from('payment_transactions')
      .update({
        status: data.status,
        gateway_response: data.gateway_response,
        verified_at: new Date().toISOString()
      })
      .eq('reference', data.reference)

    if (paymentError) {
      prodLog.error('Error updating payment transaction:', paymentError, { reference: data.reference })
      return false
    }

    // Update order status
    if (data.metadata.order_id) {
      const { error: orderError } = await supabaseService
        .from('orders')
        .update({
          payment_status: 'failed',
          status: 'cancelled',
          payment_reference: data.reference
        })
        .eq('id', data.metadata.order_id)

      if (orderError) {
        prodLog.error('Error updating order:', orderError, { orderId: data.metadata.order_id, reference: data.reference })
        return false
      }

      devLog.info('Order cancelled due to failed payment:', data.metadata.order_id)
    }

    return true
  } catch (error) {
    prodLog.error('Error handling charge.failed:', error, { reference: data.reference })
    return false
  }
}

// Handle transfer.success event (for bank transfers)
async function handleTransferSuccess(data: any) {
  try {
    devLog.info('Processing transfer.success for reference:', data.reference)

    // Update payment transaction if exists
    const { error } = await supabaseService
      .from('payment_transactions')
      .update({
        status: 'success',
        paid_at: data.paid_at || new Date().toISOString(),
        gateway_response: 'Transfer successful',
        verified_at: new Date().toISOString()
      })
      .eq('reference', data.reference)

    if (error) {
      prodLog.error('Error updating transfer payment:', error, { reference: data.reference })
      return false
    }

    return true
  } catch (error) {
    prodLog.error('Error handling transfer.success:', error, { reference: data.reference })
    return false
  }
}

// Main webhook handler
export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting for webhooks
    const rateLimitResult = await applyRateLimit(request, rateLimiters.webhook)
    if (rateLimitResult) {
      return rateLimitResult
    }

    // Get the raw body
    const body = await request.text()
    const signature = request.headers.get('x-paystack-signature')

    if (!signature) {
      prodLog.error('No Paystack signature found')
      return NextResponse.json(
        { error: 'No signature provided' },
        { status: 400 }
      )
    }

    // Verify the webhook signature
    if (!verifyPaystackSignature(body, signature)) {
      prodLog.error('Invalid Paystack signature')
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      )
    }

    // Parse and validate the webhook event
    let parsedEvent
    try {
      parsedEvent = JSON.parse(body)
    } catch (parseError) {
      prodLog.error('Invalid JSON in webhook payload', parseError)
      return NextResponse.json(
        { error: 'Invalid JSON payload' },
        { status: 400 }
      )
    }

    // Validate webhook event structure
    const validation = validateData(paystackWebhookSchema, parsedEvent, 'Paystack Webhook')
    
    if (!validation.success) {
      prodLog.error('Webhook validation failed', { errors: validation.errors })
      return NextResponse.json(
        { error: 'Invalid webhook payload structure' },
        { status: 400 }
      )
    }

    const event = validation.data
    devLog.info('Received valid Paystack webhook event:', event.event)

    // Handle different event types
    let handled = false

    switch (event.event) {
      case 'charge.success':
        handled = await handleChargeSuccess(event.data as any)
        break

      case 'charge.failed':
        handled = await handleChargeFailed(event.data as any)
        break

      case 'transfer.success':
        handled = await handleTransferSuccess(event.data)
        break

      case 'transfer.failed':
      case 'transfer.reversed':
        // Handle transfer failures if needed
        devLog.info('Transfer event received:', event.event, event.data.reference)
        handled = true
        break

      default:
        devLog.info('Unhandled Paystack webhook event:', event.event)
        handled = true // Return success for unhandled events to avoid retries
        break
    }

    if (!handled) {
      return NextResponse.json(
        { error: 'Failed to process webhook' },
        { status: 500 }
      )
    }

    return NextResponse.json({ message: 'Webhook processed successfully' })
  } catch (error) {
    prodLog.error('Webhook processing error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Handle GET requests (for verification)
export async function GET() {
  return NextResponse.json({ 
    message: 'Paystack webhook endpoint is active',
    timestamp: new Date().toISOString()
  })
}