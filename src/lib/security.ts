/**
 * Security utility functions for FoodNow application
 */

import { NextRequest, NextResponse } from 'next/server'
import { prodLog } from './logger'

// Security configuration
export const SECURITY_CONFIG = {
  // Rate limiting
  rateLimit: {
    requests: parseInt(process.env.RATE_LIMIT_REQUESTS_PER_MINUTE || '60'),
    windowMs: 60 * 1000, // 1 minute
  },
  
  // Session configuration
  session: {
    timeout: parseInt(process.env.SESSION_TIMEOUT || '86400'), // 24 hours
    adminTimeout: parseInt(process.env.ADMIN_SESSION_TIMEOUT || '3600'), // 1 hour
  },
  
  // Security headers for manual setting
  headers: {
    security: {
      'X-Frame-Options': 'DENY',
      'X-Content-Type-Options': 'nosniff',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'X-Permitted-Cross-Domain-Policies': 'none',
      'X-DNS-Prefetch-Control': 'off',
    },
    api: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    }
  }
}

/**
 * Applies security headers to API responses
 */
export function applySecurityHeaders(response: NextResponse): NextResponse {
  // Apply security headers
  Object.entries(SECURITY_CONFIG.headers.security).forEach(([key, value]) => {
    response.headers.set(key, value)
  })
  
  // Apply API-specific headers
  Object.entries(SECURITY_CONFIG.headers.api).forEach(([key, value]) => {
    response.headers.set(key, value)
  })
  
  return response
}

/**
 * IP address extraction with security considerations
 */
export function getClientIP(request: NextRequest): string {
  // Try various headers that might contain the real IP
  const forwardedFor = request.headers.get('x-forwarded-for')
  const realIP = request.headers.get('x-real-ip')
  const cfConnectingIP = request.headers.get('cf-connecting-ip') // Cloudflare
  const remoteAddr = request.headers.get('remote-addr')
  
  // Parse forwarded-for header (comma-separated list)
  if (forwardedFor) {
    const ips = forwardedFor.split(',').map(ip => ip.trim())
    // Return the first (original client) IP
    const clientIP = ips[0]
    if (isValidIP(clientIP)) {
      return clientIP
    }
  }
  
  // Try other headers
  if (realIP && isValidIP(realIP)) return realIP
  if (cfConnectingIP && isValidIP(cfConnectingIP)) return cfConnectingIP
  if (remoteAddr && isValidIP(remoteAddr)) return remoteAddr
  
  // Fallback
  return 'unknown'
}

/**
 * Validates if a string is a valid IP address
 */
function isValidIP(ip: string): boolean {
  // Basic validation for IPv4 and IPv6
  const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/
  const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$|^::1$|^::$/
  
  return ipv4Regex.test(ip) || ipv6Regex.test(ip)
}

/**
 * User Agent parsing for security logging
 */
export function parseUserAgent(userAgent: string | null): {
  browser: string
  os: string
  device: string
  isBot: boolean
} {
  if (!userAgent) {
    return { browser: 'unknown', os: 'unknown', device: 'unknown', isBot: false }
  }
  
  // Simple user agent parsing (in production, consider using a library like ua-parser-js)
  const ua = userAgent.toLowerCase()
  
  // Detect bots
  const botPatterns = ['bot', 'crawler', 'spider', 'scraper', 'curl', 'wget', 'python']
  const isBot = botPatterns.some(pattern => ua.includes(pattern))
  
  // Basic browser detection
  let browser = 'unknown'
  if (ua.includes('chrome')) browser = 'chrome'
  else if (ua.includes('firefox')) browser = 'firefox'
  else if (ua.includes('safari')) browser = 'safari'
  else if (ua.includes('edge')) browser = 'edge'
  else if (ua.includes('opera')) browser = 'opera'
  
  // Basic OS detection
  let os = 'unknown'
  if (ua.includes('windows')) os = 'windows'
  else if (ua.includes('mac')) os = 'macos'
  else if (ua.includes('linux')) os = 'linux'
  else if (ua.includes('android')) os = 'android'
  else if (ua.includes('ios')) os = 'ios'
  
  // Basic device detection
  let device = 'desktop'
  if (ua.includes('mobile')) device = 'mobile'
  else if (ua.includes('tablet')) device = 'tablet'
  
  return { browser, os, device, isBot }
}

