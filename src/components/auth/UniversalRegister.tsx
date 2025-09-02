'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { 
  registerUser, 
  type UserRole, 
  type RegisterData,
  getRoleDisplayName 
} from '@/lib/authService'
import { 
  EyeIcon, 
  EyeSlashIcon,
  UserIcon,
  BuildingStorefrontIcon,
  TruckIcon
} from '@heroicons/react/24/outline'

interface UniversalRegisterProps {
  defaultRole?: UserRole
  showRoleSelection?: boolean
  redirectTo?: string
}

const UniversalRegister = ({ 
  defaultRole = 'customer', 
  showRoleSelection = true,
  redirectTo 
}: UniversalRegisterProps) => {
  const router = useRouter()
  const [selectedRole, setSelectedRole] = useState<UserRole>(defaultRole)
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: ''
  })

  const roleOptions: Array<{
    value: UserRole
    label: string
    description: string
    icon: any
    available: boolean
  }> = [
    {
      value: 'customer',
      label: 'Customer',
      description: 'Order food from restaurants',
      icon: UserIcon,
      available: true
    },
    {
      value: 'restaurant_owner',
      label: 'Restaurant Partner',
      description: 'List your restaurant and manage orders',
      icon: BuildingStorefrontIcon,
      available: true
    },
    {
      value: 'rider',
      label: 'Delivery Rider',
      description: 'Deliver food and earn money',
      icon: TruckIcon,
      available: true
    }
    // Admin roles are NOT available for public registration
    // Admins are created via secure invitation system only
  ]

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const validateForm = (): string | null => {
    if (!formData.firstName.trim()) return 'First name is required'
    if (!formData.lastName.trim()) return 'Last name is required'
    if (!formData.email.trim()) return 'Email is required'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) return 'Invalid email format'
    if (!formData.password) return 'Password is required'
    if (formData.password.length < 6) return 'Password must be at least 6 characters'
    if (formData.password !== formData.confirmPassword) return 'Passwords do not match'
    if (selectedRole !== 'customer' && !formData.phone.trim()) return 'Phone number is required for this role'
    
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const validationError = validateForm()
    if (validationError) {
      setError(validationError)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const registerData: RegisterData = {
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
        role: selectedRole,
        phone: formData.phone || undefined
      }

      const { data: user, error } = await registerUser(registerData)

      if (error || !user) {
        setError(error || 'Failed to register user')
        return
      }

      // Registration successful
      if (selectedRole === 'customer') {
        // Customer can use the app immediately
        router.push(redirectTo || '/dashboard')
      } else {
        // Other roles need verification/approval
        router.push('/auth/verification-pending')
      }
    } catch (error) {
      console.error('Registration error:', error)
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Create your account
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Join FoodNow and start your journey
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-3xl shadow-premium p-8"
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Role Selection */}
            {showRoleSelection && (
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700">
                  I want to join as
                </label>
                <div className="grid grid-cols-1 gap-3">
                  {roleOptions.filter(option => option.available).map((option) => {
                    const IconComponent = option.icon
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setSelectedRole(option.value)}
                        className={`relative flex items-center p-4 rounded-2xl border-2 text-left transition-all ${
                          selectedRole === option.value
                            ? 'border-orange-500 bg-orange-50'
                            : 'border-gray-200 hover:border-gray-300 bg-white'
                        }`}
                      >
                        <IconComponent className={`w-6 h-6 mr-3 ${
                          selectedRole === option.value ? 'text-orange-600' : 'text-gray-500'
                        }`} />
                        <div>
                          <div className={`font-medium ${
                            selectedRole === option.value ? 'text-orange-900' : 'text-gray-900'
                          }`}>
                            {option.label}
                          </div>
                          <div className={`text-sm ${
                            selectedRole === option.value ? 'text-orange-700' : 'text-gray-600'
                          }`}>
                            {option.description}
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Name Fields */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                  First Name *
                </label>
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  required
                  value={formData.firstName}
                  onChange={handleInputChange}
                  className="mt-1 w-full px-3 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="John"
                />
              </div>
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                  Last Name *
                </label>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  required
                  value={formData.lastName}
                  onChange={handleInputChange}
                  className="mt-1 w-full px-3 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Doe"
                />
              </div>
            </div>

            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email Address *
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleInputChange}
                className="mt-1 w-full px-3 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="john@example.com"
              />
            </div>

            {/* Phone Field (required for non-customers) */}
            {(selectedRole !== 'customer' || formData.phone) && (
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                  Phone Number {selectedRole !== 'customer' ? '*' : '(Optional)'}
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  required={selectedRole !== 'customer'}
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="mt-1 w-full px-3 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="+234 XXX XXX XXXX"
                />
              </div>
            )}

            {/* Password Fields */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password *
              </label>
              <div className="mt-1 relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full px-3 py-3 pr-12 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Min. 6 characters"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                  ) : (
                    <EyeIcon className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Confirm Password *
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                value={formData.confirmPassword}
                onChange={handleInputChange}
                className="mt-1 w-full px-3 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="Confirm your password"
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* Role-specific Notice */}
            {selectedRole !== 'customer' && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
                <p className="text-sm text-blue-600">
                  <strong>Note:</strong> {getRoleDisplayName(selectedRole)} accounts require verification and approval. 
                  You&apos;ll receive an email once your application is reviewed.
                </p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Creating Account...</span>
                </div>
              ) : (
                `Create ${getRoleDisplayName(selectedRole)} Account`
              )}
            </button>

            {/* Sign In Link */}
            <div className="text-center">
              <p className="text-sm text-gray-600">
                Already have an account?{' '}
                <Link href="/auth/login" className="font-medium text-orange-600 hover:text-orange-500">
                  Sign in here
                </Link>
              </p>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  )
}

export default UniversalRegister