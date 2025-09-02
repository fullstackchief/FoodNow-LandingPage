import { NextRequest, NextResponse } from 'next/server'
import { dynamicPricing } from '@/lib/dynamicPricing'
import { prodLog } from '@/lib/logger'

export async function GET() {
  try {
    const config = (dynamicPricing as any).config
    return NextResponse.json(config)
  } catch (error) {
    prodLog.error('Failed to get surge config', error)
    return NextResponse.json(
      { error: 'Failed to fetch surge configuration' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const newConfig = await request.json()
    
    await dynamicPricing.updateSurgeConfiguration(newConfig)
    
    prodLog.info('Surge configuration updated by admin', {
      changes: newConfig,
      action: 'update_surge_config'
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    prodLog.error('Failed to update surge config', error)
    return NextResponse.json(
      { error: 'Failed to update surge configuration' },
      { status: 500 }
    )
  }
}