/**
 * Security event logging
 */
export function logSecurityEvent(
  event: string,
  details: Record<string, any>,
  request?: NextRequest
) {
  const logData: Record<string, any> = {
    event,
    ...details,
    timestamp: new Date().toISOString(),
  }
  
  if (request) {
    logData.ip = getClientIP(request)
    logData.userAgent = parseUserAgent(request.headers.get('user-agent'))
    logData.url = request.url
    logData.method = request.method
  }
  
  prodLog.warn(`Security Event: ${event}`, logData)
}

/**
 * Content Security Policy nonce generator
 */
export function generateNonce(): string {
  // Generate a random nonce for CSP
  return Buffer.from(crypto.getRandomValues(new Uint8Array(16))).toString('base64')
}

/**
 * CSRF token generation and validation
 */
export class CSRFProtection {
  private static tokens = new Map<string, { token: string; expires: number }>()
  
  static generate(sessionId: string): string {
    const token = Buffer.from(crypto.getRandomValues(new Uint8Array(32))).toString('hex')
    const expires = Date.now() + (30 * 60 * 1000) // 30 minutes
    
    this.tokens.set(sessionId, { token, expires })
    
    // Clean up expired tokens
    this.cleanup()
    
    return token
  }
  
  static validate(sessionId: string, token: string): boolean {
    const stored = this.tokens.get(sessionId)
    
    if (!stored) return false
    if (Date.now() > stored.expires) {
      this.tokens.delete(sessionId)
      return false
    }
    
    return stored.token === token
  }
  
  private static cleanup() {
    const now = Date.now()
    for (const [sessionId, data] of this.tokens.entries()) {
      if (now > data.expires) {
        this.tokens.delete(sessionId)
      }
    }
  }
}

/**
 * Input sanitization helpers
 */
export const sanitize = {
  /**
   * Remove potentially dangerous HTML/script tags
   */
  html: (input: string): string => {
    return input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<[^>]+>/g, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+=/gi, '')
  },
  
  /**
   * Sanitize SQL-like input (basic protection)
   */
  sql: (input: string): string => {
    return input
      .replace(/['";\\]/g, '')
      .replace(/\b(DROP|DELETE|INSERT|UPDATE|SELECT|UNION|ALTER|CREATE)\b/gi, '')
  },
  
  /**
   * Sanitize file names
   */
  filename: (input: string): string => {
    return input
      .replace(/[^a-zA-Z0-9.-]/g, '_')
      .replace(/\.+/g, '.')
      .substring(0, 255)
  },
  
  /**
   * General purpose sanitization
   */
  general: (input: string): string => {
    return input
      .trim()
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // Control characters
      .substring(0, 1000) // Limit length
  }
}

/**
 * Security middleware factory
 */
export function createSecurityMiddleware(options: {
  rateLimit?: boolean
  csrfProtection?: boolean
  ipWhitelist?: string[]
}) {
  return async (request: NextRequest) => {
    const ip = getClientIP(request)
    
    // IP whitelist check
    if (options.ipWhitelist && options.ipWhitelist.length > 0) {
      if (!options.ipWhitelist.includes(ip)) {
        logSecurityEvent('ip_blocked', { ip, reason: 'not_whitelisted' }, request)
        return new NextResponse('Forbidden', { status: 403 })
      }
    }
    
    // Basic bot detection
    const userAgent = parseUserAgent(request.headers.get('user-agent'))
    if (userAgent.isBot && request.url.includes('/admin')) {
      logSecurityEvent('bot_blocked', { ip, userAgent: userAgent.browser }, request)
      return new NextResponse('Forbidden', { status: 403 })
    }
    
    return NextResponse.next()
  }
}