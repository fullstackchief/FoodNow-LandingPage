/**
 * Authentication Logout API Route
 * ===============================
 * Handles user logout with session cleanup
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase-client'
import { prodLog } from '@/lib/logger'
import { getClientIP } from '@/lib/security'
import { validateSession, clearAllSessionCookies } from '@/lib/cookies'

export async function POST(request: NextRequest) {
  try {
    const clientIP = getClientIP(request)
    
    // Validate session from cookie
    const sessionData = await validateSession(request)
    
    if (sessionData) {
      prodLog.info('API logout initiated', { 
        userId: sessionData.userId,
        clientIP,
        action: 'api_logout_attempt'
      })

      // Optional: Update last_logout in database
      await (supabase
        .from('users') as any)
        .update({ 
          last_logout_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', sessionData.userId)
    }

    // Sign out with Supabase (if there's still a Supabase session)
    await supabase.auth.signOut()

    prodLog.info('API logout successful', { 
      userId: sessionData?.userId,
      clientIP,
      action: 'api_logout_success'
    })

    // Create response
    const response = NextResponse.json({
      success: true,
      message: 'Successfully logged out'
    })

    // Clear all session cookies
    clearAllSessionCookies(response)

    // Add security headers
    response.headers.set('X-Content-Type-Options', 'nosniff')
    response.headers.set('X-Frame-Options', 'DENY')
    response.headers.set('X-XSS-Protection', '1; mode=block')

    return response

  } catch (error) {
    prodLog.error('API logout exception occurred', error, { 
      clientIP: getClientIP(request),
      action: 'api_logout_exception',
      errorType: 'unexpected_error'
    })

    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: 'An unexpected error occurred during logout.'
      },
      { status: 500 }
    )
  }
}

// Handle unsupported methods
export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  )
}

export async function PUT() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  )
}

export async function DELETE() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  )
}