'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, Upload, Check, AlertCircle, User, Building2, Truck } from 'lucide-react'
import { UserRole } from '@/lib/authService'
import { supabase } from '@/lib/supabase-client'
import { devLog, prodLog } from '@/lib/logger'
import DocumentUpload from './DocumentUpload'
import { getDocumentRequirements } from '@/lib/documentRequirements'

// Registration step types
interface BaseRegistrationStep {
  id: string
  title: string
  description: string
  isCompleted: boolean
  isOptional?: boolean
}

interface RegistrationData {
  // Basic info
  email: string
  password: string
  firstName: string
  lastName: string
  phone: string
  role: UserRole
  
  // Restaurant owner specific
  businessName?: string
  businessAddress?: string
  businessPhone?: string
  businessEmail?: string
  cuisineTypes?: string[]
  registrationNumber?: string
  taxId?: string
  
  // Rider specific
  vehicleType?: 'motorcycle' | 'bicycle' | 'car' | 'scooter'
  licenseNumber?: string
  vehicleRegistration?: string
  hasInsurance?: boolean
  workingAreas?: string[]
  
  // Documents
  documents?: {
    [key: string]: File | string
  }
}

interface MultiStepRegistrationProps {
  onComplete: (data: RegistrationData) => Promise<void>
  onCancel?: () => void
  initialRole?: UserRole
}

