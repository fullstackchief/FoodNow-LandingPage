'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  XMarkIcon, 
  UserPlusIcon,
  CommandLineIcon,
  ShieldCheckIcon,
  StarIcon,
  UsersIcon,
  EyeIcon,
  EyeSlashIcon
} from '@heroicons/react/24/outline'

interface AdminPermissions {
  restaurants: {
    view: boolean
    create: boolean
    edit: boolean
    delete: boolean
    approve: boolean
  }
  users: {
    view: boolean
    delete: boolean
    suspend: boolean
    viewDetails: boolean
  }
  orders: {
    view: boolean
    edit: boolean
    cancel: boolean
    refund: boolean
  }
  analytics: {
    view: boolean
    export: boolean
  }
  settings: {
    view: boolean
    edit: boolean
  }
  admins: {
    view: boolean
    create: boolean
    edit: boolean
    delete: boolean
  }
}

const DEFAULT_PERMISSIONS: AdminPermissions = {
  restaurants: { view: false, create: false, edit: false, delete: false, approve: false },
  users: { view: false, delete: false, suspend: false, viewDetails: false },
  orders: { view: false, edit: false, cancel: false, refund: false },
  analytics: { view: false, export: false },
  settings: { view: false, edit: false },
  admins: { view: false, create: false, edit: false, delete: false }
}

const ROLE_PRESETS: Record<string, AdminPermissions> = {
  super_admin: {
    restaurants: { view: true, create: true, edit: true, delete: true, approve: true },
    users: { view: true, delete: true, suspend: true, viewDetails: true },
    orders: { view: true, edit: true, cancel: true, refund: true },
    analytics: { view: true, export: true },
    settings: { view: true, edit: true },
    admins: { view: true, create: true, edit: true, delete: true }
  },
  admin: {
    restaurants: { view: true, create: false, edit: true, delete: false, approve: true },
    users: { view: true, delete: false, suspend: true, viewDetails: true },
    orders: { view: true, edit: true, cancel: true, refund: true },
    analytics: { view: true, export: true },
    settings: { view: true, edit: false },
    admins: { view: true, create: false, edit: false, delete: false }
  },
  moderator: {
    restaurants: { view: true, create: false, edit: false, delete: false, approve: false },
    users: { view: true, delete: false, suspend: true, viewDetails: false },
    orders: { view: true, edit: false, cancel: false, refund: false },
    analytics: { view: false, export: false },
    settings: { view: false, edit: false },
    admins: { view: false, create: false, edit: false, delete: false }
  },
  staff: {
    restaurants: { view: true, create: false, edit: false, delete: false, approve: false },
    users: { view: true, delete: false, suspend: false, viewDetails: false },
    orders: { view: true, edit: false, cancel: false, refund: false },
    analytics: { view: false, export: false },
    settings: { view: false, edit: false },
    admins: { view: false, create: false, edit: false, delete: false }
  }
}

interface CreateAdminFormProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  currentUser: any
}

