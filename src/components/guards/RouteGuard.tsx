'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { useAuth } from '@/contexts/AuthContext'
// Route access utilities simplified for Supabase user structure
import type { UserType } from '@/types/auth'
import { Shield, AlertCircle, ArrowLeft, Home, LogIn } from 'lucide-react'

interface RouteGuardProps {
  children: React.ReactNode
  requiredRole?: UserType
  requiredRoles?: UserType[]
  allowedRoles?: UserType[]
  requireAuth?: boolean
  redirectTo?: string
  fallback?: React.ReactNode
}

const RouteGuard = ({ 
  children, 
  requiredRole,
  requiredRoles,
  allowedRoles,
  requireAuth = true,
  redirectTo,
  fallback
}: RouteGuardProps) => {
  const { user, isAuthenticated, isLoading } = useAuth()
  const router = useRouter()
  const [isChecking, setIsChecking] = useState(true)
  const [hasAccess, setHasAccess] = useState(false)
  const [accessError, setAccessError] = useState<string | null>(null)

  useEffect(() => {
    const checkAccess = () => {
      setIsChecking(true)
      setAccessError(null)

      // Wait for auth to finish loading
      if (isLoading) return

      // Check if authentication is required
      if (requireAuth && !isAuthenticated) {
        setAccessError('Authentication required')
        setHasAccess(false)
        setIsChecking(false)
        
        // Redirect to login with return path
        const currentPath = typeof window !== 'undefined' ? window.location.pathname : '/'
        const loginPath = `/auth/login?redirect=${encodeURIComponent(currentPath)}`
        router.push(loginPath)
        return
      }

      // If no auth required and user is not authenticated, allow access
      if (!requireAuth && !isAuthenticated) {
        setHasAccess(true)
        setIsChecking(false)
        return
      }

      // User is authenticated, check role-based access
      if (isAuthenticated && user) {
        let hasRequiredAccess = true
        let errorMessage = ''

        // Check specific required role - simplified for Supabase users
        if (requiredRole && requiredRole !== 'customer') {
          hasRequiredAccess = false
          errorMessage = `This page requires ${requiredRole} access. Your current role: customer`
        }

        // Check if user has any of the required roles - simplified for now
        if (requiredRoles && !requiredRoles.includes('customer' as UserType)) {
          hasRequiredAccess = false
          errorMessage = `This page requires one of: ${requiredRoles.join(', ')}. Your current role: customer`
        }

        // Check if user has any of the allowed roles - simplified for now
        if (allowedRoles && !allowedRoles.includes('customer' as UserType)) {
          hasRequiredAccess = false
          errorMessage = `Access denied. Allowed roles: ${allowedRoles.join(', ')}`
        }

        // Check using route-based access control - simplified for now
        // Allow access to common customer routes
        const currentPath = typeof window !== 'undefined' ? window.location.pathname : '/'
        const isRestrictedRoute = ['/admin', '/restaurant-dashboard', '/rider-dashboard'].some(route => 
          currentPath.startsWith(route)
        )
        if (isRestrictedRoute) {
          hasRequiredAccess = false
          errorMessage = `You don't have permission to access this page`
        }

        if (!hasRequiredAccess) {
          setAccessError(errorMessage)
          setHasAccess(false)
          
          // Redirect to appropriate dashboard or specified redirect
          const redirectPath = redirectTo || '/explore' // Default customer path
          setTimeout(() => router.push(redirectPath), 2000)
        } else {
          setHasAccess(true)
        }
      }

      setIsChecking(false)
    }

    checkAccess()
  }, [isLoading, isAuthenticated, user, requireAuth, requiredRole, requiredRoles, allowedRoles, redirectTo, router])

  // Loading state
  if (isChecking || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="w-16 h-16 border-4 border-orange-500/30 border-t-orange-500 rounded-full animate-spin mx-auto mb-6"></div>
          <p className="text-gray-600 text-lg font-medium">Checking access permissions...</p>
          <p className="text-gray-500 text-sm mt-2">Please wait while we verify your credentials</p>
        </motion.div>
      </div>
    )
  }

  // Access denied
  if (!hasAccess && accessError) {
    if (fallback) {
      return <>{fallback}</>
    }

    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full"
        >
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center border border-red-100">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Shield className="w-8 h-8 text-red-600" />
            </div>
            
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
            <p className="text-gray-600 mb-6 leading-relaxed">{accessError}</p>
            
            <div className="space-y-3">
              {!isAuthenticated ? (
                <>
                  <button
                    onClick={() => router.push('/auth/login')}
                    className="w-full flex items-center justify-center space-x-2 bg-orange-500 hover:bg-orange-600 text-white font-medium py-3 px-6 rounded-xl transition-colors"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>Sign In</span>
                  </button>
                  <button
                    onClick={() => router.push('/')}
                    className="w-full flex items-center justify-center space-x-2 border border-gray-300 hover:border-gray-400 text-gray-700 font-medium py-3 px-6 rounded-xl transition-colors"
                  >
                    <Home className="w-4 h-4" />
                    <span>Go Home</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => router.push(user ? '/explore' : '/')}
                    className="w-full flex items-center justify-center space-x-2 bg-orange-500 hover:bg-orange-600 text-white font-medium py-3 px-6 rounded-xl transition-colors"
                  >
                    <Home className="w-4 h-4" />
                    <span>Go to Dashboard</span>
                  </button>
                  <button
                    onClick={() => router.back()}
                    className="w-full flex items-center justify-center space-x-2 border border-gray-300 hover:border-gray-400 text-gray-700 font-medium py-3 px-6 rounded-xl transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Go Back</span>
                  </button>
                </>
              )}
            </div>
            
            <div className="mt-6 p-4 bg-amber-50 rounded-xl border border-amber-200">
              <div className="flex items-center justify-center space-x-2 text-amber-800 mb-2">
                <AlertCircle className="w-4 h-4" />
                <span className="font-medium text-sm">Need Help?</span>
              </div>
              <p className="text-amber-700 text-xs">
                If you believe this is an error, please contact support or check your account permissions.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    )
  }

  // Access granted
  return <>{children}</>
}

