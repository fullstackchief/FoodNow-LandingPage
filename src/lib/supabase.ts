/**
 * Supabase Client Compatibility Layer
 * ====================================
 * Last Modified: ${new Date().toISOString()}
 * 
 * This file ensures backward compatibility after migration to separate
 * client/server Supabase implementations. It provides a unified interface
 * for components that previously imported from supabase.ts
 * 
 * IMPORTANT: All new code should import directly from:
 * - @/lib/supabase-client for client-side usage
 * - @/lib/supabase-server for server-side/API usage
 */

// Import the client implementation
import { 
  supabase as supabaseClient,
  typedSupabase,
  handleSupabaseError,
  supabaseAuth
} from './supabase-client'

// Re-export the main client as both named and default export
export const supabase = supabaseClient
export default supabaseClient

// Re-export all utilities and helpers
export { 
  typedSupabase,
  handleSupabaseError,
  supabaseAuth
}

// Re-export types if needed
export type { Database } from './database.types'

// Add a unique identifier to force Turbopack to recognize this module
// This comment changes on each save to bust the HMR cache
// Cache Buster: 2025-09-02T14:24:01.000Z