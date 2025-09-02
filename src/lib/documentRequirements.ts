/**
 * Document Requirements for Different User Roles
 * =============================================
 * Defines required documents for restaurant owners and delivery riders
 */

export interface DocumentRequirement {
  id: string
  title: string
  description: string
  acceptedTypes: string[]
  maxSize: number // in MB
  required: boolean
  examples?: string[]
  category: 'identity' | 'business' | 'vehicle' | 'certification' | 'financial'
}

/**
 * Document requirements for restaurant owners
 */
export const RESTAURANT_OWNER_DOCUMENTS: DocumentRequirement[] = [
  {
    id: 'business_registration',
    title: 'Business Registration Certificate',
    description: 'Official business registration document from Corporate Affairs Commission (CAC)',
    acceptedTypes: ['image/jpeg', 'image/png', 'application/pdf'],
    maxSize: 5,
    required: true,
    category: 'business',
    examples: [
      'Certificate of Incorporation',
      'Business Name Registration Certificate',
      'CAC Certificate'
    ]
  },
  {
    id: 'tax_identification',
    title: 'Tax Identification Number (TIN)',
    description: 'Valid Tax Identification Number certificate',
    acceptedTypes: ['image/jpeg', 'image/png', 'application/pdf'],
    maxSize: 3,
    required: true,
    category: 'financial',
    examples: [
      'TIN Certificate from FIRS',
      'Tax Clearance Certificate'
    ]
  },
  {
    id: 'food_safety_permit',
    title: 'Food Safety Permit',
    description: 'Valid food safety permit or license from local health authority',
    acceptedTypes: ['image/jpeg', 'image/png', 'application/pdf'],
    maxSize: 5,
    required: true,
    category: 'certification',
    examples: [
      'NAFDAC Registration',
      'Local Government Health Permit',
      'Food Handler\'s Certificate'
    ]
  },
  {
    id: 'business_premises_permit',
    title: 'Business Premises Permit',
    description: 'Valid permit for operating a food business at your location',
    acceptedTypes: ['image/jpeg', 'image/png', 'application/pdf'],
    maxSize: 5,
    required: true,
    category: 'business',
    examples: [
      'Local Government Business Permit',
      'Shop Permit',
      'Restaurant Operating License'
    ]
  },
  {
    id: 'owner_identification',
    title: 'Owner\'s Valid ID',
    description: 'Government-issued identification of the business owner',
    acceptedTypes: ['image/jpeg', 'image/png'],
    maxSize: 3,
    required: true,
    category: 'identity',
    examples: [
      'National ID Card',
      'International Passport',
      'Driver\'s License',
      'Voter\'s Card'
    ]
  },
  {
    id: 'bank_statement',
    title: 'Bank Account Statement',
    description: 'Recent bank statement (within 3 months) for payment verification',
    acceptedTypes: ['image/jpeg', 'image/png', 'application/pdf'],
    maxSize: 3,
    required: false,
    category: 'financial',
    examples: [
      '3-month bank statement',
      'Account opening document',
      'Bank certificate'
    ]
  },
  {
    id: 'menu_sample',
    title: 'Menu Sample',
    description: 'Sample of your restaurant menu with prices',
    acceptedTypes: ['image/jpeg', 'image/png', 'application/pdf'],
    maxSize: 5,
    required: false,
    category: 'business',
    examples: [
      'Current menu card',
      'Digital menu with prices',
      'Food catalog'
    ]
  }
]

/**
 * Document requirements for delivery riders
 */
