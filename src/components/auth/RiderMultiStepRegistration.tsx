'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, Upload, Check, AlertCircle, User, Calendar, MapPin, FileText, CreditCard, Shield, Users, Briefcase, Phone } from 'lucide-react'
import { devLog, prodLog } from '@/lib/logger'
import { sendOTP } from '@/lib/otpService'
import { NIGERIAN_STATES, NIGERIAN_BANKS, DELIVERY_ZONES, GUARANTOR_OCCUPATIONS } from '@/constants'

// Registration step types
interface BaseRegistrationStep {
  id: string
  title: string
  description: string
  isCompleted: boolean
  icon: React.ReactNode
}

interface RiderRegistrationData {
  // Step 1: Basic Information
  fullName: string
  phoneNumber: string
  email: string
  houseAddress: string
  age: number | ''
  dateOfBirth: string
  stateOfOrigin: string
  emergencyContactName: string
  emergencyContactPhone: string
  
  // Step 2: Next of Kin Details
  nextOfKinFullName: string
  nextOfKinPhone: string
  nextOfKinRelationship: string
  nextOfKinAddress: string
  educationalBackground: string
  languagesSpoken: string[]
  previousWorkExperience: string
  
  // Step 3: Banking Information
  bankName: string
  accountNumber: string
  accountName: string
  bvn?: string
  
  // Step 4: NIN Information
  ninNumber: string
  ninFirstName: string
  ninLastName: string
  
  // Step 5: Document Uploads
  documents: {
    ninCardFront?: File | string
    // ninCardBack removed - no longer required
    utilityBill?: File | string
    riderPhoto1?: File | string
    riderPhoto2?: File | string
    riderPhoto3?: File | string
    riderPhoto4?: File | string
  }
  
  // Step 6: Work Preferences
  preferredZone1: string
  preferredZone2: string
  preferredZone3: string
  equipmentChoice: 'own_bicycle' | 'company_bicycle'
  bicycleName?: string
  agreeToTerms?: boolean
  
  // Step 7: Guarantor Information
  guarantorFullName: string
  guarantorPhoneNumber: string
  guarantorNinNumber: string
  guarantorOccupation: string
  companyOrganizationName: string
  companyOrganizationAddress: string
  guarantorRelationshipToRider: string
  yearsKnown: number | ''
  
  // Step 8: OTP Verification
  guarantorOtp: string
  
  // Registration metadata
  password: string
  confirmPassword: string
  role: 'rider'
}

interface RiderMultiStepRegistrationProps {
  onComplete: (data: RiderRegistrationData) => Promise<void>
  onCancel?: () => void
}

