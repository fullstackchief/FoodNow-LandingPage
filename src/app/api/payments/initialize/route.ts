/**
 * Payment Initialization API Route
 * ================================
 * Secure server-side payment initialization
 */

import { NextRequest, NextResponse } from 'next/server'
import { initializeServerPayment, getClientPaymentConfig } from '@/lib/payment-server'
import { createClient } from '@supabase/supabase-js'
import { prodLog, devLog } from '@/lib/logger'
import { getClientIP } from '@/lib/security'
import { applyRateLimit, rateLimiters } from '@/lib/rateLimiter'

export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResult = await applyRateLimit(request, rateLimiters.api)
    if (rateLimitResult) {
      return rateLimitResult
    }

    // Validate Supabase session
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Invalid or expired session' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { orderId, amount, email, customerName, orderItems, deliveryAddress } = body

    // Validate required fields
    if (!orderId || !amount || !email || !customerName) {
      return NextResponse.json(
        { error: 'Missing required payment data' },
        { status: 400 }
      )
    }

    // Validate amount is positive
    if (amount <= 0) {
      return NextResponse.json(
        { error: 'Invalid payment amount' },
        { status: 400 }
      )
    }

    const clientIP = getClientIP(request)

    prodLog.info('Payment initialization requested', {
      orderId,
      userId: user.id,
      amount,
      email,
      clientIP
    })

    // Initialize payment on server
    const result = await initializeServerPayment({
      orderId,
      amount,
      email,
      userId: user.id,
      customerName,
      orderItems: orderItems || [],
      deliveryAddress
    })

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Payment initialization failed' },
        { status: 500 }
      )
    }

    // Get client configuration (safe values only)
    const clientConfig = getClientPaymentConfig()

    devLog.info('Payment initialization successful', {
      orderId,
      reference: result.data?.reference
    })

    return NextResponse.json({
      success: true,
      data: {
        ...result.data,
        config: clientConfig
      }
    })

  } catch (error) {
    prodLog.error('Payment initialization error', error, {
      clientIP: getClientIP(request)
    })

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Handle unsupported methods
export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  )
}

export async function PUT() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  )
}

export async function DELETE() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  )
}