'use client'

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react'
import { supabase } from '@/lib/supabase-client'
import type { User as SupabaseUser, Session } from '@supabase/supabase-js'
import { 
  setRememberMeSession, 
  clearRememberMeSession, 
  restoreRememberMeSession,
  extendSessionIfNeeded
} from '@/lib/sessionService'
import { 
  type UserProfile, 
  type UserRole,
  getDashboardRoute
} from '@/lib/authService'
import { 
  validateAdminSession, 
  hasPermission,
  type AdminRole,
  type AdminPermissions
} from '@/lib/adminService'
import type { AdminUser as AdminUserType } from '@/lib/adminService'
import { devLog, prodLog } from '@/lib/logger'

interface SignupData {
  email: string
  password: string
  firstName: string
  lastName: string
  phone?: string
  userRole?: UserRole
}

interface AuthContextType {
  // Auth state
  user: UserProfile | null
  supabaseUser: SupabaseUser | null
  session: Session | null
  isAuthenticated: boolean
  isLoading: boolean

  // Role-based helpers
  userRole: UserRole | null
  isCustomer: boolean
  isRestaurantOwner: boolean
  isRider: boolean
  isAdmin: boolean
  isSuperAdmin: boolean
  isVerified: boolean
  dashboardRoute: string

  // Admin system integration
  adminUser: AdminUserType | null
  adminRole: AdminRole | null
  isAdminAuthenticated: boolean
  isAdminLoading: boolean
  adminPermissions: AdminPermissions | null
  
  // Admin role checkers
  isSuperAdminRole: boolean
  isAdminRole: boolean
  isModeratorRole: boolean
  isStaffRole: boolean

  // Auth actions
  login: (email: string, password: string, rememberMe?: boolean) => Promise<{ success: boolean; error?: string }>
  signup: (data: SignupData) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<{ success: boolean; error?: string }>
  updateProfile: (updates: Partial<UserProfile>) => Promise<{ success: boolean; error?: string }>
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>
  
  // Admin actions
  loginAsAdmin: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  completeAdminOTP: (email: string, otpToken: string) => Promise<{ success: boolean; error?: string }>
  checkAdminPermission: (category: keyof AdminPermissions, permission: string) => Promise<boolean>
  
