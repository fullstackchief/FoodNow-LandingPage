'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useEnhancedAdmin } from '@/contexts/EnhancedAdminContext'
import {
  HomeIcon,
  BuildingStorefrontIcon,
  UserGroupIcon,
  ChartBarIcon,
  CogIcon,
  ShieldCheckIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  UserPlusIcon,
  KeyIcon,
  DocumentTextIcon,
  BellIcon
} from '@heroicons/react/24/outline'
import Navigation from '@/components/layout/Navigation'
import AdminUserManagement from '@/components/ui/AdminUserManagement'
import PermissionMatrix from '@/components/ui/PermissionMatrix'
import SecuritySettings from '@/components/ui/SecuritySettings'
import AuditLogger from '@/components/ui/AuditLogger'
import PasswordChangeModal from '@/components/ui/PasswordChangeModal'

const EnhancedAdminDashboard = () => {
  const { 
    currentAdmin, 
    logout, 
    getRemainingSessionTime, 
    hasPermission, 
    hasRole,
    auditLogs,
    adminUsers 
  } = useEnhancedAdmin()
  
  const [activeTab, setActiveTab] = useState('dashboard')
  const [showPasswordModal, setShowPasswordModal] = useState(false)

  if (!currentAdmin) return null

  // Dashboard stats
  const dashboardStats = {
    totalAdmins: adminUsers.length,
    activeAdmins: adminUsers.filter(a => a.isActive).length,
    recentActions: auditLogs.slice(0, 5).length,
    sessionTime: getRemainingSessionTime()
  }

  const navigationItems = [
    {
      id: 'dashboard',
      name: 'Dashboard',
      icon: HomeIcon,
      description: 'Overview and system status'
    },
    {
      id: 'restaurants',
      name: 'Restaurants',
      icon: BuildingStorefrontIcon,
      description: 'Restaurant management and approvals',
      permission: { category: 'restaurants', action: 'view' }
    },
    {
      id: 'admin-users',
      name: 'Admin Users',
      icon: UserGroupIcon,
      description: 'Manage admin accounts and permissions',
      permission: { category: 'admins', action: 'view' }
    },
    {
      id: 'analytics',
      name: 'Analytics',
      icon: ChartBarIcon,
      description: 'Reports and system analytics',
      permission: { category: 'analytics', action: 'view' }
    },
    {
      id: 'audit-logs',
      name: 'Audit Logs',
      icon: DocumentTextIcon,
      description: 'Security and activity logs',
      permission: { category: 'settings', action: 'view' }
    },
    {
      id: 'security',
      name: 'Security Settings',
      icon: ShieldCheckIcon,
      description: 'Security policies and settings',
      permission: { category: 'settings', action: 'edit' }
    }
  ]

  const filteredNavItems = navigationItems.filter(item => {
    if (!item.permission) return true
    return hasPermission(item.permission.category as any, item.permission.action as any)
  })

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <div className="space-y-8">
            {/* Welcome Header */}
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-3xl p-8 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-black mb-2">
                    Welcome back, {currentAdmin.firstName || currentAdmin.email}
                  </h1>
                  <p className="text-blue-100 text-lg">
                    Role: <span className="font-semibold capitalize">{currentAdmin.role.replace('_', ' ')}</span>
                  </p>
                  <p className="text-blue-100 text-sm mt-1">
                    Session expires in {dashboardStats.sessionTime} minutes
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-blue-100 text-sm">Portal Access</p>
                  <p className="font-mono text-sm">/admin-portal-7k9x2m</p>
                </div>
              </div>
            </div>

            {/* Password Change Warning */}
            {currentAdmin.mustChangePassword && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-50 border border-red-200 rounded-2xl p-6"
              >
                <div className="flex items-center space-x-3">
                  <ExclamationTriangleIcon className="w-6 h-6 text-red-600" />
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-red-900">Password Change Required</h3>
                    <p className="text-red-700 mt-1">
                      For security reasons, you must change your password before accessing sensitive features.
                    </p>
                  </div>
                  <button
                    onClick={() => setShowPasswordModal(true)}
                    className="bg-red-600 hover:bg-red-700 text-white font-medium px-4 py-2 rounded-lg transition-colors"
                  >
                    Change Password
                  </button>
                </div>
              </motion.div>
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                    <UserGroupIcon className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-gray-600 text-sm">Total Admins</p>
                    <p className="text-2xl font-bold text-gray-900">{dashboardStats.totalAdmins}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                    <ShieldCheckIcon className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-gray-600 text-sm">Active Admins</p>
                    <p className="text-2xl font-bold text-gray-900">{dashboardStats.activeAdmins}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                    <DocumentTextIcon className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-gray-600 text-sm">Recent Actions</p>
                    <p className="text-2xl font-bold text-gray-900">{dashboardStats.recentActions}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                    <ClockIcon className="w-6 h-6 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-gray-600 text-sm">Session Time</p>
                    <p className="text-2xl font-bold text-gray-900">{dashboardStats.sessionTime}m</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            {hasRole('super_admin') && (
              <div className="bg-white rounded-3xl p-8 shadow-lg border border-gray-100">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Quick Actions</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <button
                    onClick={() => setActiveTab('admin-users')}
                    className="flex items-center space-x-3 p-4 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors text-left"
                  >
                    <UserPlusIcon className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="font-semibold text-blue-900">Invite Admin</p>
                      <p className="text-blue-700 text-sm">Add new admin user</p>
                    </div>
                  </button>

                  <button
                    onClick={() => setShowPasswordModal(true)}
                    className="flex items-center space-x-3 p-4 bg-green-50 hover:bg-green-100 rounded-xl transition-colors text-left"
                  >
                    <KeyIcon className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="font-semibold text-green-900">Change Password</p>
                      <p className="text-green-700 text-sm">Update your password</p>
                    </div>
                  </button>

                  <button
                    onClick={() => setActiveTab('audit-logs')}
                    className="flex items-center space-x-3 p-4 bg-purple-50 hover:bg-purple-100 rounded-xl transition-colors text-left"
                  >
                    <DocumentTextIcon className="w-5 h-5 text-purple-600" />
                    <div>
                      <p className="font-semibold text-purple-900">View Logs</p>
                      <p className="text-purple-700 text-sm">Check audit trail</p>
                    </div>
                  </button>
                </div>
              </div>
            )}

            {/* Recent Activity */}
            <div className="bg-white rounded-3xl p-8 shadow-lg border border-gray-100">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Recent Admin Activity</h2>
              <div className="space-y-4">
                {auditLogs.slice(0, 5).map((log, index) => (
                  <div key={log.id} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-xl">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <BellIcon className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">{log.action}</p>
                      <p className="text-gray-600 text-sm">{log.details}</p>
                      <p className="text-gray-500 text-xs mt-1">
                        {log.adminEmail} • {new Date(log.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
                {auditLogs.length === 0 && (
                  <p className="text-gray-500 text-center py-8">No recent activity to display</p>
                )}
              </div>
            </div>
          </div>
        )

      case 'admin-users':
        return <AdminUserManagement />
      
      case 'audit-logs':
        return <AuditLogger />
      
      case 'security':
        return <SecuritySettings />
      
      default:
        return (
          <div className="bg-white rounded-3xl p-8 shadow-lg border border-gray-100">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Coming Soon</h2>
            <p className="text-gray-600">This feature is under development and will be available soon.</p>
          </div>
        )
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Sidebar Navigation */}
            <div className="lg:w-80 flex-shrink-0">
              <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-6 sticky top-28">
                {/* Admin Profile */}
                <div className="flex items-center space-x-3 mb-8 pb-6 border-b border-gray-100">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center">
                    <span className="text-white font-bold text-lg">
                      {(currentAdmin.firstName?.[0] || currentAdmin.email[0]).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">
                      {currentAdmin.firstName || 'Admin'}
                    </p>
                    <p className="text-sm text-gray-600 capitalize">
                      {currentAdmin.role.replace('_', ' ')}
                    </p>
                  </div>
                </div>

                {/* Navigation Menu */}
                <nav className="space-y-2">
                  {filteredNavItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-left transition-all ${
                        activeTab === item.id
                          ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <item.icon className="w-5 h-5" />
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <p className={`text-xs ${
                          activeTab === item.id ? 'text-blue-100' : 'text-gray-500'
                        }`}>
                          {item.description}
                        </p>
                      </div>
                    </button>
                  ))}
                </nav>

                {/* Logout Button */}
                <button
                  onClick={logout}
                  className="w-full mt-6 flex items-center justify-center space-x-2 px-4 py-3 bg-red-50 hover:bg-red-100 text-red-700 rounded-xl transition-colors border border-red-200"
                >
                  <span className="font-medium">Logout</span>
                </button>
              </div>
            </div>

            {/* Main Content */}
            <div className="flex-1">
              {renderContent()}
            </div>
          </div>
        </div>
      </div>

      {/* Password Change Modal */}
      <PasswordChangeModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
      />
    </div>
  )
}

export default EnhancedAdminDashboard