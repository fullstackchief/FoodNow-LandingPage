/**
 * SAFE LOGGING UTILITY
 * ===================
 * Bulletproof logging utility that works in all environments
 * Extracted to separate module to avoid circular dependencies
 */

// Safe logging utility - bulletproof implementation
export default function safeLog(message: any, level: 'log' | 'warn' | 'error' = 'log'): void {
  // Server-side: skip logging
  if (typeof window === 'undefined') return
  
  // Convert message to safe string
  let safeMessage: string
  try {
    safeMessage = typeof message === 'string' ? message : String(message)
  } catch {
    safeMessage = '[Unable to convert message to string]'
  }
  
  // Validate level
  const safeLevel = (level === 'warn' || level === 'error') ? level : 'log'
  
  // Attempt logging with multiple fallbacks
  try {
    if (window.console?.[safeLevel] && typeof window.console[safeLevel] === 'function') {
      window.console[safeLevel](safeMessage)
      return
    }
  } catch {}
  
  // Fallback 1: Try console.log
  try {
    if (window.console?.log && typeof window.console.log === 'function') {
      window.console.log(`[${safeLevel.toUpperCase()}] ${safeMessage}`)
      return
    }
  } catch {}
  
  // Fallback 2: Try direct console access
  try {
    const console = window.console
    if (console && console.log) {
      console.log(`[${safeLevel.toUpperCase()}] ${safeMessage}`)
    }
  } catch {}
  
  // If all fails, silently continue
}