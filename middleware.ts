import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { applySecurityHeaders, getClientIP, logSecurityEvent, parseUserAgent } from './src/lib/security'
import { applyRateLimit, rateLimiters } from './src/lib/rateLimiter'
import { validateSession, validateAdminSession } from './src/lib/cookies'

// Server-side Supabase client for middleware (service role)
const createServerSupabaseClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

// Define protected admin routes
const ADMIN_ROUTES = [
  '/admin',
  '/admin/dashboard',
  '/admin/users',
  '/admin/restaurants',
  '/admin/analytics'
]

// Define API routes that need admin authentication
const ADMIN_API_ROUTES = [
  '/api/admin'
]

function isAdminRoute(pathname: string): boolean {
  return ADMIN_ROUTES.some(route => pathname.startsWith(route))
}

function isAdminAPIRoute(pathname: string): boolean {
  return ADMIN_API_ROUTES.some(route => pathname.startsWith(route))
}

async function verifyAdminAccess(request: NextRequest): Promise<boolean> {
  try {
    // First check for cookie-based admin session
    const adminSession = await validateAdminSession(request)
    if (adminSession) {
      return true
    }

    // Fall back to checking Authorization header for API compatibility
    const authorization = request.headers.get('authorization')
    if (!authorization) {
      return false
    }

    const supabase = createServerSupabaseClient()

    const token = authorization.replace('Bearer ', '')
    const { data: { user }, error } = await supabase.auth.getUser(token)
    
    if (error || !user) {
      return false
    }

    // Check if user has admin privileges in the database
    const { data: adminUser, error: adminError } = await supabase
      .from('admin_users')
      .select('is_active')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single()

    return !adminError && !!adminUser
    
  } catch {
    return false
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const ip = getClientIP(request)
  const userAgent = parseUserAgent(request.headers.get('user-agent'))
  
  // Skip middleware for certain paths
  if (
    pathname.startsWith('/_next') ||
    pathname.includes('.') // Skip for static files
  ) {
    return NextResponse.next()
  }

  // Apply general rate limiting to API routes
  if (pathname.startsWith('/api/')) {
    // Apply specific rate limiters based on route
    let rateLimitResult
    
    if (pathname.startsWith('/api/admin/auth')) {
      // Admin auth has its own rate limiting in the route
      rateLimitResult = null
    } else if (pathname.startsWith('/api/orders')) {
      // Order endpoints have their own rate limiting
      rateLimitResult = null
    } else if (pathname.startsWith('/api/webhooks')) {
      // Webhook endpoints have their own rate limiting
      rateLimitResult = null
    } else if (pathname.includes('/auth/') || pathname.includes('/login') || pathname.includes('/register')) {
      rateLimitResult = await applyRateLimit(request, rateLimiters.auth)
    } else if (pathname.includes('/search') || pathname.includes('/restaurants')) {
      rateLimitResult = await applyRateLimit(request, rateLimiters.search)
    } else {
      // General API rate limiting
      rateLimitResult = await applyRateLimit(request, rateLimiters.api)
    }

    if (rateLimitResult) {
      logSecurityEvent('api_rate_limited', {
        path: pathname,
        ip,
        userAgent: userAgent.browser
      }, request)
      return rateLimitResult
    }
  }

  // Security checks for admin routes
  if (isAdminRoute(pathname) || isAdminAPIRoute(pathname)) {
    // Block bots from admin areas
    if (userAgent.isBot) {
      logSecurityEvent('admin_bot_blocked', { 
        ip, 
        userAgent: userAgent.browser, 
        path: pathname 
      }, request)
      
      return new NextResponse('Forbidden', { status: 403 })
    }
    
    // Log admin access attempts
    logSecurityEvent('admin_access_attempt', {
      ip,
      userAgent: userAgent.browser,
      path: pathname
    }, request)
    
    const isAuthorized = await verifyAdminAccess(request)
    
    if (!isAuthorized) {
      // Log unauthorized access attempts
      logSecurityEvent('admin_unauthorized_access', {
        ip,
        userAgent: userAgent.browser,
        path: pathname
      }, request)
      
      // For API routes, return 401 with security headers
      if (pathname.startsWith('/api/')) {
        const response = NextResponse.json(
          { error: 'Unauthorized - Admin privileges required' },
          { status: 401 }
        )
        return applySecurityHeaders(response)
      }
      
      // For page routes, redirect to login
      return NextResponse.redirect(new URL('/auth/login', request.url))
    } else {
      // Log successful admin authentication
      logSecurityEvent('admin_access_granted', {
        ip,
        userAgent: userAgent.browser,
        path: pathname
      }, request)
    }
  }

  // Apply security headers to all responses
  const response = NextResponse.next()
  return applySecurityHeaders(response)
}

// Configure which paths the middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}