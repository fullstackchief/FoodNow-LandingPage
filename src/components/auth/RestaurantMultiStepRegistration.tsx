'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, Upload, Check, AlertCircle, Building2, FileText, CreditCard, Clock, Camera, User } from 'lucide-react'
import { prodLog } from '@/lib/logger'

// Nigerian states list
const NIGERIAN_STATES = [
  'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue', 'Borno',
  'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 'FCT', 'Gombe',
  'Imo', 'Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Kogi', 'Kwara',
  'Lagos', 'Nasarawa', 'Niger', 'Ogun', 'Ondo', 'Osun', 'Oyo', 'Plateau',
  'Rivers', 'Sokoto', 'Taraba', 'Yobe', 'Zamfara'
]

// Nigerian banks list
const NIGERIAN_BANKS = [
  'Access Bank', 'Ecobank', 'Fidelity Bank', 'First Bank of Nigeria', 'First City Monument Bank',
  'Guaranty Trust Bank', 'Heritage Bank', 'Keystone Bank', 'Polaris Bank', 'Stanbic IBTC Bank',
  'Standard Chartered Bank', 'Sterling Bank', 'Union Bank', 'United Bank for Africa', 'Unity Bank',
  'Wema Bank', 'Zenith Bank', 'Jaiz Bank', 'SunTrust Bank', 'Titan Trust Bank'
]

// Cuisine types for restaurants
const CUISINE_TYPES = [
  'Nigerian', 'Chinese', 'Italian', 'Indian', 'Continental', 'Lebanese', 'Japanese',
  'Mexican', 'Turkish', 'Ethiopian', 'Korean', 'Thai', 'American', 'French', 
  'Mediterranean', 'Vegetarian/Vegan', 'Fast Food', 'BBQ/Grill', 'Seafood', 'Other'
]

// Operating hours template
const OPERATING_HOURS_TEMPLATE = {
  monday: { open: '08:00', close: '22:00', is_open: true },
  tuesday: { open: '08:00', close: '22:00', is_open: true },
  wednesday: { open: '08:00', close: '22:00', is_open: true },
  thursday: { open: '08:00', close: '22:00', is_open: true },
  friday: { open: '08:00', close: '22:00', is_open: true },
  saturday: { open: '08:00', close: '22:00', is_open: true },
  sunday: { open: '08:00', close: '22:00', is_open: true }
}

// Registration step types
interface BaseRegistrationStep {
  id: string
  title: string
  description: string
  isCompleted: boolean
  icon: React.ReactNode
}

interface RestaurantRegistrationData {
  // Step 1: Business Information
  restaurantName: string
  cacRegistrationNumber: string
  taxIdentificationNumber: string
  businessAddress: string
  state: string
  businessDescription: string
  establishedYear: number | ''
  
  // Step 2: Owner Details
  ownerFullName: string
  ownerNIN: string
  ownerPhone: string
  ownerEmail: string
  ownerAddress: string
  
  // Step 3: Document Upload
  documents: {
    cacCertificate?: File | string
    ownerNinFront?: File | string
    ownerNinBack?: File | string
    restaurantPhoto1?: File | string
    restaurantPhoto2?: File | string
    restaurantPhoto3?: File | string
    ownerPhoto?: File | string
  }
  
  // Step 4: Banking Information
  businessBankName: string
  businessAccountNumber: string
  businessAccountName: string
  businessBVN: string
  
  // Step 5: Restaurant Details
  cuisineTypes: string[]
  operatingHours: any
  deliveryRadius: number | ''
  minimumOrderAmount: number | ''
  estimatedDeliveryTime: string
  priceRange: '$' | '$$' | '$$$' | '$$$$' | ''
  specialFeatures: string[]
  
  // Registration metadata
  password: string
  confirmPassword: string
  role: 'restaurant_owner'
  agreeToTerms: boolean
}

interface RestaurantMultiStepRegistrationProps {
  onComplete: (data: RestaurantRegistrationData) => Promise<void>
  onCancel?: () => void
}

