import { NextResponse } from 'next/server'

/**
 * Liveness Probe Endpoint
 * ======================
 * Simple endpoint for load balancers and monitoring systems
 * Returns 200 if the application is running
 * Used by Kubernetes liveness probes or similar systems
 */

export async function GET() {
  return NextResponse.json({
    status: 'alive',
    timestamp: new Date().toISOString(),
    service: 'foodnow-api'
  }, { status: 200 })
}

export async function HEAD() {
  return new NextResponse(null, { status: 200 })
}