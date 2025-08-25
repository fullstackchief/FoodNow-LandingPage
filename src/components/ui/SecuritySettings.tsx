'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useEnhancedAdmin } from '@/contexts/EnhancedAdminContext'
import {
  ShieldCheckIcon,
  ClockIcon,
  KeyIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  LockClosedIcon,
  UserIcon,
  CogIcon
} from '@heroicons/react/24/outline'
import { SecuritySettings as SecuritySettingsType, DEFAULT_SECURITY_SETTINGS } from '@/types/admin'

const SecuritySettings = () => {
  const { securitySettings, updateSecuritySettings, hasRole, hasPermission } = useEnhancedAdmin()
  const [localSettings, setLocalSettings] = useState<SecuritySettingsType>(securitySettings)
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  if (!hasRole('super_admin') && !hasPermission('settings', 'edit')) {
    return (
      <div className="bg-white rounded-3xl p-8 shadow-lg border border-gray-100">
        <div className="text-center">
          <ExclamationTriangleIcon className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">You don't have permission to modify security settings.</p>
        </div>
      </div>
    )
  }

  const handleSave = async () => {
    setIsLoading(true)
    setError('')

    try {
      const result = await updateSecuritySettings(localSettings)
      if (result.success) {
        setSuccess(true)
        setTimeout(() => setSuccess(false), 3000)
      } else {
        setError(result.error || 'Failed to update settings')
      }
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const handleReset = () => {
    setLocalSettings(DEFAULT_SECURITY_SETTINGS)
    setError('')
    setSuccess(false)
  }

  const handleSettingChange = (key: keyof SecuritySettingsType, value: number | boolean) => {
    setLocalSettings(prev => ({
      ...prev,
      [key]: value
    }))
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-3xl p-8 text-white">
        <div className="flex items-center space-x-3">
          <ShieldCheckIcon className="w-10 h-10" />
          <div>
            <h1 className="text-3xl font-black mb-2">Security Settings</h1>
            <p className="text-red-100 text-lg">
              Configure security policies and authentication settings
            </p>
          </div>
        </div>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="p-4 bg-green-50 border border-green-200 rounded-xl flex items-center space-x-3"
        >
          <CheckCircleIcon className="w-5 h-5 text-green-600" />
          <p className="text-green-800 font-medium">Security settings updated successfully!</p>
        </motion.div>
      )}

      {error && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center space-x-3"
        >
          <ExclamationTriangleIcon className="w-5 h-5 text-red-600" />
          <p className="text-red-800 font-medium">{error}</p>
        </motion.div>
      )}

      {/* Authentication Security */}
      <div className="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center space-x-3">
            <LockClosedIcon className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-bold text-gray-900">Authentication Security</h2>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Failed Login Attempts */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">Maximum Failed Login Attempts</h3>
              <p className="text-sm text-gray-600">Number of failed attempts before account lockout</p>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="number"
                min="3"
                max="10"
                value={localSettings.maxFailedLoginAttempts}
                onChange={(e) => handleSettingChange('maxFailedLoginAttempts', parseInt(e.target.value))}
                className="w-20 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-center"
              />
              <span className="text-sm text-gray-500">attempts</span>
            </div>
          </div>

          {/* Lockout Duration */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">Account Lockout Duration</h3>
              <p className="text-sm text-gray-600">Minutes to lock account after failed attempts</p>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="number"
                min="15"
                max="120"
                step="15"
                value={localSettings.lockoutDuration}
                onChange={(e) => handleSettingChange('lockoutDuration', parseInt(e.target.value))}
                className="w-20 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-center"
              />
              <span className="text-sm text-gray-500">minutes</span>
            </div>
          </div>
        </div>
      </div>

      {/* Password Policies */}
      <div className="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center space-x-3">
            <KeyIcon className="w-6 h-6 text-green-600" />
            <h2 className="text-xl font-bold text-gray-900">Password Policies</h2>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Password Change Interval */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">Password Change Interval</h3>
              <p className="text-sm text-gray-600">Days before password must be changed</p>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="number"
                min="7"
                max="90"
                value={localSettings.passwordChangeInterval}
                onChange={(e) => handleSettingChange('passwordChangeInterval', parseInt(e.target.value))}
                className="w-20 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-center"
              />
              <span className="text-sm text-gray-500">days</span>
            </div>
          </div>

          {/* Require Password Change on First Login */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">Force Password Change on First Login</h3>
              <p className="text-sm text-gray-600">New admins must change password immediately</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={localSettings.requirePasswordChangeOnFirstLogin}
                onChange={(e) => handleSettingChange('requirePasswordChangeOnFirstLogin', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
            </label>
          </div>
        </div>
      </div>

      {/* Session Management */}
      <div className="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center space-x-3">
            <ClockIcon className="w-6 h-6 text-purple-600" />
            <h2 className="text-xl font-bold text-gray-900">Session Management</h2>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Minimum Session Timeout */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">Minimum Session Timeout</h3>
              <p className="text-sm text-gray-600">Shortest allowed session duration</p>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="number"
                min="5"
                max="60"
                step="5"
                value={localSettings.minSessionTimeout}
                onChange={(e) => handleSettingChange('minSessionTimeout', parseInt(e.target.value))}
                className="w-20 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-center"
              />
              <span className="text-sm text-gray-500">minutes</span>
            </div>
          </div>

          {/* Maximum Session Timeout */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">Maximum Session Timeout</h3>
              <p className="text-sm text-gray-600">Longest allowed session duration</p>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="number"
                min="60"
                max="1440"
                step="60"
                value={localSettings.maxSessionTimeout}
                onChange={(e) => handleSettingChange('maxSessionTimeout', parseInt(e.target.value))}
                className="w-20 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-center"
              />
              <span className="text-sm text-gray-500">minutes</span>
            </div>
          </div>

          {/* Allow Multiple Sessions */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">Allow Multiple Sessions</h3>
              <p className="text-sm text-gray-600">Allow admins to log in from multiple devices</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={localSettings.allowMultipleSessions}
                onChange={(e) => handleSettingChange('allowMultipleSessions', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
            </label>
          </div>
        </div>
      </div>

      {/* Security Recommendations */}
      <div className="bg-blue-50 rounded-3xl p-6 border border-blue-200">
        <div className="flex items-start space-x-3">
          <ShieldCheckIcon className="w-6 h-6 text-blue-600 mt-1" />
          <div>
            <h3 className="text-lg font-bold text-blue-900 mb-3">Security Recommendations</h3>
            <ul className="space-y-2 text-sm text-blue-800">
              <li className="flex items-center space-x-2">
                <CheckCircleIcon className="w-4 h-4 text-blue-600" />
                <span>Keep failed login attempts between 3-5 for optimal security</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircleIcon className="w-4 h-4 text-blue-600" />
                <span>Set lockout duration to at least 30 minutes</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircleIcon className="w-4 h-4 text-blue-600" />
                <span>Require password changes every 15-30 days for high security</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircleIcon className="w-4 h-4 text-blue-600" />
                <span>Limit session timeout to 4-8 hours for active environments</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between p-6 bg-white rounded-2xl shadow-lg border border-gray-100">
        <button
          onClick={handleReset}
          className="px-6 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 font-medium rounded-xl transition-colors"
        >
          Reset to Defaults
        </button>

        <div className="flex items-center space-x-4">
          <div className="text-right text-sm text-gray-600">
            <p>Changes will be applied to all admin users</p>
            <p>Current settings are automatically saved</p>
          </div>
          <motion.button
            onClick={handleSave}
            disabled={isLoading}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="px-8 py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-bold rounded-xl transition-all duration-300 shadow-lg shadow-red-500/30 disabled:shadow-none flex items-center space-x-2"
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>Saving...</span>
              </>
            ) : (
              <>
                <CogIcon className="w-5 h-5" />
                <span>Save Security Settings</span>
              </>
            )}
          </motion.button>
        </div>
      </div>
    </div>
  )
}

export default SecuritySettings