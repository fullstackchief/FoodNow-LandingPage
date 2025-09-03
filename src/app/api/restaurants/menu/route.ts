import { NextRequest, NextResponse } from 'next/server'
import { supabaseServerClient } from '@/lib/supabase-server'
import { devLog, prodLog } from '@/lib/logger'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const restaurantId = searchParams.get('restaurantId')

    if (!restaurantId) {
      return NextResponse.json({ error: 'Restaurant ID required' }, { status: 400 })
    }

    const { data: menuItems, error } = await supabaseServerClient
      .from('menu_items')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .order('created_at', { ascending: false })

    if (error) {
      prodLog.error('Failed to fetch restaurant menu', error, { restaurantId })
      return NextResponse.json({ error: 'Failed to fetch menu' }, { status: 500 })
    }

    return NextResponse.json({ menuItems: menuItems || [] })

  } catch (error) {
    prodLog.error('Exception in GET /api/restaurants/menu', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      restaurantId, 
      name, 
      description, 
      category, 
      price, 
      image_url,
      customization_options,
      preparation_time,
      is_available = true
    } = body

    if (!restaurantId || !name || !description || !category || !price) {
      return NextResponse.json({ 
        error: 'Missing required fields: restaurantId, name, description, category, price' 
      }, { status: 400 })
    }

    devLog.info('Creating new menu item', { restaurantId, name, category, price })

    const { data: newMenuItem, error } = await (supabaseServerClient
      .from('menu_items') as any)
      .insert({
        restaurant_id: restaurantId,
        name,
        description,
        category,
        price,
        image_url: image_url || '/images/food/default.jpg',
        customization_options: customization_options || [],
        preparation_time: preparation_time || 25,
        is_available,
        admin_approved: false, // Requires admin approval
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      } as any)
      .select()
      .single()

    if (error) {
      prodLog.error('Failed to create menu item', error, { restaurantId, name })
      return NextResponse.json({ error: 'Failed to create menu item' }, { status: 500 })
    }

    prodLog.info('Menu item created successfully', {
      restaurantId,
      menuItemId: (newMenuItem as any).id,
      name,
      price
    })

    return NextResponse.json({ 
      success: true,
      menuItem: newMenuItem,
      message: 'Menu item created and pending admin approval'
    })

  } catch (error) {
    prodLog.error('Exception in POST /api/restaurants/menu', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}