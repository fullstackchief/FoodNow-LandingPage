import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { validateRequestBody, createOrderSchema, createValidationErrorResponse } from '@/lib/validations'
import { applyRateLimit, rateLimiters } from '@/lib/rateLimiter'
import { prodLog, devLog } from '@/lib/logger'
import { logSecurityEvent } from '@/lib/security'

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

export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting for order creation
    const rateLimitResult = await applyRateLimit(request, rateLimiters.orders)
    if (rateLimitResult) {
      logSecurityEvent('order_creation_rate_limited', {
        path: request.nextUrl.pathname,
        reason: 'Too many order creation attempts'
      }, request)
      return rateLimitResult
    }

    // Validate request body
    const validation = await validateRequestBody(request, createOrderSchema, 'Order Creation')
    
    if (!validation.success) {
      return createValidationErrorResponse(validation.errors)
    }

    const orderData = validation.data
    devLog.info('Creating new order', { restaurantId: orderData.restaurant_id })

    // Create order in database
    const { data: order, error } = await supabaseService
      .from('orders')
      .insert({
        ...orderData,
        status: 'pending',
        payment_status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      prodLog.error('Failed to create order', error, { orderData })
      return NextResponse.json(
        { success: false, error: 'Failed to create order' },
        { status: 500 }
      )
    }

    logSecurityEvent('order_created', {
      orderId: order.id,
      restaurantId: orderData.restaurant_id,
      total: orderData.total
    }, request)

    return NextResponse.json({
      success: true,
      data: order
    }, { status: 201 })

  } catch (error) {
    prodLog.error('Order creation error', error, {
      path: request.nextUrl.pathname
    })
    
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    // Apply rate limiting for order queries
    const rateLimitResult = await applyRateLimit(request, rateLimiters.api)
    if (rateLimitResult) {
      return rateLimitResult
    }

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('user_id')
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Build query
    let query = supabaseService
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (userId) {
      query = query.eq('user_id', userId)
    }

    if (status) {
      query = query.eq('status', status)
    }

    const { data: orders, error, count } = await query

    if (error) {
      prodLog.error('Failed to fetch orders', error)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch orders' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: orders,
      pagination: {
        limit,
        offset,
        total: count || 0
      }
    })

  } catch (error) {
    prodLog.error('Order fetch error', error, {
      path: request.nextUrl.pathname
    })
    
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}