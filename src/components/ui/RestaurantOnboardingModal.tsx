'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  XMarkIcon, 
  DocumentArrowUpIcon, 
  CheckCircleIcon, 
  ExclamationTriangleIcon,
  UserIcon,
  BuildingStorefrontIcon,
  DocumentTextIcon,
  UsersIcon,
  BookmarkIcon,
  ClockIcon
} from '@heroicons/react/24/outline'

interface RestaurantApplicationData {
  firstName: string
  lastName: string
  email: string
  phone: string
  password: string
  confirmPassword: string
  restaurantName: string
  restaurantAddress: string
  city: string
  state: string
  postalCode: string
  cuisineType: string
  restaurantDescription: string
  cacDocument: File | null
  regulatoryId: File | null
  menuDocument: File | null
  managerName: string
  managerEmail: string
  managerPhone: string
  managerRole: string
  alternateContact: string
  applicationId?: string
  status?: string
  submittedAt?: string
}

interface RestaurantOnboardingModalProps {
  isOpen: boolean
  onClose: () => void
  onComplete: (data: RestaurantApplicationData) => void
}

interface ApplicationData {
  // Step 1: Personal Info
  firstName: string
  lastName: string
  email: string
  phone: string
  password: string
  confirmPassword: string
  
  // Step 2: Restaurant Info
  restaurantName: string
  restaurantAddress: string
  city: string
  state: string
  postalCode: string
  cuisineType: string
  restaurantDescription: string
  
  // Step 3: Documents
  cacDocument: File | null
  regulatoryId: File | null
  menuDocument: File | null
  
  // Step 4: Manager Details
  managerName: string
  managerEmail: string
  managerPhone: string
  managerRole: string
  alternateContact: string
}

