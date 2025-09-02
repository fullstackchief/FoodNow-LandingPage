/**
 * Client-side Supabase Configuration
 * ==================================
 * This file provides client-side Supabase client with minimal privileges
 * Only for client-side operations like authentication and public data access
 */

import { createClient } from '@supabase/supabase-js'
import { Database } from './database.types'

// Client-safe environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing client-side Supabase environment variables')
}

/**
 * Client-side Supabase instance
 * Limited to anonymous access and authenticated user's own data
 */
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
})

/**
 * Typed Supabase wrapper to avoid 'never' type issues
 * Use this for all database operations to bypass strict typing temporarily
 */
export const typedSupabase = supabase as any

// Helper function to handle Supabase errors
export function handleSupabaseError(error: unknown) {
  console.error('Supabase client error:', error)
  
  if (error && typeof error === 'object' && 'message' in error) {
    return (error as { message: string }).message
  }
  
  if (error && typeof error === 'object' && 'error_description' in error) {
    return (error as { error_description: string }).error_description
  }
  
  return 'An unexpected error occurred'
}

/**
 * Client-side auth helpers
 * Limited to user's own authentication and data
 */
export const supabaseAuth = {
  signUp: async (email: string, password: string, metadata?: Record<string, unknown>) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata
      }
    })
    
    if (error) throw new Error(handleSupabaseError(error))
    return data
  },

  signIn: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    
    if (error) throw new Error(handleSupabaseError(error))
    return data
  },

  signOut: async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw new Error(handleSupabaseError(error))
  },

  resetPassword: async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`
    })
    
    if (error) throw new Error(handleSupabaseError(error))
  },

  updatePassword: async (password: string) => {
    const { error } = await supabase.auth.updateUser({ password })
    if (error) throw new Error(handleSupabaseError(error))
  },

  getUser: () => supabase.auth.getUser(),
  getSession: () => supabase.auth.getSession()
}