export const RIDER_DOCUMENTS: DocumentRequirement[] = [
  {
    id: 'rider_identification',
    title: 'Valid Government ID',
    description: 'Government-issued identification document',
    acceptedTypes: ['image/jpeg', 'image/png'],
    maxSize: 3,
    required: true,
    category: 'identity',
    examples: [
      'National ID Card',
      'International Passport',
      'Driver\'s License',
      'Voter\'s Card'
    ]
  },
  {
    id: 'drivers_license',
    title: 'Driver\'s License',
    description: 'Valid driver\'s license for your vehicle type',
    acceptedTypes: ['image/jpeg', 'image/png'],
    maxSize: 3,
    required: true,
    category: 'vehicle',
    examples: [
      'Motorcycle License',
      'Car Driver\'s License',
      'Commercial Driver\'s License'
    ]
  },
  {
    id: 'vehicle_registration',
    title: 'Vehicle Registration',
    description: 'Valid vehicle registration documents',
    acceptedTypes: ['image/jpeg', 'image/png', 'application/pdf'],
    maxSize: 5,
    required: true,
    category: 'vehicle',
    examples: [
      'Vehicle Registration Certificate',
      'Motorcycle Papers',
      'Car Registration Document'
    ]
  },
  {
    id: 'insurance_certificate',
    title: 'Insurance Certificate',
    description: 'Valid insurance certificate for your vehicle',
    acceptedTypes: ['image/jpeg', 'image/png', 'application/pdf'],
    maxSize: 5,
    required: true,
    category: 'vehicle',
    examples: [
      'Third-party Insurance',
      'Comprehensive Insurance',
      'Commercial Vehicle Insurance'
    ]
  },
  {
    id: 'road_worthiness',
    title: 'Road Worthiness Certificate',
    description: 'Valid road worthiness certificate (for motorcycles/cars)',
    acceptedTypes: ['image/jpeg', 'image/png', 'application/pdf'],
    maxSize: 3,
    required: true,
    category: 'vehicle',
    examples: [
      'Vehicle Inspection Certificate',
      'Road Worthiness Certificate',
      'Emissions Test Certificate'
    ]
  },
  {
    id: 'guarantor_form',
    title: 'Guarantor Information',
    description: 'Guarantor form with valid ID of your guarantor',
    acceptedTypes: ['image/jpeg', 'image/png', 'application/pdf'],
    maxSize: 5,
    required: false,
    category: 'identity',
    examples: [
      'Guarantor Form with signature',
      'Guarantor\'s Valid ID',
      'Letter of Guarantee'
    ]
  },
  {
    id: 'bank_details',
    title: 'Bank Account Details',
    description: 'Bank account statement or document for payment',
    acceptedTypes: ['image/jpeg', 'image/png', 'application/pdf'],
    maxSize: 3,
    required: false,
    category: 'financial',
    examples: [
      'Bank statement (3 months)',
      'Account opening document',
      'Bank certificate'
    ]
  }
]

/**
 * Get document requirements for a specific role
 */
export function getDocumentRequirements(role: 'restaurant_owner' | 'rider'): DocumentRequirement[] {
  switch (role) {
    case 'restaurant_owner':
      return RESTAURANT_OWNER_DOCUMENTS
    case 'rider':
      return RIDER_DOCUMENTS
    default:
      return []
  }
}

/**
 * Get required documents only
 */
export function getRequiredDocuments(role: 'restaurant_owner' | 'rider'): DocumentRequirement[] {
  return getDocumentRequirements(role).filter(doc => doc.required)
}

/**
 * Get optional documents only
 */
export function getOptionalDocuments(role: 'restaurant_owner' | 'rider'): DocumentRequirement[] {
  return getDocumentRequirements(role).filter(doc => !doc.required)
}

/**
 * Validate uploaded documents completeness
 */
export function validateDocumentsCompleteness(
  role: 'restaurant_owner' | 'rider',
  uploadedDocuments: { [key: string]: any }
): {
  isComplete: boolean
  missingRequired: string[]
  totalRequired: number
  completedRequired: number
} {
  const requiredDocs = getRequiredDocuments(role)
  const missingRequired: string[] = []
  let completedRequired = 0

  requiredDocs.forEach(doc => {
    const uploaded = uploadedDocuments[doc.id]
    if (!uploaded || uploaded.status !== 'uploaded') {
      missingRequired.push(doc.title)
    } else {
      completedRequired++
    }
  })

  return {
    isComplete: missingRequired.length === 0,
    missingRequired,
    totalRequired: requiredDocs.length,
    completedRequired
  }
}

/**
 * Document categories for better organization
 */
export const DOCUMENT_CATEGORIES = {
  identity: {
    title: 'Identity Documents',
    description: 'Government-issued identification documents',
    icon: '🆔'
  },
  business: {
    title: 'Business Documents', 
    description: 'Business registration and permits',
    icon: '🏢'
  },
  vehicle: {
    title: 'Vehicle Documents',
    description: 'Vehicle registration and related documents',
    icon: '🚗'
  },
  certification: {
    title: 'Certifications',
    description: 'Professional certifications and permits',
    icon: '📜'
  },
  financial: {
    title: 'Financial Documents',
    description: 'Bank statements and tax documents',
    icon: '💰'
  }
} as const

export type DocumentCategory = keyof typeof DOCUMENT_CATEGORIES

export default {
  RESTAURANT_OWNER_DOCUMENTS,
  RIDER_DOCUMENTS,
  getDocumentRequirements,
  getRequiredDocuments,
  getOptionalDocuments,
  validateDocumentsCompleteness,
  DOCUMENT_CATEGORIES
}