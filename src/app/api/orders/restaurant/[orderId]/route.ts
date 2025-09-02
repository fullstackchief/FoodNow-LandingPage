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
 * PATCH - Update specific order status
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    // Apply rate limiting
    const rateLimitResult = await applyRateLimit(request, rateLimiters.orders)
    if (rateLimitResult) {
      return rateLimitResult
    }

    const { orderId } = await params
    const body = await request.json()
    const { status, restaurantId, rejectionReason } = body

    if (!status || !restaurantId) {
      return NextResponse.json(
        { success: false, error: 'Status and restaurant ID are required' },
        { status: 400 }
      )
    }

    // Validate status
    const validStatuses = ['confirmed', 'preparing', 'ready', 'cancelled']
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, error: 'Invalid status value' },
        { status: 400 }
      )
    }

    // Verify order belongs to restaurant and get current state
    const { data: existingOrder, error: fetchError } = await supabaseService
      .from('orders')
      .select('id, status, restaurant_id, tracking_updates, user_id')
      .eq('id', orderId)
      .eq('restaurant_id', restaurantId)
      .single()

    if (fetchError || !existingOrder) {
      logSecurityEvent('unauthorized_order_modification', {
        orderId,
        restaurantId,
        requestedStatus: status
      }, request)
      return NextResponse.json(
        { success: false, error: 'Order not found or unauthorized' },
        { status: 404 }
      )
    }

    // Validate status transition
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
      .select(`
        *,
        order_items (
          *,
          menu_items (name, image_url, base_price)
        ),
        users!inner(first_name, last_name, phone)
      `)
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

    devLog.info('Order status updated successfully', {
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
    prodLog.error('Order update error', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * GET - Get specific order details for restaurant
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    // Apply rate limiting
    const rateLimitResult = await applyRateLimit(request, rateLimiters.api)
    if (rateLimitResult) {
      return rateLimitResult
    }

    const { orderId } = await params
    const { searchParams } = new URL(request.url)
    const restaurantId = searchParams.get('restaurant_id')

    if (!restaurantId) {
      return NextResponse.json(
        { success: false, error: 'Restaurant ID is required' },
        { status: 400 }
      )
    }

    // Get order with full details
    const { data: order, error } = await supabaseService
      .from('orders')
      .select(`
        *,
        order_items (
          *,
          menu_items (name, image_url, base_price, description)
        ),
        users!inner(first_name, last_name, phone),
        restaurants!inner(name, phone_number)
      `)
      .eq('id', orderId)
      .eq('restaurant_id', restaurantId)
      .single()

    if (error || !order) {
      return NextResponse.json(
        { success: false, error: 'Order not found or unauthorized' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: order
    })

  } catch (error) {
    prodLog.error('Order detail fetch error', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}