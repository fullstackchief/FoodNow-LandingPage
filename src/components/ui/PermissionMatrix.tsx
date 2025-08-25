'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { AdminPermissions, AdminRole } from '@/types/admin'
import { 
  CheckIcon, 
  XMarkIcon,
  BuildingStorefrontIcon,
  ClipboardDocumentListIcon,
  UserGroupIcon,
  ChartBarIcon,
  ShieldCheckIcon,
  CogIcon
} from '@heroicons/react/24/outline'

interface PermissionMatrixProps {
  permissions: AdminPermissions
  onChange?: (permissions: AdminPermissions) => void
  readOnly?: boolean
  role?: AdminRole
}

const PermissionMatrix = ({ 
  permissions, 
  onChange, 
  readOnly = false, 
  role 
}: PermissionMatrixProps) => {
  const [expandedCategories, setExpandedCategories] = useState<string[]>(['restaurants'])

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category)
        : [...prev, category]
    )
  }

  const handlePermissionChange = (
    category: keyof AdminPermissions, 
    action: string, 
    value: boolean
  ) => {
    if (readOnly || !onChange) return

    const updatedPermissions = {
      ...permissions,
      [category]: {
        ...permissions[category],
        [action]: value
      }
    }
    onChange(updatedPermissions)
  }

  const categoryConfig = {
    restaurants: {
      name: 'Restaurant Management',
      icon: BuildingStorefrontIcon,
      description: 'Manage restaurant accounts, approvals, and settings',
      color: 'orange'
    },
    orders: {
      name: 'Order Management', 
      icon: ClipboardDocumentListIcon,
      description: 'Handle orders, refunds, and customer support',
      color: 'blue'
    },
    users: {
      name: 'User Management',
      icon: UserGroupIcon, 
      description: 'Manage customer accounts and user data',
      color: 'green'
    },
    analytics: {
      name: 'Analytics & Reports',
      icon: ChartBarIcon,
      description: 'View system analytics and export reports',
      color: 'purple'
    },
    admins: {
      name: 'Admin Management',
      icon: ShieldCheckIcon,
      description: 'Manage admin users and permissions',
      color: 'red'
    },
    settings: {
      name: 'System Settings',
      icon: CogIcon,
      description: 'Configure system settings and policies',
      color: 'gray'
    }
  }

  const actionLabels = {
    view: 'View',
    create: 'Create', 
    edit: 'Edit',
    delete: 'Delete',
    approve: 'Approve',
    refund: 'Refund',
    cancel: 'Cancel',
    suspend: 'Suspend',
    viewDetails: 'View Details',
    export: 'Export'
  }

  const getColorClasses = (color: string, isActive: boolean = false) => {
    const colors = {
      orange: isActive ? 'bg-orange-500 text-white' : 'bg-orange-50 text-orange-700 border-orange-200',
      blue: isActive ? 'bg-blue-500 text-white' : 'bg-blue-50 text-blue-700 border-blue-200', 
      green: isActive ? 'bg-green-500 text-white' : 'bg-green-50 text-green-700 border-green-200',
      purple: isActive ? 'bg-purple-500 text-white' : 'bg-purple-50 text-purple-700 border-purple-200',
      red: isActive ? 'bg-red-500 text-white' : 'bg-red-50 text-red-700 border-red-200',
      gray: isActive ? 'bg-gray-500 text-white' : 'bg-gray-50 text-gray-700 border-gray-200'
    }
    return colors[color as keyof typeof colors] || colors.gray
  }

  return (
    <div className="space-y-4">
      {/* Role Badge */}
      {role && (
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-bold text-gray-900 capitalize">
              {role.replace('_', ' ')} Permissions
            </h3>
            <p className="text-sm text-gray-600">
              {readOnly ? 'View permissions for this role' : 'Configure permissions for this role'}
            </p>
          </div>
          <span className={`px-3 py-1 text-sm font-semibold rounded-full ${
            role === 'super_admin' ? 'bg-purple-100 text-purple-800' :
            role === 'admin' ? 'bg-blue-100 text-blue-800' :
            'bg-green-100 text-green-800'
          }`}>
            {role.replace('_', ' ').toUpperCase()}
          </span>
        </div>
      )}

      {/* Permission Categories */}
      <div className="space-y-4">
        {Object.entries(categoryConfig).map(([categoryKey, config]) => {
          const categoryPermissions = permissions[categoryKey as keyof AdminPermissions] as Record<string, boolean>
          const isExpanded = expandedCategories.includes(categoryKey)
          const Icon = config.icon
          
          return (
            <motion.div
              key={categoryKey}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white border border-gray-200 rounded-xl overflow-hidden"
            >
              {/* Category Header */}
              <button
                onClick={() => toggleCategory(categoryKey)}
                className={`w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors border border-transparent ${getColorClasses(config.color)}`}
              >
                <div className="flex items-center space-x-3">
                  <Icon className="w-5 h-5" />
                  <div className="text-left">
                    <h4 className="font-semibold">{config.name}</h4>
                    <p className="text-xs opacity-80">{config.description}</p>
                  </div>
                </div>
                <motion.div
                  animate={{ rotate: isExpanded ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </motion.div>
              </button>

              {/* Category Permissions */}
              <motion.div
                initial={false}
                animate={{ height: isExpanded ? 'auto' : 0 }}
                className="overflow-hidden"
              >
                <div className="p-4 bg-gray-50 border-t border-gray-200">
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                    {Object.entries(categoryPermissions).map(([action, hasPermission]) => (
                      <div
                        key={action}
                        className="flex items-center space-x-2"
                      >
                        {readOnly ? (
                          <div className={`w-5 h-5 rounded flex items-center justify-center ${
                            hasPermission 
                              ? 'bg-green-500 text-white' 
                              : 'bg-gray-300 text-gray-600'
                          }`}>
                            {hasPermission ? (
                              <CheckIcon className="w-3 h-3" />
                            ) : (
                              <XMarkIcon className="w-3 h-3" />
                            )}
                          </div>
                        ) : (
                          <input
                            type="checkbox"
                            checked={hasPermission}
                            onChange={(e) => handlePermissionChange(
                              categoryKey as keyof AdminPermissions,
                              action,
                              e.target.checked
                            )}
                            className={`w-5 h-5 rounded transition-colors ${getColorClasses(config.color, hasPermission).includes('text-white') ? 'text-' + config.color + '-600' : 'text-gray-600'} focus:ring-2 focus:ring-${config.color}-500`}
                          />
                        )}
                        <label className="text-sm font-medium text-gray-700 capitalize cursor-pointer">
                          {actionLabels[action as keyof typeof actionLabels] || action}
                        </label>
                      </div>
                    ))}
                  </div>
                  
                  {/* Permission Summary */}
                  <div className="mt-4 pt-3 border-t border-gray-200">
                    <div className="flex items-center justify-between text-xs text-gray-600">
                      <span>
                        {Object.values(categoryPermissions).filter(Boolean).length} of {Object.keys(categoryPermissions).length} permissions enabled
                      </span>
                      <div className="flex items-center space-x-2">
                        {Object.values(categoryPermissions).filter(Boolean).length === Object.keys(categoryPermissions).length ? (
                          <span className="flex items-center space-x-1 text-green-600">
                            <CheckIcon className="w-3 h-3" />
                            <span>Full Access</span>
                          </span>
                        ) : Object.values(categoryPermissions).filter(Boolean).length === 0 ? (
                          <span className="flex items-center space-x-1 text-red-600">
                            <XMarkIcon className="w-3 h-3" />
                            <span>No Access</span>
                          </span>
                        ) : (
                          <span className="flex items-center space-x-1 text-yellow-600">
                            <div className="w-3 h-3 bg-yellow-500 rounded-sm"></div>
                            <span>Partial Access</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )
        })}
      </div>

      {/* Permission Summary */}
      <div className="bg-blue-50 rounded-xl p-4 border border-blue-200 mt-6">
        <h4 className="font-semibold text-blue-900 mb-2">Permission Summary</h4>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div className="text-center">
            <p className="text-blue-600 font-bold text-lg">
              {Object.values(permissions).reduce((total, category) => 
                total + Object.values(category).filter(Boolean).length, 0
              )}
            </p>
            <p className="text-blue-700">Total Permissions</p>
          </div>
          <div className="text-center">
            <p className="text-blue-600 font-bold text-lg">
              {Object.values(permissions).filter(category => 
                Object.values(category).some(Boolean)
              ).length}
            </p>
            <p className="text-blue-700">Active Categories</p>
          </div>
          <div className="text-center">
            <p className="text-blue-600 font-bold text-lg">
              {Math.round(
                (Object.values(permissions).reduce((total, category) => 
                  total + Object.values(category).filter(Boolean).length, 0
                ) / Object.values(permissions).reduce((total, category) => 
                  total + Object.keys(category).length, 0
                )) * 100
              )}%
            </p>
            <p className="text-blue-700">Access Level</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PermissionMatrix