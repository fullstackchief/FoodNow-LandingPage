'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'

interface AuthRedirectProps {
  children?: React.ReactNode
  redirectAuthenticated?: boolean
  redirectUnauthenticated?: boolean
}

/**
 * Component that handles authentication-based redirects
 * - Redirects authenticated users away from auth pages
 * - Redirects unauthenticated users to login
 * - Handles return paths after successful authentication
 */
const AuthRedirect = ({ 
  children, 
  redirectAuthenticated = false,
  redirectUnauthenticated = false
}: AuthRedirectProps) => {
  const { user, isAuthenticated, isLoading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    // Don't redirect while auth is still loading
    if (isLoading) return

    // Handle authenticated user redirects (for auth pages like login/signup)
    if (redirectAuthenticated && isAuthenticated && user) {
      // Check if there's a return path in the URL
      const redirectParam = searchParams?.get('redirect')
      
      if (redirectParam) {
        // Validate and use the redirect parameter
        try {
          const decodedPath = decodeURIComponent(redirectParam)
          // Basic security check - only allow relative paths
          if (decodedPath.startsWith('/') && !decodedPath.startsWith('//')) {
            router.replace(decodedPath)
            return
          }
        } catch {
          console.warn('Invalid redirect parameter:', redirectParam)
        }
      }

      // No valid redirect parameter, use default dashboard path for customers
      const dashboardPath = '/explore' // Default to customer path for now
      router.replace(dashboardPath)
      return
    }

    // Handle unauthenticated user redirects (for protected pages)
    if (redirectUnauthenticated && !isAuthenticated) {
      const currentPath = typeof window !== 'undefined' 
        ? window.location.pathname + window.location.search
        : '/'
      const loginPath = `/auth/login?redirect=${encodeURIComponent(currentPath)}`
      router.replace(loginPath)
      return
    }
  }, [isLoading, isAuthenticated, user, redirectAuthenticated, redirectUnauthenticated, router, searchParams])

  // Render children if no redirect is happening
  return children ? <>{children}</> : null
}

/**
 * Higher-order component that wraps pages to handle auth redirects
 */
export const withAuthRedirect = (
  Component: React.ComponentType,
  options: Omit<AuthRedirectProps, 'children'> = {}
) => {
  return function AuthRedirectWrapper(props: Record<string, unknown>) {
    return (
      <AuthRedirect {...options}>
        <Component {...props} />
      </AuthRedirect>
    )
  }
}

/**
 * Hook that provides auth redirect utilities
 */
export const useAuthRedirect = () => {
  const { user, isAuthenticated } = useAuth()
  const router = useRouter()

  const redirectToDashboard = () => {
    if (user) {
      const path = '/explore' // Default to customer path for now
      router.push(path)
    } else {
      router.push('/')
    }
  }

  const redirectToLogin = (returnPath?: string) => {
    const currentPath = returnPath || (typeof window !== 'undefined' 
      ? window.location.pathname + window.location.search 
      : '/')
    const loginPath = `/auth/login?redirect=${encodeURIComponent(currentPath)}`
    router.push(loginPath)
  }

  const handlePostLoginRedirect = (intendedPath?: string) => {
    if (user) {
      const redirectPath = intendedPath || '/explore' // Default to intended path or explore
      router.replace(redirectPath)
    }
  }

  return {
    redirectToDashboard,
    redirectToLogin,
    handlePostLoginRedirect,
    isAuthenticated,
    user
  }
}

export default AuthRedirect