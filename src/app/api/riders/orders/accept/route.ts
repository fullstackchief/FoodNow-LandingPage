import { NextRequest, NextResponse } from 'next/server'
import { supabaseServerClient } from '@/lib/supabase-server'
import { devLog, prodLog } from '@/lib/logger'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { orderId, riderId } = body

    if (!orderId || !riderId) {
      return NextResponse.json({ 
        error: 'Order ID and Rider ID are required' 
      }, { status: 400 })
    }

    devLog.info('Rider accepting order', { orderId, riderId })

    // Check if order is still available
    const { data: orderCheck, error: checkError } = await supabaseServerClient
      .from('orders')
      .select('id, status, rider_id')
      .eq('id', orderId)
      .single()

    if (checkError) {
      prodLog.error('Failed to check order availability', checkError, { orderId, riderId })
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    if ((orderCheck as any).status !== 'confirmed' || (orderCheck as any).rider_id) {
      return NextResponse.json({ 
        error: 'Order is no longer available' 
      }, { status: 409 })
    }

    // Assign rider to order
    const { data: updatedOrder, error: updateError } = await (supabaseServerClient
      .from('orders') as any)
      .update({
        rider_id: riderId,
        status: 'rider_assigned',
        rider_assigned_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      } as any)
      .eq('id', orderId)
      .select(`
        id,
        order_number,
        total,
        delivery_info,
        restaurants!inner(
          name,
          address,
          phone_number
        )
      `)
      .single()

    if (updateError) {
      prodLog.error('Failed to assign rider to order', updateError, { orderId, riderId })
      return NextResponse.json({ error: 'Failed to accept order' }, { status: 500 })
    }

    // Add tracking update
    const trackingUpdate = {
      status: 'rider_assigned',
      timestamp: new Date().toISOString(),
      message: 'Rider has been assigned to your order',
      rider_id: riderId
    }

    const { error: trackingError } = await (supabaseServerClient
      .from('orders') as any)
      .update({
        tracking_updates: (supabaseServerClient as any).sql`tracking_updates || ${JSON.stringify([trackingUpdate])}`
      } as any)
      .eq('id', orderId)

    if (trackingError) {
      devLog.warn('Failed to add tracking update', trackingError, { orderId, riderId })
    }

    prodLog.info('Order accepted by rider successfully', {
      orderId,
      riderId,
      orderNumber: (updatedOrder as any).order_number,
      restaurant: (updatedOrder as any).restaurants.name
    })

    return NextResponse.json({ 
      success: true,
      order: updatedOrder,
      message: 'Order accepted successfully',
      assignedRiderId: riderId
    })

  } catch (error) {
    prodLog.error('Exception in POST /api/riders/orders/accept', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}