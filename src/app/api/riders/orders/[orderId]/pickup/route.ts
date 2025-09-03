import { NextRequest, NextResponse } from 'next/server'
import { supabaseServerClient } from '@/lib/supabase-server'
import { prodLog, devLog } from '@/lib/logger'
import { OrderTrackingService } from '@/lib/orderTrackingService'

/**
 * POST - Mark order as picked up by rider
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params
    const body = await request.json()
    const { riderId, latitude, longitude, pickupNotes } = body

    if (!riderId) {
      return NextResponse.json(
        { success: false, error: 'Rider ID is required' },
        { status: 400 }
      )
    }

    // Verify order exists and is assigned to this rider
    const { data: order, error: orderError } = await supabaseServerClient
      .from('orders')
      .select(`
        id, 
        status, 
        rider_id, 
        restaurant_id,
        order_number,
        total,
        users!customer_id(first_name, last_name, phone),
        restaurants!restaurant_id(name, phone_number)
      `)
      .eq('id', orderId)
      .eq('rider_id', riderId)
      .single()

    if (orderError || !order) {
      return NextResponse.json(
        { success: false, error: 'Order not found or not assigned to this rider' },
        { status: 404 }
      )
    }

    // Validate current status
    if (order.status !== 'ready') {
      return NextResponse.json(
        { success: false, error: `Cannot pick up order with status: ${order.status}. Order must be ready for pickup.` },
        { status: 400 }
      )
    }

    // Update order status to picked_up
    const updates: any = {
      status: 'picked_up',
      picked_up_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    // Add rider location if provided
    if (latitude && longitude) {
      updates.pickup_location = { latitude, longitude }
    }

    if (pickupNotes) {
      updates.pickup_notes = pickupNotes
    }

    // Add tracking update
    const trackingUpdate = {
      status: 'picked_up',
      timestamp: new Date().toISOString(),
      message: `Order picked up by ${order.users?.first_name || 'rider'}`,
      location: latitude && longitude ? { latitude, longitude } : null,
      updated_by: 'rider',
      notes: pickupNotes
    }

    // Get current tracking updates
    const { data: currentOrder } = await supabaseServerClient
      .from('orders')
      .select('tracking_updates')
      .eq('id', orderId)
      .single()

    const currentTracking = (currentOrder?.tracking_updates as any[]) || []
    updates.tracking_updates = [...currentTracking, trackingUpdate]

    // Update order
    const { data: updatedOrder, error: updateError } = await supabaseServerClient
      .from('orders')
      .update(updates)
      .eq('id', orderId)
      .eq('rider_id', riderId)
      .select('*')
      .single()

    if (updateError) {
      prodLog.error('Failed to mark order as picked up', updateError, {
        orderId,
        riderId,
        pickupLocation: { latitude, longitude }
      })
      return NextResponse.json(
        { success: false, error: 'Failed to update order status' },
        { status: 500 }
      )
    }

    // Update rider location in tracking system
    if (latitude && longitude) {
      try {
        await fetch('/api/riders/location', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            riderId,
            latitude,
            longitude,
            accuracy: 10,
            orderId
          })
        })
      } catch (locationError) {
        // Don't fail the pickup if location update fails
        devLog.warn('Failed to update rider location during pickup', { riderId, orderId })
      }
    }

    // Send real-time notification
    await OrderTrackingService.broadcastStatusUpdate(orderId, 'picked_up', 'rider')

    // Log successful pickup
    prodLog.info('Order picked up successfully', {
      orderId: order.id,
      orderNumber: order.order_number,
      riderId,
      restaurantId: order.restaurant_id,
      pickupTime: updates.picked_up_at,
      pickupLocation: updates.pickup_location
    })

    return NextResponse.json({
      success: true,
      message: 'Order marked as picked up successfully',
      data: {
        orderId: order.id,
        orderNumber: order.order_number,
        status: 'picked_up',
        pickedUpAt: updates.picked_up_at,
        customer: {
          name: `${order.users?.first_name} ${order.users?.last_name}`,
          phone: order.users?.phone
        },
        restaurant: {
          name: order.restaurants?.name,
          phone: order.restaurants?.phone_number
        }
      }
    })

  } catch (error) {
    prodLog.error('Order pickup error', error, { orderId })
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}