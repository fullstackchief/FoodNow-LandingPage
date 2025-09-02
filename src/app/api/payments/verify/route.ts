/**
 * Payment Verification API Route
 * ==============================
 * Secure server-side payment verification
 */

import { NextRequest, NextResponse } from 'next/server'
import { verifyServerPayment } from '@/lib/payment-server'
import { supabaseServerClient } from '@/lib/supabase-server'
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

    // Validate Supabase authentication
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseServerClient.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Invalid authentication token' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { reference } = body

    // Validate required fields
    if (!reference) {
      return NextResponse.json(
        { error: 'Payment reference is required' },
        { status: 400 }
      )
    }

    const clientIP = getClientIP(request)

    prodLog.info('Payment verification requested', {
      reference,
      userId: user.id,
      clientIP
    })

    // Verify payment on server
    const result = await verifyServerPayment(reference)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Payment verification failed' },
        { status: 500 }
      )
    }

    devLog.info('Payment verification successful', {
      reference,
      status: result.data?.status,
      userId: user.id
    })

    // Return verification result
    return NextResponse.json({
      success: true,
      data: {
        reference,
        status: result.data?.status,
        amount: result.data?.amount,
        currency: result.data?.currency,
        paid_at: result.data?.paid_at,
        channel: result.data?.channel,
        gateway_response: result.data?.gateway_response,
        metadata: result.data?.metadata
      }
    })

  } catch (error) {
    prodLog.error('Payment verification error', error, {
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