/**
 * Secure Cookie Management Utilities
 * ===================================
 * Handles httpOnly cookies for session management with proper security settings
 */

import { NextRequest, NextResponse } from 'next/server'
import { SignJWT, jwtVerify } from 'jose'
import { devLog, prodLog } from '@/lib/logger'

// Cookie configuration
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  path: '/',
}

// Session cookie names
export const COOKIE_NAMES = {
  SESSION: 'foodnow_session',
  ADMIN_SESSION: 'foodnow_admin_session',
  REMEMBER_ME: 'foodnow_remember_me',
  CSRF_TOKEN: 'foodnow_csrf',
} as const

// JWT secret - must be in environment variable
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || process.env.SESSION_SECRET
)

// Session durations
const SESSION_DURATION = {
  DEFAULT: 60 * 60 * 1000, // 1 hour
  REMEMBER_ME: 7 * 24 * 60 * 60 * 1000, // 7 days
  ADMIN: 30 * 60 * 1000, // 30 minutes (shorter for admin)
}

/**
 * Create a secure session token
 */
export async function createSessionToken(payload: any, expiresIn: number = SESSION_DURATION.DEFAULT): Promise<string> {
  try {
    const token = await new SignJWT(payload)
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime(Math.floor((Date.now() + expiresIn) / 1000))
      .sign(JWT_SECRET)
    
    return token
  } catch (error) {
    prodLog.error('Failed to create session token', error)
    throw new Error('Session token creation failed')
  }
}

/**
 * Verify and decode a session token
 */
export async function verifySessionToken(token: string): Promise<any> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    return payload
  } catch (error) {
    devLog.error('Failed to verify session token', error)
    return null
  }
}

/**
 * Set an httpOnly cookie
 */
export function setCookie(
  response: NextResponse,
  name: string,
  value: string,
  maxAge?: number
): NextResponse {
  const cookieOptions = {
    ...COOKIE_OPTIONS,
    maxAge: maxAge || SESSION_DURATION.DEFAULT / 1000, // Convert to seconds
  }

  response.cookies.set(name, value, cookieOptions)
  
  devLog.info('Cookie set', { name, maxAge: cookieOptions.maxAge })
  
  return response
}

/**
 * Get a cookie value from request
 */
export function getCookie(request: NextRequest, name: string): string | undefined {
  return request.cookies.get(name)?.value
}

/**
 * Delete a cookie
 */
export function deleteCookie(response: NextResponse, name: string): NextResponse {
  response.cookies.set(name, '', {
    ...COOKIE_OPTIONS,
    maxAge: 0,
  })
  
  devLog.info('Cookie deleted', { name })
  
  return response
}

/**
 * Set user session cookie
 */
export async function setSessionCookie(
  response: NextResponse,
  sessionData: {
    userId: string
    email: string
    role: string
    isVerified: boolean
  },
  rememberMe: boolean = false
): Promise<NextResponse> {
  const expiresIn = rememberMe ? SESSION_DURATION.REMEMBER_ME : SESSION_DURATION.DEFAULT
  const token = await createSessionToken(sessionData, expiresIn)
  
  return setCookie(
    response,
    COOKIE_NAMES.SESSION,
    token,
    expiresIn / 1000
  )
}

/**
 * Set admin session cookie with enhanced security
 */
export async function setAdminSessionCookie(
  response: NextResponse,
  adminData: {
    adminId: string
    email: string
    role: string
    permissions: any
    ipAddress: string
    userAgent: string
  }
): Promise<NextResponse> {
  const token = await createSessionToken(adminData, SESSION_DURATION.ADMIN)
  
  return setCookie(
    response,
    COOKIE_NAMES.ADMIN_SESSION,
    token,
    SESSION_DURATION.ADMIN / 1000
  )
}

/**
 * Validate session from request
 */
export async function validateSession(request: NextRequest): Promise<any> {
  const sessionToken = getCookie(request, COOKIE_NAMES.SESSION)
  
  if (!sessionToken) {
    return null
  }
  
  const sessionData = await verifySessionToken(sessionToken)
  
  if (!sessionData) {
    return null
  }
  
  // Check if session is expired
  if (sessionData.exp && sessionData.exp * 1000 < Date.now()) {
    devLog.info('Session expired', { userId: sessionData.userId })
    return null
  }
  
  return sessionData
}

/**
 * Validate admin session with additional checks
 */
export async function validateAdminSession(request: NextRequest): Promise<any> {
  const adminToken = getCookie(request, COOKIE_NAMES.ADMIN_SESSION)
  
  if (!adminToken) {
    return null
  }
  
  const adminData = await verifySessionToken(adminToken)
  
  if (!adminData) {
    return null
  }
  
  // Additional security checks for admin
  const clientIP = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip')
  const userAgent = request.headers.get('user-agent')
  
  // Verify IP and user agent match
  if (adminData.ipAddress !== clientIP || adminData.userAgent !== userAgent) {
    prodLog.warn('Admin session validation failed - IP or UA mismatch', {
      adminId: adminData.adminId,
      expectedIP: adminData.ipAddress,
      actualIP: clientIP,
    })
    return null
  }
  
  return adminData
}

/**
 * Clear all session cookies
 */
export function clearAllSessionCookies(response: NextResponse): NextResponse {
  deleteCookie(response, COOKIE_NAMES.SESSION)
  deleteCookie(response, COOKIE_NAMES.ADMIN_SESSION)
  deleteCookie(response, COOKIE_NAMES.REMEMBER_ME)
  deleteCookie(response, COOKIE_NAMES.CSRF_TOKEN)
  
  devLog.info('All session cookies cleared')
  
  return response
}

/**
 * Generate CSRF token
 */
export async function generateCSRFToken(): Promise<string> {
  const token = crypto.randomUUID()
  const signedToken = await createSessionToken({ csrf: token }, SESSION_DURATION.DEFAULT)
  return signedToken
}

/**
 * Validate CSRF token
 */
export async function validateCSRFToken(request: NextRequest, providedToken: string): Promise<boolean> {
  const cookieToken = getCookie(request, COOKIE_NAMES.CSRF_TOKEN)
  
  if (!cookieToken || !providedToken) {
    return false
  }
  
  const cookieData = await verifySessionToken(cookieToken)
  const providedData = await verifySessionToken(providedToken)
  
  if (!cookieData || !providedData) {
    return false
  }
  
  return cookieData.csrf === providedData.csrf
}