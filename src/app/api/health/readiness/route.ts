import { NextResponse } from 'next/server'
import { supabaseServerClient } from '@/lib/supabase-server'

/**
 * Readiness Probe Endpoint
 * =======================
 * Checks if the application is ready to serve traffic
 * Used by load balancers to determine if instance should receive requests
 * Essential for zero-downtime deployments in Lagos operations
 */

export async function GET() {
  try {
    // Check if critical services are ready
    const checks = await Promise.allSettled([
      // Database connectivity check
      supabaseServerClient
        .from('restaurants')
        .select('count')
        .limit(1),
      
      // Auth service check
      supabaseServerClient.auth.getUser()
    ])

    // Analyze results
    const dbResult = checks[0]
    const authResult = checks[1]
    
    const isReady = dbResult.status === 'fulfilled' && 
                   authResult.status === 'fulfilled'

    if (isReady) {
      return NextResponse.json({
        status: 'ready',
        timestamp: new Date().toISOString(),
        service: 'foodnow-api',
        checks: {
          database: 'connected',
          auth: 'available'
        }
      }, { status: 200 })
    } else {
      return NextResponse.json({
        status: 'not_ready',
        timestamp: new Date().toISOString(),
        service: 'foodnow-api',
        checks: {
          database: dbResult.status === 'fulfilled' ? 'connected' : 'failed',
          auth: authResult.status === 'fulfilled' ? 'available' : 'failed'
        },
        errors: [
          ...(dbResult.status === 'rejected' ? [`Database: ${dbResult.reason}`] : []),
          ...(authResult.status === 'rejected' ? [`Auth: ${authResult.reason}`] : [])
        ]
      }, { status: 503 })
    }

  } catch (error) {
    return NextResponse.json({
      status: 'not_ready',
      timestamp: new Date().toISOString(),
      service: 'foodnow-api',
      error: error instanceof Error ? error.message : 'Readiness check failed'
    }, { status: 503 })
  }
}

export async function HEAD() {
  try {
    // Simple connectivity check for HEAD requests
    const { error } = await supabaseServerClient
      .from('restaurants')
      .select('count')
      .limit(1)
    
    return new NextResponse(null, { 
      status: error ? 503 : 200
    })
  } catch {
    return new NextResponse(null, { status: 503 })
  }
}