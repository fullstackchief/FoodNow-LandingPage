import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
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

/**
 * GET - Fetch orders for a specific restaurant
 */
export async function GET(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResult = await applyRateLimit(request, rateLimiters.api)
    if (rateLimitResult) {
      return rateLimitResult
    }

    const { searchParams } = new URL(request.url)
    const restaurantId = searchParams.get('restaurant_id')
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    if (!restaurantId) {
      return NextResponse.json(
        { success: false, error: 'Restaurant ID is required' },
        { status: 400 }
      )
    }

    // Build query for restaurant orders
    let query = supabaseService
      .from('orders')
      .select(`
        *,
        order_items (
          *,
          menu_items (name, image_url, base_price)
        ),
        users!inner(first_name, last_name, phone)
      `)
      .eq('restaurant_id', restaurantId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (status) {
      query = query.eq('status', status)
    }

    const { data: orders, error, count } = await query

    if (error) {
      prodLog.error('Failed to fetch restaurant orders', error, {
        restaurantId,
        status,
        limit,
        offset
      })
      return NextResponse.json(
        { success: false, error: 'Failed to fetch orders' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: orders || [],
      pagination: {
        limit,
        offset,
        total: count || 0
      }
    })

  } catch (error) {
    prodLog.error('Restaurant orders fetch error', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PATCH - Update order status (restaurant action)
 */
export async function PATCH(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResult = await applyRateLimit(request, rateLimiters.orders)
    if (rateLimitResult) {
      return rateLimitResult
    }

    const body = await request.json()
    const { orderId, status, restaurantId, rejectionReason } = body

    if (!orderId || !status || !restaurantId) {
      return NextResponse.json(
        { success: false, error: 'Order ID, status, and restaurant ID are required' },
        { status: 400 }
      )
    }

    // Validate status transition
    const validStatuses = ['confirmed', 'preparing', 'ready', 'cancelled']
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, error: 'Invalid status value' },
        { status: 400 }
      )
    }

    // Verify order belongs to restaurant
    const { data: existingOrder, error: fetchError } = await supabaseService
      .from('orders')
      .select('id, status, restaurant_id, tracking_updates')
      .eq('id', orderId)
      .eq('restaurant_id', restaurantId)
      .single()

    if (fetchError || !existingOrder) {
      logSecurityEvent('unauthorized_order_access', {
        orderId,
        restaurantId,
        requestedBy: 'restaurant'
      }, request)
      return NextResponse.json(
        { success: false, error: 'Order not found or unauthorized' },
        { status: 404 }
      )
    }

    // Check if status transition is valid
    const currentStatus = existingOrder.status
    const validTransitions: Record<string, string[]> = {
      'pending': ['confirmed', 'cancelled'],
      'confirmed': ['preparing', 'cancelled'],
      'preparing': ['ready', 'cancelled'],
      'ready': ['picked_up'] // Only riders can mark as picked_up
    }

    if (!validTransitions[currentStatus]?.includes(status)) {
      return NextResponse.json(
        { success: false, error: `Cannot change status from ${currentStatus} to ${status}` },
        { status: 400 }
      )
    }

    // Prepare updates
    const updates: any = {
      status,
      updated_at: new Date().toISOString()
    }

    // Add status-specific timestamps
    switch (status) {
      case 'confirmed':
        updates.confirmed_at = new Date().toISOString()
        break
      case 'preparing':
        updates.started_preparing_at = new Date().toISOString()
        break
      case 'ready':
        updates.ready_at = new Date().toISOString()
        break
      case 'cancelled':
        updates.cancelled_at = new Date().toISOString()
        if (rejectionReason) {
          updates.cancellation_reason = rejectionReason
        }
        break
    }

    // Add tracking update
    const trackingUpdate = {
      status,
      timestamp: new Date().toISOString(),
      message: status === 'cancelled' 
        ? `Order cancelled: ${rejectionReason || 'Restaurant unavailable'}`
        : `Order ${status} by restaurant`,
      location: 'restaurant',
      updated_by: 'restaurant'
    }

    const currentTracking = (existingOrder.tracking_updates as any[]) || []
    updates.tracking_updates = [...currentTracking, trackingUpdate]

    // Update order
    const { data: updatedOrder, error: updateError } = await supabaseService
      .from('orders')
      .update(updates)
      .eq('id', orderId)
      .eq('restaurant_id', restaurantId)
      .select()
      .single()

    if (updateError) {
      prodLog.error('Failed to update order status', updateError, {
        orderId,
        status,
        restaurantId,
        rejectionReason
      })
      return NextResponse.json(
        { success: false, error: 'Failed to update order status' },
        { status: 500 }
      )
    }

    logSecurityEvent('order_status_updated', {
      orderId,
      previousStatus: currentStatus,
      newStatus: status,
      restaurantId,
      updatedBy: 'restaurant'
    }, request)

    devLog.info('Order status updated by restaurant', {
      orderId,
      previousStatus: currentStatus,
      newStatus: status,
      restaurantId
    })

    return NextResponse.json({
      success: true,
      data: updatedOrder
    })

  } catch (error) {
    prodLog.error('Order status update error', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}