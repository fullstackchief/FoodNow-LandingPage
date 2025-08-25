'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  XMarkIcon, 
  EnvelopeIcon,
  UserGroupIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'
import { useEnhancedAdmin } from '@/contexts/EnhancedAdminContext'
import { AdminRole, AdminPermissions, DEFAULT_PERMISSIONS } from '@/types/admin'
import PermissionMatrix from '@/components/ui/PermissionMatrix'

interface AdminInviteModalProps {
  isOpen: boolean
  onClose: () => void
}

const AdminInviteModal = ({ isOpen, onClose }: AdminInviteModalProps) => {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<AdminRole>('admin')
  const [customPermissions, setCustomPermissions] = useState<AdminPermissions>(DEFAULT_PERMISSIONS.admin)
  const [useCustomPermissions, setUseCustomPermissions] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  
  const { createAdminInvitation } = useEnhancedAdmin()

  const handleRoleChange = (newRole: AdminRole) => {
    setRole(newRole)
    setCustomPermissions(DEFAULT_PERMISSIONS[newRole])
    setUseCustomPermissions(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const result = await createAdminInvitation(
        email, 
        role, 
        useCustomPermissions ? customPermissions : undefined
      )
      
      if (result.success) {
        setSuccess(true)
        setTimeout(() => {
          handleClose()
        }, 2000)
      } else {
        setError(result.error || 'Failed to create invitation')
      }
    } catch {
      setError('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    setEmail('')
    setRole('admin')
    setCustomPermissions(DEFAULT_PERMISSIONS.admin)
    setUseCustomPermissions(false)
    setIsLoading(false)
    setSuccess(false)
    setError('')
    onClose()
  }

  const roleDescriptions = {
    super_admin: 'Full system access with all administrative privileges',
    admin: 'Restaurant and order management with limited system access',
    moderator: 'Basic viewing and reporting capabilities'
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm"
          onClick={handleClose}
        />

        {/* Modal */}
        <div className="flex min-h-screen items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-2xl bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20"
          >
            {success ? (
              // Success State
              <div className="p-8 text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6"
                >
                  <CheckCircleIcon className="w-10 h-10 text-green-600" />
                </motion.div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Invitation Sent!</h2>
                <p className="text-gray-600 mb-6">
                  An invitation has been sent to <span className="font-semibold">{email}</span>
                </p>
                <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                  <p className="text-sm text-blue-800">
                    <span className="font-semibold">Note:</span> In development mode, 
                    invitation details are logged to the browser console.
                  </p>
                </div>
              </div>
            ) : (
              <>
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center">
                      <UserGroupIcon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-black text-gray-900">Invite New Admin</h2>
                      <p className="text-sm text-gray-600">Send invitation to join as admin user</p>
                    </div>
                  </div>
                  <button
                    onClick={handleClose}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <XMarkIcon className="w-5 h-5 text-gray-400" />
                  </button>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="p-6 pb-0">
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center space-x-3"
                    >
                      <ExclamationTriangleIcon className="w-5 h-5 text-red-600" />
                      <p className="text-red-800 text-sm font-medium">{error}</p>
                    </motion.div>
                  </div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                  {/* Email Input */}
                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-3">
                      Email Address
                    </label>
                    <div className="relative">
                      <EnvelopeIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="admin@foodnow.ng"
                        required
                        className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      Invitation will be sent to this email address
                    </p>
                  </div>

                  {/* Role Selection */}
                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-3">
                      Admin Role
                    </label>
                    <div className="space-y-3">
                      {Object.entries(roleDescriptions).map(([roleKey, description]) => (
                        <label
                          key={roleKey}
                          className={`flex items-start space-x-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                            role === roleKey 
                              ? 'border-purple-500 bg-purple-50' 
                              : 'border-gray-200 hover:border-gray-300 bg-white'
                          }`}
                        >
                          <input
                            type="radio"
                            name="role"
                            value={roleKey}
                            checked={role === roleKey}
                            onChange={(e) => handleRoleChange(e.target.value as AdminRole)}
                            className="mt-1 text-purple-600 focus:ring-purple-500"
                          />
                          <div className="flex-1">
                            <p className={`font-semibold capitalize ${
                              role === roleKey ? 'text-purple-900' : 'text-gray-900'
                            }`}>
                              {roleKey.replace('_', ' ')}
                            </p>
                            <p className={`text-sm ${
                              role === roleKey ? 'text-purple-700' : 'text-gray-600'
                            }`}>
                              {description}
                            </p>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Custom Permissions Toggle */}
                  <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={useCustomPermissions}
                        onChange={(e) => setUseCustomPermissions(e.target.checked)}
                        className="text-purple-600 focus:ring-purple-500 rounded"
                      />
                      <div>
                        <p className="font-medium text-gray-900">Customize Permissions</p>
                        <p className="text-sm text-gray-600">
                          Override default role permissions with custom settings
                        </p>
                      </div>
                    </label>
                  </div>

                  {/* Permission Matrix */}
                  {useCustomPermissions && (
                    <div className="border border-gray-200 rounded-xl p-6 bg-gray-50">
                      <h3 className="text-lg font-bold text-gray-900 mb-4">
                        Custom Permissions
                      </h3>
                      <PermissionMatrix
                        permissions={customPermissions}
                        onChange={setCustomPermissions}
                        readOnly={false}
                        role={role}
                      />
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={handleClose}
                      className="px-6 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 font-medium rounded-xl transition-colors"
                    >
                      Cancel
                    </button>
                    <motion.button
                      type="submit"
                      disabled={isLoading}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="px-8 py-3 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-bold rounded-xl transition-all duration-300 shadow-lg shadow-purple-500/30 disabled:shadow-none flex items-center space-x-2"
                    >
                      {isLoading ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          <span>Sending Invitation...</span>
                        </>
                      ) : (
                        <>
                          <EnvelopeIcon className="w-5 h-5" />
                          <span>Send Invitation</span>
                        </>
                      )}
                    </motion.button>
                  </div>
                </form>

                {/* Development Note */}
                <div className="p-6 pt-0">
                  <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-200">
                    <div className="flex items-start space-x-3">
                      <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600 mt-0.5" />
                      <div className="flex-1">
                        <h4 className="text-sm font-semibold text-yellow-900 mb-1">
                          Development Mode
                        </h4>
                        <p className="text-xs text-yellow-800">
                          Email invitations are simulated. Check browser console for invitation details.
                          Default password for all new admins: <span className="font-mono bg-yellow-100 px-1 rounded">FoodNow2025!</span>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  )
}

export default AdminInviteModal