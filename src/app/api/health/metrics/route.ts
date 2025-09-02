import { NextResponse } from 'next/server'
import { supabaseServerClient } from '@/lib/supabase-server'

/**
 * Metrics Endpoint
 * ===============
 * Provides system metrics for monitoring and alerting
 * Essential for Lagos food delivery operations monitoring
 */

interface Metrics {
  timestamp: string
  system: {
    uptime: number
    memory: NodeJS.MemoryUsage
    environment: string
    nodeVersion: string
  }
  application: {
    version: string
    totalRequests?: number
    activeConnections?: number
  }
  database: {
    status: 'connected' | 'disconnected'
    responseTime?: number
    connectionCount?: number
  }
  business?: {
    activeRestaurants?: number
    totalOrders?: number
    systemErrors?: number
  }
}

// Simple in-memory counters (in production, use Redis or proper metrics store)
let requestCount = 0
let startTime = Date.now()

export async function GET() {
  const metricsStart = Date.now()
  requestCount++

  try {
    const metrics: Metrics = {
      timestamp: new Date().toISOString(),
      system: {
        uptime: Date.now() - startTime,
        memory: process.memoryUsage(),
        environment: process.env.NODE_ENV || 'development',
        nodeVersion: process.version
      },
      application: {
        version: process.env.npm_package_version || '1.0.0',
        totalRequests: requestCount
      },
      database: {
        status: 'disconnected',
        responseTime: 0
      }
    }

    // Database metrics
    try {
      const dbStart = Date.now()
      const { error: dbError, count: _count } = await supabaseServerClient
        .from('restaurants')
        .select('*', { count: 'exact', head: true })
      
      const dbResponseTime = Date.now() - dbStart
      
      metrics.database = {
        status: dbError ? 'disconnected' : 'connected',
        responseTime: dbResponseTime
      }

      // Business metrics (only if database is available)
      if (!dbError) {
        try {
          const businessMetrics = await Promise.allSettled([
            // Active restaurants
            supabaseServerClient
              .from('restaurants')
              .select('*', { count: 'exact', head: true })
              .eq('is_open', true),
            
            // Total orders (last 24 hours)
            supabaseServerClient
              .from('orders')
              .select('*', { count: 'exact', head: true })
              .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
          ])

          const [restaurantsResult, ordersResult] = businessMetrics

          metrics.business = {
            activeRestaurants: restaurantsResult.status === 'fulfilled' ? 
              restaurantsResult.value.count || 0 : undefined,
            totalOrders: ordersResult.status === 'fulfilled' ? 
              ordersResult.value.count || 0 : undefined
          }
        } catch (error) {
          // Business metrics are optional, don't fail the entire request
          console.warn('Failed to fetch business metrics:', error)
        }
      }
    } catch (error) {
      metrics.database.status = 'disconnected'
      console.error('Database metrics failed:', error)
    }

    // Add deployment info if available
    if (process.env.VERCEL_GIT_COMMIT_SHA) {
      metrics.application = {
        ...metrics.application,
        ...{
          commit: process.env.VERCEL_GIT_COMMIT_SHA,
          region: process.env.VERCEL_REGION,
          deployedAt: process.env.VERCEL_GIT_COMMIT_DATE
        }
      }
    }

    const responseTime = Date.now() - metricsStart
    
    return NextResponse.json({
      ...metrics,
      responseTime
    }, {
      status: 200,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })

  } catch (error) {
    return NextResponse.json({
      error: 'Failed to collect metrics',
      timestamp: new Date().toISOString(),
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// Reset metrics endpoint (for testing or maintenance)
export async function DELETE() {
  requestCount = 0
  startTime = Date.now()
  
  return NextResponse.json({
    message: 'Metrics reset successfully',
    timestamp: new Date().toISOString()
  })
}