export default function CreateAdminForm({ isOpen, onClose, onSuccess, currentUser }: CreateAdminFormProps) {
  const [formData, setFormData] = useState({
    email: '',
    first_name: '',
    last_name: '',
    password: '',
    confirmPassword: '',
    role: 'staff' as keyof typeof ROLE_PRESETS
  })
  const [permissions, setPermissions] = useState<AdminPermissions>(DEFAULT_PERMISSIONS)
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleRoleChange = (role: keyof typeof ROLE_PRESETS) => {
    setFormData({ ...formData, role })
    setPermissions(ROLE_PRESETS[role])
  }

  const handlePermissionChange = (
    category: keyof AdminPermissions,
    permission: string,
    value: boolean
  ) => {
    setPermissions(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [permission]: value
      }
    }))
  }

  const handleSelectAllCategory = (category: keyof AdminPermissions) => {
    const allTrue = Object.values(permissions[category]).every(v => v === true)
    const newCategoryPerms = Object.keys(permissions[category]).reduce((acc, key) => {
      acc[key] = !allTrue
      return acc
    }, {} as any)
    
    setPermissions(prev => ({
      ...prev,
      [category]: newCategoryPerms
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          permissions,
          created_by: currentUser.id
        })
      })

      const result = await response.json()

      if (result.success) {
        onSuccess()
        // Reset form
        setFormData({
          email: '',
          first_name: '',
          last_name: '',
          password: '',
          confirmPassword: '',
          role: 'staff'
        })
        setPermissions(DEFAULT_PERMISSIONS)
      } else {
        setError(result.error || 'Failed to create admin')
      }
    } catch (err) {
      setError('Network error occurred')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  const getRoleIcon = (role: string) => {
    const icons = {
      super_admin: CommandLineIcon,
      admin: ShieldCheckIcon,
      moderator: StarIcon,
      staff: UsersIcon
    }
    const Icon = icons[role as keyof typeof icons]
    return Icon ? <Icon className="w-5 h-5" /> : null
  }

  const getPermissionCount = (category: keyof AdminPermissions) => {
    return Object.values(permissions[category]).filter(v => v === true).length
  }

  const getTotalPermissions = () => {
    return Object.values(permissions).reduce((total, category) => {
      return total + Object.values(category).filter(v => v === true).length
    }, 0)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <UserPlusIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Create New Admin</h2>
                <p className="text-blue-100 text-sm">
                  {currentUser?.role === 'super_admin' ? '👑 God Mode: Full Access' : 'Limited Admin Creation'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-xl transition-colors"
            >
              <XMarkIcon className="w-6 h-6 text-white" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex">
          {/* Left Side - Basic Info */}
          <div className="flex-1 p-6 border-r border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    First Name
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.first_name}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="John"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Last Name
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.last_name}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Doe"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="john.doe@foodnow.com"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full p-3 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Min 8 characters"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2"
                    >
                      {showPassword ? <EyeSlashIcon className="w-5 h-5 text-gray-400" /> : <EyeIcon className="w-5 h-5 text-gray-400" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirm Password
                  </label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Confirm password"
                  />
                </div>
              </div>

              {/* Role Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Admin Role
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {Object.keys(ROLE_PRESETS).map((role) => {
                    const isDisabled = currentUser?.role !== 'super_admin' && ['super_admin', 'admin'].includes(role)
                    const isSelected = formData.role === role
                    
                    return (
                      <button
                        key={role}
                        type="button"
                        disabled={isDisabled}
                        onClick={() => handleRoleChange(role as keyof typeof ROLE_PRESETS)}
                        className={`p-3 border-2 rounded-lg flex items-center space-x-2 transition-colors ${
                          isSelected 
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : isDisabled
                              ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
                              : 'border-gray-200 hover:border-gray-300 text-gray-700'
                        }`}
                      >
                        {getRoleIcon(role)}
                        <span className="font-medium text-sm">
                          {role === 'super_admin' ? 'God Mode' : role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </span>
                        {role === 'super_admin' && <span>👑</span>}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Permissions Checkboxes */}
          <div className="flex-1 p-6 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Permissions ({getTotalPermissions()} selected)</h3>
              <div className="text-xs text-gray-500">Tick boxes to grant access</div>
            </div>

            <div className="space-y-4">
              {Object.entries(permissions).map(([category, perms]) => (
                <div key={category} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-gray-900 capitalize flex items-center space-x-2">
                      <span>{category.replace('_', ' ')}</span>
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                        {getPermissionCount(category as keyof AdminPermissions)}/{Object.keys(perms).length}
                      </span>
                    </h4>
                    <button
                      type="button"
                      onClick={() => handleSelectAllCategory(category as keyof AdminPermissions)}
                      className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                    >
                      {Object.values(perms).every(v => v === true) ? 'Deselect All' : 'Select All'}
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(perms).map(([permission, enabled]) => (
                      <label key={permission} className="flex items-center space-x-2 cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={Boolean(enabled)}
                          onChange={(e) => handlePermissionChange(
                            category as keyof AdminPermissions,
                            permission,
                            e.target.checked
                          )}
                          className="w-4 h-4 text-blue-600 border-2 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                        />
                        <span className={`text-sm ${enabled ? 'text-blue-700 font-medium' : 'text-gray-600'} group-hover:text-blue-600 transition-colors`}>
                          {permission.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}
          
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Creating admin with <strong>{getTotalPermissions()} permissions</strong> across {Object.keys(permissions).length} categories
            </div>
            
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg font-medium transition-colors flex items-center space-x-2"
              >
                {loading && <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>}
                <span>{loading ? 'Creating...' : 'Create Admin'}</span>
                {formData.role === 'super_admin' && <span>👑</span>}
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}