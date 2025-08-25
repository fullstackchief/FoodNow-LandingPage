'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  XMarkIcon, 
  LockClosedIcon, 
  EyeIcon, 
  EyeSlashIcon,
  KeyIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline'
import { useEnhancedAdmin } from '@/contexts/EnhancedAdminContext'

interface PasswordChangeModalProps {
  isOpen: boolean
  onClose: () => void
}

const PasswordChangeModal = ({ isOpen, onClose }: PasswordChangeModalProps) => {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  
  const { changePassword, currentAdmin } = useEnhancedAdmin()

  const passwordStrength = (password: string) => {
    let strength = 0
    if (password.length >= 16) strength++
    if (password.length >= 20) strength++
    if (/[A-Z]/.test(password)) strength++
    if (/[a-z]/.test(password)) strength++
    if (/[0-9]/.test(password)) strength++
    if (/[^A-Za-z0-9]/.test(password)) strength++
    return strength
  }

  const getStrengthLabel = (strength: number) => {
    if (strength <= 2) return { label: 'Weak', color: 'text-red-600 bg-red-100' }
    if (strength <= 4) return { label: 'Medium', color: 'text-yellow-600 bg-yellow-100' }
    return { label: 'Strong', color: 'text-green-600 bg-green-100' }
  }

  const getStrengthProgress = (strength: number) => {
    const percentage = (strength / 6) * 100
    let colorClass = 'bg-red-500'
    if (strength > 2) colorClass = 'bg-yellow-500'
    if (strength > 4) colorClass = 'bg-green-500'
    return { percentage, colorClass }
  }

  const validatePassword = (password: string) => {
    const errors = []
    if (password.length < 16) errors.push('Must be at least 16 characters long')
    if (!/[A-Z]/.test(password)) errors.push('Must contain uppercase letter')
    if (!/[a-z]/.test(password)) errors.push('Must contain lowercase letter')
    if (!/[0-9]/.test(password)) errors.push('Must contain number')
    if (!/[^A-Za-z0-9]/.test(password)) errors.push('Must contain special character')
    return errors
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Validation
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match')
      return
    }

    const validationErrors = validatePassword(newPassword)
    if (validationErrors.length > 0) {
      setError(validationErrors[0])
      return
    }

    if (passwordStrength(newPassword) < 4) {
      setError('Password is too weak. Please choose a stronger password.')
      return
    }

    setIsLoading(true)

    try {
      const result = await changePassword(currentPassword, newPassword)
      
      if (result.success) {
        setSuccess(true)
        setTimeout(() => {
          handleClose()
        }, 2000)
      } else {
        setError(result.error || 'Failed to change password')
      }
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
    setShowCurrentPassword(false)
    setShowNewPassword(false)
    setShowConfirmPassword(false)
    setError('')
    setSuccess(false)
    setIsLoading(false)
    onClose()
  }

  const strength = passwordStrength(newPassword)
  const strengthInfo = getStrengthLabel(strength)
  const strengthProgress = getStrengthProgress(strength)
  const validationErrors = newPassword ? validatePassword(newPassword) : []

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
            className="relative w-full max-w-md bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20"
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
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Password Changed!</h2>
                <p className="text-gray-600 mb-6">
                  Your password has been successfully updated. You can now use your new password for future logins.
                </p>
                <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                  <div className="flex items-center space-x-2">
                    <ShieldCheckIcon className="w-5 h-5 text-blue-600" />
                    <p className="text-sm text-blue-800">
                      <span className="font-semibold">Security Reminder:</span> Keep your password secure and don't share it with others.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <>
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center">
                      <KeyIcon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-black text-gray-900">Change Password</h2>
                      <p className="text-sm text-gray-600">Update your account password</p>
                    </div>
                  </div>
                  <button
                    onClick={handleClose}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <XMarkIcon className="w-5 h-5 text-gray-400" />
                  </button>
                </div>

                {/* Password Change Requirement */}
                {currentAdmin?.mustChangePassword && (
                  <div className="p-6 pb-0">
                    <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center space-x-3">
                      <ExclamationTriangleIcon className="w-5 h-5 text-red-600" />
                      <p className="text-red-800 text-sm font-medium">
                        Password change is required before accessing sensitive features.
                      </p>
                    </div>
                  </div>
                )}

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
                  {/* Current Password */}
                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-3">
                      Current Password
                    </label>
                    <div className="relative">
                      <LockClosedIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type={showCurrentPassword ? 'text' : 'password'}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="Enter your current password"
                        required
                        className="w-full pl-12 pr-12 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        {showCurrentPassword ? (
                          <EyeSlashIcon className="w-5 h-5" />
                        ) : (
                          <EyeIcon className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* New Password */}
                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-3">
                      New Password
                    </label>
                    <div className="relative">
                      <KeyIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Enter your new password"
                        required
                        className="w-full pl-12 pr-12 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        {showNewPassword ? (
                          <EyeSlashIcon className="w-5 h-5" />
                        ) : (
                          <EyeIcon className="w-5 h-5" />
                        )}
                      </button>
                    </div>

                    {/* Password Strength Indicator */}
                    {newPassword && (
                      <div className="mt-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-medium text-gray-600">Password Strength</span>
                          <span className={`text-xs font-semibold px-2 py-1 rounded-full ${strengthInfo.color}`}>
                            {strengthInfo.label}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${strengthProgress.percentage}%` }}
                            className={`h-2 rounded-full ${strengthProgress.colorClass} transition-all duration-300`}
                          />
                        </div>
                      </div>
                    )}

                    {/* Password Requirements */}
                    {newPassword && validationErrors.length > 0 && (
                      <div className="mt-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                        <p className="text-xs font-semibold text-yellow-800 mb-2">Password Requirements:</p>
                        <ul className="space-y-1">
                          {validationErrors.map((error, index) => (
                            <li key={index} className="text-xs text-yellow-700 flex items-center space-x-2">
                              <span className="w-1 h-1 bg-yellow-600 rounded-full"></span>
                              <span>{error}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-3">
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <LockClosedIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm your new password"
                        required
                        className="w-full pl-12 pr-12 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        {showConfirmPassword ? (
                          <EyeSlashIcon className="w-5 h-5" />
                        ) : (
                          <EyeIcon className="w-5 h-5" />
                        )}
                      </button>
                    </div>

                    {/* Password Match Indicator */}
                    {confirmPassword && (
                      <div className="mt-2">
                        {newPassword === confirmPassword ? (
                          <div className="flex items-center space-x-2 text-green-600">
                            <CheckCircleIcon className="w-4 h-4" />
                            <span className="text-xs font-medium">Passwords match</span>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-2 text-red-600">
                            <ExclamationTriangleIcon className="w-4 h-4" />
                            <span className="text-xs font-medium">Passwords do not match</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

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
                      disabled={isLoading || validationErrors.length > 0 || newPassword !== confirmPassword}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="px-8 py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-bold rounded-xl transition-all duration-300 shadow-lg shadow-green-500/30 disabled:shadow-none flex items-center space-x-2"
                    >
                      {isLoading ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          <span>Updating...</span>
                        </>
                      ) : (
                        <>
                          <KeyIcon className="w-5 h-5" />
                          <span>Change Password</span>
                        </>
                      )}
                    </motion.button>
                  </div>
                </form>

                {/* Security Tips */}
                <div className="p-6 pt-0">
                  <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                    <div className="flex items-start space-x-3">
                      <ShieldCheckIcon className="w-5 h-5 text-blue-600 mt-0.5" />
                      <div className="flex-1">
                        <h4 className="text-sm font-semibold text-blue-900 mb-1">Password Security Tips</h4>
                        <ul className="text-xs text-blue-800 space-y-1">
                          <li>• Use a passphrase with 16+ characters</li>
                          <li>• Mix uppercase, lowercase, numbers, and symbols</li>
                          <li>• Avoid common words or personal information</li>
                          <li>• Consider using a password manager</li>
                        </ul>
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

export default PasswordChangeModal