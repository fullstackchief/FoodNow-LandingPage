import { NextRequest, NextResponse } from 'next/server'
import { supabaseServerClient } from '@/lib/supabase-server'
import { devLog, prodLog } from '@/lib/logger'

// Update rider location
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { riderId, latitude, longitude, accuracy, orderId } = body

    if (!riderId || !latitude || !longitude) {
      return NextResponse.json({ 
        error: 'Rider ID, latitude, and longitude are required' 
      }, { status: 400 })
    }

    devLog.info('Updating rider location', { 
      riderId, 
      latitude, 
      longitude, 
      accuracy,
      orderId 
    })

    // Validate location coordinates
    const lat = parseFloat(latitude)
    const lng = parseFloat(longitude)
    
    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return NextResponse.json({ 
        error: 'Invalid coordinates' 
      }, { status: 400 })
    }

    // Update rider's current location in profile
    const locationData = {
      latitude: lat,
      longitude: lng,
      updated_at: new Date().toISOString()
    }

    const { error: profileError } = await supabaseServerClient
      .from('rider_profiles')
      .update({
        current_location: locationData,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', riderId)

    if (profileError) {
      prodLog.error('Failed to update rider location in profile', profileError, { riderId })
      return NextResponse.json({ error: 'Failed to update location' }, { status: 500 })
    }

    // Log location to history
    const { error: historyError } = await supabaseServerClient
      .from('rider_location_history')
      .insert({
        rider_id: riderId,
        latitude: lat,
        longitude: lng,
        accuracy: accuracy ? parseInt(accuracy) : null,
        order_id: orderId || null,
        recorded_at: new Date().toISOString()
      })

    if (historyError) {
      devLog.warn('Failed to log location to history', historyError, { riderId })
    }

    devLog.info('Rider location updated successfully', { riderId, latitude: lat, longitude: lng })

    return NextResponse.json({ 
      success: true,
      message: 'Location updated successfully',
      location: locationData
    })

  } catch (error) {
    prodLog.error('Exception in POST /api/riders/location', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Get rider location
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const riderId = searchParams.get('riderId')

    if (!riderId) {
      return NextResponse.json({ error: 'Rider ID required' }, { status: 400 })
    }

    const { data: riderProfile, error } = await supabaseServerClient
      .from('rider_profiles')
      .select('current_location, updated_at')
      .eq('user_id', riderId)
      .single()

    if (error) {
      prodLog.error('Failed to get rider location', error, { riderId })
      return NextResponse.json({ error: 'Rider not found' }, { status: 404 })
    }

    return NextResponse.json({ 
      location: riderProfile.current_location,
      lastUpdated: riderProfile.updated_at
    })

  } catch (error) {
    prodLog.error('Exception in GET /api/riders/location', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}