export default function RestaurantMultiStepRegistration({ 
  onComplete, 
  onCancel
}: RestaurantMultiStepRegistrationProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<{ [key: string]: string }>({})
  const [registrationData, setRegistrationData] = useState<RestaurantRegistrationData>({
    // Business Information
    restaurantName: '',
    cacRegistrationNumber: '',
    taxIdentificationNumber: '',
    businessAddress: '',
    state: '',
    businessDescription: '',
    establishedYear: '',
    
    // Owner Details
    ownerFullName: '',
    ownerNIN: '',
    ownerPhone: '',
    ownerEmail: '',
    ownerAddress: '',
    
    // Document Uploads
    documents: {},
    
    // Banking Information
    businessBankName: '',
    businessAccountNumber: '',
    businessAccountName: '',
    businessBVN: '',
    
    // Restaurant Details
    cuisineTypes: [],
    operatingHours: OPERATING_HOURS_TEMPLATE,
    deliveryRadius: '',
    minimumOrderAmount: '',
    estimatedDeliveryTime: '30-45 mins',
    priceRange: '',
    specialFeatures: [],
    
    // Registration metadata
    password: '',
    confirmPassword: '',
    role: 'restaurant_owner',
    agreeToTerms: false
  })

  // Generate steps for restaurant registration
  const steps: BaseRegistrationStep[] = [
    {
      id: 'business_info',
      title: 'Business Information',
      description: 'Restaurant name, CAC registration, and tax ID',
      isCompleted: false,
      icon: <Building2 className="w-5 h-5" />
    },
    {
      id: 'owner_details',
      title: 'Owner Details',
      description: 'Owner personal information and verification',
      isCompleted: false,
      icon: <User className="w-5 h-5" />
    },
    {
      id: 'document_upload',
      title: 'Document Upload',
      description: 'Required documents and photos',
      isCompleted: false,
      icon: <FileText className="w-5 h-5" />
    },
    {
      id: 'banking_info',
      title: 'Banking Information',
      description: 'Business account details for payments',
      isCompleted: false,
      icon: <CreditCard className="w-5 h-5" />
    },
    {
      id: 'restaurant_details',
      title: 'Restaurant Details',
      description: 'Operational details and preferences',
      isCompleted: false,
      icon: <Clock className="w-5 h-5" />
    }
  ]

  const updateRegistrationData = (updates: Partial<RestaurantRegistrationData>) => {
    setRegistrationData(prev => ({ ...prev, ...updates }))
  }

  // Validation functions
  const validatePhoneNumber = (phone: string): boolean => {
    const nigerianPhoneRegex = /^(\+234|234|0)(7|8|9)(0|1)\d{8}$/
    return nigerianPhoneRegex.test(phone.replace(/\s+/g, ''))
  }

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const validateBVN = (bvn: string): boolean => {
    return /^\d{11}$/.test(bvn)
  }

  const validateNIN = (nin: string): boolean => {
    return /^\d{11}$/.test(nin)
  }

  const validateAccountNumber = (accountNumber: string): boolean => {
    return /^\d{10}$/.test(accountNumber)
  }

  const validateCACNumber = (cac: string): boolean => {
    // CAC registration numbers can be RC followed by numbers, or BN followed by numbers
    return /^(RC|BN|IT)\d+$/i.test(cac)
  }

  const validateTIN = (tin: string): boolean => {
    // Nigerian TIN format - 8 digits followed by 4 digits
    return /^\d{8}-\d{4}$/.test(tin) || /^\d{12}$/.test(tin)
  }

  const validateStep = (stepId: string): { isValid: boolean; errors: { [key: string]: string } } => {
    const stepErrors: { [key: string]: string } = {}

    switch (stepId) {
      case 'business_info':
        if (!registrationData.restaurantName.trim()) stepErrors.restaurantName = 'Restaurant name is required'
        if (!registrationData.cacRegistrationNumber.trim()) {
          stepErrors.cacRegistrationNumber = 'CAC registration number is required'
        } else if (!validateCACNumber(registrationData.cacRegistrationNumber)) {
          stepErrors.cacRegistrationNumber = 'Please enter a valid CAC registration number (e.g., RC123456)'
        }
        if (!registrationData.taxIdentificationNumber.trim()) {
          stepErrors.taxIdentificationNumber = 'Tax identification number is required'
        } else if (!validateTIN(registrationData.taxIdentificationNumber)) {
          stepErrors.taxIdentificationNumber = 'Please enter a valid TIN (e.g., 12345678-1234 or 123456781234)'
        }
        if (!registrationData.businessAddress.trim()) stepErrors.businessAddress = 'Business address is required'
        if (!registrationData.state) stepErrors.state = 'State is required'
        if (!registrationData.businessDescription.trim()) stepErrors.businessDescription = 'Business description is required'
        if (!registrationData.establishedYear || registrationData.establishedYear < 1900 || registrationData.establishedYear > new Date().getFullYear()) {
          stepErrors.establishedYear = 'Please enter a valid establishment year'
        }
        if (!registrationData.password) {
          stepErrors.password = 'Password is required'
        } else if (registrationData.password.length < 8) {
          stepErrors.password = 'Password must be at least 8 characters long'
        }
        if (registrationData.password !== registrationData.confirmPassword) {
          stepErrors.confirmPassword = 'Passwords do not match'
        }
        break

      case 'owner_details':
        if (!registrationData.ownerFullName.trim()) stepErrors.ownerFullName = 'Owner full name is required'
        if (!registrationData.ownerNIN.trim()) {
          stepErrors.ownerNIN = 'Owner NIN is required'
        } else if (!validateNIN(registrationData.ownerNIN)) {
          stepErrors.ownerNIN = 'NIN must be 11 digits'
        }
        if (!registrationData.ownerPhone.trim()) {
          stepErrors.ownerPhone = 'Owner phone number is required'
        } else if (!validatePhoneNumber(registrationData.ownerPhone)) {
          stepErrors.ownerPhone = 'Please enter a valid Nigerian phone number'
        }
        if (!registrationData.ownerEmail.trim()) {
          stepErrors.ownerEmail = 'Owner email is required'
        } else if (!validateEmail(registrationData.ownerEmail)) {
          stepErrors.ownerEmail = 'Please enter a valid email address'
        }
        if (!registrationData.ownerAddress.trim()) stepErrors.ownerAddress = 'Owner address is required'
        break

      case 'document_upload':
        if (!registrationData.documents.cacCertificate) stepErrors.cacCertificate = 'CAC certificate is required'
        if (!registrationData.documents.ownerNinFront) stepErrors.ownerNinFront = 'Owner NIN front is required'
        if (!registrationData.documents.ownerNinBack) stepErrors.ownerNinBack = 'Owner NIN back is required'
        if (!registrationData.documents.restaurantPhoto1) stepErrors.restaurantPhoto1 = 'Restaurant photo 1 is required'
        if (!registrationData.documents.restaurantPhoto2) stepErrors.restaurantPhoto2 = 'Restaurant photo 2 is required'
        if (!registrationData.documents.restaurantPhoto3) stepErrors.restaurantPhoto3 = 'Restaurant photo 3 is required'
        if (!registrationData.documents.ownerPhoto) stepErrors.ownerPhoto = 'Owner photo is required'
        break

      case 'banking_info':
        if (!registrationData.businessBankName) stepErrors.businessBankName = 'Business bank name is required'
        if (!registrationData.businessAccountNumber.trim()) {
          stepErrors.businessAccountNumber = 'Business account number is required'
        } else if (!validateAccountNumber(registrationData.businessAccountNumber)) {
          stepErrors.businessAccountNumber = 'Account number must be 10 digits'
        }
        if (!registrationData.businessAccountName.trim()) stepErrors.businessAccountName = 'Business account name is required'
        if (!registrationData.businessBVN.trim()) {
          stepErrors.businessBVN = 'Business BVN is required'
        } else if (!validateBVN(registrationData.businessBVN)) {
          stepErrors.businessBVN = 'BVN must be 11 digits'
        }
        // Validate account name matches restaurant name
        if (registrationData.businessAccountName && registrationData.restaurantName) {
          const accountNameLower = registrationData.businessAccountName.toLowerCase()
          const restaurantNameLower = registrationData.restaurantName.toLowerCase()
          if (!accountNameLower.includes(restaurantNameLower.split(' ')[0])) {
            stepErrors.businessAccountName = 'Account name should match or include the restaurant name'
          }
        }
        break

      case 'restaurant_details':
        if (!registrationData.cuisineTypes.length) stepErrors.cuisineTypes = 'Please select at least one cuisine type'
        if (!registrationData.deliveryRadius || registrationData.deliveryRadius < 1 || registrationData.deliveryRadius > 50) {
          stepErrors.deliveryRadius = 'Delivery radius must be between 1-50 km'
        }
        if (!registrationData.minimumOrderAmount || registrationData.minimumOrderAmount < 500) {
          stepErrors.minimumOrderAmount = 'Minimum order amount must be at least ₦500'
        }
        if (!registrationData.priceRange) stepErrors.priceRange = 'Price range is required'
        if (!registrationData.agreeToTerms) stepErrors.agreeToTerms = 'You must agree to the terms and conditions'
        break

      default:
        break
    }

    return {
      isValid: Object.keys(stepErrors).length === 0,
      errors: stepErrors
    }
  }

  const handleNext = async () => {
    const currentStepData = steps[currentStep]
    const validation = validateStep(currentStepData.id)
    
    if (validation.isValid) {
      setErrors({})
      // Mark current step as completed
      steps[currentStep].isCompleted = true

      if (currentStep < steps.length - 1) {
        setCurrentStep(currentStep + 1)
      }
    } else {
      setErrors(validation.errors)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
      setErrors({})
    }
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    try {
      await onComplete(registrationData)
    } catch (error) {
      prodLog.error('Restaurant multi-step registration submission failed', error)
      setErrors({ submit: 'Registration failed. Please try again.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDocumentUpload = (documentType: string, file: File) => {
    updateRegistrationData({
      documents: {
        ...registrationData.documents,
        [documentType]: file
      }
    })
  }

  const renderStepContent = () => {
    const currentStepData = steps[currentStep]

    switch (currentStepData.id) {
      case 'business_info':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Business Information
              </h3>
              <p className="text-gray-600">
                Please provide your restaurant's business details and registration information.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Restaurant Name *
                </label>
                <input
                  type="text"
                  value={registrationData.restaurantName}
                  onChange={(e) => updateRegistrationData({ restaurantName: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                    errors.restaurantName ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter your restaurant name"
                />
                {errors.restaurantName && <p className="text-red-500 text-sm mt-1">{errors.restaurantName}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    CAC Registration Number *
                  </label>
                  <input
                    type="text"
                    value={registrationData.cacRegistrationNumber}
                    onChange={(e) => updateRegistrationData({ cacRegistrationNumber: e.target.value.toUpperCase() })}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                      errors.cacRegistrationNumber ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="e.g., RC123456"
                  />
                  {errors.cacRegistrationNumber && <p className="text-red-500 text-sm mt-1">{errors.cacRegistrationNumber}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tax Identification Number *
                  </label>
                  <input
                    type="text"
                    value={registrationData.taxIdentificationNumber}
                    onChange={(e) => updateRegistrationData({ taxIdentificationNumber: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                      errors.taxIdentificationNumber ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="12345678-1234"
                  />
                  {errors.taxIdentificationNumber && <p className="text-red-500 text-sm mt-1">{errors.taxIdentificationNumber}</p>}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Business Address *
                </label>
                <textarea
                  value={registrationData.businessAddress}
                  onChange={(e) => updateRegistrationData({ businessAddress: e.target.value })}
                  rows={3}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                    errors.businessAddress ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter complete business address"
                />
                {errors.businessAddress && <p className="text-red-500 text-sm mt-1">{errors.businessAddress}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    State *
                  </label>
                  <select
                    value={registrationData.state}
                    onChange={(e) => updateRegistrationData({ state: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                      errors.state ? 'border-red-500' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Select State</option>
                    {NIGERIAN_STATES.map(state => (
                      <option key={state} value={state}>{state}</option>
                    ))}
                  </select>
                  {errors.state && <p className="text-red-500 text-sm mt-1">{errors.state}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Year Established *
                  </label>
                  <input
                    type="number"
                    min="1900"
                    max={new Date().getFullYear()}
                    value={registrationData.establishedYear}
                    onChange={(e) => updateRegistrationData({ establishedYear: parseInt(e.target.value) || '' })}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                      errors.establishedYear ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="e.g., 2018"
                  />
                  {errors.establishedYear && <p className="text-red-500 text-sm mt-1">{errors.establishedYear}</p>}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Business Description *
                </label>
                <textarea
                  value={registrationData.businessDescription}
                  onChange={(e) => updateRegistrationData({ businessDescription: e.target.value })}
                  rows={4}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                    errors.businessDescription ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Describe your restaurant, specialties, and what makes it unique..."
                  maxLength={500}
                />
                <div className="text-right text-sm text-gray-500 mt-1">
                  {registrationData.businessDescription.length}/500
                </div>
                {errors.businessDescription && <p className="text-red-500 text-sm mt-1">{errors.businessDescription}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password *
                  </label>
                  <input
                    type="password"
                    value={registrationData.password}
                    onChange={(e) => updateRegistrationData({ password: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                      errors.password ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Create a secure password"
                  />
                  {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirm Password *
                  </label>
                  <input
                    type="password"
                    value={registrationData.confirmPassword}
                    onChange={(e) => updateRegistrationData({ confirmPassword: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                      errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Confirm your password"
                  />
                  {errors.confirmPassword && <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>}
                </div>
              </div>
            </div>
          </div>
        )

      case 'owner_details':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Owner Details
              </h3>
              <p className="text-gray-600">
                Please provide the restaurant owner's personal information for verification.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Owner Full Name *
                </label>
                <input
                  type="text"
                  value={registrationData.ownerFullName}
                  onChange={(e) => updateRegistrationData({ ownerFullName: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                    errors.ownerFullName ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter owner&apos;s full name as on NIN"
                />
                {errors.ownerFullName && <p className="text-red-500 text-sm mt-1">{errors.ownerFullName}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Owner NIN *
                </label>
                <input
                  type="text"
                  value={registrationData.ownerNIN}
                  onChange={(e) => updateRegistrationData({ ownerNIN: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                    errors.ownerNIN ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="11-digit NIN"
                  maxLength={11}
                />
                {errors.ownerNIN && <p className="text-red-500 text-sm mt-1">{errors.ownerNIN}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Owner Phone Number *
                  </label>
                  <input
                    type="tel"
                    value={registrationData.ownerPhone}
                    onChange={(e) => updateRegistrationData({ ownerPhone: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                      errors.ownerPhone ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="080xxxxxxxx"
                  />
                  {errors.ownerPhone && <p className="text-red-500 text-sm mt-1">{errors.ownerPhone}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Owner Email Address *
                  </label>
                  <input
                    type="email"
                    value={registrationData.ownerEmail}
                    onChange={(e) => updateRegistrationData({ ownerEmail: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                      errors.ownerEmail ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="owner@example.com"
                  />
                  {errors.ownerEmail && <p className="text-red-500 text-sm mt-1">{errors.ownerEmail}</p>}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Owner Address *
                </label>
                <textarea
                  value={registrationData.ownerAddress}
                  onChange={(e) => updateRegistrationData({ ownerAddress: e.target.value })}
                  rows={3}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                    errors.ownerAddress ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter owner&apos;s residential address"
                />
                {errors.ownerAddress && <p className="text-red-500 text-sm mt-1">{errors.ownerAddress}</p>}
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex">
                  <AlertCircle className="h-5 w-5 text-blue-400 mt-0.5" />
                  <div className="ml-3">
                    <h4 className="text-sm font-medium text-blue-800">
                      Verification Notice
                    </h4>
                    <p className="mt-1 text-sm text-blue-700">
                      The information provided here will be cross-verified with the documents you upload in the next step. 
                      Please ensure all details match exactly with your official documents.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )

      case 'document_upload':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Document Upload
              </h3>
              <p className="text-gray-600">
                Please upload all required documents and photos for verification.
              </p>
            </div>

            {/* Business Documents */}
            <div className="border border-gray-200 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-4">Business Documents</h4>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  CAC Certificate *
                </label>
                <div className={`border-2 border-dashed rounded-lg p-4 text-center ${
                  errors.cacCertificate ? 'border-red-300' : 'border-gray-300'
                }`}>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/jpg,application/pdf"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) handleDocumentUpload('cacCertificate', file)
                    }}
                    className="hidden"
                    id="cacCertificate"
                  />
                  <label htmlFor="cacCertificate" className="cursor-pointer">
                    <Upload className="mx-auto h-8 w-8 text-gray-400" />
                    <p className="mt-2 text-sm text-gray-600">
                      {registrationData.documents.cacCertificate ? 'Document uploaded' : 'Click to upload CAC certificate'}
                    </p>
                    <p className="text-xs text-gray-500">JPG, PNG, PDF up to 5MB</p>
                  </label>
                </div>
                {errors.cacCertificate && <p className="text-red-500 text-sm mt-1">{errors.cacCertificate}</p>}
              </div>
            </div>

            {/* Owner Identity Documents */}
            <div className="border border-gray-200 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-4">Owner Identity Documents</h4>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Owner NIN Front *
                  </label>
                  <div className={`border-2 border-dashed rounded-lg p-4 text-center ${
                    errors.ownerNinFront ? 'border-red-300' : 'border-gray-300'
                  }`}>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/jpg"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) handleDocumentUpload('ownerNinFront', file)
                      }}
                      className="hidden"
                      id="ownerNinFront"
                    />
                    <label htmlFor="ownerNinFront" className="cursor-pointer">
                      <Upload className="mx-auto h-8 w-8 text-gray-400" />
                      <p className="mt-2 text-sm text-gray-600">
                        {registrationData.documents.ownerNinFront ? 'Document uploaded' : 'Click to upload NIN front'}
                      </p>
                      <p className="text-xs text-gray-500">JPG, PNG up to 5MB</p>
                    </label>
                  </div>
                  {errors.ownerNinFront && <p className="text-red-500 text-sm mt-1">{errors.ownerNinFront}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Owner NIN Back *
                  </label>
                  <div className={`border-2 border-dashed rounded-lg p-4 text-center ${
                    errors.ownerNinBack ? 'border-red-300' : 'border-gray-300'
                  }`}>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/jpg"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) handleDocumentUpload('ownerNinBack', file)
                      }}
                      className="hidden"
                      id="ownerNinBack"
                    />
                    <label htmlFor="ownerNinBack" className="cursor-pointer">
                      <Upload className="mx-auto h-8 w-8 text-gray-400" />
                      <p className="mt-2 text-sm text-gray-600">
                        {registrationData.documents.ownerNinBack ? 'Document uploaded' : 'Click to upload NIN back'}
                      </p>
                      <p className="text-xs text-gray-500">JPG, PNG up to 5MB</p>
                    </label>
                  </div>
                  {errors.ownerNinBack && <p className="text-red-500 text-sm mt-1">{errors.ownerNinBack}</p>}
                </div>
              </div>
            </div>

            {/* Restaurant Photos */}
            <div className="border border-gray-200 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-4">Restaurant Photos (Minimum 3 required)</h4>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Restaurant Exterior *
                  </label>
                  <div className={`border-2 border-dashed rounded-lg p-4 text-center ${
                    errors.restaurantPhoto1 ? 'border-red-300' : 'border-gray-300'
                  }`}>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/jpg"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) handleDocumentUpload('restaurantPhoto1', file)
                      }}
                      className="hidden"
                      id="restaurantPhoto1"
                    />
                    <label htmlFor="restaurantPhoto1" className="cursor-pointer">
                      <Camera className="mx-auto h-8 w-8 text-gray-400" />
                      <p className="mt-2 text-sm text-gray-600">
                        {registrationData.documents.restaurantPhoto1 ? 'Photo uploaded' : 'Upload exterior photo'}
                      </p>
                      <p className="text-xs text-gray-500">JPG, PNG up to 5MB</p>
                    </label>
                  </div>
                  {errors.restaurantPhoto1 && <p className="text-red-500 text-sm mt-1">{errors.restaurantPhoto1}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Kitchen/Dining Area *
                  </label>
                  <div className={`border-2 border-dashed rounded-lg p-4 text-center ${
                    errors.restaurantPhoto2 ? 'border-red-300' : 'border-gray-300'
                  }`}>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/jpg"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) handleDocumentUpload('restaurantPhoto2', file)
                      }}
                      className="hidden"
                      id="restaurantPhoto2"
                    />
                    <label htmlFor="restaurantPhoto2" className="cursor-pointer">
                      <Camera className="mx-auto h-8 w-8 text-gray-400" />
                      <p className="mt-2 text-sm text-gray-600">
                        {registrationData.documents.restaurantPhoto2 ? 'Photo uploaded' : 'Upload kitchen/dining photo'}
                      </p>
                      <p className="text-xs text-gray-500">JPG, PNG up to 5MB</p>
                    </label>
                  </div>
                  {errors.restaurantPhoto2 && <p className="text-red-500 text-sm mt-1">{errors.restaurantPhoto2}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Menu/Food Display *
                  </label>
                  <div className={`border-2 border-dashed rounded-lg p-4 text-center ${
                    errors.restaurantPhoto3 ? 'border-red-300' : 'border-gray-300'
                  }`}>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/jpg"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) handleDocumentUpload('restaurantPhoto3', file)
                      }}
                      className="hidden"
                      id="restaurantPhoto3"
                    />
                    <label htmlFor="restaurantPhoto3" className="cursor-pointer">
                      <Camera className="mx-auto h-8 w-8 text-gray-400" />
                      <p className="mt-2 text-sm text-gray-600">
                        {registrationData.documents.restaurantPhoto3 ? 'Photo uploaded' : 'Upload menu/food photo'}
                      </p>
                      <p className="text-xs text-gray-500">JPG, PNG up to 5MB</p>
                    </label>
                  </div>
                  {errors.restaurantPhoto3 && <p className="text-red-500 text-sm mt-1">{errors.restaurantPhoto3}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Owner Photo *
                  </label>
                  <div className={`border-2 border-dashed rounded-lg p-4 text-center ${
                    errors.ownerPhoto ? 'border-red-300' : 'border-gray-300'
                  }`}>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/jpg"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) handleDocumentUpload('ownerPhoto', file)
                      }}
                      className="hidden"
                      id="ownerPhoto"
                    />
                    <label htmlFor="ownerPhoto" className="cursor-pointer">
                      <User className="mx-auto h-8 w-8 text-gray-400" />
                      <p className="mt-2 text-sm text-gray-600">
                        {registrationData.documents.ownerPhoto ? 'Photo uploaded' : 'Upload owner photo'}
                      </p>
                      <p className="text-xs text-gray-500">JPG, PNG up to 5MB</p>
                    </label>
                  </div>
                  {errors.ownerPhoto && <p className="text-red-500 text-sm mt-1">{errors.ownerPhoto}</p>}
                </div>
              </div>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex">
                <Check className="h-5 w-5 text-green-400 mt-0.5" />
                <div className="ml-3">
                  <h4 className="text-sm font-medium text-green-800">
                    Document Requirements
                  </h4>
                  <ul className="mt-1 text-sm text-green-700 space-y-1">
                    <li>• All documents must be clear and readable</li>
                    <li>• Photos should have good lighting and resolution</li>
                    <li>• Maximum file size: 5MB per document</li>
                    <li>• Supported formats: JPG, PNG, PDF</li>
                    <li>• Restaurant photos should showcase your establishment professionally</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )

      case 'banking_info':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Banking Information
              </h3>
              <p className="text-gray-600">
                Provide your business banking details for payment processing.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Business Bank Name *
                </label>
                <select
                  value={registrationData.businessBankName}
                  onChange={(e) => updateRegistrationData({ businessBankName: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                    errors.businessBankName ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select Bank</option>
                  {NIGERIAN_BANKS.map(bank => (
                    <option key={bank} value={bank}>{bank}</option>
                  ))}
                </select>
                {errors.businessBankName && <p className="text-red-500 text-sm mt-1">{errors.businessBankName}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Business Account Number *
                  </label>
                  <input
                    type="text"
                    value={registrationData.businessAccountNumber}
                    onChange={(e) => updateRegistrationData({ businessAccountNumber: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                      errors.businessAccountNumber ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="10-digit account number"
                    maxLength={10}
                  />
                  {errors.businessAccountNumber && <p className="text-red-500 text-sm mt-1">{errors.businessAccountNumber}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Business Account Name *
                  </label>
                  <input
                    type="text"
                    value={registrationData.businessAccountName}
                    onChange={(e) => updateRegistrationData({ businessAccountName: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                      errors.businessAccountName ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Account name (should match restaurant name)"
                  />
                  {errors.businessAccountName && <p className="text-red-500 text-sm mt-1">{errors.businessAccountName}</p>}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Business BVN *
                </label>
                <input
                  type="text"
                  value={registrationData.businessBVN}
                  onChange={(e) => updateRegistrationData({ businessBVN: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                    errors.businessBVN ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="11-digit BVN"
                  maxLength={11}
                />
                {errors.businessBVN && <p className="text-red-500 text-sm mt-1">{errors.businessBVN}</p>}
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex">
                  <AlertCircle className="h-5 w-5 text-blue-400 mt-0.5" />
                  <div className="ml-3">
                    <h4 className="text-sm font-medium text-blue-800">
                      Banking Information Security
                    </h4>
                    <p className="mt-1 text-sm text-blue-700">
                      Your banking information is encrypted and secure. It will only be used for payment processing and order settlements. 
                      Please ensure this is a business account registered under your restaurant name.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex">
                  <AlertCircle className="h-5 w-5 text-amber-400 mt-0.5" />
                  <div className="ml-3">
                    <h4 className="text-sm font-medium text-amber-800">
                      Account Name Validation
                    </h4>
                    <p className="mt-1 text-sm text-amber-700">
                      The account name should match or include your restaurant name for successful verification. 
                      This helps ensure payments are made to the correct business entity.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )

      case 'restaurant_details':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Restaurant Operational Details
              </h3>
              <p className="text-gray-600">
                Configure your restaurant&apos;s operational preferences and service details.
              </p>
            </div>

            {/* Cuisine Types */}
            <div className="border border-gray-200 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-4">Cuisine Types *</h4>
              
              <div className="grid grid-cols-3 gap-2">
                {CUISINE_TYPES.map((cuisine) => (
                  <label key={cuisine} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={registrationData.cuisineTypes.includes(cuisine)}
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
              {errors.cuisineTypes && <p className="text-red-500 text-sm mt-1">{errors.cuisineTypes}</p>}
            </div>

            {/* Service Details */}
            <div className="border border-gray-200 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-4">Service Details</h4>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Delivery Radius (km) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={registrationData.deliveryRadius}
                    onChange={(e) => updateRegistrationData({ deliveryRadius: parseInt(e.target.value) || '' })}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                      errors.deliveryRadius ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="e.g., 10"
                  />
                  {errors.deliveryRadius && <p className="text-red-500 text-sm mt-1">{errors.deliveryRadius}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Minimum Order Amount (₦) *
                  </label>
                  <input
                    type="number"
                    min="500"
                    value={registrationData.minimumOrderAmount}
                    onChange={(e) => updateRegistrationData({ minimumOrderAmount: parseInt(e.target.value) || '' })}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                      errors.minimumOrderAmount ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="e.g., 1500"
                  />
                  {errors.minimumOrderAmount && <p className="text-red-500 text-sm mt-1">{errors.minimumOrderAmount}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Estimated Delivery Time *
                  </label>
                  <select
                    value={registrationData.estimatedDeliveryTime}
                    onChange={(e) => updateRegistrationData({ estimatedDeliveryTime: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  >
                    <option value="15-30 mins">15-30 minutes</option>
                    <option value="30-45 mins">30-45 minutes</option>
                    <option value="45-60 mins">45-60 minutes</option>
                    <option value="60-90 mins">60-90 minutes</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Price Range *
                  </label>
                  <select
                    value={registrationData.priceRange}
                    onChange={(e) => updateRegistrationData({ priceRange: e.target.value as any })}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                      errors.priceRange ? 'border-red-500' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Select Price Range</option>
                    <option value="$">$ - Budget (₦500-1,500)</option>
                    <option value="$$">$$ - Moderate (₦1,500-3,500)</option>
                    <option value="$$$">$$$ - Expensive (₦3,500-7,000)</option>
                    <option value="$$$$">$$$$ - Fine Dining (₦7,000+)</option>
                  </select>
                  {errors.priceRange && <p className="text-red-500 text-sm mt-1">{errors.priceRange}</p>}
                </div>
              </div>
            </div>

            {/* Special Features */}
            <div className="border border-gray-200 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-4">Special Features (Optional)</h4>
              
              <div className="grid grid-cols-2 gap-2">
                {[
                  'Halal Certified',
                  'Vegetarian Options',
                  'Vegan Options',
                  'Gluten-Free Options',
                  'Organic Ingredients',
                  'Local Sourcing',
                  'Traditional Recipes',
                  'Chef Specials',
                  'Live Cooking',
                  'Catering Services',
                  'Party Packages',
                  'Corporate Meals'
                ].map((feature) => (
                  <label key={feature} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={registrationData.specialFeatures.includes(feature)}
                      onChange={(e) => {
                        const currentFeatures = registrationData.specialFeatures || []
                        if (e.target.checked) {
                          updateRegistrationData({ specialFeatures: [...currentFeatures, feature] })
                        } else {
                          updateRegistrationData({ specialFeatures: currentFeatures.filter(f => f !== feature) })
                        }
                      }}
                      className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">{feature}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Terms and Conditions */}
            <div className="border border-gray-200 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-4">Terms and Conditions</h4>
              
              <label className="flex items-start">
                <input
                  type="checkbox"
                  checked={registrationData.agreeToTerms || false}
                  onChange={(e) => updateRegistrationData({ agreeToTerms: e.target.checked })}
                  className="rounded border-gray-300 text-orange-600 focus:ring-orange-500 mt-1"
                />
                <span className="ml-3 text-sm text-gray-700">
                  I agree to FoodNow&apos;s <a href="/terms" className="text-orange-600 hover:underline">Terms and Conditions</a>, 
                  <a href="/privacy" className="text-orange-600 hover:underline ml-1">Privacy Policy</a>, 
                  and <a href="/restaurant-agreement" className="text-orange-600 hover:underline ml-1">Restaurant Partner Agreement</a>. 
                  I understand that my application will be reviewed by FoodNow&apos;s admin team and approval is required before I can start receiving orders. *
                </span>
              </label>
              {errors.agreeToTerms && <p className="text-red-500 text-sm mt-1">{errors.agreeToTerms}</p>}
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex">
                <Check className="h-5 w-5 text-green-400 mt-0.5" />
                <div className="ml-3">
                  <h4 className="text-sm font-medium text-green-800">
                    Final Step
                  </h4>
                  <p className="mt-1 text-sm text-green-700">
                    Once you complete this registration, your application will be submitted for admin review. 
                    You&apos;ll receive notifications about your application status via email and SMS. 
                    The review process typically takes 2-3 business days.
                  </p>
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
    <div className="max-w-4xl mx-auto">
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>Step {currentStep + 1} of {steps.length}: {steps[currentStep].title}</span>
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

      {/* Step Navigation */}
      <div className="flex justify-between items-center mb-6 overflow-x-auto">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center min-w-0">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
              index <= currentStep 
                ? 'border-orange-600 bg-orange-600 text-white' 
                : 'border-gray-300 text-gray-300'
            }`}>
              {step.isCompleted ? <Check className="w-4 h-4" /> : step.icon}
            </div>
            {index < steps.length - 1 && (
              <div className={`w-8 h-0.5 mx-1 ${
                index < currentStep ? 'bg-orange-600' : 'bg-gray-300'
              }`} />
            )}
          </div>
        ))}
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

      {/* Error Display */}
      {errors.submit && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-red-400 mt-0.5" />
            <div className="ml-3">
              <p className="text-sm text-red-700">{errors.submit}</p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between">
        <button
          onClick={currentStep === 0 ? onCancel : handlePrevious}
          className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-800"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          {currentStep === 0 ? 'Cancel' : 'Previous'}
        </button>

        <button
          onClick={currentStep === steps.length - 1 ? handleSubmit : handleNext}
          disabled={isSubmitting}
          className="flex items-center px-6 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              Submitting...
            </>
          ) : currentStep === steps.length - 1 ? (
            'Submit Application'
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