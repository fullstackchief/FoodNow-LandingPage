'use client'

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react'
import { 
  AdminUser, 
  AdminSession, 
  AdminAuditLog, 
  AdminInvitation, 
  SecuritySettings, 
  DEFAULT_PERMISSIONS, 
  DEFAULT_SECURITY_SETTINGS,
  AdminRole,
  AdminPermissions
} from '@/types/admin'

interface EnhancedAdminContextType {
  // Current admin session
  currentAdmin: AdminUser | null
  isAuthenticated: boolean
  session: AdminSession | null
  
  // Authentication methods
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string; requirePasswordChange?: boolean }>
  logout: () => void
  changePassword: (currentPassword: string, newPassword: string) => Promise<{ success: boolean; error?: string }>
  acceptInvitation: (token: string, password: string) => Promise<{ success: boolean; error?: string }>
  
  // Admin management (Super Admin only)
  adminUsers: AdminUser[]
  invitations: AdminInvitation[]
  createAdminInvitation: (email: string, role: AdminRole, permissions?: AdminPermissions) => Promise<{ success: boolean; error?: string }>
  updateAdminUser: (adminId: string, updates: Partial<AdminUser>) => Promise<{ success: boolean; error?: string }>
  deleteAdminUser: (adminId: string) => Promise<{ success: boolean; error?: string }>
  suspendAdminUser: (adminId: string) => Promise<{ success: boolean; error?: string }>
  
  // Permission checking
  hasPermission: (category: keyof AdminPermissions, action: keyof AdminPermissions[keyof AdminPermissions]) => boolean
  hasRole: (role: AdminRole) => boolean
  
  // Security & Audit
  auditLogs: AdminAuditLog[]
  securitySettings: SecuritySettings
  updateSecuritySettings: (settings: Partial<SecuritySettings>) => Promise<{ success: boolean; error?: string }>
  logAdminAction: (action: string, details: string) => void
  
  // Session management
  extendSession: () => void
  isSessionExpired: () => boolean
  getRemainingSessionTime: () => number // in minutes
}

const EnhancedAdminContext = createContext<EnhancedAdminContextType | undefined>(undefined)

// Mock data for development - this simulates backend data
const ADMIN_PORTAL_KEY = 'foodnow-admin-portal-7k9x2m' // Hidden portal identifier

