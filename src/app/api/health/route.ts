import { NextRequest, NextResponse } from 'next/server'
import { supabaseServerClient } from '@/lib/supabase-server'

/**
 * Health Check API Endpoint
 * ========================
 * Provides comprehensive health status for monitoring and load balancers
 * Essential for Lagos food delivery operations and uptime monitoring
 */

interface HealthCheck {
  status: 'healthy' | 'unhealthy' | 'degraded'
  timestamp: string
  uptime: number
  version: string
  environment: string
  services: {
    database: ServiceHealth
    auth: ServiceHealth
    storage: ServiceHealth
    payment?: ServiceHealth
  }
  performance: {
    responseTime: number
    memoryUsage?: NodeJS.MemoryUsage
  }
  deployment: {
    commit?: string
    deployedAt?: string
    region: string
  }
}

interface ServiceHealth {
  status: 'up' | 'down' | 'slow'
  responseTime?: number
  lastChecked: string
  error?: string
}

// Store startup time
const startTime = Date.now()

export async function GET(_request: NextRequest) {
  const checkStart = Date.now()
  
  try {
    // Initialize health check response
    const healthCheck: HealthCheck = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: Date.now() - startTime,
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      services: {
        database: { status: 'up', lastChecked: new Date().toISOString() },
        auth: { status: 'up', lastChecked: new Date().toISOString() },
        storage: { status: 'up', lastChecked: new Date().toISOString() }
      },
      performance: {
        responseTime: 0,
        memoryUsage: process.memoryUsage()
      },
      deployment: {
        commit: process.env.VERCEL_GIT_COMMIT_SHA || 'local',
        deployedAt: process.env.VERCEL_GIT_COMMIT_DATE,
        region: process.env.VERCEL_REGION || 'local'
      }
    }

    // Check database connectivity
    try {
      const dbStart = Date.now()
      const { error: dbError } = await supabaseServerClient
        .from('restaurants')
        .select('count')
        .limit(1)
        .single()
      
      const dbResponseTime = Date.now() - dbStart
      
      if (dbError) {
        healthCheck.services.database = {
          status: 'down',
          responseTime: dbResponseTime,
          lastChecked: new Date().toISOString(),
          error: dbError.message
        }
        healthCheck.status = 'degraded'
      } else {
        healthCheck.services.database = {
          status: dbResponseTime > 1000 ? 'slow' : 'up',
          responseTime: dbResponseTime,
          lastChecked: new Date().toISOString()
        }
        
        if (dbResponseTime > 1000) {
          healthCheck.status = 'degraded'
        }
      }
    } catch (error) {
      healthCheck.services.database = {
        status: 'down',
        lastChecked: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown database error'
      }
      healthCheck.status = 'unhealthy'
    }

    // Check auth service
    try {
      const authStart = Date.now()
      const { error: authError } = await supabaseServerClient.auth.getUser()
      const authResponseTime = Date.now() - authStart
      
      healthCheck.services.auth = {
        status: authError ? 'down' : (authResponseTime > 500 ? 'slow' : 'up'),
        responseTime: authResponseTime,
        lastChecked: new Date().toISOString(),
        error: authError?.message
      }
      
      if (authError) {
        healthCheck.status = healthCheck.status === 'healthy' ? 'degraded' : healthCheck.status
      }
    } catch (error) {
      healthCheck.services.auth = {
        status: 'down',
        lastChecked: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Auth service error'
      }
      healthCheck.status = 'degraded'
    }

    // Check storage service
    try {
      const storageStart = Date.now()
      const { error: storageError } = await supabaseServerClient
        .storage
        .from('restaurants')
        .list('', { limit: 1 })
      
      const storageResponseTime = Date.now() - storageStart
      
      healthCheck.services.storage = {
        status: storageError ? 'down' : (storageResponseTime > 1000 ? 'slow' : 'up'),
        responseTime: storageResponseTime,
        lastChecked: new Date().toISOString(),
        error: storageError?.message
      }
      
      if (storageError) {
        healthCheck.status = healthCheck.status === 'healthy' ? 'degraded' : healthCheck.status
      }
    } catch (error) {
      healthCheck.services.storage = {
        status: 'down',
        lastChecked: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Storage service error'
      }
      healthCheck.status = 'degraded'
    }

    // Add payment service check if in production
    if (process.env.NODE_ENV === 'production' && process.env.PAYSTACK_SECRET_KEY) {
      try {
        const paymentStart = Date.now()
        const response = await fetch('https://api.paystack.co/bank', {
          headers: {
            Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          },
        })
        
        const paymentResponseTime = Date.now() - paymentStart
        
        healthCheck.services.payment = {
          status: response.ok ? (paymentResponseTime > 2000 ? 'slow' : 'up') : 'down',
          responseTime: paymentResponseTime,
          lastChecked: new Date().toISOString(),
          error: response.ok ? undefined : `HTTP ${response.status}`
        }
        
        if (!response.ok) {
          healthCheck.status = healthCheck.status === 'healthy' ? 'degraded' : healthCheck.status
        }
      } catch (error) {
        healthCheck.services.payment = {
          status: 'down',
          lastChecked: new Date().toISOString(),
          error: error instanceof Error ? error.message : 'Payment service error'
        }
        healthCheck.status = 'degraded'
      }
    }

    // Calculate total response time
    healthCheck.performance.responseTime = Date.now() - checkStart

    // Determine HTTP status code based on health
    const statusCode = healthCheck.status === 'healthy' ? 200 : 
                      healthCheck.status === 'degraded' ? 200 : 503

    return NextResponse.json(healthCheck, { status: statusCode })

  } catch (error) {
    const errorResponse: HealthCheck = {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      uptime: Date.now() - startTime,
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      services: {
        database: { status: 'down', lastChecked: new Date().toISOString() },
        auth: { status: 'down', lastChecked: new Date().toISOString() },
        storage: { status: 'down', lastChecked: new Date().toISOString() }
      },
      performance: {
        responseTime: Date.now() - checkStart,
      },
      deployment: {
        commit: process.env.VERCEL_GIT_COMMIT_SHA || 'local',
        region: process.env.VERCEL_REGION || 'local'
      }
    }

    return NextResponse.json({
      ...errorResponse,
      error: error instanceof Error ? error.message : 'Health check failed'
    }, { status: 503 })
  }
}