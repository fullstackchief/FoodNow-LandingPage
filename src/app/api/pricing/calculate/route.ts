import { NextRequest, NextResponse } from 'next/server'
import { calculateOrderPricing } from '@/lib/dynamicPricing'
import { prodLog } from '@/lib/logger'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { restaurantId, zoneId, orderValue, deliveryType } = body

    if (!restaurantId || !zoneId || !orderValue) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      )
    }

    const pricing = await calculateOrderPricing(
      restaurantId,
      zoneId,
      orderValue,
      deliveryType || 'delivery'
    )

    prodLog.info('Dynamic pricing calculated', {
      restaurantId,
      zoneId,
      orderValue,
      deliveryType,
      surgeActive: pricing.surgeInfo.isActive,
      multiplier: pricing.surgeInfo.multiplier
    })

    return NextResponse.json(pricing)

  } catch (error) {
    prodLog.error('Dynamic pricing API error', error, {
      action: 'calculate_dynamic_pricing'
    })
    
    return NextResponse.json(
      { error: 'Pricing calculation failed' },
      { status: 500 }
    )
  }
}