export function EnhancedAdminProvider({ children }: { children: ReactNode }) {
  const [currentAdmin, setCurrentAdmin] = useState<AdminUser | null>(null)
  const [session, setSession] = useState<AdminSession | null>(null)
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([])
  const [invitations, setInvitations] = useState<AdminInvitation[]>([])
  const [auditLogs, setAuditLogs] = useState<AdminAuditLog[]>([])
  const [securitySettings, setSecuritySettings] = useState<SecuritySettings>(DEFAULT_SECURITY_SETTINGS)

  // Initialize with default super admin
  useEffect(() => {
    const initializeAdminSystem = () => {
      const existingAdmins = localStorage.getItem('foodnow-admin-users')
      const existingSession = localStorage.getItem('foodnow-admin-session')
      
      if (!existingAdmins) {
        // Create default super admin on first run
        const defaultSuperAdmin: AdminUser = {
          id: 'super-admin-001',
          email: 'superadmin@foodnow.ng',
          firstName: 'Super',
          lastName: 'Admin',
          role: 'super_admin',
          permissions: DEFAULT_PERMISSIONS.super_admin,
          isActive: true,
          lastLogin: null,
          passwordLastChanged: new Date('2024-01-01'),
          sessionTimeout: 480, // 8 hours
          mustChangePassword: true,
          failedLoginAttempts: 0,
          lockedUntil: null,
          createdAt: new Date(),
          createdBy: 'system'
        }
        
        const initialAdmins = [defaultSuperAdmin]
        setAdminUsers(initialAdmins)
        localStorage.setItem('foodnow-admin-users', JSON.stringify(initialAdmins))
        
        // Log the default credentials for development
        console.log('🔐 Default Super Admin Created:')
        console.log('Email: superadmin@foodnow.ng')
        console.log('Default Password: FoodNow2025!')
        console.log('Portal URL: /admin-portal-7k9x2m')
      } else {
        setAdminUsers(JSON.parse(existingAdmins))
      }
      
      // Restore session if valid
      if (existingSession) {
        const sessionData: AdminSession = JSON.parse(existingSession)
        if (new Date() < new Date(sessionData.expiresAt)) {
          setSession(sessionData)
          const admin = JSON.parse(existingAdmins || '[]').find((a: AdminUser) => a.id === sessionData.adminId)
          if (admin) {
            setCurrentAdmin(admin)
          }
        } else {
          localStorage.removeItem('foodnow-admin-session')
        }
      }
      
      // Initialize audit logs
      const existingLogs = localStorage.getItem('foodnow-audit-logs')
      if (existingLogs) {
        setAuditLogs(JSON.parse(existingLogs))
      }
    }

    initializeAdminSystem()
  }, [])

  const login = useCallback(async (email: string, password: string): Promise<{ success: boolean; error?: string; requirePasswordChange?: boolean }> => {
    const admin = adminUsers.find(a => a.email.toLowerCase() === email.toLowerCase() && a.isActive)
    
    if (!admin) {
      return { success: false, error: 'Invalid credentials' }
    }
    
    // Check if account is locked
    if (admin.lockedUntil && new Date() < admin.lockedUntil) {
      const remainingTime = Math.ceil((admin.lockedUntil.getTime() - new Date().getTime()) / (1000 * 60))
      return { success: false, error: `Account locked. Try again in ${remainingTime} minutes.` }
    }
    
    // For demo purposes, check default passwords
    const validPasswords = [
      'FoodNow2025!', // Default super admin password
      'foodnow-admin-2024' // Legacy password for compatibility
    ]
    
    if (!validPasswords.includes(password)) {
      // Increment failed login attempts
      const updatedAdmin = { 
        ...admin, 
        failedLoginAttempts: admin.failedLoginAttempts + 1,
        lockedUntil: admin.failedLoginAttempts + 1 >= securitySettings.maxFailedLoginAttempts 
          ? new Date(Date.now() + securitySettings.lockoutDuration * 60 * 1000)
          : null
      }
      
      const updatedAdmins = adminUsers.map(a => a.id === admin.id ? updatedAdmin : a)
      setAdminUsers(updatedAdmins)
      localStorage.setItem('foodnow-admin-users', JSON.stringify(updatedAdmins))
      
      return { success: false, error: 'Invalid credentials' }
    }
    
    // Reset failed login attempts on successful login
    const updatedAdmin = {
      ...admin,
      lastLogin: new Date(),
      failedLoginAttempts: 0,
      lockedUntil: null
    }
    
    const updatedAdmins = adminUsers.map(a => a.id === admin.id ? updatedAdmin : a)
    setAdminUsers(updatedAdmins)
    localStorage.setItem('foodnow-admin-users', JSON.stringify(updatedAdmins))
    
    // Create session
    const newSession: AdminSession = {
      adminId: admin.id,
      token: generateSessionToken(),
      expiresAt: new Date(Date.now() + admin.sessionTimeout * 60 * 1000),
      createdAt: new Date(),
      lastActivity: new Date()
    }
    
    setCurrentAdmin(updatedAdmin)
    setSession(newSession)
    localStorage.setItem('foodnow-admin-session', JSON.stringify(newSession))
    
    // Log the login
    logAdminAction('LOGIN', `Admin ${admin.email} logged in successfully`)
    
    return { 
      success: true, 
      requirePasswordChange: admin.mustChangePassword || isPasswordExpired(admin)
    }
  }, [adminUsers, securitySettings])

  const logout = useCallback(() => {
    if (currentAdmin) {
      logAdminAction('LOGOUT', `Admin ${currentAdmin.email} logged out`)
    }
    
    setCurrentAdmin(null)
    setSession(null)
    localStorage.removeItem('foodnow-admin-session')
  }, [currentAdmin])

  const changePassword = useCallback(async (currentPassword: string, newPassword: string): Promise<{ success: boolean; error?: string }> => {
    if (!currentAdmin) {
      return { success: false, error: 'Not authenticated' }
    }
    
    // Validate current password (simplified for demo)
    if (currentPassword !== 'FoodNow2025!' && currentPassword !== 'foodnow-admin-2024') {
      return { success: false, error: 'Current password is incorrect' }
    }
    
    // Validate new password strength
    if (newPassword.length < 16) {
      return { success: false, error: 'Password must be at least 16 characters long' }
    }
    
    // Update admin password
    const updatedAdmin = {
      ...currentAdmin,
      passwordLastChanged: new Date(),
      mustChangePassword: false
    }
    
    const updatedAdmins = adminUsers.map(a => a.id === currentAdmin.id ? updatedAdmin : a)
    setAdminUsers(updatedAdmins)
    setCurrentAdmin(updatedAdmin)
    localStorage.setItem('foodnow-admin-users', JSON.stringify(updatedAdmins))
    
    logAdminAction('PASSWORD_CHANGE', 'Admin password changed successfully')
    
    return { success: true }
  }, [currentAdmin, adminUsers])

  const createAdminInvitation = useCallback(async (email: string, role: AdminRole, permissions?: AdminPermissions): Promise<{ success: boolean; error?: string }> => {
    if (!currentAdmin || !hasRole('super_admin')) {
      return { success: false, error: 'Insufficient permissions' }
    }
    
    // Check if admin already exists
    const existingAdmin = adminUsers.find(a => a.email.toLowerCase() === email.toLowerCase())
    if (existingAdmin) {
      return { success: false, error: 'Admin with this email already exists' }
    }
    
    // Create invitation
    const invitation: AdminInvitation = {
      id: generateId(),
      email,
      role,
      permissions: permissions || DEFAULT_PERMISSIONS[role],
      inviteToken: generateInviteToken(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      createdBy: currentAdmin.id,
      createdAt: new Date(),
      isUsed: false
    }
    
    const updatedInvitations = [...invitations, invitation]
    setInvitations(updatedInvitations)
    localStorage.setItem('foodnow-admin-invitations', JSON.stringify(updatedInvitations))
    
    // In a real app, this would send an email
    console.log(`📧 Admin Invitation Created:`)
    console.log(`Email: ${email}`)
    console.log(`Role: ${role}`)
    console.log(`Invite Token: ${invitation.inviteToken}`)
    console.log(`Portal URL: /admin-portal-7k9x2m/accept-invitation?token=${invitation.inviteToken}`)
    console.log(`Default Password: FoodNow2025!`)
    
    logAdminAction('ADMIN_INVITE_CREATED', `Invitation sent to ${email} with role ${role}`)
    
    return { success: true }
  }, [currentAdmin, adminUsers, invitations])

  const acceptInvitation = useCallback(async (token: string, password: string): Promise<{ success: boolean; error?: string }> => {
    const invitation = invitations.find(i => i.inviteToken === token && !i.isUsed)
    
    if (!invitation) {
      return { success: false, error: 'Invalid or expired invitation' }
    }
    
    if (new Date() > invitation.expiresAt) {
      return { success: false, error: 'Invitation has expired' }
    }
    
    // Create new admin user
    const newAdmin: AdminUser = {
      id: generateId(),
      email: invitation.email,
      firstName: '', // Will be updated by admin
      lastName: '',
      role: invitation.role,
      permissions: invitation.permissions,
      isActive: true,
      lastLogin: null,
      passwordLastChanged: new Date(),
      sessionTimeout: 240, // 4 hours default
      mustChangePassword: true,
      failedLoginAttempts: 0,
      lockedUntil: null,
      createdAt: new Date(),
      createdBy: invitation.createdBy
    }
    
    // Mark invitation as used
    const updatedInvitations = invitations.map(i => 
      i.id === invitation.id ? { ...i, isUsed: true, usedAt: new Date() } : i
    )
    setInvitations(updatedInvitations)
    localStorage.setItem('foodnow-admin-invitations', JSON.stringify(updatedInvitations))
    
    // Add new admin
    const updatedAdmins = [...adminUsers, newAdmin]
    setAdminUsers(updatedAdmins)
    localStorage.setItem('foodnow-admin-users', JSON.stringify(updatedAdmins))
    
    logAdminAction('ADMIN_CREATED', `New admin created: ${invitation.email}`)
    
    return { success: true }
  }, [invitations, adminUsers])

  const hasPermission = useCallback((category: keyof AdminPermissions, action: keyof AdminPermissions[keyof AdminPermissions]): boolean => {
    if (!currentAdmin) return false
    return (currentAdmin.permissions[category] as any)[action] === true
  }, [currentAdmin])

  const hasRole = useCallback((role: AdminRole): boolean => {
    if (!currentAdmin) return false
    return currentAdmin.role === role
  }, [currentAdmin])

  const logAdminAction = useCallback((action: string, details: string) => {
    if (!currentAdmin) return
    
    const logEntry: AdminAuditLog = {
      id: generateId(),
      adminId: currentAdmin.id,
      adminEmail: currentAdmin.email,
      action,
      details,
      timestamp: new Date(),
      ipAddress: '127.0.0.1', // Mock IP
      userAgent: navigator.userAgent
    }
    
    const updatedLogs = [logEntry, ...auditLogs].slice(0, 1000) // Keep last 1000 logs
    setAuditLogs(updatedLogs)
    localStorage.setItem('foodnow-audit-logs', JSON.stringify(updatedLogs))
  }, [currentAdmin, auditLogs])

  const isSessionExpired = useCallback((): boolean => {
    if (!session) return true
    return new Date() > new Date(session.expiresAt)
  }, [session])

  const extendSession = useCallback(() => {
    if (!session || !currentAdmin) return
    
    const extendedSession = {
      ...session,
      expiresAt: new Date(Date.now() + currentAdmin.sessionTimeout * 60 * 1000),
      lastActivity: new Date()
    }
    
    setSession(extendedSession)
    localStorage.setItem('foodnow-admin-session', JSON.stringify(extendedSession))
  }, [session, currentAdmin])

  const getRemainingSessionTime = useCallback((): number => {
    if (!session) return 0
    const remaining = new Date(session.expiresAt).getTime() - new Date().getTime()
    return Math.max(0, Math.floor(remaining / (1000 * 60)))
  }, [session])

  // Helper functions
  const generateSessionToken = (): string => {
    return 'sess_' + Math.random().toString(36).substring(2) + Date.now().toString(36)
  }

  const generateInviteToken = (): string => {
    return 'inv_' + Math.random().toString(36).substring(2) + Date.now().toString(36)
  }

  const generateId = (): string => {
    return Math.random().toString(36).substring(2) + Date.now().toString(36)
  }

  const isPasswordExpired = (admin: AdminUser): boolean => {
    const daysSinceChange = (new Date().getTime() - admin.passwordLastChanged.getTime()) / (1000 * 60 * 60 * 24)
    return daysSinceChange > securitySettings.passwordChangeInterval
  }

  // Stub methods for admin management
  const updateAdminUser = async (adminId: string, updates: Partial<AdminUser>) => {
    return { success: true }
  }

  const deleteAdminUser = async (adminId: string) => {
    return { success: true }
  }

  const suspendAdminUser = async (adminId: string) => {
    return { success: true }
  }

  const updateSecuritySettings = async (settings: Partial<SecuritySettings>) => {
    return { success: true }
  }

  const value: EnhancedAdminContextType = {
    currentAdmin,
    isAuthenticated: !!currentAdmin && !!session && !isSessionExpired(),
    session,
    login,
    logout,
    changePassword,
    acceptInvitation,
    adminUsers,
    invitations,
    createAdminInvitation,
    updateAdminUser,
    deleteAdminUser,
    suspendAdminUser,
    hasPermission,
    hasRole,
    auditLogs,
    securitySettings,
    updateSecuritySettings,
    logAdminAction,
    extendSession,
    isSessionExpired,
    getRemainingSessionTime
  }

  return (
    <EnhancedAdminContext.Provider value={value}>
      {children}
    </EnhancedAdminContext.Provider>
  )
}

export function useEnhancedAdmin() {
  const context = useContext(EnhancedAdminContext)
  if (context === undefined) {
    throw new Error('useEnhancedAdmin must be used within an EnhancedAdminProvider')
  }
  return context
}