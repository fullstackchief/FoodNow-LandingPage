'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import Link from 'next/link'
import CreateAdminForm from '@/components/admin/CreateAdminForm'
import ErrorBoundary from '@/components/ui/ErrorBoundary'
import { prodLog } from '@/lib/logger'
import {
  UserPlusIcon,
  UsersIcon,
  ShieldCheckIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  CheckCircleIcon,
  XCircleIcon,
  CommandLineIcon,
  StarIcon,
  ArrowLeftIcon,
  HomeIcon
} from '@heroicons/react/24/outline'

interface AdminUser {
  id: string
  email: string
  first_name: string
  last_name: string
  role: 'super_admin' | 'admin' | 'moderator' | 'staff'
  permissions: any
  is_active: boolean
  last_login?: string
  created_at: string
  created_by?: string
}

const ROLE_COLORS = {
  super_admin: 'bg-purple-100 text-purple-800 border-purple-200',
  admin: 'bg-blue-100 text-blue-800 border-blue-200',
  moderator: 'bg-green-100 text-green-800 border-green-200',
  staff: 'bg-gray-100 text-gray-800 border-gray-200'
}

const ROLE_ICONS = {
  super_admin: CommandLineIcon,
  admin: ShieldCheckIcon,
  moderator: StarIcon,
  staff: UsersIcon
}

