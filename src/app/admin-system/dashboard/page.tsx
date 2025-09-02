'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import Link from 'next/link'
import {
  BuildingStorefrontIcon,
  UserGroupIcon,
  ChartBarIcon,
  ClockIcon,
  CheckCircleIcon,
  CommandLineIcon,
  ShieldCheckIcon,
  StarIcon,
  UsersIcon,
  ArrowRightIcon,
  PowerIcon
} from '@heroicons/react/24/outline'

export default function AdminSystemDashboard() {
  const { isAdminAuthenticated, adminUser, logout } = useAuth()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!isAdminAuthenticated || !adminUser) {
      router.push('/admin-system')
      return
    }
    setIsLoading(false)
  }, [isAdminAuthenticated, adminUser, router])

  const handleLogout = async () => {
    await logout()
    router.push('/')
  }

  const getRoleIcon = (role: string) => {
    const icons = {
      super_admin: CommandLineIcon,
      admin: ShieldCheckIcon,
      moderator: StarIcon,
      staff: UsersIcon
    }
    return icons[role as keyof typeof icons] || UsersIcon
  }

  const getRoleColor = (role: string) => {
    const colors = {
      super_admin: 'from-purple-500 to-purple-600',
      admin: 'from-blue-500 to-blue-600',
      moderator: 'from-green-500 to-green-600',
      staff: 'from-gray-500 to-gray-600'
    }
    return colors[role as keyof typeof colors] || 'from-gray-500 to-gray-600'
  }

  const getPermissionCount = (permissions: any) => {
    if (!permissions) return 0
    let count = 0
    Object.values(permissions).forEach((category: any) => {
      if (typeof category === 'object') {
        count += Object.values(category).filter(p => p === true).length
      }
    })
    return count
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    )
  }

  const quickActions = [
    {
      title: 'User Management',
      description: 'Manage administrator accounts and permissions',
      href: '/admin-system/users',
      icon: UserGroupIcon,
      color: 'bg-blue-500',
      available: adminUser?.role === 'super_admin' || adminUser?.permissions?.admins?.view
    },
    {
      title: 'Restaurant Applications',
      description: 'Review and approve restaurant applications', 
      href: '/admin-system/applications',
      icon: BuildingStorefrontIcon,
      color: 'bg-green-500',
      available: adminUser?.permissions?.restaurants?.view !== false
    },
    {
      title: 'System Analytics',
      description: 'View platform statistics and insights',
      href: '/admin/analytics',
      icon: ChartBarIcon,
      color: 'bg-purple-500',
      available: adminUser?.permissions?.analytics?.view !== false
    },
    {
      title: 'Order Management',
      description: 'Monitor and manage platform orders',
      href: '/admin/orders',
      icon: ClockIcon,
      color: 'bg-orange-500',
      available: adminUser?.permissions?.orders?.view !== false
    }
  ].filter(action => action.available)

  const RoleIcon = getRoleIcon(adminUser?.role || '')

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center space-x-4">
              <Link href="/" className="flex items-center space-x-3 group">
                <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
                  <span className="text-white font-black text-lg">F</span>
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900 group-hover:text-orange-600 transition-colors">
                    FoodNow
                  </h1>
                  <p className="text-xs text-gray-500">Administration System</p>
                </div>
              </Link>
            </div>

            {/* User Info & Logout */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3 text-right">
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {adminUser?.first_name} {adminUser?.last_name}
                  </p>
                  <p className="text-xs text-gray-500 flex items-center justify-end space-x-1">
                    <RoleIcon className="w-3 h-3" />
                    <span className="capitalize">
                      {adminUser?.role === 'super_admin' ? 'God Mode' : adminUser?.role?.replace('_', ' ')}
                    </span>
                    {adminUser?.role === 'super_admin' && <span>👑</span>}
                  </p>
                </div>
                <div className={`w-12 h-12 bg-gradient-to-br ${getRoleColor(adminUser?.role || '')} rounded-full flex items-center justify-center text-white font-medium shadow-lg`}>
                  {adminUser?.first_name?.charAt(0)}{adminUser?.last_name?.charAt(0)}
                </div>
              </div>
              
              <button
                onClick={handleLogout}
                className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Logout"
              >
                <PowerIcon className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl p-6 text-white"
          >
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold mb-2">
                  Welcome back, {adminUser?.first_name}
                </h1>
                <p className="text-blue-100 mb-4">
                  You have {getPermissionCount(adminUser?.permissions)} active permissions across the system
                </p>
                <div className="flex items-center space-x-4 text-sm text-blue-100">
                  <span>🔐 Secure Session Active</span>
                  <span>•</span>
                  <span>Last Login: {adminUser?.last_login ? new Date(adminUser.last_login).toLocaleDateString() : 'First time'}</span>
                </div>
              </div>
              <div className="hidden sm:block">
                <div className="w-20 h-20 bg-white/10 rounded-2xl flex items-center justify-center">
                  <RoleIcon className="w-10 h-10 text-white" />
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Quick Actions Grid */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {quickActions.map((action, index) => {
              const Icon = action.icon
              return (
                <motion.div
                  key={action.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.5 }}
                >
                  <Link href={action.href}>
                    <div className="bg-white rounded-xl p-6 shadow-sm border hover:shadow-md transition-all duration-200 group cursor-pointer">
                      <div className="flex items-center justify-between mb-4">
                        <div className={`w-12 h-12 ${action.color} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                          <Icon className="w-6 h-6 text-white" />
                        </div>
                        <ArrowRightIcon className="w-4 h-4 text-gray-400 group-hover:text-gray-600 group-hover:translate-x-1 transition-all" />
                      </div>
                      <h3 className="font-semibold text-gray-900 mb-2">{action.title}</h3>
                      <p className="text-sm text-gray-600">{action.description}</p>
                    </div>
                  </Link>
                </motion.div>
              )
            })}
          </div>
        </div>

        {/* System Status */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="bg-white rounded-xl p-6 shadow-sm border"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">System Status</h3>
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Platform Status</span>
                <span className="text-green-600 font-medium flex items-center space-x-1">
                  <CheckCircleIcon className="w-4 h-4" />
                  <span>Online</span>
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Database</span>
                <span className="text-green-600 font-medium flex items-center space-x-1">
                  <CheckCircleIcon className="w-4 h-4" />
                  <span>Connected</span>
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Security</span>
                <span className="text-green-600 font-medium flex items-center space-x-1">
                  <CheckCircleIcon className="w-4 h-4" />
                  <span>Secure</span>
                </span>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="bg-white rounded-xl p-6 shadow-sm border"
          >
            <h3 className="font-semibold text-gray-900 mb-4">Your Permissions</h3>
            <div className="space-y-2">
              {adminUser?.permissions && Object.entries(adminUser.permissions).map(([category, perms]) => {
                if (typeof perms !== 'object') return null
                const enabledCount = Object.values(perms).filter(p => p === true).length
                const totalCount = Object.keys(perms).length
                
                return (
                  <div key={category} className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 capitalize">{category.replace('_', ' ')}</span>
                    <span className="font-medium text-gray-900">
                      {enabledCount}/{totalCount}
                    </span>
                  </div>
                )
              })}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="bg-white rounded-xl p-6 shadow-sm border"
          >
            <h3 className="font-semibold text-gray-900 mb-4">Session Info</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Role Level</span>
                <span className="font-medium text-gray-900 capitalize">
                  {adminUser?.role === 'super_admin' ? 'God Mode' : adminUser?.role?.replace('_', ' ')}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Account Status</span>
                <span className="text-green-600 font-medium">Active</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Login Time</span>
                <span className="text-gray-900 font-medium">
                  {new Date().toLocaleTimeString()}
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}