'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase-client'
import { Loader2, CheckCircle } from 'lucide-react'
import { devLog, prodLog } from '@/lib/logger'

export default function AuthCallbackPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [error, setError] = useState('')
  const [status, setStatus] = useState<'processing' | 'creating-profile' | 'success' | 'error'>('processing')
  const [provider, setProvider] = useState<string>('')

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        devLog.info('OAuth callback initiated')
        
        // Get the session from the URL fragments (for OAuth)
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError) {
          prodLog.error('OAuth callback session error', sessionError)
          setError('Authentication session error. Please try signing in again.')
          setStatus('error')
          setTimeout(() => router.push('/auth/login'), 3000)
          return
        }

        if (!sessionData.session) {
          // Try to get session from URL hash (OAuth callback)
          const hashParams = new URLSearchParams(window.location.hash.substring(1))
          const accessToken = hashParams.get('access_token')
          const refreshToken = hashParams.get('refresh_token')
          
          if (accessToken) {
            devLog.info('Found OAuth tokens in URL hash, setting session')
            const { data, error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken || ''
            })
            
            if (error || !data.session) {
              prodLog.error('Failed to set OAuth session', error)
              setError('Failed to complete OAuth login. Please try again.')
              setStatus('error')
              setTimeout(() => router.push('/auth/login'), 3000)
              return
            }
            
            // Update session data for profile creation
            (sessionData as any).session = data.session
          } else {
            setError('No authentication session found. Please try signing in again.')
            setStatus('error')
            setTimeout(() => router.push('/auth/login'), 3000)
            return
          }
        }

        const session = sessionData.session!
        const user = session.user
        
        // Detect the OAuth provider
        const authProvider = user.app_metadata?.provider || 'unknown'
        setProvider(authProvider)
        
        devLog.info('OAuth callback processing', { 
          userId: user.id, 
          provider: authProvider,
          email: user.email 
        })

        // Check if user profile exists in database
        setStatus('creating-profile')
        const { data: existingProfile, error: profileError } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single()

        if (profileError && profileError.code === 'PGRST116') {
          // Profile doesn't exist - create one for OAuth users
          devLog.info('Creating OAuth user profile', { userId: user.id, provider: authProvider })
          
          const profileData = {
            id: user.id,
            email: user.email!,
            first_name: user.user_metadata?.full_name?.split(' ')[0] || 
                        user.user_metadata?.first_name || 
                        user.user_metadata?.name?.split(' ')[0] || 
                        user.email!.split('@')[0],
            last_name: user.user_metadata?.full_name?.split(' ').slice(1).join(' ') || 
                      user.user_metadata?.last_name || 
                      user.user_metadata?.name?.split(' ').slice(1).join(' ') || 
                      null,
            avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture || null,
            phone: user.user_metadata?.phone || null,
            is_verified: true, // OAuth users are considered verified
            user_role: 'customer', // Default role for OAuth users
            provider: authProvider,
            provider_id: user.user_metadata?.sub || user.id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }

          const { error: createError } = await (supabase
            .from('users') as any)
            .insert(profileData)

          if (createError) {
            prodLog.error('Failed to create OAuth user profile', createError, { 
              userId: user.id, 
              provider: authProvider 
            })
            // Continue anyway - profile creation will be handled by auth context
            devLog.warn('OAuth profile creation failed, will be handled by auth context', { userId: user.id })
          } else {
            devLog.info('OAuth user profile created successfully', { userId: user.id, provider: authProvider })
          }
        } else if (existingProfile) {
          devLog.info('Existing OAuth user profile found', { userId: user.id, provider: authProvider })
          
          // Update last login info
          await (supabase
            .from('users') as any)
            .update({ 
              updated_at: new Date().toISOString(),
              last_login_at: new Date().toISOString()
            })
            .eq('id', user.id)
        }

        setStatus('success')
        prodLog.info('OAuth callback completed successfully', { 
          userId: user.id, 
          provider: authProvider,
          email: user.email 
        })

        // Redirect to intended destination after a brief success display
        const redirectTo = searchParams.get('redirect') || '/'
        const finalRedirect = redirectTo === '/auth/login' ? '/' : redirectTo
        
        setTimeout(() => {
          devLog.info('Redirecting after OAuth success', { destination: finalRedirect })
          router.push(finalRedirect)
        }, 1500)
        
      } catch (error) {
        prodLog.error('OAuth callback handling error', error)
        setError('An unexpected error occurred during authentication. Please try again.')
        setStatus('error')
        setTimeout(() => router.push('/auth/login'), 3000)
      }
    }

    handleAuthCallback()
  }, [router, searchParams])

  if (status === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-red-600 text-2xl">⚠️</span>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Authentication Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="flex space-x-2 items-center justify-center text-sm text-gray-500">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Redirecting to login...</span>
          </div>
        </div>
      </div>
    )
  }

  if (status === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Successfully Signed In!</h2>
          <p className="text-gray-600 mb-2">
            Welcome! You've been successfully authenticated{provider && ` with ${provider}`}.
          </p>
          <div className="flex space-x-2 items-center justify-center text-sm text-green-600">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Taking you to your dashboard...</span>
          </div>
        </div>
      </div>
    )
  }

  // Default processing states
  const getStatusMessage = () => {
    switch (status) {
      case 'creating-profile':
        return {
          title: 'Setting Up Your Profile',
          message: `Creating your account${provider && ` with ${provider}`}...`
        }
      default:
        return {
          title: 'Signing You In',
          message: 'Please wait while we complete your authentication.'
        }
    }
  }

  const { title, message } = getStatusMessage()

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center max-w-md mx-auto p-6">
        <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <Loader2 className="w-8 h-8 animate-spin text-orange-600" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">{title}</h2>
        <p className="text-gray-600 mb-6">{message}</p>
        <div className="flex space-x-2 items-center justify-center">
          <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
          <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse delay-75"></div>
          <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse delay-150"></div>
        </div>
      </div>
    </div>
  )
}