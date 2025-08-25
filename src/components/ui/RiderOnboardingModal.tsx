'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  XMarkIcon, 
  DocumentArrowUpIcon, 
  CheckCircleIcon, 
  ExclamationTriangleIcon,
  UserIcon,
  TruckIcon,
  DocumentTextIcon,
  BanknotesIcon,
  CameraIcon,
  BookmarkIcon,
  ClockIcon
} from '@heroicons/react/24/outline'

interface RiderOnboardingModalProps {
  isOpen: boolean
  onClose: () => void
  onComplete: (data: RiderApplicationData) => void
}

interface RiderApplicationData {
  // Step 1: Personal Info
  firstName: string
  lastName: string
  email: string
  phone: string
  password: string
  confirmPassword: string
  dateOfBirth: string
  gender: string
  
  // Step 2: Vehicle Info
  vehicleType: string
  vehicleMake: string
  vehicleModel: string
  vehicleYear: string
  vehiclePlateNumber: string
  vehicleColor: string
  hasInsurance: boolean
  
  // Step 3: Documents
  driversLicense: File | null
  vehicleRegistration: File | null
  insurance: File | null
  profilePhoto: File | null
  
  // Step 4: Bank Details
  bankName: string
  accountNumber: string
  accountName: string
  bvn: string
  
  // Agreement
  agreeToTerms: boolean
  backgroundCheck: boolean
}

