'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useEnhancedAdmin } from '@/contexts/EnhancedAdminContext'
import {
  UserPlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  EnvelopeIcon,
  XMarkIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline'
import { AdminRole, AdminUser } from '@/types/admin'
import AdminInviteModal from '@/components/ui/AdminInviteModal'
import PermissionMatrix from '@/components/ui/PermissionMatrix'

const AdminUserManagement = () => {
  const { 
    currentAdmin, 
    adminUsers, 
    invitations,
    hasRole,
    hasPermission 
  } = useEnhancedAdmin()
  
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [selectedAdmin, setSelectedAdmin] = useState<AdminUser | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState<'all' | AdminRole>('all')

  // Filter admin users
  const filteredAdmins = adminUsers.filter(admin => {
    const matchesSearch = admin.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         admin.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         admin.lastName?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRole = roleFilter === 'all' || admin.role === roleFilter
    return matchesSearch && matchesRole
  })

  const handleViewPermissions = (admin: AdminUser) => {
    setSelectedAdmin(admin)
    // setShowPermissionsModal(true) - removed as modal state was removed
  }

  const getRoleBadgeColor = (role: AdminRole) => {
    switch (role) {
      case 'super_admin':
        return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'admin':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'moderator':
        return 'bg-green-100 text-green-800 border-green-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusColor = (isActive: boolean, lockedUntil: Date | null) => {
    if (lockedUntil && new Date() < lockedUntil) {
      return 'text-red-600 bg-red-50'
    }
    return isActive ? 'text-green-600 bg-green-50' : 'text-gray-600 bg-gray-50'
  }

  const getStatusText = (isActive: boolean, lockedUntil: Date | null) => {
    if (lockedUntil && new Date() < lockedUntil) {
      return 'Locked'
    }
    return isActive ? 'Active' : 'Inactive'
  }

  if (!hasRole('super_admin') && !hasPermission('admins', 'view')) {
    return (
      <div className="bg-white rounded-3xl p-8 shadow-lg border border-gray-100">
        <div className="text-center">
          <ExclamationTriangleIcon className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">You don&apos;t have permission to manage admin users.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-3xl p-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black mb-2">Admin User Management</h1>
            <p className="text-purple-100 text-lg">
              Manage admin accounts, roles, and permissions
            </p>
          </div>
          {hasRole('super_admin') && (
            <button
              onClick={() => setShowInviteModal(true)}
              className="bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white font-bold px-6 py-3 rounded-xl transition-all duration-300 flex items-center space-x-2"
            >
              <UserPlusIcon className="w-5 h-5" />
              <span>Invite Admin</span>
            </button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <UserGroupIcon className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-gray-600 text-sm">Total Admins</p>
              <p className="text-2xl font-bold text-gray-900">{adminUsers.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <CheckCircleIcon className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-gray-600 text-sm">Active</p>
              <p className="text-2xl font-bold text-gray-900">
                {adminUsers.filter(a => a.isActive).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <EnvelopeIcon className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-gray-600 text-sm">Pending Invites</p>
              <p className="text-2xl font-bold text-gray-900">
                {invitations.filter(i => !i.isUsed && new Date() < i.expiresAt).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
              <ClockIcon className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-gray-600 text-sm">Super Admins</p>
              <p className="text-2xl font-bold text-gray-900">
                {adminUsers.filter(a => a.role === 'super_admin').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
        <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search by email, name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as 'all' | AdminRole)}
            className="px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value="all">All Roles</option>
            <option value="super_admin">Super Admin</option>
            <option value="admin">Admin</option>
            <option value="moderator">Moderator</option>
          </select>
        </div>
      </div>

      {/* Admin Users Table */}
      <div className="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">Admin Users</h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-900 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-900 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-900 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-900 uppercase tracking-wider">
                  Last Login
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-900 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredAdmins.map((admin) => (
                <motion.tr
                  key={admin.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold">
                          {(admin.firstName?.[0] || admin.email[0]).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">
                          {admin.firstName && admin.lastName 
                            ? `${admin.firstName} ${admin.lastName}`
                            : 'Admin User'
                          }
                        </p>
                        <p className="text-sm text-gray-600">{admin.email}</p>
                        {admin.id === currentAdmin?.id && (
                          <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full mt-1">
                            You
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full border ${getRoleBadgeColor(admin.role)}`}>
                      {admin.role.replace('_', ' ').toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(admin.isActive, admin.lockedUntil)}`}>
                      {getStatusText(admin.isActive, admin.lockedUntil)}
                    </span>
                    {admin.mustChangePassword && (
                      <div className="flex items-center space-x-1 mt-1">
                        <ExclamationTriangleIcon className="w-3 h-3 text-yellow-500" />
                        <span className="text-xs text-yellow-600">Password change required</span>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {admin.lastLogin 
                      ? new Date(admin.lastLogin).toLocaleDateString()
                      : 'Never'
                    }
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleViewPermissions(admin)}
                        className="text-blue-600 hover:text-blue-700 transition-colors p-2 hover:bg-blue-50 rounded-lg"
                        title="View Permissions"
                      >
                        <EyeIcon className="w-4 h-4" />
                      </button>
                      
                      {hasRole('super_admin') && admin.id !== currentAdmin?.id && (
                        <>
                          <button
                            className="text-green-600 hover:text-green-700 transition-colors p-2 hover:bg-green-50 rounded-lg"
                            title="Edit Admin"
                          >
                            <PencilIcon className="w-4 h-4" />
                          </button>
                          <button
                            className="text-red-600 hover:text-red-700 transition-colors p-2 hover:bg-red-50 rounded-lg"
                            title="Delete Admin"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredAdmins.length === 0 && (
          <div className="text-center py-12">
            <UserGroupIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No admin users found</h3>
            <p className="text-gray-600">Try adjusting your search filters.</p>
          </div>
        )}
      </div>

      {/* Pending Invitations */}
      {invitations.filter(i => !i.isUsed && new Date() < i.expiresAt).length > 0 && (
        <div className="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-xl font-bold text-gray-900">Pending Invitations</h2>
          </div>
          
          <div className="p-6">
            <div className="space-y-4">
              {invitations
                .filter(i => !i.isUsed && new Date() < i.expiresAt)
                .map((invitation) => (
                  <div key={invitation.id} className="flex items-center justify-between p-4 bg-yellow-50 rounded-xl border border-yellow-200">
                    <div className="flex items-center space-x-3">
                      <EnvelopeIcon className="w-5 h-5 text-yellow-600" />
                      <div>
                        <p className="font-semibold text-gray-900">{invitation.email}</p>
                        <p className="text-sm text-gray-600">
                          Role: {invitation.role.replace('_', ' ')} • 
                          Expires: {new Date(invitation.expiresAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                        Pending
                      </span>
                      {hasRole('super_admin') && (
                        <button className="text-red-600 hover:text-red-700 transition-colors p-1">
                          <XMarkIcon className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <AdminInviteModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
      />

      {selectedAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto"
          >
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">
                  {selectedAdmin.firstName || selectedAdmin.email} - Permissions
                </h2>
                <button
                  onClick={() => {/* Close modal - functionality removed */}}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <XMarkIcon className="w-5 h-5 text-gray-400" />
                </button>
              </div>
            </div>
            <div className="p-6">
              <PermissionMatrix
                permissions={selectedAdmin.permissions}
                readOnly={true}
                role={selectedAdmin.role}
              />
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}

export default AdminUserManagement