const RestaurantOnboardingModal = ({ isOpen, onClose, onComplete }: RestaurantOnboardingModalProps) => {
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<{[key: string]: number}>({})
  const [hasSavedProgress, setHasSavedProgress] = useState(false)
  const [showProgressDialog, setShowProgressDialog] = useState(false)
  
  const [formData, setFormData] = useState<ApplicationData>({
    // Step 1
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    
    // Step 2
    restaurantName: '',
    restaurantAddress: '',
    city: 'Lagos',
    state: 'Lagos State',
    postalCode: '',
    cuisineType: '',
    restaurantDescription: '',
    
    // Step 3
    cacDocument: null,
    regulatoryId: null,
    menuDocument: null,
    
    // Step 4
    managerName: '',
    managerEmail: '',
    managerPhone: '',
    managerRole: '',
    alternateContact: ''
  })

  // Progress management
  const STORAGE_KEY = 'restaurant-onboarding-progress'
  
  useEffect(() => {
    if (isOpen) {
      const savedData = localStorage.getItem(STORAGE_KEY)
      if (savedData) {
        setHasSavedProgress(true)
        setShowProgressDialog(true)
      }
    }
  }, [isOpen])

  const saveProgress = () => {
    const progressData = {
      formData,
      currentStep,
      timestamp: new Date().toISOString(),
      uploadProgress
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progressData))
    setHasSavedProgress(true)
  }

  const loadProgress = () => {
    const savedData = localStorage.getItem(STORAGE_KEY)
    if (savedData) {
      const progressData = JSON.parse(savedData)
      setFormData(progressData.formData)
      setCurrentStep(progressData.currentStep)
      setUploadProgress(progressData.uploadProgress || {})
      setShowProgressDialog(false)
    }
  }

  const clearProgress = () => {
    localStorage.removeItem(STORAGE_KEY)
    setHasSavedProgress(false)
    setShowProgressDialog(false)
  }

  const fileInputRefs = {
    cac: useRef<HTMLInputElement>(null),
    regulatory: useRef<HTMLInputElement>(null),
    menu: useRef<HTMLInputElement>(null)
  }

  const cuisineTypes = [
    'Nigerian',
    'Continental', 
    'Fast Food',
    'Asian',
    'Mediterranean',
    'Healthy/Organic',
    'Desserts & Beverages',
    'Mixed Cuisine'
  ]

  const handleInputChange = (field: keyof ApplicationData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Auto-save progress on significant changes
    setTimeout(saveProgress, 1000)
  }

  const handleFileUpload = async (field: 'cacDocument' | 'regulatoryId' | 'menuDocument', file: File) => {
    setFormData(prev => ({ ...prev, [field]: file }))
    
    // Simulate upload progress
    const progressKey = field
    setUploadProgress(prev => ({ ...prev, [progressKey]: 0 }))
    
    for (let i = 0; i <= 100; i += 10) {
      await new Promise(resolve => setTimeout(resolve, 100))
      setUploadProgress(prev => ({ ...prev, [progressKey]: i }))
    }
  }

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return !!(
          formData.firstName && 
          formData.lastName && 
          formData.email && 
          formData.phone && 
          formData.password && 
          formData.password === formData.confirmPassword
        )
      case 2:
        return !!(
          formData.restaurantName && 
          formData.restaurantAddress && 
          formData.cuisineType
        )
      case 3:
        return !!(
          formData.cacDocument && 
          formData.regulatoryId
        )
      case 4:
        return !!(
          formData.managerName && 
          formData.managerEmail && 
          formData.managerPhone
        )
      default:
        return false
    }
  }

  const handleNext = () => {
    if (validateStep(currentStep)) {
      saveProgress() // Save progress before moving to next step
      setCurrentStep(prev => Math.min(prev + 1, 5))
    }
  }

  const handlePrevious = () => {
    saveProgress() // Save progress before moving to previous step
    setCurrentStep(prev => Math.max(prev - 1, 1))
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // Create application data
    const applicationData = {
      ...formData,
      applicationId: `APP-${Date.now()}`,
      status: 'pending',
      submittedAt: new Date().toISOString()
    }
    
    onComplete(applicationData)
    clearProgress() // Clear saved progress after successful submission
    setIsSubmitting(false)
    setCurrentStep(5)
  }

  const FileUploadBox = ({ 
    title, 
    description, 
    fileKey, 
    accept = '.pdf,.jpg,.jpeg,.png',
    required = true 
  }: {
    title: string
    description: string
    fileKey: 'cac' | 'regulatory' | 'menu'
    accept?: string
    required?: boolean
  }) => {
    const fieldKey = `${fileKey}Document` as 'cacDocument' | 'regulatoryId' | 'menuDocument'
    const file = formData[fieldKey] as File | null
    const progress = uploadProgress[fieldKey] || 0
    const isUploaded = file && progress === 100

    return (
      <div className={`border-2 border-dashed rounded-2xl p-6 transition-colors ${
        isUploaded ? 'border-green-400 bg-green-50' : 'border-gray-300 hover:border-green-400'
      }`}>
        <input
          ref={fileInputRefs[fileKey]}
          type="file"
          accept={accept}
          onChange={(e) => {
            const selectedFile = e.target.files?.[0]
            if (selectedFile) {
              handleFileUpload(fieldKey, selectedFile)
            }
          }}
          className="hidden"
        />
        
        <div className="text-center">
          {isUploaded ? (
            <CheckCircleIcon className="w-12 h-12 text-green-500 mx-auto mb-4" />
          ) : (
            <DocumentArrowUpIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          )}
          
          <h4 className="font-semibold text-gray-900 mb-2">{title} {required && '*'}</h4>
          <p className="text-sm text-gray-600 mb-4">{description}</p>
          
          {file && progress < 100 && (
            <div className="mb-4">
              <div className="bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">Uploading... {progress}%</p>
            </div>
          )}
          
          {isUploaded ? (
            <div className="space-y-2">
              <p className="text-sm font-medium text-green-700">{file.name}</p>
              <button
                onClick={() => fileInputRefs[fileKey].current?.click()}
                className="text-sm text-green-600 hover:text-green-700 font-medium"
              >
                Replace File
              </button>
            </div>
          ) : (
            <button
              onClick={() => fileInputRefs[fileKey].current?.click()}
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              Choose File
            </button>
          )}
        </div>
      </div>
    )
  }

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <UserIcon className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h3 className="text-2xl font-bold text-gray-900">Personal Information</h3>
        <p className="text-gray-600">Let&apos;s start with your basic information</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">First Name *</label>
          <input
            type="text"
            value={formData.firstName}
            onChange={(e) => handleInputChange('firstName', e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
            placeholder="Your first name"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Last Name *</label>
          <input
            type="text"
            value={formData.lastName}
            onChange={(e) => handleInputChange('lastName', e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
            placeholder="Your last name"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Email Address *</label>
        <input
          type="email"
          value={formData.email}
          onChange={(e) => handleInputChange('email', e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
          placeholder="your@email.com"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number *</label>
        <input
          type="tel"
          value={formData.phone}
          onChange={(e) => handleInputChange('phone', e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
          placeholder="+234 XXX XXX XXXX"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Password *</label>
          <input
            type="password"
            value={formData.password}
            onChange={(e) => handleInputChange('password', e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
            placeholder="Choose a secure password"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Confirm Password *</label>
          <input
            type="password"
            value={formData.confirmPassword}
            onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
            placeholder="Confirm your password"
          />
          {formData.password && formData.confirmPassword && formData.password !== formData.confirmPassword && (
            <p className="text-sm text-red-600 mt-1">Passwords do not match</p>
          )}
        </div>
      </div>
    </div>
  )

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <BuildingStorefrontIcon className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h3 className="text-2xl font-bold text-gray-900">Restaurant Information</h3>
        <p className="text-gray-600">Tell us about your restaurant</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Restaurant Name *</label>
        <input
          type="text"
          value={formData.restaurantName}
          onChange={(e) => handleInputChange('restaurantName', e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
          placeholder="Your restaurant name"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Restaurant Address *</label>
        <input
          type="text"
          value={formData.restaurantAddress}
          onChange={(e) => handleInputChange('restaurantAddress', e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
          placeholder="Full restaurant address"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
          <input
            type="text"
            value={formData.city}
            onChange={(e) => handleInputChange('city', e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
          <input
            type="text"
            value={formData.state}
            onChange={(e) => handleInputChange('state', e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Postal Code</label>
          <input
            type="text"
            value={formData.postalCode}
            onChange={(e) => handleInputChange('postalCode', e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
            placeholder="100001"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Cuisine Type *</label>
        <select
          value={formData.cuisineType}
          onChange={(e) => handleInputChange('cuisineType', e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          <option value="">Select cuisine type</option>
          {cuisineTypes.map(cuisine => (
            <option key={cuisine} value={cuisine}>{cuisine}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Restaurant Description</label>
        <textarea
          value={formData.restaurantDescription}
          onChange={(e) => handleInputChange('restaurantDescription', e.target.value)}
          rows={3}
          className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
          placeholder="Describe your restaurant, specialties, and what makes it unique..."
        />
      </div>
    </div>
  )

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <DocumentTextIcon className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h3 className="text-2xl font-bold text-gray-900">Document Upload</h3>
        <p className="text-gray-600">Please upload the required documents</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FileUploadBox
          title="CAC Document"
          description="Upload your Certificate of Incorporation (CAC)"
          fileKey="cac"
          accept=".pdf,.jpg,.jpeg,.png"
        />
        
        <FileUploadBox
          title="Regulatory ID"
          description="Upload food handling/business license"
          fileKey="regulatory"
          accept=".pdf,.jpg,.jpeg,.png"
        />
      </div>

      <div className="md:col-span-2">
        <FileUploadBox
          title="Menu Document"
          description="Upload your current menu (optional - you can add items later)"
          fileKey="menu"
          accept=".pdf,.jpg,.jpeg,.png"
          required={false}
        />
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <div className="flex space-x-3">
          <ExclamationTriangleIcon className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">Document Requirements:</p>
            <ul className="list-disc list-inside space-y-1 text-blue-700">
              <li>All documents must be clear and readable</li>
              <li>Accepted formats: PDF, JPG, JPEG, PNG</li>
              <li>Maximum file size: 5MB per document</li>
              <li>Documents will be verified within 24-48 hours</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )

  const renderStep4 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <UsersIcon className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h3 className="text-2xl font-bold text-gray-900">Manager Details</h3>
        <p className="text-gray-600">Who will be the main contact for your restaurant?</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Manager Full Name *</label>
        <input
          type="text"
          value={formData.managerName}
          onChange={(e) => handleInputChange('managerName', e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
          placeholder="Manager's full name"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Manager Email *</label>
          <input
            type="email"
            value={formData.managerEmail}
            onChange={(e) => handleInputChange('managerEmail', e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
            placeholder="manager@restaurant.com"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Manager Phone *</label>
          <input
            type="tel"
            value={formData.managerPhone}
            onChange={(e) => handleInputChange('managerPhone', e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
            placeholder="+234 XXX XXX XXXX"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Manager Role/Position</label>
        <input
          type="text"
          value={formData.managerRole}
          onChange={(e) => handleInputChange('managerRole', e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
          placeholder="e.g., Restaurant Manager, Owner, Head Chef"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Alternate Contact (Optional)</label>
        <input
          type="tel"
          value={formData.alternateContact}
          onChange={(e) => handleInputChange('alternateContact', e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
          placeholder="Backup contact number"
        />
      </div>

      <div className="bg-gray-50 rounded-xl p-4">
        <h4 className="font-semibold text-gray-900 mb-2">Review Your Information</h4>
        <div className="text-sm text-gray-700 space-y-1">
          <p><span className="font-medium">Restaurant:</span> {formData.restaurantName}</p>
          <p><span className="font-medium">Owner:</span> {formData.firstName} {formData.lastName}</p>
          <p><span className="font-medium">Email:</span> {formData.email}</p>
          <p><span className="font-medium">Cuisine:</span> {formData.cuisineType}</p>
          <p><span className="font-medium">Manager:</span> {formData.managerName}</p>
        </div>
      </div>
    </div>
  )

  const renderStep5 = () => (
    <div className="text-center space-y-6">
      <CheckCircleIcon className="w-24 h-24 text-green-500 mx-auto" />
      <div>
        <h3 className="text-2xl font-bold text-gray-900 mb-4">Application Submitted!</h3>
        <p className="text-lg text-gray-600 mb-6">
          Thank you for applying to become a FoodNow partner. Your application has been submitted successfully.
        </p>
      </div>

      <div className="bg-green-50 border border-green-200 rounded-xl p-6">
        <h4 className="font-semibold text-green-900 mb-3">What happens next?</h4>
        <div className="text-left space-y-2 text-sm text-green-800">
          <div className="flex items-start space-x-2">
            <span className="font-medium">1.</span>
            <span>Our team will review your application and documents within 24-48 hours</span>
          </div>
          <div className="flex items-start space-x-2">
            <span className="font-medium">2.</span>
            <span>You&apos;ll receive an email notification about your application status</span>
          </div>
          <div className="flex items-start space-x-2">
            <span className="font-medium">3.</span>
            <span>Once approved, you&apos;ll get access to your restaurant dashboard</span>
          </div>
          <div className="flex items-start space-x-2">
            <span className="font-medium">4.</span>
            <span>Start receiving orders and grow your business with FoodNow!</span>
          </div>
        </div>
      </div>

      <div className="bg-gray-50 rounded-xl p-4">
        <p className="text-sm text-gray-600">
          Questions? Contact our support team at{' '}
          <span className="font-medium text-green-600">support@foodnow.ng</span> or{' '}
          <span className="font-medium text-green-600">+234 912 956 6291</span>
        </p>
      </div>
    </div>
  )

  const steps = [
    { number: 1, title: 'Personal Info', icon: UserIcon, component: renderStep1 },
    { number: 2, title: 'Restaurant Info', icon: BuildingStorefrontIcon, component: renderStep2 },
    { number: 3, title: 'Documents', icon: DocumentTextIcon, component: renderStep3 },
    { number: 4, title: 'Manager Details', icon: UsersIcon, component: renderStep4 },
    { number: 5, title: 'Complete', icon: CheckCircleIcon, component: renderStep5 }
  ]

  // Progress Resume Dialog
  const ProgressDialog = () => {
    if (!showProgressDialog) return null

    const savedData = localStorage.getItem(STORAGE_KEY)
    const progressData = savedData ? JSON.parse(savedData) : null
    const savedDate = progressData?.timestamp ? new Date(progressData.timestamp).toLocaleDateString() : ''

    return (
      <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6"
        >
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <ClockIcon className="w-8 h-8 text-green-600" />
            </div>
            
            <h3 className="text-xl font-bold text-gray-900 mb-3">Resume Previous Application?</h3>
            <p className="text-gray-600 mb-6">
              We found a saved application from {savedDate}. Would you like to continue where you left off or start fresh?
            </p>
            
            <div className="space-y-3">
              <button
                onClick={loadProgress}
                className="w-full bg-green-500 hover:bg-green-600 text-white py-3 px-4 rounded-xl font-medium transition-colors flex items-center justify-center space-x-2"
              >
                <BookmarkIcon className="w-5 h-5" />
                <span>Resume Application</span>
              </button>
              
              <button
                onClick={clearProgress}
                className="w-full border border-gray-300 text-gray-700 py-3 px-4 rounded-xl font-medium transition-colors hover:bg-gray-50"
              >
                Start Fresh
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    )
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
            onClick={currentStep < 5 ? onClose : undefined}
            className="fixed inset-0 bg-black/50 z-50"
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[95vh] overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <h2 className="text-2xl font-bold text-gray-900">Restaurant Application</h2>
                    {hasSavedProgress && currentStep < 5 && (
                      <div className="flex items-center space-x-1 text-green-600 text-sm">
                        <BookmarkIcon className="w-4 h-4" />
                        <span>Auto-saved</span>
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    {currentStep < 5 ? `Step ${currentStep} of 4` : 'Application Complete'}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  {currentStep < 5 && (
                    <>
                      <button
                        onClick={saveProgress}
                        className="flex items-center space-x-1 px-3 py-2 text-green-600 hover:bg-green-50 rounded-xl transition-colors text-sm font-medium"
                        title="Save Progress"
                      >
                        <BookmarkIcon className="w-4 h-4" />
                        <span className="hidden sm:inline">Save</span>
                      </button>
                      <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                      >
                        <XMarkIcon className="w-6 h-6 text-gray-500" />
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Progress Steps */}
              {currentStep < 5 && (
                <div className="flex items-center justify-center p-4 border-b border-gray-200 overflow-x-auto">
                  {steps.slice(0, 4).map((step, index) => (
                    <div key={step.number} className="flex items-center">
                      <div className={`flex items-center space-x-2 ${
                        currentStep >= step.number ? 'text-green-600' : 'text-gray-400'
                      }`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                          currentStep >= step.number
                            ? 'bg-green-500 text-white'
                            : 'bg-gray-200 text-gray-600'
                        }`}>
                          {currentStep > step.number ? '✓' : step.number}
                        </div>
                        <span className="text-sm font-medium whitespace-nowrap">{step.title}</span>
                      </div>
                      {index < 3 && (
                        <div className={`w-8 h-px mx-3 ${
                          currentStep > step.number ? 'bg-green-500' : 'bg-gray-200'
                        }`} />
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Form Content */}
              <div className="p-6 max-h-[70vh] overflow-y-auto">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentStep}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                  >
                    {steps[currentStep - 1].component()}
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Footer */}
              {currentStep < 5 && (
                <div className="flex items-center justify-between p-6 border-t border-gray-200">
                  <button
                    onClick={currentStep > 1 ? handlePrevious : onClose}
                    className="px-6 py-2 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium transition-colors"
                  >
                    {currentStep > 1 ? 'Previous' : 'Cancel'}
                  </button>
                  
                  {currentStep < 4 ? (
                    <button
                      onClick={handleNext}
                      disabled={!validateStep(currentStep)}
                      className="px-6 py-2 bg-green-500 hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-xl font-medium transition-colors"
                    >
                      Next
                    </button>
                  ) : (
                    <button
                      onClick={handleSubmit}
                      disabled={!validateStep(currentStep) || isSubmitting}
                      className="px-6 py-2 bg-green-500 hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-xl font-medium transition-colors"
                    >
                      {isSubmitting ? 'Submitting...' : 'Submit Application'}
                    </button>
                  )}
                </div>
              )}

              {/* Success Footer */}
              {currentStep === 5 && (
                <div className="flex justify-center p-6 border-t border-gray-200">
                  <button
                    onClick={onClose}
                    className="px-8 py-3 bg-green-500 hover:bg-green-600 text-white rounded-xl font-medium transition-colors"
                  >
                    Close
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
      <ProgressDialog />
    </AnimatePresence>
  )
}

export default RestaurantOnboardingModal