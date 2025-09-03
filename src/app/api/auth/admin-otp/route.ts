import { NextRequest, NextResponse } from 'next/server'
import { supabaseServerClient } from '@/lib/supabase-server'
import { setSessionCookie } from '@/lib/cookies'

/**
 * Admin OTP Authentication Handler
 * ==============================
 * Enhanced admin login with email OTP verification
 * Validates admin credentials before triggering OTP
 */

export async function POST(request: NextRequest) {
  try {
    const { email, password, action } = await request.json()

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Email is required' },
        { status: 400 }
      )
    }

    // Step 1: Verify Admin Credentials
    if (action === 'verify_credentials') {
      if (!password || typeof password !== 'string') {
        return NextResponse.json(
          { success: false, error: 'Password is required' },
          { status: 400 }
        )
      }

      // Verify admin credentials using Supabase Auth
      const { data: authData, error: authError } = await supabaseServerClient.auth.signInWithPassword({
        email,
        password
      })

      if (authError) {
        return NextResponse.json(
          { success: false, error: 'Invalid admin credentials' },
          { status: 401 }
        )
      }

      // Check if user has admin role
      const userRole = authData.user?.user_metadata?.role
      if (!userRole || !['admin', 'super_admin'].includes(userRole)) {
        // Sign out the user since they're not an admin
        await supabaseServerClient.auth.signOut()
        return NextResponse.json(
          { success: false, error: 'Access denied. Admin privileges required.' },
          { status: 403 }
        )
      }

      // Sign out temporarily - user will authenticate via OTP
      await supabaseServerClient.auth.signOut()

      // Send OTP email for admin verification
      const { error: otpError } = await supabaseServerClient.auth.signInWithOtp({
        email: email,
        options: {
          shouldCreateUser: false // Don't create new user, just send OTP
        }
      })

      if (otpError) {
        return NextResponse.json(
          { success: false, error: 'Failed to send OTP email' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        message: 'Admin credentials verified. OTP sent to your email.',
        data: { 
          email, 
          role: userRole,
          requiresOTP: true 
        }
      })
    }

    // Step 2: Complete OTP Authentication
    if (action === 'complete_otp_login') {
      const { otpToken } = await request.json()
      
      if (!otpToken || typeof otpToken !== 'string') {
        return NextResponse.json(
          { success: false, error: 'OTP token is required' },
          { status: 400 }
        )
      }

      // Verify OTP with Supabase
      const { data: otpData, error: otpError } = await supabaseServerClient.auth.verifyOtp({
        email,
        token: otpToken,
        type: 'email'
      })

      if (otpError) {
        return NextResponse.json(
          { success: false, error: 'Invalid or expired OTP code' },
          { status: 401 }
        )
      }

      // Double-check admin role after OTP verification
      const userRole = otpData.user?.user_metadata?.role
      if (!userRole || !['admin', 'super_admin'].includes(userRole)) {
        await supabaseServerClient.auth.signOut()
        return NextResponse.json(
          { success: false, error: 'Access denied. Admin privileges required.' },
          { status: 403 }
        )
      }

      // Create secure session
      const sessionData = {
        userId: otpData.user?.id || '',
        email: otpData.user?.email || '',
        role: userRole,
        isVerified: true
      }

      const response = NextResponse.json({
        success: true,
        message: 'Admin OTP authentication successful',
        data: {
          user: {
            id: otpData.user?.id,
            email: otpData.user?.email,
            role: userRole,
            verified: true
          }
        }
      })

      // Set secure session cookie
      await setSessionCookie(response, sessionData, false) // Admin sessions should not be "remember me"

      return response
    }

    return NextResponse.json(
      { success: false, error: 'Invalid action. Must be "verify_credentials" or "complete_otp_login"' },
      { status: 400 }
    )

  } catch (error) {
    console.error('Admin OTP authentication error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Only POST allowed for security
export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  )
}