export default function MultiStepRegistration({ 
  onComplete, 
  onCancel,
  initialRole = 'customer'
}: MultiStepRegistrationProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [registrationData, setRegistrationData] = useState<RegistrationData>({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phone: '',
    role: initialRole,
    documents: {}
  })

  // Generate steps based on role
  const generateSteps = (role: UserRole): BaseRegistrationStep[] => {
    const baseSteps: BaseRegistrationStep[] = [
      {
        id: 'role_selection',
        title: 'Choose Your Role',
        description: 'Select how you want to use FoodNow',
        isCompleted: false
      },
      {
        id: 'basic_info',
        title: 'Basic Information',
        description: 'Tell us about yourself',
        isCompleted: false
      }
    ]

    if (role === 'restaurant_owner') {
      baseSteps.push(
        {
          id: 'business_info',
          title: 'Business Details',
          description: 'Information about your restaurant',
          isCompleted: false
        },
        {
          id: 'business_documents',
          title: 'Business Documents',
          description: 'Upload required business documents',
          isCompleted: false
        }
      )
    } else if (role === 'rider') {
      baseSteps.push(
        {
          id: 'rider_info',
          title: 'Delivery Information',
          description: 'Vehicle and delivery details',
          isCompleted: false
        },
        {
          id: 'rider_documents',
          title: 'Required Documents',
          description: 'Upload license and vehicle documents',
          isCompleted: false
        }
      )
    }

    baseSteps.push({
      id: 'review_submit',
      title: 'Review & Submit',
      description: 'Confirm your information',
      isCompleted: false
    })

    return baseSteps
  }

  const [steps, setSteps] = useState<BaseRegistrationStep[]>(generateSteps(initialRole))

  // Update steps when role changes
  useEffect(() => {
    const newSteps = generateSteps(registrationData.role)
    setSteps(newSteps)
    
    // Reset to appropriate step if role changed
    if (currentStep > 1) {
      setCurrentStep(1) // Go back to basic info step
    }
  }, [registrationData.role, currentStep])

  const updateRegistrationData = (updates: Partial<RegistrationData>) => {
    setRegistrationData(prev => ({ ...prev, ...updates }))
  }

  const validateStep = (stepId: string): boolean => {
    switch (stepId) {
      case 'role_selection':
        return !!registrationData.role

      case 'basic_info':
        return !!(
          registrationData.email &&
          registrationData.password &&
          registrationData.firstName &&
          registrationData.lastName &&
          registrationData.phone
        )

      case 'business_info':
        return !!(
          registrationData.businessName &&
          registrationData.businessAddress &&
          registrationData.businessPhone &&
          registrationData.cuisineTypes?.length
        )

      case 'rider_info':
        return !!(
          registrationData.vehicleType &&
          registrationData.licenseNumber &&
          registrationData.workingAreas?.length
        )

      case 'business_documents':
      case 'rider_documents':
        // Documents are optional for now
        return true

      case 'review_submit':
        return true

      default:
        return false
    }
  }

  const handleNext = () => {
    const currentStepData = steps[currentStep]
    if (validateStep(currentStepData.id)) {
      // Mark current step as completed
      const updatedSteps = [...steps]
      updatedSteps[currentStep].isCompleted = true
      setSteps(updatedSteps)

      if (currentStep < steps.length - 1) {
        setCurrentStep(currentStep + 1)
      }
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    try {
      await onComplete(registrationData)
    } catch (error) {
      prodLog.error('Multi-step registration submission failed', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case 'customer':
        return <User className="w-8 h-8" />
      case 'restaurant_owner':
        return <Building2 className="w-8 h-8" />
      case 'rider':
        return <Truck className="w-8 h-8" />
      default:
        return <User className="w-8 h-8" />
    }
  }

  const getRoleDescription = (role: UserRole) => {
    switch (role) {
      case 'customer':
        return 'Order food from your favorite restaurants'
      case 'restaurant_owner':
        return 'List your restaurant and manage orders'
      case 'rider':
        return 'Deliver orders and earn money'
      default:
        return ''
    }
  }

  const renderStepContent = () => {
    const currentStepData = steps[currentStep]

    switch (currentStepData.id) {
      case 'role_selection':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                How do you want to use FoodNow?
              </h3>
              <p className="text-gray-600">
                Choose your role to get started with the right features for you.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {(['customer', 'restaurant_owner', 'rider'] as UserRole[]).map((role) => (
                <button
                  key={role}
                  onClick={() => updateRegistrationData({ role })}
                  className={`p-4 border rounded-lg text-left transition-all ${
                    registrationData.role === role
                      ? 'border-orange-500 bg-orange-50 ring-2 ring-orange-200'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`${
                      registrationData.role === role ? 'text-orange-600' : 'text-gray-400'
                    }`}>
                      {getRoleIcon(role)}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 capitalize">
                        {role.replace('_', ' ')}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {getRoleDescription(role)}
                      </p>
                    </div>
                    {registrationData.role === role && (
                      <Check className="w-5 h-5 text-orange-600" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )

      case 'basic_info':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Tell us about yourself
              </h3>
              <p className="text-gray-600">
                We need some basic information to create your account.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  First Name *
                </label>
                <input
                  type="text"
                  value={registrationData.firstName}
                  onChange={(e) => updateRegistrationData({ firstName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Enter your first name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Last Name *
                </label>
                <input
                  type="text"
                  value={registrationData.lastName}
                  onChange={(e) => updateRegistrationData({ lastName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Enter your last name"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address *
              </label>
              <input
                type="email"
                value={registrationData.email}
                onChange={(e) => updateRegistrationData({ email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="Enter your email address"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password *
              </label>
              <input
                type="password"
                value={registrationData.password}
                onChange={(e) => updateRegistrationData({ password: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="Create a secure password"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number *
              </label>
              <input
                type="tel"
                value={registrationData.phone}
                onChange={(e) => updateRegistrationData({ phone: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="+234 xxx xxx xxxx"
              />
            </div>
          </div>
        )

      case 'business_info':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Business Information
              </h3>
              <p className="text-gray-600">
                Tell us about your restaurant to get started.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Business Name *
              </label>
              <input
                type="text"
                value={registrationData.businessName || ''}
                onChange={(e) => updateRegistrationData({ businessName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="Enter your restaurant name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Business Address *
              </label>
              <textarea
                value={registrationData.businessAddress || ''}
                onChange={(e) => updateRegistrationData({ businessAddress: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="Enter your restaurant's full address"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Business Phone *
                </label>
                <input
                  type="tel"
                  value={registrationData.businessPhone || ''}
                  onChange={(e) => updateRegistrationData({ businessPhone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Business phone number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Business Email
                </label>
                <input
                  type="email"
                  value={registrationData.businessEmail || ''}
                  onChange={(e) => updateRegistrationData({ businessEmail: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Business email (optional)"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cuisine Types *
              </label>
              <div className="grid grid-cols-3 gap-2">
                {['Nigerian', 'Continental', 'Chinese', 'Indian', 'Italian', 'Fast Food', 'Pizza', 'Seafood', 'Vegetarian'].map((cuisine) => (
                  <label key={cuisine} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={registrationData.cuisineTypes?.includes(cuisine) || false}
                      onChange={(e) => {
                        const currentTypes = registrationData.cuisineTypes || []
                        if (e.target.checked) {
                          updateRegistrationData({ cuisineTypes: [...currentTypes, cuisine] })
                        } else {
                          updateRegistrationData({ cuisineTypes: currentTypes.filter(t => t !== cuisine) })
                        }
                      }}
                      className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">{cuisine}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Registration Number
                </label>
                <input
                  type="text"
                  value={registrationData.registrationNumber || ''}
                  onChange={(e) => updateRegistrationData({ registrationNumber: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="CAC registration number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tax ID (TIN)
                </label>
                <input
                  type="text"
                  value={registrationData.taxId || ''}
                  onChange={(e) => updateRegistrationData({ taxId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Tax identification number"
                />
              </div>
            </div>
          </div>
        )

      case 'rider_info':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Delivery Information
              </h3>
              <p className="text-gray-600">
                Tell us about your vehicle and delivery preferences.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Vehicle Type *
              </label>
              <div className="grid grid-cols-2 gap-4">
                {(['motorcycle', 'bicycle', 'car', 'scooter'] as const).map((vehicle) => (
                  <button
                    key={vehicle}
                    type="button"
                    onClick={() => updateRegistrationData({ vehicleType: vehicle })}
                    className={`p-4 border rounded-lg text-left transition-all ${
                      registrationData.vehicleType === vehicle
                        ? 'border-orange-500 bg-orange-50 ring-2 ring-orange-200'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`text-2xl ${
                        registrationData.vehicleType === vehicle ? 'text-orange-600' : 'text-gray-400'
                      }`}>
                        {vehicle === 'motorcycle' && '🏍️'}
                        {vehicle === 'bicycle' && '🚲'}
                        {vehicle === 'car' && '🚗'}
                        {vehicle === 'scooter' && '🛵'}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 capitalize">
                          {vehicle}
                        </h4>
                      </div>
                      {registrationData.vehicleType === vehicle && (
                        <Check className="w-5 h-5 text-orange-600" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                License Number *
              </label>
              <input
                type="text"
                value={registrationData.licenseNumber || ''}
                onChange={(e) => updateRegistrationData({ licenseNumber: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="Enter your driver's license number"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Vehicle Registration Number
              </label>
              <input
                type="text"
                value={registrationData.vehicleRegistration || ''}
                onChange={(e) => updateRegistrationData({ vehicleRegistration: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="Vehicle registration number"
              />
            </div>

            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={registrationData.hasInsurance || false}
                  onChange={(e) => updateRegistrationData({ hasInsurance: e.target.checked })}
                  className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                />
                <span className="ml-2 text-sm text-gray-700">
                  I have valid vehicle insurance
                </span>
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Preferred Working Areas *
              </label>
              <div className="grid grid-cols-2 gap-2">
                {['Victoria Island', 'Ikoyi', 'Lekki', 'Ikeja', 'Surulere', 'Yaba', 'Ajah', 'Maryland', 'Gbagada', 'Apapa'].map((area) => (
                  <label key={area} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={registrationData.workingAreas?.includes(area) || false}
                      onChange={(e) => {
                        const currentAreas = registrationData.workingAreas || []
                        if (e.target.checked) {
                          updateRegistrationData({ workingAreas: [...currentAreas, area] })
                        } else {
                          updateRegistrationData({ workingAreas: currentAreas.filter(a => a !== area) })
                        }
                      }}
                      className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">{area}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )

      case 'business_documents':
        return (
          <DocumentUpload
            documentRequirements={getDocumentRequirements('restaurant_owner')}
            onDocumentsChange={(docs) => {
              // Convert UploadedDocument to File | string
              const convertedDocs: { [key: string]: File | string } = {}
              Object.entries(docs).forEach(([key, doc]) => {
                convertedDocs[key] = doc.file
              })
              updateRegistrationData({ documents: convertedDocs })
            }}
            userRole="restaurant_owner"
          />
        )

      case 'rider_documents':
        return (
          <DocumentUpload
            documentRequirements={getDocumentRequirements('rider')}
            onDocumentsChange={(docs) => {
              // Convert UploadedDocument to File | string
              const convertedDocs: { [key: string]: File | string } = {}
              Object.entries(docs).forEach(([key, doc]) => {
                convertedDocs[key] = doc.file
              })
              updateRegistrationData({ documents: convertedDocs })
            }}
            userRole="rider"
          />
        )

      case 'review_submit':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Review Your Information
              </h3>
              <p className="text-gray-600">
                Please review all information before submitting your application.
              </p>
            </div>

            {/* Personal Information */}
            <div className="border border-gray-200 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-3">Personal Information</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Name:</span>
                  <p className="font-medium">{registrationData.firstName} {registrationData.lastName}</p>
                </div>
                <div>
                  <span className="text-gray-500">Email:</span>
                  <p className="font-medium">{registrationData.email}</p>
                </div>
                <div>
                  <span className="text-gray-500">Phone:</span>
                  <p className="font-medium">{registrationData.phone}</p>
                </div>
                <div>
                  <span className="text-gray-500">Role:</span>
                  <p className="font-medium capitalize">{registrationData.role.replace('_', ' ')}</p>
                </div>
              </div>
            </div>

            {/* Role-specific information */}
            {registrationData.role === 'restaurant_owner' && (
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-3">Business Information</h4>
                <div className="grid grid-cols-1 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Business Name:</span>
                    <p className="font-medium">{registrationData.businessName}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Business Address:</span>
                    <p className="font-medium">{registrationData.businessAddress}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Cuisine Types:</span>
                    <p className="font-medium">{registrationData.cuisineTypes?.join(', ')}</p>
                  </div>
                </div>
              </div>
            )}

            {registrationData.role === 'rider' && (
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-3">Delivery Information</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Vehicle Type:</span>
                    <p className="font-medium capitalize">{registrationData.vehicleType}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">License Number:</span>
                    <p className="font-medium">{registrationData.licenseNumber}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Insurance:</span>
                    <p className="font-medium">{registrationData.hasInsurance ? 'Yes' : 'No'}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Working Areas:</span>
                    <p className="font-medium">{registrationData.workingAreas?.join(', ')}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex">
                <AlertCircle className="h-5 w-5 text-blue-400 mt-0.5" />
                <div className="ml-3">
                  <h4 className="text-sm font-medium text-blue-800">
                    What happens next?
                  </h4>
                  <ul className="mt-2 text-sm text-blue-700 space-y-1">
                    <li>• Your application will be reviewed by our team</li>
                    <li>• You'll receive an email confirmation</li>
                    <li>• Verification typically takes 1-3 business days</li>
                    <li>• You'll be notified once your account is approved</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )

      default:
        return (
          <div className="text-center py-8">
            <p className="text-gray-600">Step content under development...</p>
          </div>
        )
    }
  }

  const progress = ((currentStep + 1) / steps.length) * 100

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>Step {currentStep + 1} of {steps.length}</span>
          <span>{Math.round(progress)}% Complete</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <motion.div
            className="bg-orange-600 h-2 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      {/* Step Content */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {renderStepContent()}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <button
          onClick={onCancel || handlePrevious}
          disabled={currentStep === 0}
          className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          {currentStep === 0 ? 'Cancel' : 'Previous'}
        </button>

        <button
          onClick={currentStep === steps.length - 1 ? handleSubmit : handleNext}
          disabled={!validateStep(steps[currentStep].id) || isSubmitting}
          className="flex items-center px-6 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              Submitting...
            </>
          ) : currentStep === steps.length - 1 ? (
            'Complete Registration'
          ) : (
            <>
              Next
              <ChevronRight className="w-4 h-4 ml-1" />
            </>
          )}
        </button>
      </div>
    </div>
  )
}