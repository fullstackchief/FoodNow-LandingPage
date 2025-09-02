/**
 * Server-only Supabase Client Configuration
 * ========================================
 * This file provides server-side Supabase clients with service role access
 * IMPORTANT: This file should NEVER be imported on the client side
 */

import { createClient } from '@supabase/supabase-js'
import { Database } from './database.types'

// Server-only environment variables - these should NOT be NEXT_PUBLIC_*
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable')
}

if (!supabaseAnonKey) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable')  
}

// Service key is optional - we'll fall back to anon key if not available
const effectiveKey = supabaseServiceKey || supabaseAnonKey
const isServiceRole = !!supabaseServiceKey

if (!supabaseServiceKey) {
  console.warn('⚠️  SUPABASE_SERVICE_ROLE_KEY not found - using anon key (RLS policies will apply)')
}

/**
 * Server Client - Uses service role if available, falls back to anon key
 * When using anon key, RLS policies will apply
 */
export const supabaseServerClient = createClient<Database>(supabaseUrl, effectiveKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
})

// Export metadata about the client configuration
export const serverClientInfo = {
  isServiceRole,
  keyType: isServiceRole ? 'service_role' : 'anon',
  hasRLSBypass: isServiceRole
}

// Typed wrapper for server client to avoid 'never' type issues
export const typedSupabaseServerClient = supabaseServerClient as any

/**
 * Anonymous Client for server-side operations
 * Limited to public access and authenticated user data
 */
export const supabaseAnonClient = createClient<Database>(
  supabaseUrl, 
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// Helper function to handle Supabase errors
export function handleSupabaseError(error: unknown) {
  console.error('Supabase server error:', error)
  
  if (error && typeof error === 'object' && 'message' in error) {
    return (error as { message: string }).message
  }
  
  if (error && typeof error === 'object' && 'error_description' in error) {
    return (error as { error_description: string }).error_description
  }
  
  return 'An unexpected error occurred'
}

/**
 * Server-side auth helpers using service role client
 */
export const supabaseServerAuth = {
  // Get user by ID (admin operation)
  getUserById: async (userId: string) => {
    const { data, error } = await typedSupabaseServerClient
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()
    
    if (error) throw new Error(handleSupabaseError(error))
    return data
  },

  // Get user by email (admin operation)
  getUserByEmail: async (email: string) => {
    const { data, error } = await typedSupabaseServerClient
      .from('users')
      .select('*')
      .eq('email', email)
      .single()
    
    if (error) throw new Error(handleSupabaseError(error))
    return data
  },

  // Update user (admin operation)
  updateUser: async (userId: string, updates: Record<string, any>) => {
    const { data, error } = await typedSupabaseServerClient
      .from('users')
      .update(updates as any)
      .eq('id', userId)
      .select()
      .single()
    
    if (error) throw new Error(handleSupabaseError(error))
    return data
  },

  // Create user (admin operation)
  createUser: async (userData: Record<string, any>) => {
    const { data, error } = await typedSupabaseServerClient
      .from('users')
      .insert(userData as any)
      .select()
      .single()
    
    if (error) throw new Error(handleSupabaseError(error))
    return data
  },

  // Delete user (admin operation)
  deleteUser: async (userId: string) => {
    const { error } = await typedSupabaseServerClient
      .from('users')
      .delete()
      .eq('id', userId)
    
    if (error) throw new Error(handleSupabaseError(error))
  },

  // Verify user email (admin operation)
  verifyUserEmail: async (userId: string) => {
    const { data, error } = await typedSupabaseServerClient
      .from('users')
      .update({
        is_verified: true,
        verification_completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      } as any)
      .eq('id', userId)
      .select()
      .single()
    
    if (error) throw new Error(handleSupabaseError(error))
    return data
  }
}