import { NextResponse } from 'next/server'
import { getSystemWideSurgeStatus } from '@/lib/dynamicPricing'
import { prodLog } from '@/lib/logger'

export async function GET() {
  try {
    const surgeStatus = await getSystemWideSurgeStatus()
    return NextResponse.json(surgeStatus)
  } catch (error) {
    prodLog.error('Failed to get surge status', error)
    return NextResponse.json(
      { error: 'Failed to fetch surge status' },
      { status: 500 }
    )
  }
}