const RiderOnboardingModal = ({ isOpen, onClose, onComplete }: RiderOnboardingModalProps) => {
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<{[key: string]: number}>({})
  const [hasSavedProgress, setHasSavedProgress] = useState(false)
  const [showProgressDialog, setShowProgressDialog] = useState(false)
  
  const [formData, setFormData] = useState<RiderApplicationData>({
    // Step 1
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    dateOfBirth: '',
    gender: '',
    
    // Step 2
    vehicleType: '',
    vehicleMake: '',
    vehicleModel: '',
    vehicleYear: '',
    vehiclePlateNumber: '',
    vehicleColor: '',
    hasInsurance: false,
    
    // Step 3
    driversLicense: null,
    vehicleRegistration: null,
    insurance: null,
    profilePhoto: null,
    
    // Step 4
    bankName: '',
    accountNumber: '',
    accountName: '',
    bvn: '',
    
    // Agreement
    agreeToTerms: false,
    backgroundCheck: false
  })

  // Progress management
  const STORAGE_KEY = 'rider-onboarding-progress'
  
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
    license: useRef<HTMLInputElement>(null),
    registration: useRef<HTMLInputElement>(null),
    insurance: useRef<HTMLInputElement>(null),
    photo: useRef<HTMLInputElement>(null)
  }

  const vehicleTypes = [
    'Motorcycle',
    'Bicycle',
    'Electric Bike',
    'Scooter',
    'Car'
  ]

  const bankOptions = [
    'Access Bank',
    'GTBank',
    'First Bank',
    'UBA',
    'Zenith Bank',
    'Kuda',
    'OPay',
    'PalmPay',
    'Other'
  ]

  const handleInputChange = (field: keyof RiderApplicationData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Auto-save progress on significant changes
    setTimeout(saveProgress, 1000)
  }

  const handleFileUpload = async (field: 'driversLicense' | 'vehicleRegistration' | 'insurance' | 'profilePhoto', file: File) => {
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
          formData.password === formData.confirmPassword &&
          formData.dateOfBirth &&
          formData.gender
        )
      case 2:
        return !!(
          formData.vehicleType && 
          formData.vehicleMake && 
          formData.vehicleModel &&
          formData.vehicleYear &&
          formData.vehiclePlateNumber
        )
      case 3:
        return !!(
          formData.driversLicense && 
          formData.vehicleRegistration &&
          formData.profilePhoto
        )
      case 4:
        return !!(
          formData.bankName && 
          formData.accountNumber && 
          formData.accountName &&
          formData.agreeToTerms &&
          formData.backgroundCheck
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
      applicationId: `RDR-${Date.now()}`,
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
    fileKey: 'license' | 'registration' | 'insurance' | 'photo'
    accept?: string
    required?: boolean
  }) => {
    const fieldKeyMap = {
      license: 'driversLicense',
      registration: 'vehicleRegistration',
      insurance: 'insurance',
      photo: 'profilePhoto'
    }
    const fieldKey = fieldKeyMap[fileKey] as keyof RiderApplicationData
    const file = formData[fieldKey] as File | null
    const progress = uploadProgress[fieldKey] || 0
    const isUploaded = file && progress === 100

    return (
      <div className={`border-2 border-dashed rounded-2xl p-6 transition-colors ${
        isUploaded ? 'border-purple-400 bg-purple-50' : 'border-gray-300 hover:border-purple-400'
      }`}>
        <input
          ref={fileInputRefs[fileKey]}
          type="file"
          accept={accept}
          onChange={(e) => {
            const selectedFile = e.target.files?.[0]
            if (selectedFile) {
              handleFileUpload(fieldKey as 'driversLicense' | 'vehicleRegistration' | 'insurance' | 'profilePhoto', selectedFile)
            }
          }}
          className="hidden"
        />
        
        <div className="text-center">
          {isUploaded ? (
            <CheckCircleIcon className="w-12 h-12 text-purple-500 mx-auto mb-4" />
          ) : fileKey === 'photo' ? (
            <CameraIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          ) : (
            <DocumentArrowUpIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          )}
          
          <h4 className="font-semibold text-gray-900 mb-2">{title} {required && '*'}</h4>
          <p className="text-sm text-gray-600 mb-4">{description}</p>
          
          {file && progress < 100 && (
            <div className="mb-4">
              <div className="bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-purple-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">Uploading... {progress}%</p>
            </div>
          )}
          
          {isUploaded ? (
            <div className="space-y-2">
              <p className="text-sm font-medium text-purple-700">{file.name}</p>
              <button
                onClick={() => fileInputRefs[fileKey].current?.click()}
                className="text-sm text-purple-600 hover:text-purple-700 font-medium"
              >
                Replace File
              </button>
            </div>
          ) : (
            <button
              onClick={() => fileInputRefs[fileKey].current?.click()}
              className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              {fileKey === 'photo' ? 'Take/Upload Photo' : 'Choose File'}
            </button>
          )}
        </div>
      </div>
    )
  }

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <UserIcon className="w-16 h-16 text-purple-500 mx-auto mb-4" />
        <h3 className="text-2xl font-bold text-gray-900">Personal Information</h3>
        <p className="text-gray-600">Tell us about yourself</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">First Name *</label>
          <input
            type="text"
            value={formData.firstName}
            onChange={(e) => handleInputChange('firstName', e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
            placeholder="Your first name"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Last Name *</label>
          <input
            type="text"
            value={formData.lastName}
            onChange={(e) => handleInputChange('lastName', e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
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
          className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
          placeholder="your@email.com"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number *</label>
        <input
          type="tel"
          value={formData.phone}
          onChange={(e) => handleInputChange('phone', e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
          placeholder="+234 XXX XXX XXXX"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Date of Birth *</label>
          <input
            type="date"
            value={formData.dateOfBirth}
            onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Gender *</label>
          <select
            value={formData.gender}
            onChange={(e) => handleInputChange('gender', e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="">Select gender</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Prefer not to say</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Password *</label>
          <input
            type="password"
            value={formData.password}
            onChange={(e) => handleInputChange('password', e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
            placeholder="Choose a secure password"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Confirm Password *</label>
          <input
            type="password"
            value={formData.confirmPassword}
            onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
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
        <TruckIcon className="w-16 h-16 text-purple-500 mx-auto mb-4" />
        <h3 className="text-2xl font-bold text-gray-900">Vehicle Information</h3>
        <p className="text-gray-600">Tell us about your delivery vehicle</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Vehicle Type *</label>
        <select
          value={formData.vehicleType}
          onChange={(e) => handleInputChange('vehicleType', e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
        >
          <option value="">Select vehicle type</option>
          {vehicleTypes.map(type => (
            <option key={type} value={type}>{type}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Vehicle Make *</label>
          <input
            type="text"
            value={formData.vehicleMake}
            onChange={(e) => handleInputChange('vehicleMake', e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
            placeholder="e.g., Honda, Yamaha"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Vehicle Model *</label>
          <input
            type="text"
            value={formData.vehicleModel}
            onChange={(e) => handleInputChange('vehicleModel', e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
            placeholder="e.g., Accord, FZ150"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Vehicle Year *</label>
          <input
            type="text"
            value={formData.vehicleYear}
            onChange={(e) => handleInputChange('vehicleYear', e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
            placeholder="e.g., 2020"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">License Plate *</label>
          <input
            type="text"
            value={formData.vehiclePlateNumber}
            onChange={(e) => handleInputChange('vehiclePlateNumber', e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
            placeholder="e.g., ABC-123-XY"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Vehicle Color</label>
        <input
          type="text"
          value={formData.vehicleColor}
          onChange={(e) => handleInputChange('vehicleColor', e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
          placeholder="e.g., Black, Red"
        />
      </div>

      <div className="bg-purple-50 rounded-xl p-4">
        <label className="flex items-center space-x-3 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.hasInsurance}
            onChange={(e) => handleInputChange('hasInsurance', e.target.checked)}
            className="w-5 h-5 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
          />
          <span className="font-medium text-gray-900">My vehicle has valid insurance</span>
        </label>
      </div>
    </div>
  )

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <DocumentTextIcon className="w-16 h-16 text-purple-500 mx-auto mb-4" />
        <h3 className="text-2xl font-bold text-gray-900">Document Upload</h3>
        <p className="text-gray-600">Please upload the required documents</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FileUploadBox
          title="Driver's License"
          description="Upload a clear photo of your valid driver's license"
          fileKey="license"
          accept=".pdf,.jpg,.jpeg,.png"
        />
        
        <FileUploadBox
          title="Vehicle Registration"
          description="Upload your vehicle registration document"
          fileKey="registration"
          accept=".pdf,.jpg,.jpeg,.png"
        />
        
        <FileUploadBox
          title="Insurance Document"
          description="Upload your vehicle insurance (if available)"
          fileKey="insurance"
          accept=".pdf,.jpg,.jpeg,.png"
          required={false}
        />
        
        <FileUploadBox
          title="Profile Photo"
          description="Take or upload a clear photo of yourself"
          fileKey="photo"
          accept=".jpg,.jpeg,.png"
        />
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <div className="flex space-x-3">
          <ExclamationTriangleIcon className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">Document Requirements:</p>
            <ul className="list-disc list-inside space-y-1 text-blue-700">
              <li>All documents must be clear and readable</li>
              <li>Driver&apos;s license must be valid and not expired</li>
              <li>Profile photo should show your face clearly</li>
              <li>Maximum file size: 5MB per document</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )

  const renderStep4 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <BanknotesIcon className="w-16 h-16 text-purple-500 mx-auto mb-4" />
        <h3 className="text-2xl font-bold text-gray-900">Bank Details & Agreement</h3>
        <p className="text-gray-600">Set up your payment information</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Bank Name *</label>
        <select
          value={formData.bankName}
          onChange={(e) => handleInputChange('bankName', e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
        >
          <option value="">Select your bank</option>
          {bankOptions.map(bank => (
            <option key={bank} value={bank}>{bank}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Account Number *</label>
          <input
            type="text"
            value={formData.accountNumber}
            onChange={(e) => handleInputChange('accountNumber', e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
            placeholder="Your account number"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Account Name *</label>
          <input
            type="text"
            value={formData.accountName}
            onChange={(e) => handleInputChange('accountName', e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
            placeholder="Name on account"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">BVN (Optional)</label>
        <input
          type="text"
          value={formData.bvn}
          onChange={(e) => handleInputChange('bvn', e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
          placeholder="Bank Verification Number"
        />
      </div>

      <div className="space-y-3 bg-gray-50 rounded-xl p-4">
        <label className="flex items-start space-x-3 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.agreeToTerms}
            onChange={(e) => handleInputChange('agreeToTerms', e.target.checked)}
            className="w-5 h-5 text-purple-600 border-gray-300 rounded focus:ring-purple-500 mt-0.5"
          />
          <span className="text-sm text-gray-700">
            I agree to FoodNow&apos;s <span className="text-purple-600 font-medium">Terms of Service</span> and{' '}
            <span className="text-purple-600 font-medium">Rider Agreement</span>
          </span>
        </label>
        
        <label className="flex items-start space-x-3 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.backgroundCheck}
            onChange={(e) => handleInputChange('backgroundCheck', e.target.checked)}
            className="w-5 h-5 text-purple-600 border-gray-300 rounded focus:ring-purple-500 mt-0.5"
          />
          <span className="text-sm text-gray-700">
            I consent to a background check and understand that my application may be rejected if I have a criminal record
          </span>
        </label>
      </div>
    </div>
  )

  const renderStep5 = () => (
    <div className="text-center space-y-6">
      <CheckCircleIcon className="w-24 h-24 text-purple-500 mx-auto" />
      <div>
        <h3 className="text-2xl font-bold text-gray-900 mb-4">Application Submitted!</h3>
        <p className="text-lg text-gray-600 mb-6">
          Thank you for applying to become a FoodNow rider. Your application has been submitted successfully.
        </p>
      </div>

      <div className="bg-purple-50 border border-purple-200 rounded-xl p-6">
        <h4 className="font-semibold text-purple-900 mb-3">What happens next?</h4>
        <div className="text-left space-y-2 text-sm text-purple-800">
          <div className="flex items-start space-x-2">
            <span className="font-medium">1.</span>
            <span>We&apos;ll review your application and documents within 24 hours</span>
          </div>
          <div className="flex items-start space-x-2">
            <span className="font-medium">2.</span>
            <span>You&apos;ll receive an email and SMS about your application status</span>
          </div>
          <div className="flex items-start space-x-2">
            <span className="font-medium">3.</span>
            <span>Once approved, you&apos;ll get access to the rider app and training materials</span>
          </div>
          <div className="flex items-start space-x-2">
            <span className="font-medium">4.</span>
            <span>Complete the quick online training and start earning!</span>
          </div>
        </div>
      </div>

      <div className="bg-gray-50 rounded-xl p-4">
        <p className="text-sm text-gray-600">
          Questions? Contact our rider support at{' '}
          <span className="font-medium text-purple-600">riders@foodnow.ng</span> or{' '}
          <span className="font-medium text-purple-600">+234 912 956 6292</span>
        </p>
      </div>
    </div>
  )

  const steps = [
    { number: 1, title: 'Personal Info', icon: UserIcon, component: renderStep1 },
    { number: 2, title: 'Vehicle Info', icon: TruckIcon, component: renderStep2 },
    { number: 3, title: 'Documents', icon: DocumentTextIcon, component: renderStep3 },
    { number: 4, title: 'Bank & Agreement', icon: BanknotesIcon, component: renderStep4 },
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
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <ClockIcon className="w-8 h-8 text-purple-600" />
            </div>
            
            <h3 className="text-xl font-bold text-gray-900 mb-3">Resume Previous Application?</h3>
            <p className="text-gray-600 mb-6">
              We found a saved rider application from {savedDate}. Would you like to continue where you left off or start fresh?
            </p>
            
            <div className="space-y-3">
              <button
                onClick={loadProgress}
                className="w-full bg-purple-500 hover:bg-purple-600 text-white py-3 px-4 rounded-xl font-medium transition-colors flex items-center justify-center space-x-2"
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
              <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-purple-100">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <h2 className="text-2xl font-bold text-gray-900">Rider Application</h2>
                    {hasSavedProgress && currentStep < 5 && (
                      <div className="flex items-center space-x-1 text-purple-600 text-sm">
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
                        className="flex items-center space-x-1 px-3 py-2 text-purple-600 hover:bg-purple-50 rounded-xl transition-colors text-sm font-medium"
                        title="Save Progress"
                      >
                        <BookmarkIcon className="w-4 h-4" />
                        <span className="hidden sm:inline">Save</span>
                      </button>
                      <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/50 rounded-xl transition-colors"
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
                        currentStep >= step.number ? 'text-purple-600' : 'text-gray-400'
                      }`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                          currentStep >= step.number
                            ? 'bg-purple-500 text-white'
                            : 'bg-gray-200 text-gray-600'
                        }`}>
                          {currentStep > step.number ? '✓' : step.number}
                        </div>
                        <span className="text-sm font-medium whitespace-nowrap hidden sm:inline">{step.title}</span>
                      </div>
                      {index < 3 && (
                        <div className={`w-8 h-px mx-3 ${
                          currentStep > step.number ? 'bg-purple-500' : 'bg-gray-200'
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
                      className="px-6 py-2 bg-purple-500 hover:bg-purple-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-xl font-medium transition-colors"
                    >
                      Next
                    </button>
                  ) : (
                    <button
                      onClick={handleSubmit}
                      disabled={!validateStep(currentStep) || isSubmitting}
                      className="px-6 py-2 bg-purple-500 hover:bg-purple-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-xl font-medium transition-colors"
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
                    className="px-8 py-3 bg-purple-500 hover:bg-purple-600 text-white rounded-xl font-medium transition-colors"
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

export default RiderOnboardingModal