// Convenience components for specific user types
export const CustomerRoute = ({ children, ...props }: Omit<RouteGuardProps, 'requiredRole'>) => (
  <RouteGuard requiredRole="customer" {...props}>
    {children}
  </RouteGuard>
)

export const RestaurantRoute = ({ children, ...props }: Omit<RouteGuardProps, 'requiredRole'>) => (
  <RouteGuard requiredRole="restaurant" {...props}>
    {children}
  </RouteGuard>
)

export const RiderRoute = ({ children, ...props }: Omit<RouteGuardProps, 'requiredRole'>) => (
  <RouteGuard requiredRole="rider" {...props}>
    {children}
  </RouteGuard>
)

export const AdminRoute = ({ children, ...props }: Omit<RouteGuardProps, 'requiredRole'>) => (
  <RouteGuard requiredRole="admin" {...props}>
    {children}
  </RouteGuard>
)

// Multi-role convenience components
export const RestaurantOrAdminRoute = ({ children, ...props }: Omit<RouteGuardProps, 'allowedRoles'>) => (
  <RouteGuard allowedRoles={['restaurant', 'admin']} {...props}>
    {children}
  </RouteGuard>
)

export const RiderOrAdminRoute = ({ children, ...props }: Omit<RouteGuardProps, 'allowedRoles'>) => (
  <RouteGuard allowedRoles={['rider', 'admin']} {...props}>
    {children}
  </RouteGuard>
)

export const AnyAuthenticatedRoute = ({ children, ...props }: Omit<RouteGuardProps, 'allowedRoles'>) => (
  <RouteGuard allowedRoles={['customer', 'restaurant', 'rider', 'admin']} {...props}>
    {children}
  </RouteGuard>
)

export const PublicRoute = ({ children, ...props }: Omit<RouteGuardProps, 'requireAuth'>) => (
  <RouteGuard requireAuth={false} {...props}>
    {children}
  </RouteGuard>
)

export default RouteGuard