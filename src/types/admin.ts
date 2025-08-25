// Admin types and interfaces for the FoodNow platform

export type AdminRole = 'super_admin' | 'admin' | 'moderator'

export interface AdminPermissions {
  restaurants: {
    view: boolean
    create: boolean
    edit: boolean
    delete: boolean
    approve: boolean
  }
  orders: {
    view: boolean
    edit: boolean
    refund: boolean
    cancel: boolean
  }
  users: {
    view: boolean
    suspend: boolean
    delete: boolean
    viewDetails: boolean
  }
  analytics: {
    view: boolean
    export: boolean
  }
  admins: {
    view: boolean
    create: boolean
    edit: boolean
    delete: boolean
  }
  settings: {
    view: boolean
    edit: boolean
  }
}

export interface AdminUser {
  id: string
  email: string
  firstName: string
  lastName: string
  role: AdminRole
  permissions: AdminPermissions
  isActive: boolean
  lastLogin: Date | null
  passwordLastChanged: Date
  sessionTimeout: number // in minutes
  mustChangePassword: boolean
  failedLoginAttempts: number
  lockedUntil: Date | null
  createdAt: Date
  createdBy: string
  inviteToken?: string
  inviteExpiresAt?: Date
}

export interface AdminSession {
  adminId: string
  token: string
  expiresAt: Date
  createdAt: Date
  lastActivity: Date
}

export interface AdminAuditLog {
  id: string
  adminId: string
  adminEmail: string
  action: string
  details: string
  timestamp: Date
  ipAddress?: string
  userAgent?: string
}

export interface AdminInvitation {
  id: string
  email: string
  role: AdminRole
  permissions: AdminPermissions
  inviteToken: string
  expiresAt: Date
  createdBy: string
  createdAt: Date
  isUsed: boolean
  usedAt?: Date
}

export interface SecuritySettings {
  maxFailedLoginAttempts: number
  lockoutDuration: number // in minutes
  passwordChangeInterval: number // in days
  minSessionTimeout: number // in minutes
  maxSessionTimeout: number // in minutes
  requirePasswordChangeOnFirstLogin: boolean
  allowMultipleSessions: boolean
}

// Default permissions for each role
export const DEFAULT_PERMISSIONS: Record<AdminRole, AdminPermissions> = {
  super_admin: {
    restaurants: { view: true, create: true, edit: true, delete: true, approve: true },
    orders: { view: true, edit: true, refund: true, cancel: true },
    users: { view: true, suspend: true, delete: true, viewDetails: true },
    analytics: { view: true, export: true },
    admins: { view: true, create: true, edit: true, delete: true },
    settings: { view: true, edit: true }
  },
  admin: {
    restaurants: { view: true, create: false, edit: true, delete: false, approve: true },
    orders: { view: true, edit: true, refund: true, cancel: true },
    users: { view: true, suspend: true, delete: false, viewDetails: true },
    analytics: { view: true, export: false },
    admins: { view: true, create: false, edit: false, delete: false },
    settings: { view: true, edit: false }
  },
  moderator: {
    restaurants: { view: true, create: false, edit: false, delete: false, approve: false },
    orders: { view: true, edit: false, refund: false, cancel: false },
    users: { view: true, suspend: false, delete: false, viewDetails: false },
    analytics: { view: true, export: false },
    admins: { view: false, create: false, edit: false, delete: false },
    settings: { view: false, edit: false }
  }
}

// Default security settings
export const DEFAULT_SECURITY_SETTINGS: SecuritySettings = {
  maxFailedLoginAttempts: 5,
  lockoutDuration: 30, // 30 minutes
  passwordChangeInterval: 15, // 15 days
  minSessionTimeout: 15, // 15 minutes
  maxSessionTimeout: 480, // 8 hours
  requirePasswordChangeOnFirstLogin: true,
  allowMultipleSessions: false
}