export default function AdminSystemUserManagement() {
  const { adminUser, isAdminAuthenticated, adminRole, isAdminLoading } = useAuth()
  const router = useRouter()
  const [admins, setAdmins] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [selectedAdmin, setSelectedAdmin] = useState<AdminUser | null>(null)

  const isSuperAdmin = adminRole === 'super_admin'

  useEffect(() => {
    // Wait for admin loading to complete
    if (isAdminLoading) return
    
    if (!isAdminAuthenticated || !adminUser) {
      router.push('/admin-system')
      return
    }

    // Check if user has permission to view admins
    if (!isSuperAdmin && !adminUser?.permissions?.admins?.view) {
      router.push('/admin-systemapp/dashboard')
      return
    }

    loadAdmins()
  }, [isAdminAuthenticated, adminUser, isSuperAdmin, isAdminLoading, router])

  const loadAdmins = async () => {
    try {
      const response = await fetch(`/api/admin/users?requestor=${adminUser?.id}`)
      const result = await response.json()
      
      if (result.success) {
        setAdmins(result.data)
      }
    } catch (error) {
      prodLog.error('Failed to load admins', error, { adminId: adminUser?.id, operation: 'loadAdmins' })
    } finally {
      setLoading(false)
    }
  }

  const getRoleIcon = (role: AdminUser['role']) => {
    const Icon = ROLE_ICONS[role]
    return <Icon className="w-4 h-4" />
  }

  const getRoleBadge = (role: AdminUser['role']) => {
    const colorClass = ROLE_COLORS[role]
    const displayName = role === 'super_admin' ? 'God Mode' : 
                       role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())
    
    return (
      <div className={`flex items-center space-x-1 px-2 py-1 rounded-full border text-xs font-medium ${colorClass}`}>
        {getRoleIcon(role)}
        <span>{displayName}</span>
        {role === 'super_admin' && <span className="ml-1">👑</span>}
      </div>
    )
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading admin management...</p>
        </div>
      </div>
    )
  }

  return (
    <ErrorBoundary showDetails={true}>
      <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Link 
                  href="/admin-systemapp/dashboard"
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ArrowLeftIcon className="w-5 h-5" />
                </Link>
                
                <div className="flex-1 min-w-0">
                  <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate flex items-center space-x-3">
                    <UsersIcon className="w-8 h-8 text-blue-600" />
                    <span>Admin Management</span>
                    {isSuperAdmin && (
                      <span className="text-lg bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium">
                        👑 God Mode
                      </span>
                    )}
                  </h1>
                  <div className="mt-1 flex flex-col sm:flex-row sm:flex-wrap sm:mt-0 sm:space-x-6">
                    <div className="mt-2 flex items-center text-sm text-gray-500">
                      <span className="mr-2">🔐</span>
                      Manage administrators and their permissions
                    </div>
                  </div>
                </div>
              </div>
              
              {(isSuperAdmin || adminUser?.permissions?.admins?.create) && (
                <div className="flex space-x-3">
                  <Link 
                    href="/admin-systemapp/dashboard"
                    className="inline-flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                  >
                    <HomeIcon className="w-4 h-4 mr-2" />
                    Dashboard
                  </Link>
                  <button
                    onClick={() => setShowCreateForm(true)}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <UserPlusIcon className="w-4 h-4 mr-2" />
                    Create Admin
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CommandLineIcon className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      God Mode Admins
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {admins.filter(a => a.role === 'super_admin').length}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ShieldCheckIcon className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total Admins
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {admins.length}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CheckCircleIcon className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Active
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {admins.filter(a => a.is_active).length}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <XCircleIcon className="h-6 w-6 text-red-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Inactive
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {admins.filter(a => !a.is_active).length}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Admin List */}
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Administrator Accounts
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              Manage administrator accounts and their permissions.
            </p>
          </div>
          
          <ul role="list" className="divide-y divide-gray-200">
            {admins.map((admin, index) => (
              <motion.li
                key={admin.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="px-4 py-4 hover:bg-gray-50"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-12 w-12">
                      <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center">
                        <span className="text-lg font-medium text-gray-700">
                          {admin.first_name.charAt(0)}{admin.last_name.charAt(0)}
                        </span>
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className="flex items-center space-x-3">
                        <p className="text-sm font-medium text-gray-900">
                          {admin.first_name} {admin.last_name}
                        </p>
                        {getRoleBadge(admin.role)}
                        {admin.is_active ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            Inactive
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">{admin.email}</p>
                      <div className="flex items-center space-x-4 text-xs text-gray-400 mt-1">
                        <span>{getPermissionCount(admin.permissions)} permissions</span>
                        <span>•</span>
                        <span>Created {new Date(admin.created_at).toLocaleDateString()}</span>
                        {admin.last_login && (
                          <>
                            <span>•</span>
                            <span>Last login {new Date(admin.last_login).toLocaleDateString()}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setSelectedAdmin(admin)}
                      className="inline-flex items-center p-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <EyeIcon className="h-4 w-4" />
                    </button>
                    
                    {(isSuperAdmin || adminUser?.permissions?.admins?.create) && (
                      <button
                        className="inline-flex items-center p-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                    )}
                    
                    {isSuperAdmin && admin.role !== 'super_admin' && (
                      <button
                        className="inline-flex items-center p-2 border border-red-300 rounded-md shadow-sm text-sm font-medium text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              </motion.li>
            ))}
          </ul>
        </div>

        {/* Create Admin Form Modal */}
        {showCreateForm && (
          <CreateAdminForm 
            isOpen={showCreateForm}
            onClose={() => setShowCreateForm(false)}
            onSuccess={() => {
              setShowCreateForm(false)
              loadAdmins()
            }}
            currentUser={adminUser}
          />
        )}

        {/* Admin Details Modal (placeholder) */}
        {selectedAdmin && (
          <AdminDetailsModal
            admin={selectedAdmin}
            onClose={() => setSelectedAdmin(null)}
            currentUser={adminUser}
          />
        )}
      </div>
      </div>
    </ErrorBoundary>
  )
}

// Admin Details Modal Component (placeholder)
function AdminDetailsModal({ admin, onClose, currentUser }: any) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const suppressUnused = currentUser
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-96 overflow-y-auto">
        <h3 className="text-lg font-medium mb-4">Admin Details for {admin.first_name} {admin.last_name}</h3>
        <pre className="text-xs bg-gray-100 p-4 rounded overflow-auto">
          {JSON.stringify(admin, null, 2)}
        </pre>
        <button
          onClick={onClose}
          className="mt-4 bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
        >
          Close
        </button>
      </div>
    </div>
  )
}