export default function RiderMultiStepRegistration({ 
  onComplete, 
  onCancel
}: RiderMultiStepRegistrationProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<{ [key: string]: string }>({})
  const [registrationData, setRegistrationData] = useState<RiderRegistrationData>({
    // Basic Information
    fullName: '',
    phoneNumber: '',
    email: '',
    houseAddress: '',
    age: '',
    dateOfBirth: '',
    stateOfOrigin: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    
    // Next of Kin Details
    nextOfKinFullName: '',
    nextOfKinPhone: '',
    nextOfKinRelationship: '',
    nextOfKinAddress: '',
    educationalBackground: '',
    languagesSpoken: [],
    previousWorkExperience: '',
    
    // Banking Information
    bankName: '',
    accountNumber: '',
    accountName: '',
    bvn: '',
    
    // NIN Information
    ninNumber: '',
    ninFirstName: '',
    ninLastName: '',
    
    // Document Uploads
    documents: {},
    
    // Work Preferences
    preferredZone1: '',
    preferredZone2: '',
    preferredZone3: '',
    equipmentChoice: 'own_bicycle',
    bicycleName: '',
    agreeToTerms: false,
    
    // Guarantor Information
    guarantorFullName: '',
    guarantorPhoneNumber: '',
    guarantorNinNumber: '',
    guarantorOccupation: '',
    companyOrganizationName: '',
    companyOrganizationAddress: '',
    guarantorRelationshipToRider: '',
    yearsKnown: '',
    
    // OTP Verification
    guarantorOtp: '',
    
    // Registration metadata
    password: '',
    confirmPassword: '',
    role: 'rider'
  })

  // Generate steps for rider registration
  const steps: BaseRegistrationStep[] = [
    {
      id: 'basic_info',
      title: 'Basic Information',
      description: 'Personal details and contact information',
      isCompleted: false,
      icon: <User className="w-5 h-5" />
    },
    {
      id: 'next_of_kin',
      title: 'Next of Kin & Background',
      description: 'Emergency contact and personal background',
      isCompleted: false,
      icon: <Users className="w-5 h-5" />
    },
    {
      id: 'banking_info',
      title: 'Banking Information',
      description: 'Account details for payments',
      isCompleted: false,
      icon: <CreditCard className="w-5 h-5" />
    },
    {
      id: 'nin_info',
      title: 'NIN Information',
      description: 'National Identity Number details',
      isCompleted: false,
      icon: <Shield className="w-5 h-5" />
    },
    {
      id: 'document_upload',
      title: 'Document Upload',
      description: 'Required documents and photos',
      isCompleted: false,
      icon: <FileText className="w-5 h-5" />
    },
    {
      id: 'work_preferences',
      title: 'Work Preferences',
      description: 'Delivery zones and equipment choice',
      isCompleted: false,
      icon: <Briefcase className="w-5 h-5" />
    },
    {
      id: 'guarantor_info',
      title: 'Guarantor Information',
      description: 'Details of your guarantor',
      isCompleted: false,
      icon: <Phone className="w-5 h-5" />
    },
    {
      id: 'guarantor_verification',
      title: 'Guarantor Verification',
      description: 'OTP verification from guarantor',
      isCompleted: false,
      icon: <Check className="w-5 h-5" />
    }
  ]

  const updateRegistrationData = (updates: Partial<RiderRegistrationData>) => {
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

  const calculateAge = (dateOfBirth: string): number => {
    const today = new Date()
    const birthDate = new Date(dateOfBirth)
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    
    return age
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

  const validateStep = (stepId: string): { isValid: boolean; errors: { [key: string]: string } } => {
    const stepErrors: { [key: string]: string } = {}

    switch (stepId) {
      case 'basic_info':
        if (!registrationData.fullName.trim()) stepErrors.fullName = 'Full name is required'
        if (!registrationData.phoneNumber.trim()) {
          stepErrors.phoneNumber = 'Phone number is required'
        } else if (!validatePhoneNumber(registrationData.phoneNumber)) {
          stepErrors.phoneNumber = 'Please enter a valid Nigerian phone number'
        }
        if (!registrationData.email.trim()) {
          stepErrors.email = 'Email address is required'
        } else if (!validateEmail(registrationData.email)) {
          stepErrors.email = 'Please enter a valid email address'
        }
        if (!registrationData.houseAddress.trim()) stepErrors.houseAddress = 'House address is required'
        if (!registrationData.dateOfBirth) {
          stepErrors.dateOfBirth = 'Date of birth is required'
        } else {
          const calculatedAge = calculateAge(registrationData.dateOfBirth)
          if (calculatedAge < 18) {
            stepErrors.dateOfBirth = 'You must be at least 18 years old to register as a rider'
          } else if (calculatedAge > 60) {
            stepErrors.dateOfBirth = 'Maximum age for riders is 60 years'
          }
          updateRegistrationData({ age: calculatedAge })
        }
        if (!registrationData.stateOfOrigin) stepErrors.stateOfOrigin = 'State of origin is required'
        if (!registrationData.emergencyContactName.trim()) stepErrors.emergencyContactName = 'Emergency contact name is required'
        if (!registrationData.emergencyContactPhone.trim()) {
          stepErrors.emergencyContactPhone = 'Emergency contact phone is required'
        } else if (!validatePhoneNumber(registrationData.emergencyContactPhone)) {
          stepErrors.emergencyContactPhone = 'Please enter a valid Nigerian phone number'
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

      case 'next_of_kin':
        if (!registrationData.nextOfKinFullName.trim()) stepErrors.nextOfKinFullName = 'Next of kin full name is required'
        if (!registrationData.nextOfKinPhone.trim()) {
          stepErrors.nextOfKinPhone = 'Next of kin phone is required'
        } else if (!validatePhoneNumber(registrationData.nextOfKinPhone)) {
          stepErrors.nextOfKinPhone = 'Please enter a valid Nigerian phone number'
        }
        if (!registrationData.nextOfKinRelationship) stepErrors.nextOfKinRelationship = 'Relationship is required'
        if (!registrationData.nextOfKinAddress.trim()) stepErrors.nextOfKinAddress = 'Next of kin address is required'
        if (!registrationData.educationalBackground) stepErrors.educationalBackground = 'Educational background is required'
        if (!registrationData.languagesSpoken.length) stepErrors.languagesSpoken = 'Please select at least one language'
        break

      case 'banking_info':
        if (!registrationData.bankName) stepErrors.bankName = 'Bank name is required'
        if (!registrationData.accountNumber.trim()) {
          stepErrors.accountNumber = 'Account number is required'
        } else if (!validateAccountNumber(registrationData.accountNumber)) {
          stepErrors.accountNumber = 'Account number must be 10 digits'
        }
        if (!registrationData.accountName.trim()) stepErrors.accountName = 'Account name is required'
        // BVN no longer required per business decision
        break

      case 'nin_info':
        if (!registrationData.ninNumber.trim()) {
          stepErrors.ninNumber = 'NIN number is required'
        } else if (!validateNIN(registrationData.ninNumber)) {
          stepErrors.ninNumber = 'NIN must be 11 digits'
        }
        if (!registrationData.ninFirstName.trim()) stepErrors.ninFirstName = 'NIN first name is required'
        if (!registrationData.ninLastName.trim()) stepErrors.ninLastName = 'NIN last name is required'
        break

      case 'document_upload':
        if (!registrationData.documents.ninCardFront) stepErrors.ninCardFront = 'NIN card front is required'
        // NIN card back no longer required per business decision
        if (!registrationData.documents.utilityBill) stepErrors.utilityBill = 'Utility bill is required'
        if (!registrationData.documents.riderPhoto1) stepErrors.riderPhoto1 = 'Rider photo 1 is required'
        if (!registrationData.documents.riderPhoto2) stepErrors.riderPhoto2 = 'Rider photo 2 is required'
        if (!registrationData.documents.riderPhoto3) stepErrors.riderPhoto3 = 'Face close-up 1 is required'
        if (!registrationData.documents.riderPhoto4) stepErrors.riderPhoto4 = 'Face close-up 2 is required'
        break

      case 'work_preferences':
        if (!registrationData.preferredZone1) stepErrors.preferredZone1 = 'Preferred zone 1 is required'
        if (!registrationData.preferredZone2) stepErrors.preferredZone2 = 'Preferred zone 2 is required'
        if (!registrationData.preferredZone3) stepErrors.preferredZone3 = 'Preferred zone 3 is required'
        if (registrationData.preferredZone2 === registrationData.preferredZone1) {
          stepErrors.preferredZone2 = 'Zone 2 must be different from Zone 1'
        }
        if (registrationData.preferredZone3 === registrationData.preferredZone1 || 
            registrationData.preferredZone3 === registrationData.preferredZone2) {
          stepErrors.preferredZone3 = 'Zone 3 must be different from Zones 1 and 2'
        }
        if (registrationData.equipmentChoice === 'own_bicycle' && !registrationData.bicycleName?.trim()) {
          stepErrors.bicycleName = 'Bicycle name/number is required for your own bicycle'
        }
        if (registrationData.equipmentChoice === 'company_bicycle' && !registrationData.agreeToTerms) {
          stepErrors.agreeToTerms = 'You must agree to FoodNow bicycle terms and conditions'
        }
        break

      case 'guarantor_info':
        if (!registrationData.guarantorFullName.trim()) stepErrors.guarantorFullName = 'Guarantor full name is required'
        if (!registrationData.guarantorPhoneNumber.trim()) {
          stepErrors.guarantorPhoneNumber = 'Guarantor phone number is required'
        } else if (!validatePhoneNumber(registrationData.guarantorPhoneNumber)) {
          stepErrors.guarantorPhoneNumber = 'Please enter a valid Nigerian phone number'
        }
        if (!registrationData.guarantorNinNumber.trim()) {
          stepErrors.guarantorNinNumber = 'Guarantor NIN is required'
        } else if (!validateNIN(registrationData.guarantorNinNumber)) {
          stepErrors.guarantorNinNumber = 'Guarantor NIN must be 11 digits'
        }
        if (!registrationData.guarantorOccupation) stepErrors.guarantorOccupation = 'Guarantor occupation is required'
        if (!registrationData.companyOrganizationName.trim()) stepErrors.companyOrganizationName = 'Company/Organization name is required'
        if (!registrationData.companyOrganizationAddress.trim()) stepErrors.companyOrganizationAddress = 'Company/Organization address is required'
        if (!registrationData.guarantorRelationshipToRider.trim()) stepErrors.guarantorRelationshipToRider = 'Relationship to rider is required'
        if (!registrationData.yearsKnown || registrationData.yearsKnown < 2) {
          stepErrors.yearsKnown = 'Years known must be at least 2 years'
        }
        break

      case 'guarantor_verification':
        if (!registrationData.guarantorOtp.trim()) {
          stepErrors.guarantorOtp = 'OTP from guarantor is required'
        } else if (!/^\d{6}$/.test(registrationData.guarantorOtp)) {
          stepErrors.guarantorOtp = 'OTP must be 6 digits'
        }
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

      // If moving from guarantor_info to guarantor_verification, send OTP
      if (currentStepData.id === 'guarantor_info' && currentStep < steps.length - 1) {
        await sendGuarantorOTP()
      }

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
      prodLog.error('Rider multi-step registration submission failed', error)
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

  const sendGuarantorOTP = async () => {
    try {
      prodLog.info('Sending OTP to guarantor', { 
        guarantorPhone: registrationData.guarantorPhoneNumber,
        riderName: registrationData.fullName
      })

      // Format phone number for international format (Nigerian)
      let formattedPhone = registrationData.guarantorPhoneNumber
      if (formattedPhone.startsWith('0')) {
        formattedPhone = '+234' + formattedPhone.substring(1)
      } else if (!formattedPhone.startsWith('+')) {
        formattedPhone = '+234' + formattedPhone
      }

      const result = await sendOTP(formattedPhone, 'sms', {
        shouldCreateUser: false,
        data: {
          purpose: 'guarantor_verification',
          riderName: registrationData.fullName,
          guarantorName: registrationData.guarantorFullName
        }
      })

      if (result.success) {
        prodLog.info('OTP sent successfully to guarantor', {
          guarantorPhone: formattedPhone
        })
        // You could add a toast notification here
      } else {
        prodLog.error('Failed to send OTP to guarantor', {
          error: result.error,
          guarantorPhone: formattedPhone
        })
        setErrors({ guarantorOtp: result.error || 'Failed to send OTP' })
      }
    } catch (error) {
      prodLog.error('Error sending guarantor OTP', error)
      setErrors({ guarantorOtp: 'Error sending OTP. Please try again.' })
    }
  }

  const renderStepContent = () => {
    const currentStepData = steps[currentStep]

    switch (currentStepData.id) {
      case 'basic_info':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Join FoodNow Riders
              </h3>
              <p className="text-gray-600">
                Please provide your personal information to get started.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={registrationData.fullName}
                  onChange={(e) => updateRegistrationData({ fullName: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                    errors.fullName ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter your full name"
                />
                {errors.fullName && <p className="text-red-500 text-sm mt-1">{errors.fullName}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    value={registrationData.phoneNumber}
                    onChange={(e) => updateRegistrationData({ phoneNumber: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                      errors.phoneNumber ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="080xxxxxxxx"
                  />
                  {errors.phoneNumber && <p className="text-red-500 text-sm mt-1">{errors.phoneNumber}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    value={registrationData.email}
                    onChange={(e) => updateRegistrationData({ email: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                      errors.email ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="your.email@example.com"
                  />
                  {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  House Address *
                </label>
                <textarea
                  value={registrationData.houseAddress}
                  onChange={(e) => updateRegistrationData({ houseAddress: e.target.value })}
                  rows={3}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                    errors.houseAddress ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter your full residential address"
                />
                {errors.houseAddress && <p className="text-red-500 text-sm mt-1">{errors.houseAddress}</p>}
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date of Birth *
                  </label>
                  <input
                    type="date"
                    value={registrationData.dateOfBirth}
                    onChange={(e) => updateRegistrationData({ dateOfBirth: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                      errors.dateOfBirth ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.dateOfBirth && <p className="text-red-500 text-sm mt-1">{errors.dateOfBirth}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Age
                  </label>
                  <input
                    type="number"
                    value={registrationData.age}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
                    placeholder="Auto-calculated"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    State of Origin *
                  </label>
                  <select
                    value={registrationData.stateOfOrigin}
                    onChange={(e) => updateRegistrationData({ stateOfOrigin: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                      errors.stateOfOrigin ? 'border-red-500' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Select State</option>
                    {NIGERIAN_STATES.map(state => (
                      <option key={state} value={state}>{state}</option>
                    ))}
                  </select>
                  {errors.stateOfOrigin && <p className="text-red-500 text-sm mt-1">{errors.stateOfOrigin}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Emergency Contact Name *
                  </label>
                  <input
                    type="text"
                    value={registrationData.emergencyContactName}
                    onChange={(e) => updateRegistrationData({ emergencyContactName: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                      errors.emergencyContactName ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Emergency contact full name"
                  />
                  {errors.emergencyContactName && <p className="text-red-500 text-sm mt-1">{errors.emergencyContactName}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Emergency Contact Phone *
                  </label>
                  <input
                    type="tel"
                    value={registrationData.emergencyContactPhone}
                    onChange={(e) => updateRegistrationData({ emergencyContactPhone: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                      errors.emergencyContactPhone ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="080xxxxxxxx"
                  />
                  {errors.emergencyContactPhone && <p className="text-red-500 text-sm mt-1">{errors.emergencyContactPhone}</p>}
                </div>
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

      case 'next_of_kin':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Next of Kin & Background Information
              </h3>
              <p className="text-gray-600">
                Please provide emergency contact and personal background details.
              </p>
            </div>

            {/* Next of Kin Information */}
            <div className="border border-gray-200 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-4">Next of Kin Details</h4>
              
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Next of Kin Full Name *
                  </label>
                  <input
                    type="text"
                    value={registrationData.nextOfKinFullName}
                    onChange={(e) => updateRegistrationData({ nextOfKinFullName: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                      errors.nextOfKinFullName ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Enter next of kin full name"
                  />
                  {errors.nextOfKinFullName && <p className="text-red-500 text-sm mt-1">{errors.nextOfKinFullName}</p>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Next of Kin Phone *
                    </label>
                    <input
                      type="tel"
                      value={registrationData.nextOfKinPhone}
                      onChange={(e) => updateRegistrationData({ nextOfKinPhone: e.target.value })}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                        errors.nextOfKinPhone ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="080xxxxxxxx"
                    />
                    {errors.nextOfKinPhone && <p className="text-red-500 text-sm mt-1">{errors.nextOfKinPhone}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Relationship *
                    </label>
                    <select
                      value={registrationData.nextOfKinRelationship}
                      onChange={(e) => updateRegistrationData({ nextOfKinRelationship: e.target.value })}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                        errors.nextOfKinRelationship ? 'border-red-500' : 'border-gray-300'
                      }`}
                    >
                      <option value="">Select Relationship</option>
                      <option value="Spouse">Spouse</option>
                      <option value="Parent">Parent</option>
                      <option value="Sibling">Sibling</option>
                      <option value="Child">Child</option>
                      <option value="Other">Other</option>
                    </select>
                    {errors.nextOfKinRelationship && <p className="text-red-500 text-sm mt-1">{errors.nextOfKinRelationship}</p>}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Next of Kin Address *
                  </label>
                  <textarea
                    value={registrationData.nextOfKinAddress}
                    onChange={(e) => updateRegistrationData({ nextOfKinAddress: e.target.value })}
                    rows={3}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                      errors.nextOfKinAddress ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Enter next of kin full address"
                  />
                  {errors.nextOfKinAddress && <p className="text-red-500 text-sm mt-1">{errors.nextOfKinAddress}</p>}
                </div>
              </div>
            </div>

            {/* Personal Background */}
            <div className="border border-gray-200 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-4">Personal Background</h4>
              
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Educational Background *
                  </label>
                  <select
                    value={registrationData.educationalBackground}
                    onChange={(e) => updateRegistrationData({ educationalBackground: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                      errors.educationalBackground ? 'border-red-500' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Select Educational Background</option>
                    <option value="Primary">Primary</option>
                    <option value="Secondary">Secondary</option>
                    <option value="OND">OND</option>
                    <option value="HND">HND</option>
                    <option value="BSc">BSc</option>
                    <option value="MSc">MSc</option>
                    <option value="PhD">PhD</option>
                    <option value="Other">Other</option>
                  </select>
                  {errors.educationalBackground && <p className="text-red-500 text-sm mt-1">{errors.educationalBackground}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Languages Spoken *
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {['English', 'Yoruba', 'Igbo', 'Hausa', 'Other'].map((language) => (
                      <label key={language} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={registrationData.languagesSpoken.includes(language)}
                          onChange={(e) => {
                            const currentLanguages = registrationData.languagesSpoken || []
                            if (e.target.checked) {
                              updateRegistrationData({ languagesSpoken: [...currentLanguages, language] })
                            } else {
                              updateRegistrationData({ languagesSpoken: currentLanguages.filter(l => l !== language) })
                            }
                          }}
                          className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">{language}</span>
                      </label>
                    ))}
                  </div>
                  {errors.languagesSpoken && <p className="text-red-500 text-sm mt-1">{errors.languagesSpoken}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Previous Work Experience (Optional)
                  </label>
                  <textarea
                    value={registrationData.previousWorkExperience}
                    onChange={(e) => updateRegistrationData({ previousWorkExperience: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="Describe your previous work experience (optional)"
                  />
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
                Provide your banking details for payment processing.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bank Name *
                </label>
                <select
                  value={registrationData.bankName}
                  onChange={(e) => updateRegistrationData({ bankName: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                    errors.bankName ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select Bank</option>
                  {NIGERIAN_BANKS.map(bank => (
                    <option key={bank} value={bank}>{bank}</option>
                  ))}
                </select>
                {errors.bankName && <p className="text-red-500 text-sm mt-1">{errors.bankName}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Account Number *
                  </label>
                  <input
                    type="text"
                    value={registrationData.accountNumber}
                    onChange={(e) => updateRegistrationData({ accountNumber: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                      errors.accountNumber ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="10-digit account number"
                    maxLength={10}
                  />
                  {errors.accountNumber && <p className="text-red-500 text-sm mt-1">{errors.accountNumber}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Account Name *
                  </label>
                  <input
                    type="text"
                    value={registrationData.accountName}
                    onChange={(e) => updateRegistrationData({ accountName: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                      errors.accountName ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Account holder name"
                  />
                  {errors.accountName && <p className="text-red-500 text-sm mt-1">{errors.accountName}</p>}
                </div>
              </div>


              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex">
                  <AlertCircle className="h-5 w-5 text-blue-400 mt-0.5" />
                  <div className="ml-3">
                    <h4 className="text-sm font-medium text-blue-800">
                      Banking Information Security
                    </h4>
                    <p className="mt-1 text-sm text-blue-700">
                      Your banking information is encrypted and secure. It will only be used for payment processing and account verification.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )

      case 'nin_info':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                NIN Information
              </h3>
              <p className="text-gray-600">
                Please provide your National Identity Number details.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  NIN Number *
                </label>
                <input
                  type="text"
                  value={registrationData.ninNumber}
                  onChange={(e) => updateRegistrationData({ ninNumber: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                    errors.ninNumber ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="11-digit NIN"
                  maxLength={11}
                />
                {errors.ninNumber && <p className="text-red-500 text-sm mt-1">{errors.ninNumber}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    NIN First Name *
                  </label>
                  <input
                    type="text"
                    value={registrationData.ninFirstName}
                    onChange={(e) => updateRegistrationData({ ninFirstName: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                      errors.ninFirstName ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="First name as on NIN"
                  />
                  {errors.ninFirstName && <p className="text-red-500 text-sm mt-1">{errors.ninFirstName}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    NIN Last Name *
                  </label>
                  <input
                    type="text"
                    value={registrationData.ninLastName}
                    onChange={(e) => updateRegistrationData({ ninLastName: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                      errors.ninLastName ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Last name as on NIN"
                  />
                  {errors.ninLastName && <p className="text-red-500 text-sm mt-1">{errors.ninLastName}</p>}
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex">
                  <AlertCircle className="h-5 w-5 text-amber-400 mt-0.5" />
                  <div className="ml-3">
                    <h4 className="text-sm font-medium text-amber-800">
                      Name Verification Required
                    </h4>
                    <p className="mt-1 text-sm text-amber-700">
                      The names you enter here must exactly match the names on your NIN card. This will be verified during the document upload process.
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
                Please upload all required documents and photos.
              </p>
            </div>

            {/* NIN Card Documents */}
            <div className="border border-gray-200 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-4">NIN Card (Front and Back)</h4>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    NIN Card Front *
                  </label>
                  <div className={`border-2 border-dashed rounded-lg p-4 text-center ${
                    errors.ninCardFront ? 'border-red-300' : 'border-gray-300'
                  }`}>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/jpg"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) handleDocumentUpload('ninCardFront', file)
                      }}
                      className="hidden"
                      id="ninCardFront"
                    />
                    <label htmlFor="ninCardFront" className="cursor-pointer">
                      <Upload className="mx-auto h-8 w-8 text-gray-400" />
                      <p className="mt-2 text-sm text-gray-600">
                        {registrationData.documents.ninCardFront ? 'Document uploaded' : 'Click to upload NIN front'}
                      </p>
                      <p className="text-xs text-gray-500">JPG, PNG up to 5MB</p>
                    </label>
                  </div>
                  {errors.ninCardFront && <p className="text-red-500 text-sm mt-1">{errors.ninCardFront}</p>}
                </div>

              </div>
            </div>

            {/* Utility Bill */}
            <div className="border border-gray-200 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-4">Utility Bill (Not older than 3 months)</h4>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Utility Bill *
                </label>
                <div className={`border-2 border-dashed rounded-lg p-4 text-center ${
                  errors.utilityBill ? 'border-red-300' : 'border-gray-300'
                }`}>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/jpg,application/pdf"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) handleDocumentUpload('utilityBill', file)
                    }}
                    className="hidden"
                    id="utilityBill"
                  />
                  <label htmlFor="utilityBill" className="cursor-pointer">
                    <Upload className="mx-auto h-8 w-8 text-gray-400" />
                    <p className="mt-2 text-sm text-gray-600">
                      {registrationData.documents.utilityBill ? 'Document uploaded' : 'Click to upload utility bill'}
                    </p>
                    <p className="text-xs text-gray-500">JPG, PNG, PDF up to 5MB</p>
                  </label>
                </div>
                {errors.utilityBill && <p className="text-red-500 text-sm mt-1">{errors.utilityBill}</p>}
              </div>
            </div>

            {/* Rider Photos */}
            <div className="border border-gray-200 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-4">Rider Photos</h4>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Body Photo 1 (Standing, Clear Face) *
                  </label>
                  <div className={`border-2 border-dashed rounded-lg p-4 text-center ${
                    errors.riderPhoto1 ? 'border-red-300' : 'border-gray-300'
                  }`}>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/jpg"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) handleDocumentUpload('riderPhoto1', file)
                      }}
                      className="hidden"
                      id="riderPhoto1"
                    />
                    <label htmlFor="riderPhoto1" className="cursor-pointer">
                      <Upload className="mx-auto h-8 w-8 text-gray-400" />
                      <p className="mt-2 text-sm text-gray-600">
                        {registrationData.documents.riderPhoto1 ? 'Photo uploaded' : 'Upload full body photo 1'}
                      </p>
                      <p className="text-xs text-gray-500">JPG, PNG up to 5MB</p>
                    </label>
                  </div>
                  {errors.riderPhoto1 && <p className="text-red-500 text-sm mt-1">{errors.riderPhoto1}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Body Photo 2 (Different Angle) *
                  </label>
                  <div className={`border-2 border-dashed rounded-lg p-4 text-center ${
                    errors.riderPhoto2 ? 'border-red-300' : 'border-gray-300'
                  }`}>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/jpg"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) handleDocumentUpload('riderPhoto2', file)
                      }}
                      className="hidden"
                      id="riderPhoto2"
                    />
                    <label htmlFor="riderPhoto2" className="cursor-pointer">
                      <Upload className="mx-auto h-8 w-8 text-gray-400" />
                      <p className="mt-2 text-sm text-gray-600">
                        {registrationData.documents.riderPhoto2 ? 'Photo uploaded' : 'Upload full body photo 2'}
                      </p>
                      <p className="text-xs text-gray-500">JPG, PNG up to 5MB</p>
                    </label>
                  </div>
                  {errors.riderPhoto2 && <p className="text-red-500 text-sm mt-1">{errors.riderPhoto2}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Face Close-up 1 (Passport Style) *
                  </label>
                  <div className={`border-2 border-dashed rounded-lg p-4 text-center ${
                    errors.riderPhoto3 ? 'border-red-300' : 'border-gray-300'
                  }`}>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/jpg"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) handleDocumentUpload('riderPhoto3', file)
                      }}
                      className="hidden"
                      id="riderPhoto3"
                    />
                    <label htmlFor="riderPhoto3" className="cursor-pointer">
                      <Upload className="mx-auto h-8 w-8 text-gray-400" />
                      <p className="mt-2 text-sm text-gray-600">
                        {registrationData.documents.riderPhoto3 ? 'Photo uploaded' : 'Upload face close-up 1'}
                      </p>
                      <p className="text-xs text-gray-500">JPG, PNG up to 5MB</p>
                    </label>
                  </div>
                  {errors.riderPhoto3 && <p className="text-red-500 text-sm mt-1">{errors.riderPhoto3}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Face Close-up 2 (Different Angle) *
                  </label>
                  <div className={`border-2 border-dashed rounded-lg p-4 text-center ${
                    errors.riderPhoto4 ? 'border-red-300' : 'border-gray-300'
                  }`}>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/jpg"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) handleDocumentUpload('riderPhoto4', file)
                      }}
                      className="hidden"
                      id="riderPhoto4"
                    />
                    <label htmlFor="riderPhoto4" className="cursor-pointer">
                      <Upload className="mx-auto h-8 w-8 text-gray-400" />
                      <p className="mt-2 text-sm text-gray-600">
                        {registrationData.documents.riderPhoto4 ? 'Photo uploaded' : 'Upload face close-up 2'}
                      </p>
                      <p className="text-xs text-gray-500">JPG, PNG up to 5MB</p>
                    </label>
                  </div>
                  {errors.riderPhoto4 && <p className="text-red-500 text-sm mt-1">{errors.riderPhoto4}</p>}
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
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )

      case 'work_preferences':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Work Preferences
              </h3>
              <p className="text-gray-600">
                Choose your preferred delivery zones and equipment.
              </p>
            </div>

            {/* Delivery Zones */}
            <div className="border border-gray-200 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-4">Delivery Zones (Select 3)</h4>
              
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Preferred Zone 1 *
                  </label>
                  <select
                    value={registrationData.preferredZone1}
                    onChange={(e) => updateRegistrationData({ preferredZone1: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                      errors.preferredZone1 ? 'border-red-500' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Select Zone 1</option>
                    {DELIVERY_ZONES.map(zone => (
                      <option key={zone} value={zone}>{zone}</option>
                    ))}
                  </select>
                  {errors.preferredZone1 && <p className="text-red-500 text-sm mt-1">{errors.preferredZone1}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Preferred Zone 2 *
                  </label>
                  <select
                    value={registrationData.preferredZone2}
                    onChange={(e) => updateRegistrationData({ preferredZone2: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                      errors.preferredZone2 ? 'border-red-500' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Select Zone 2</option>
                    {DELIVERY_ZONES.filter(zone => zone !== registrationData.preferredZone1).map(zone => (
                      <option key={zone} value={zone}>{zone}</option>
                    ))}
                  </select>
                  {errors.preferredZone2 && <p className="text-red-500 text-sm mt-1">{errors.preferredZone2}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Preferred Zone 3 *
                  </label>
                  <select
                    value={registrationData.preferredZone3}
                    onChange={(e) => updateRegistrationData({ preferredZone3: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                      errors.preferredZone3 ? 'border-red-500' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Select Zone 3</option>
                    {DELIVERY_ZONES.filter(zone => 
                      zone !== registrationData.preferredZone1 && zone !== registrationData.preferredZone2
                    ).map(zone => (
                      <option key={zone} value={zone}>{zone}</option>
                    ))}
                  </select>
                  {errors.preferredZone3 && <p className="text-red-500 text-sm mt-1">{errors.preferredZone3}</p>}
                </div>
              </div>
            </div>

            {/* Equipment Choice */}
            <div className="border border-gray-200 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-4">Equipment Choice</h4>
              
              <div className="space-y-4">
                <div className={`border rounded-lg p-4 cursor-pointer transition-all ${
                  registrationData.equipmentChoice === 'own_bicycle'
                    ? 'border-orange-500 bg-orange-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
                onClick={() => updateRegistrationData({ equipmentChoice: 'own_bicycle' })}
                >
                  <div className="flex items-center">
                    <input
                      type="radio"
                      name="equipmentChoice"
                      value="own_bicycle"
                      checked={registrationData.equipmentChoice === 'own_bicycle'}
                      onChange={() => updateRegistrationData({ equipmentChoice: 'own_bicycle' })}
                      className="text-orange-600 focus:ring-orange-500"
                    />
                    <div className="ml-3 flex-1">
                      <h5 className="font-medium text-gray-900">I have my own bicycle</h5>
                      <p className="text-sm text-gray-600">Commission: 10% of delivery fee</p>
                    </div>
                  </div>
                  
                  {registrationData.equipmentChoice === 'own_bicycle' && (
                    <div className="mt-3">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Bicycle Name/Number *
                      </label>
                      <input
                        type="text"
                        value={registrationData.bicycleName || ''}
                        onChange={(e) => updateRegistrationData({ bicycleName: e.target.value })}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                          errors.bicycleName ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Enter bicycle name or number for system identification"
                      />
                      {errors.bicycleName && <p className="text-red-500 text-sm mt-1">{errors.bicycleName}</p>}
                    </div>
                  )}
                </div>

                <div className={`border rounded-lg p-4 cursor-pointer transition-all ${
                  registrationData.equipmentChoice === 'company_bicycle'
                    ? 'border-orange-500 bg-orange-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
                onClick={() => updateRegistrationData({ equipmentChoice: 'company_bicycle' })}
                >
                  <div className="flex items-center">
                    <input
                      type="radio"
                      name="equipmentChoice"
                      value="company_bicycle"
                      checked={registrationData.equipmentChoice === 'company_bicycle'}
                      onChange={() => updateRegistrationData({ equipmentChoice: 'company_bicycle' })}
                      className="text-orange-600 focus:ring-orange-500"
                    />
                    <div className="ml-3 flex-1">
                      <h5 className="font-medium text-gray-900">I need FoodNow to provide bicycle</h5>
                      <p className="text-sm text-gray-600">Commission: 20% of delivery fee</p>
                    </div>
                  </div>
                  
                  {registrationData.equipmentChoice === 'company_bicycle' && (
                    <div className="mt-3">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={registrationData.agreeToTerms || false}
                          onChange={(e) => updateRegistrationData({ agreeToTerms: e.target.checked })}
                          className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">
                          I agree to FoodNow bicycle terms and conditions *
                        </span>
                      </label>
                      {errors.agreeToTerms && <p className="text-red-500 text-sm mt-1">{errors.agreeToTerms}</p>}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )

      case 'guarantor_info':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Guarantor Information
              </h3>
              <p className="text-gray-600">
                Please provide details of your guarantor from an eligible profession.
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex">
                <AlertCircle className="h-5 w-5 text-blue-400 mt-0.5" />
                <div className="ml-3">
                  <h4 className="text-sm font-medium text-blue-800">
                    Guarantor Eligibility Requirements
                  </h4>
                  <p className="mt-1 text-sm text-blue-700">
                    Your guarantor must be in one of these eligible professions: Bank Employee, Government Worker, 
                    Police Officer, Clergy, Licensed Professional, or Reputable Business Owner. You must have known them for at least 2 years.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Guarantor Full Name *
                </label>
                <input
                  type="text"
                  value={registrationData.guarantorFullName}
                  onChange={(e) => updateRegistrationData({ guarantorFullName: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                    errors.guarantorFullName ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter guarantor's full name"
                />
                {errors.guarantorFullName && <p className="text-red-500 text-sm mt-1">{errors.guarantorFullName}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Guarantor Phone Number *
                  </label>
                  <input
                    type="tel"
                    value={registrationData.guarantorPhoneNumber}
                    onChange={(e) => updateRegistrationData({ guarantorPhoneNumber: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                      errors.guarantorPhoneNumber ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="080xxxxxxxx"
                  />
                  {errors.guarantorPhoneNumber && <p className="text-red-500 text-sm mt-1">{errors.guarantorPhoneNumber}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Guarantor NIN Number *
                  </label>
                  <input
                    type="text"
                    value={registrationData.guarantorNinNumber}
                    onChange={(e) => updateRegistrationData({ guarantorNinNumber: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                      errors.guarantorNinNumber ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="11-digit NIN"
                    maxLength={11}
                  />
                  {errors.guarantorNinNumber && <p className="text-red-500 text-sm mt-1">{errors.guarantorNinNumber}</p>}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Guarantor Occupation *
                </label>
                <select
                  value={registrationData.guarantorOccupation}
                  onChange={(e) => updateRegistrationData({ guarantorOccupation: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                    errors.guarantorOccupation ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select Guarantor Occupation</option>
                  {GUARANTOR_OCCUPATIONS.map(occupation => (
                    <option key={occupation} value={occupation}>{occupation}</option>
                  ))}
                </select>
                {errors.guarantorOccupation && <p className="text-red-500 text-sm mt-1">{errors.guarantorOccupation}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Company/Organization Name *
                </label>
                <input
                  type="text"
                  value={registrationData.companyOrganizationName}
                  onChange={(e) => updateRegistrationData({ companyOrganizationName: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                    errors.companyOrganizationName ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter company or organization name"
                />
                {errors.companyOrganizationName && <p className="text-red-500 text-sm mt-1">{errors.companyOrganizationName}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Company/Organization Address *
                </label>
                <textarea
                  value={registrationData.companyOrganizationAddress}
                  onChange={(e) => updateRegistrationData({ companyOrganizationAddress: e.target.value })}
                  rows={3}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                    errors.companyOrganizationAddress ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter full company/organization address"
                />
                {errors.companyOrganizationAddress && <p className="text-red-500 text-sm mt-1">{errors.companyOrganizationAddress}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Guarantor Relationship to You *
                  </label>
                  <input
                    type="text"
                    value={registrationData.guarantorRelationshipToRider}
                    onChange={(e) => updateRegistrationData({ guarantorRelationshipToRider: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                      errors.guarantorRelationshipToRider ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="How do you know each other?"
                  />
                  {errors.guarantorRelationshipToRider && <p className="text-red-500 text-sm mt-1">{errors.guarantorRelationshipToRider}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Years Known *
                  </label>
                  <input
                    type="number"
                    min="2"
                    max="50"
                    value={registrationData.yearsKnown}
                    onChange={(e) => updateRegistrationData({ yearsKnown: parseInt(e.target.value) || '' })}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                      errors.yearsKnown ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Minimum 2 years"
                  />
                  {errors.yearsKnown && <p className="text-red-500 text-sm mt-1">{errors.yearsKnown}</p>}
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex">
                  <AlertCircle className="h-5 w-5 text-amber-400 mt-0.5" />
                  <div className="ml-3">
                    <h4 className="text-sm font-medium text-amber-800">
                      Next Step: Guarantor Verification
                    </h4>
                    <p className="mt-1 text-sm text-amber-700">
                      After submitting this information, we will send an OTP to your guarantor's phone number. 
                      You will need to contact your guarantor to get the OTP and complete the verification process.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )

      case 'guarantor_verification':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Guarantor Verification
              </h3>
              <p className="text-gray-600">
                Please obtain the OTP from your guarantor and enter it below.
              </p>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex">
                <Check className="h-5 w-5 text-green-400 mt-0.5" />
                <div className="ml-3">
                  <h4 className="text-sm font-medium text-green-800">
                    OTP Sent to Guarantor
                  </h4>
                  <p className="mt-1 text-sm text-green-700">
                    We have sent a 6-digit OTP to <strong>{registrationData.guarantorPhoneNumber}</strong>. 
                    The OTP is valid for 10 minutes.
                  </p>
                  <p className="mt-2 text-sm text-green-700">
                    Message sent: "Hello {registrationData.guarantorFullName}, {registrationData.fullName} has listed you as guarantor for FoodNow delivery service. Please share the OTP with them."
                  </p>
                </div>
              </div>
            </div>

            <div className="text-center">
              <div className="max-w-xs mx-auto">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Enter OTP from Guarantor *
                </label>
                <input
                  type="text"
                  value={registrationData.guarantorOtp}
                  onChange={(e) => updateRegistrationData({ guarantorOtp: e.target.value })}
                  className={`w-full px-4 py-3 text-center text-2xl font-mono border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                    errors.guarantorOtp ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="000000"
                  maxLength={6}
                />
                {errors.guarantorOtp && <p className="text-red-500 text-sm mt-1">{errors.guarantorOtp}</p>}
              </div>

              <button
                onClick={sendGuarantorOTP}
                className="mt-4 px-4 py-2 text-sm text-orange-600 hover:text-orange-500"
              >
                Resend OTP to Guarantor
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Guarantor Information Summary */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-3">Guarantor Summary</h4>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-gray-500">Name:</span>
                    <p className="font-medium">{registrationData.guarantorFullName}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Phone:</span>
                    <p className="font-medium">{registrationData.guarantorPhoneNumber}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Occupation:</span>
                    <p className="font-medium">{registrationData.guarantorOccupation}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Organization:</span>
                    <p className="font-medium">{registrationData.companyOrganizationName}</p>
                  </div>
                </div>
              </div>

              {/* Instructions */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-3">Instructions</h4>
                <ol className="space-y-2 text-sm text-gray-700">
                  <li>1. Contact your guarantor via phone call</li>
                  <li>2. Ask them to check their SMS for the OTP</li>
                  <li>3. Enter the 6-digit OTP in the field above</li>
                  <li>4. Complete your registration process</li>
                </ol>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex">
                <AlertCircle className="h-5 w-5 text-blue-400 mt-0.5" />
                <div className="ml-3">
                  <h4 className="text-sm font-medium text-blue-800">
                    Final Step
                  </h4>
                  <p className="mt-1 text-sm text-blue-700">
                    Once you verify the guarantor OTP, your application will be submitted for admin review. 
                    You'll receive notifications about your application status via email and SMS.
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