  // Session management
  refreshSession: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isProfileLoading, setIsProfileLoading] = useState(false)

  // Admin system state
  const [adminUser, setAdminUser] = useState<AdminUserType | null>(null)
  const [adminRole, setAdminRole] = useState<AdminRole | null>(null)
  const [adminPermissions, setAdminPermissions] = useState<AdminPermissions | null>(null)
  const [isAdminLoading, setIsAdminLoading] = useState(false)

  // Fetch user profile from database with direct query and retry logic
  const fetchUserProfile = useCallback(async (userId: string, retryCount = 0): Promise<any> => {
    setIsProfileLoading(true)
    const maxRetries = 2
    
    try {
      // Fetching user profile
      
      // Use direct Supabase query instead of the authService function
      const { data: profiles, error: directError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .limit(1)
      
      if (directError) {
        prodLog.error('Failed to fetch user profile from database', { error: directError.message, code: directError.code, userId })
        
        // If it's a network error and we have retries left, retry after a delay
        if (retryCount < maxRetries && (directError.message.includes('network') || directError.code === 'PGRST301')) {
          devLog.info(`Retrying profile fetch in 1 second... (${retryCount + 1}/${maxRetries})`, { userId, retryCount, error: directError.message })
          await new Promise(resolve => setTimeout(resolve, 1000))
          return fetchUserProfile(userId, retryCount + 1)
        }
        
        // Try to create profile if it doesn't exist and it's not a network error
        if (directError.code === 'PGRST116' || directError.message.includes('not found')) {
          devLog.info('Profile not found, attempting to create user profile', { userId })
          const { data: authUser } = await supabase.auth.getUser()
          if (authUser?.user) {
            const createdProfile = await createUserProfile(authUser.user)
            if (createdProfile) {
              // Profile created successfully
              setUser(createdProfile as UserProfile)
              return createdProfile
            }
          }
        }
        
        // Continue without blocking login
        prodLog.warn('Continuing without user profile after retries', { userId, retryCount, error: directError.message })
        return null
      }
      
      if (!profiles || profiles.length === 0) {
        devLog.info('No profile found, creating new profile', { userId })
        const { data: authUser } = await supabase.auth.getUser()
        if (authUser?.user) {
          const createdProfile = await createUserProfile(authUser.user)
          if (createdProfile) {
            // Profile created successfully
            setUser(createdProfile as UserProfile)
            return createdProfile
          }
        }
        prodLog.error('Failed to create user profile after fetch', { userId })
        return null
      }

      const profile = profiles[0]
      // Profile fetched successfully
      setUser(profile as UserProfile)
      return profile
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      prodLog.error(`Failed to fetch user profile (attempt ${retryCount + 1})`, { error: errorMessage, userId, retryCount })
      
      // Retry on network errors
      if (retryCount < maxRetries && error instanceof Error && 
          (error.message.includes('network') || error.message.includes('fetch'))) {
        devLog.info(`Retrying profile fetch due to network error... (${retryCount + 1}/${maxRetries})`, { userId, retryCount, error: error.message })
        await new Promise(resolve => setTimeout(resolve, 1000))
        return fetchUserProfile(userId, retryCount + 1)
      }
      
      // Don't block login - continue without profile
      prodLog.warn('Continuing without user profile due to error after retries', { userId, retryCount, error: errorMessage })
      return null
    } finally {
      setIsProfileLoading(false)
    }
  }, [])

  // Initialize auth state and listen for changes
  useEffect(() => {
    // Get initial session
    const initializeAuth = async () => {
      try {
        const { data: { session: initialSession } } = await supabase.auth.getSession()
        devLog.info('Initial session check', { hasSession: !!initialSession })
        
        if (initialSession) {
          setSession(initialSession)
          setSupabaseUser(initialSession.user)
          
          // Fetch user profile but don't block on it
          fetchUserProfile(initialSession.user.id).catch(error => {
            prodLog.error('Profile fetch failed during initialization', { error: error.message, userId: initialSession.user.id })
          })
        } else {
          // No active session, try to restore from remember me
          devLog.info('No active session, attempting remember me restoration')
          const restoreResult = await restoreRememberMeSession()
          
          if (restoreResult.success && restoreResult.session) {
            devLog.info('Remember me session restored successfully')
            // The session will be handled by the onAuthStateChange listener
          } else if (restoreResult.error) {
            devLog.info('Remember me restoration failed', { error: restoreResult.error })
          }
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        prodLog.error('Failed to initialize auth system', { error: errorMessage })
      } finally {
        setIsLoading(false)
      }
    }

    initializeAuth()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        // Auth state changed
        
        setSession(session)
        setSupabaseUser(session?.user ?? null)
        
        if (session?.user) {
          // Fetching user profile
          // Don't block on profile fetch
          fetchUserProfile(session.user.id).catch(error => {
            prodLog.error('Profile fetch failed in auth state change', { error: error.message, userId: session.user.id, event })
          })
        } else {
          devLog.info('Auth state: No session, clearing user', { event })
          setUser(null)
        }
        
        // Set loading to false after handling session change
        setIsLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [fetchUserProfile])

  // Session extension for remember me users
  useEffect(() => {
    if (!session || !supabaseUser) return

    // Set up periodic session extension check for remember me users
    const sessionExtensionInterval = setInterval(() => {
      extendSessionIfNeeded().catch(error => {
        prodLog.error('Session extension check failed', error, {
          userId: supabaseUser?.id
        })
      })
    }, 15 * 60 * 1000) // Check every 15 minutes

    return () => clearInterval(sessionExtensionInterval)
  }, [session, supabaseUser])

  // Create user profile if it doesn't exist
  const createUserProfile = async (authUser: any) => {
    try {
      // Creating user profile
      
      // Extract name from metadata or email
      const fullName = authUser.user_metadata?.full_name || ''
      const firstName = authUser.user_metadata?.first_name || 
                       (fullName ? fullName.split(' ')[0] : '') ||
                       authUser.email.split('@')[0] // Fallback to email username
      const lastName = authUser.user_metadata?.last_name || 
                      (fullName ? fullName.split(' ').slice(1).join(' ') : '') ||
                      null

      // Get user role from metadata or default to customer
      const userRole = authUser.user_metadata?.user_role || 'customer'

      const { data, error } = await (supabase as any)
        .from('users')
        .insert({
          id: authUser.id,
          email: authUser.email,
          first_name: firstName,
          last_name: lastName,
          phone: authUser.phone || null,
          avatar_url: authUser.user_metadata?.avatar_url || '',
          user_role: userRole,
          is_verified: !!authUser.email_confirmed_at,
          is_active: true,
          onboarding_completed: false,
          loyalty_points: 0,
          tier: 'bronze',
          total_orders: 0,
          total_spent: 0,
          created_at: authUser.created_at,
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) {
        prodLog.error('Failed to create user profile in database', { error: error.message, userId: authUser.id, email: authUser.email })
        return null
      }

      // User profile created
      return data
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      prodLog.error('Exception while creating user profile', { error: errorMessage, userId: authUser?.id })
      return null
    }
  }


  const login = useCallback(async (email: string, password: string, rememberMe = false) => {
    // Admin login attempt
    setIsLoading(true)
    
    try {
      // Attempting authentication
      
      // Try direct login
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })
      
      // Login response received

      if (error) {
        prodLog.error('Authentication failed', { error: error.message, email })
        setIsLoading(false)
        return { success: false, error: error.message }
      }

      if (data?.user && data?.session) {
        // Login successful
        
        // Store remember me session if requested
        setRememberMeSession(data.session, rememberMe)
        
        // Create session cookie for API authentication
        try {
          await fetch('/api/auth/session', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-internal-auth': process.env.INTERNAL_AUTH_SECRET || ''
            },
            credentials: 'include',
            body: JSON.stringify({
              userId: data.user.id,
              email: data.user.email,
              role: data.user.user_metadata?.role || 'customer',
              isVerified: !!data.user.email_confirmed_at,
              rememberMe
            })
          })
          
          devLog.info('Session cookie created successfully', { userId: data.user.id })
        } catch (cookieError) {
          // Don't fail login if cookie creation fails
          const errorMessage = cookieError instanceof Error ? cookieError.message : String(cookieError)
          prodLog.warn('Failed to create session cookie, continuing with login', { 
            userId: data.user.id, 
            error: errorMessage 
          })
        }
        
        prodLog.info('Login completed with remember me preference', { 
          userId: data.user.id, 
          rememberMe,
          action: 'login_complete'
        })
        
        // Don't set loading to false yet - let the auth state change handler do it
        // The onAuthStateChange listener will handle setting session and fetching profile
        return { success: true }
      } else {
        prodLog.error('Login response missing user or session', { email })
        setIsLoading(false)
        return { success: false, error: 'No user session created' }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      prodLog.error('Login exception occurred', { error: errorMessage, email })
      setIsLoading(false)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Login failed' 
      }
    }
  }, [])

  const signup = useCallback(async (data: SignupData) => {
    setIsLoading(true)
    try {
      const { error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            first_name: data.firstName,
            last_name: data.lastName,
            phone: data.phone,
            user_role: data.userRole || 'customer'
          }
        }
      })

      if (authError) {
        return { success: false, error: authError.message }
      }

      // User profile will be created automatically by the database trigger
      // based on the metadata provided in the signup options

      return { success: true }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      prodLog.error('User signup failed', { error: errorMessage, email: data.email })
      return { success: false, error: 'Signup failed' }
    } finally {
      setIsLoading(false)
    }
  }, [])

  const logout = useCallback(async () => {
    setIsLoading(true)
    try {
      const { error } = await supabase.auth.signOut()
      
      // Clear remember me session
      clearRememberMeSession()
      
      // Also clear admin session
      localStorage.removeItem('admin_session')
      setAdminUser(null)
      setAdminRole(null)
      setAdminPermissions(null)
      
      prodLog.info('User logged out and sessions cleared', { 
        action: 'logout_complete'
      })
      
      if (error) {
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      prodLog.error('User logout failed', { error: errorMessage, userId: supabaseUser?.id })
      return { success: false, error: 'Logout failed' }
    } finally {
      setIsLoading(false)
    }
  }, [])

  const updateProfile = useCallback(async (updates: Partial<UserProfile>) => {
    if (!supabaseUser) {
      return { success: false, error: 'Not authenticated' }
    }

    try {
      // Create a safe update object with only valid fields
      const updateData: any = {
        updated_at: new Date().toISOString()
      }
      
      // Add only the fields that are being updated
      Object.keys(updates).forEach(key => {
        if (updates[key as keyof UserProfile] !== undefined) {
          updateData[key] = updates[key as keyof UserProfile]
        }
      })

      const { data, error } = await (supabase as any)
        .from('users')
        .update(updateData)
        .eq('id', supabaseUser.id)
        .select()
        .single()

      if (error) {
        return { success: false, error: error.message }
      }

      setUser(data as UserProfile)
      return { success: true }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      prodLog.error('Profile update failed', { error: errorMessage, userId: supabaseUser?.id, updates: Object.keys(updates) })
      return { success: false, error: 'Profile update failed' }
    }
  }, [supabaseUser])

  const resetPassword = useCallback(async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      })

      if (error) {
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      prodLog.error('Password reset failed', { error: errorMessage, email })
      return { success: false, error: 'Password reset failed' }
    }
  }, [])

  const refreshSession = useCallback(async () => {
    try {
      const { error } = await supabase.auth.refreshSession()
      
      if (error) {
        prodLog.error('Session refresh failed', { error: error.message, userId: supabaseUser?.id })
        setUser(null)
        setSession(null)
        setSupabaseUser(null)
      }
      
      // Auth state change listener will handle the session update
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      prodLog.error('Session refresh exception', { error: errorMessage, userId: supabaseUser?.id })
      setUser(null)
      setSession(null)
      setSupabaseUser(null)
    }
  }, [])

  // Role-based computed values
  const userRole = user?.user_role || null
  const isCustomer = userRole === 'customer'
  const isRestaurantOwner = userRole === 'restaurant_owner'
  const isRider = userRole === 'rider'
  const isAdmin = false // Admin users are in separate table
  const isSuperAdmin = false // Admin users are in separate table
  const isVerified = user?.is_verified || false
  const dashboardRoute = userRole ? getDashboardRoute(userRole) : '/dashboard'

  // Admin system computed values
  const isAdminAuthenticated = adminUser !== null && adminUser.is_active
  const isSuperAdminRole = adminRole === 'super_admin'
  const isAdminRole = adminRole === 'admin'
  const isModeratorRole = adminRole === 'moderator'
  const isStaffRole = adminRole === 'staff'

  // Admin functions  
  const loginAsAdmin = useCallback(async (email: string, password: string) => {
    setIsAdminLoading(true)
    try {
      // Use new admin OTP endpoint for enhanced security
      const response = await fetch('/api/auth/admin-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          action: 'verify_credentials'
        })
      })

      const result = await response.json()
      
      if (!result.success) {
        return { success: false, error: result.error }
      }

      // Return success - OTP modal will handle the rest
      return { success: true, data: result.data }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      prodLog.error('Admin authentication failed', { error: errorMessage, email })
      return { success: false, error: 'Admin login failed' }
    } finally {
      setIsAdminLoading(false)
    }
  }, [])

  const completeAdminOTP = useCallback(async (email: string, otpToken: string) => {
    setIsAdminLoading(true)
    try {
      // Complete OTP authentication
      const response = await fetch('/api/auth/admin-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          otpToken,
          action: 'complete_otp_login'
        })
      })

      const result = await response.json()
      
      if (!result.success) {
        return { success: false, error: result.error }
      }

      // Set admin user state from successful OTP verification
      if (result.data?.user) {
        const adminData = result.data.user
        setAdminUser(adminData)
        setAdminRole(adminData.role)
        setAdminPermissions(adminData.permissions)
        
        // Store admin session
        localStorage.setItem('admin_session', JSON.stringify({
          id: adminData.id,
          email: adminData.email,
          user_metadata: { role: adminData.role },
          verified: true
        }))
      }

      return { success: true }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      prodLog.error('Admin OTP verification failed', { error: errorMessage, email })
      return { success: false, error: 'OTP verification failed' }
    } finally {
      setIsAdminLoading(false)
    }
  }, [])

  const checkAdminPermission = useCallback(async (category: keyof AdminPermissions, permission: string) => {
    if (!supabaseUser) return false
    
    // Super admin with God Mode has all permissions
    if (adminRole === 'super_admin') return true
    
    return await hasPermission(supabaseUser.id, category, permission)
  }, [adminRole, supabaseUser])

  // Load admin session (separate from regular auth)
  // Admin auth is independent of Supabase auth for now
  useEffect(() => {
    // Check if there's an admin session in localStorage or similar
    // For now, admin state is managed through explicit login
    const storedAdminId = localStorage.getItem('admin_session')
    
    if (storedAdminId) {
      const loadAdminSession = async () => {
        setIsAdminLoading(true)
        try {
          const { validateAdminSession } = await import('@/lib/adminService')
          const adminData = await validateAdminSession(storedAdminId)
          
          if (adminData) {
            setAdminUser(adminData)
            setAdminRole(adminData.role)
            setAdminPermissions(adminData.permissions)
          } else {
            localStorage.removeItem('admin_session')
            setAdminUser(null)
            setAdminRole(null)
            setAdminPermissions(null)
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error)
          prodLog.error('Failed to load admin session', { error: errorMessage, adminId: storedAdminId })
          localStorage.removeItem('admin_session')
          setAdminUser(null)
          setAdminRole(null)
          setAdminPermissions(null)
        } finally {
          setIsAdminLoading(false)
        }
      }

      loadAdminSession()
    }
  }, [])

  const value: AuthContextType = {
    user,
    supabaseUser,
    session,
    isAuthenticated: !!session && !!supabaseUser, // Don't require user profile for basic auth
    isLoading: isLoading || isProfileLoading,
    userRole,
    isCustomer,
    isRestaurantOwner,
    isRider,
    isAdmin,
    isSuperAdmin,
    isVerified,
    dashboardRoute,
    
    // Admin system values
    adminUser,
    adminRole,
    isAdminAuthenticated,
    isAdminLoading,
    adminPermissions,
    isSuperAdminRole,
    isAdminRole,
    isModeratorRole,
    isStaffRole,
    
    login,
    signup,
    logout,
    updateProfile,
    resetPassword,
    refreshSession,
    
    // Admin functions
    loginAsAdmin,
    completeAdminOTP,
    checkAdminPermission,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}