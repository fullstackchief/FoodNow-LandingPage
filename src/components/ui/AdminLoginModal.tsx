'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { XMarkIcon, LockClosedIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline'
import { useAdmin } from '@/contexts/AdminContext'

interface AdminLoginModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

const AdminLoginModal = ({ isOpen, onClose, onSuccess }: AdminLoginModalProps) => {
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { login } = useAdmin()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    // Simulate loading time
    setTimeout(() => {
      const success = login(password)
      if (success) {
        setPassword('')
        setError('')
        onSuccess?.()
        onClose()
      } else {
        setError('Invalid admin password. Please try again.')
      }
      setIsLoading(false)
    }, 1000)
  }

  const handleClose = () => {
    setPassword('')
    setError('')
    setShowPassword(false)
    onClose()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/50 z-50"
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center">
                      <LockClosedIcon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-white">Admin Access</h2>
                      <p className="text-blue-100 text-sm">Secure administrator login</p>
                    </div>
                  </div>
                  <button
                    onClick={handleClose}
                    className="p-2 hover:bg-white/10 rounded-xl transition-colors"
                  >
                    <XMarkIcon className="w-5 h-5 text-white" />
                  </button>
                </div>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="p-6">
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Administrator Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full p-3 pr-12 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter admin password"
                      required
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
                      disabled={isLoading}
                    >
                      {showPassword ? (
                        <EyeSlashIcon className="w-5 h-5" />
                      ) : (
                        <EyeIcon className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                  {error && (
                    <p className="text-red-600 text-sm mt-2 flex items-center space-x-1">
                      <span>⚠️</span>
                      <span>{error}</span>
                    </p>
                  )}
                </div>

                {/* Demo credentials info */}
                <div className="mb-6 p-3 bg-gray-50 rounded-xl border border-gray-200">
                  <p className="text-xs text-gray-600 mb-1">
                    <span className="font-medium">Demo Credentials:</span>
                  </p>
                  <p className="text-xs text-gray-500 font-mono">
                    Password: foodnow-admin-2024
                  </p>
                </div>

                {/* Buttons */}
                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="flex-1 py-3 px-4 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium transition-colors"
                    disabled={isLoading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 px-4 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white rounded-xl font-medium transition-colors flex items-center justify-center"
                    disabled={isLoading || !password}
                  >
                    {isLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin mr-2"></div>
                        Verifying...
                      </>
                    ) : (
                      <>
                        <LockClosedIcon className="w-4 h-4 mr-2" />
                        Login
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

export default AdminLoginModal