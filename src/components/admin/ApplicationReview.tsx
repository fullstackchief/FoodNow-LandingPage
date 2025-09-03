'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  XMarkIcon,
  DocumentArrowDownIcon,
  CheckCircleIcon,
  XCircleIcon,
  EyeIcon,
  ClockIcon,
  UserGroupIcon,
  BuildingStorefrontIcon,
  TruckIcon,
  MapPinIcon,
  PhoneIcon,
  EnvelopeIcon,
  CalendarDaysIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  ChatBubbleLeftRightIcon
} from '@heroicons/react/24/outline'
import { devLog, prodLog } from '@/lib/logger'

interface ApplicationReviewProps {
  application: {
    id: string
    user_id: string
    application_type: 'restaurant' | 'rider'
    application_data?: any
    status: 'pending' | 'approved' | 'rejected' | 'under_review'
    admin_notes?: string
    reviewed_by?: string
    reviewed_at?: string
    created_at: string
    updated_at: string
    user?: {
      first_name: string
      last_name: string
      email: string
      phone_number?: string
    }
  }
  isOpen: boolean
  onClose: () => void
  onStatusUpdate: (applicationId: string, status: 'pending' | 'approved' | 'rejected' | 'under_review', adminNotes?: string) => Promise<boolean>
}

const ApplicationReview: React.FC<ApplicationReviewProps> = ({
  application,
  isOpen,
  onClose,
  onStatusUpdate
}) => {
  const [activeTab, setActiveTab] = useState('overview')
  const [adminNotes, setAdminNotes] = useState(application.admin_notes || '')
  const [updating, setUpdating] = useState(false)
  const [documentViews, setDocumentViews] = useState<{ [key: string]: boolean }>({})

  useEffect(() => {
    setAdminNotes(application.admin_notes || '')
  }, [application.admin_notes])

  if (!isOpen) return null

  const handleStatusUpdate = async (status: 'pending' | 'approved' | 'rejected' | 'under_review') => {
    setUpdating(true)
    try {
      const success = await onStatusUpdate(application.id, status, adminNotes)
      if (success) {
        devLog.info('Application status updated', { applicationId: application.id, status })
        if (status === 'approved' || status === 'rejected') {
          onClose()
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      prodLog.error('Failed to update application status', { error: errorMessage, applicationId: application.id, status })
    } finally {
      setUpdating(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-yellow-700 bg-yellow-100 border-yellow-200'
      case 'under_review': return 'text-blue-700 bg-blue-100 border-blue-200'
      case 'approved': return 'text-green-700 bg-green-100 border-green-200'
      case 'rejected': return 'text-red-700 bg-red-100 border-red-200'
      default: return 'text-gray-700 bg-gray-100 border-gray-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <ClockIcon className="w-4 h-4" />
      case 'under_review': return <EyeIcon className="w-4 h-4" />
      case 'approved': return <CheckCircleIcon className="w-4 h-4" />
      case 'rejected': return <XCircleIcon className="w-4 h-4" />
      default: return <ClockIcon className="w-4 h-4" />
    }
  }

  const formatRoleName = (role: string) => {
    return role === 'restaurant' ? 'Restaurant Owner' : 'Rider'
  }

  const getRoleIcon = (role: string) => {
    return role === 'restaurant' 
      ? <BuildingStorefrontIcon className="w-6 h-6 text-green-600" />
      : <TruckIcon className="w-6 h-6 text-blue-600" />
  }

  const toggleDocumentView = (docKey: string) => {
    setDocumentViews(prev => ({
      ...prev,
      [docKey]: !prev[docKey]
    }))
  }

  const renderDocumentSection = (title: string, documents: any, isRequired = false) => {
    if (!documents || (Array.isArray(documents) && documents.length === 0)) {
      return (
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="font-medium text-gray-900 flex items-center space-x-2">
              <span>{title}</span>
              {isRequired && <span className="text-red-500">*</span>}
            </span>
            <span className="text-red-600 text-sm flex items-center space-x-1">
              <ExclamationTriangleIcon className="w-4 h-4" />
              <span>Not Provided</span>
            </span>
          </div>
          <p className="text-sm text-gray-500">No documents uploaded for this category</p>
        </div>
      )
    }

    const docArray = Array.isArray(documents) ? documents : [documents]

    return (
      <div className="space-y-3">
        {docArray.map((doc: any, index: number) => {
          const docKey = `${title}-${index}`
          return (
            <div key={docKey} className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-gray-900 flex items-center space-x-2">
                  <span>{doc.name || `${title} ${index + 1}`}</span>
                  {isRequired && <span className="text-red-500">*</span>}
                </span>
                <span className="text-green-600 text-sm flex items-center space-x-1">
                  <CheckCircleIcon className="w-4 h-4" />
                  <span>Uploaded</span>
                </span>
              </div>
              
              {doc.filename && (
                <p className="text-sm text-gray-600 mb-3">File: {doc.filename}</p>
              )}
              
              <div className="flex space-x-3">
                <button
                  onClick={() => toggleDocumentView(docKey)}
                  className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 font-medium text-sm"
                >
                  <EyeIcon className="w-4 h-4" />
                  <span>{documentViews[docKey] ? 'Hide Preview' : 'View Document'}</span>
                </button>
                
                {doc.url && (
                  <button
                    onClick={() => window.open(doc.url, '_blank')}
                    className="flex items-center space-x-2 text-green-600 hover:text-green-700 font-medium text-sm"
                  >
                    <DocumentArrowDownIcon className="w-4 h-4" />
                    <span>Download</span>
                  </button>
                )}
              </div>
              
              {documentViews[docKey] && doc.url && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-2">Document Preview:</p>
                  <div className="border border-gray-200 rounded-lg bg-white p-4 min-h-[200px] flex items-center justify-center">
                    <div className="text-center text-gray-500">
                      <DocumentTextIcon className="w-12 h-12 mx-auto mb-2" />
                      <p className="text-sm">Preview not available</p>
                      <p className="text-xs">Use download button to view document</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    )
  }

  const renderRestaurantDetails = () => {
    const data = application.application_data || {}
    
    return (
      <div className="space-y-6">
        {/* Business Information */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center space-x-2">
            <BuildingStorefrontIcon className="w-5 h-5 text-green-600" />
            <span>Business Information</span>
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <span className="text-gray-500 text-sm">Business Name:</span>
              <p className="font-medium text-gray-900">{data.business_name || 'Not provided'}</p>
            </div>
            <div>
              <span className="text-gray-500 text-sm">Business Type:</span>
              <p className="font-medium text-gray-900">{data.business_type || 'Not provided'}</p>
            </div>
            <div>
              <span className="text-gray-500 text-sm">Cuisine Type:</span>
              <p className="font-medium text-gray-900">{data.cuisine_type || 'Not provided'}</p>
            </div>
            <div>
              <span className="text-gray-500 text-sm">Years in Operation:</span>
              <p className="font-medium text-gray-900">{data.years_in_operation || 'Not provided'}</p>
            </div>
          </div>
          
          <div className="mt-4">
            <span className="text-gray-500 text-sm">Business Description:</span>
            <p className="font-medium text-gray-900 mt-1">{data.business_description || 'Not provided'}</p>
          </div>
        </div>

        {/* Location Information */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center space-x-2">
            <MapPinIcon className="w-5 h-5 text-red-600" />
            <span>Location & Contact</span>
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <span className="text-gray-500 text-sm">Business Address:</span>
              <p className="font-medium text-gray-900">{data.business_address || 'Not provided'}</p>
            </div>
            <div>
              <span className="text-gray-500 text-sm">City:</span>
              <p className="font-medium text-gray-900">{data.city || 'Not provided'}</p>
            </div>
            <div>
              <span className="text-gray-500 text-sm">State:</span>
              <p className="font-medium text-gray-900">{data.state || 'Not provided'}</p>
            </div>
            <div>
              <span className="text-gray-500 text-sm">Business Phone:</span>
              <p className="font-medium text-gray-900">{data.business_phone || 'Not provided'}</p>
            </div>
          </div>
        </div>

        {/* Banking Information */}
        {(data.account_name || data.account_number || data.bank_name) && (
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center space-x-2">
              <DocumentTextIcon className="w-5 h-5 text-blue-600" />
              <span>Banking Information</span>
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <span className="text-gray-500 text-sm">Account Name:</span>
                <p className="font-medium text-gray-900">{data.account_name || 'Not provided'}</p>
              </div>
              <div>
                <span className="text-gray-500 text-sm">Account Number:</span>
                <p className="font-medium text-gray-900 font-mono">{data.account_number || 'Not provided'}</p>
              </div>
              <div>
                <span className="text-gray-500 text-sm">Bank Name:</span>
                <p className="font-medium text-gray-900">{data.bank_name || 'Not provided'}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  const renderRiderDetails = () => {
    const data = application.application_data || {}
    
    return (
      <div className="space-y-6">
        {/* Vehicle Information */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center space-x-2">
            <TruckIcon className="w-5 h-5 text-blue-600" />
            <span>Vehicle Information</span>
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <span className="text-gray-500 text-sm">Vehicle Type:</span>
              <p className="font-medium text-gray-900">{data.vehicle_type || 'Not provided'}</p>
            </div>
            <div>
              <span className="text-gray-500 text-sm">Vehicle Make/Model:</span>
              <p className="font-medium text-gray-900">{data.vehicle_make || 'Not provided'}</p>
            </div>
            <div>
              <span className="text-gray-500 text-sm">Vehicle Year:</span>
              <p className="font-medium text-gray-900">{data.vehicle_year || 'Not provided'}</p>
            </div>
            <div>
              <span className="text-gray-500 text-sm">License Plate:</span>
              <p className="font-medium text-gray-900 font-mono">{data.license_plate || 'Not provided'}</p>
            </div>
          </div>
        </div>

        {/* Driver Information */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center space-x-2">
            <UserGroupIcon className="w-5 h-5 text-purple-600" />
            <span>Driver Information</span>
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <span className="text-gray-500 text-sm">License Number:</span>
              <p className="font-medium text-gray-900 font-mono">{data.license_number || 'Not provided'}</p>
            </div>
            <div>
              <span className="text-gray-500 text-sm">License Expiry:</span>
              <p className="font-medium text-gray-900">{data.license_expiry || 'Not provided'}</p>
            </div>
            <div>
              <span className="text-gray-500 text-sm">Years of Experience:</span>
              <p className="font-medium text-gray-900">{data.years_experience || 'Not provided'}</p>
            </div>
            <div>
              <span className="text-gray-500 text-sm">Emergency Contact:</span>
              <p className="font-medium text-gray-900">{data.emergency_contact || 'Not provided'}</p>
            </div>
          </div>
        </div>

        {/* Guarantor Information */}
        {(data.guarantor_name || data.guarantor_phone || data.guarantor_address) && (
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center space-x-2">
              <UserGroupIcon className="w-5 h-5 text-orange-600" />
              <span>Guarantor Information</span>
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <span className="text-gray-500 text-sm">Guarantor Name:</span>
                <p className="font-medium text-gray-900">{data.guarantor_name || 'Not provided'}</p>
              </div>
              <div>
                <span className="text-gray-500 text-sm">Guarantor Phone:</span>
                <p className="font-medium text-gray-900">{data.guarantor_phone || 'Not provided'}</p>
              </div>
              <div>
                <span className="text-gray-500 text-sm">Guarantor Relationship:</span>
                <p className="font-medium text-gray-900">{data.guarantor_relationship || 'Not provided'}</p>
              </div>
              <div>
                <span className="text-gray-500 text-sm">Guarantor Address:</span>
                <p className="font-medium text-gray-900">{data.guarantor_address || 'Not provided'}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  const renderDocuments = () => {
    const data = application.application_data || {}
    
    if (application.application_type === 'restaurant') {
      return (
        <div className="space-y-6">
          <div className="bg-gray-50 rounded-xl p-4">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Required Business Documents</h3>
            <p className="text-sm text-gray-600 mb-6">Review all uploaded business documents for verification</p>
          </div>
          
          {renderDocumentSection('CAC Certificate', data.cac_certificate, true)}
          {renderDocumentSection('Business License', data.business_license, true)}
          {renderDocumentSection('Food Safety Certificate', data.food_safety_certificate)}
          {renderDocumentSection('Tax Certificate', data.tax_certificate)}
          {renderDocumentSection('Menu Documents', data.menu_documents)}
        </div>
      )
    } else {
      return (
        <div className="space-y-6">
          <div className="bg-gray-50 rounded-xl p-4">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Required Driver Documents</h3>
            <p className="text-sm text-gray-600 mb-6">Review all uploaded documents for verification</p>
          </div>
          
          {renderDocumentSection('Driver\'s License', data.drivers_license, true)}
          {renderDocumentSection('Vehicle Registration', data.vehicle_registration, true)}
          {renderDocumentSection('Vehicle Insurance', data.vehicle_insurance, true)}
          {renderDocumentSection('Police Clearance', data.police_clearance)}
          {renderDocumentSection('Guarantor ID', data.guarantor_id)}
        </div>
      )
    }
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: EyeIcon },
    { id: 'details', label: 'Details', icon: DocumentTextIcon },
    { id: 'documents', label: 'Documents', icon: DocumentArrowDownIcon },
    { id: 'notes', label: 'Admin Notes', icon: ChatBubbleLeftRightIcon }
  ]

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center space-x-4">
              {getRoleIcon(application.application_type)}
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {formatRoleName(application.application_type)} Application Review
                </h2>
                <div className="flex items-center space-x-4 mt-1">
                  <p className="text-gray-600">{application.user?.first_name} {application.user?.last_name}</p>
                  <div className={`flex items-center space-x-2 px-3 py-1 rounded-full border text-sm font-medium ${getStatusColor(application.status)}`}>
                    {getStatusIcon(application.status)}
                    <span className="capitalize">{application.status.replace('_', ' ')}</span>
                  </div>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
            >
              <XMarkIcon className="w-6 h-6 text-gray-500" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-200 bg-white px-6">
            {tabs.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex items-center space-x-2 py-4 px-4 border-b-2 font-medium transition-colors ${
                  activeTab === id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{label}</span>
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-6">
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* Application Summary */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="bg-blue-50 rounded-xl p-4">
                      <div className="flex items-center space-x-3">
                        <CalendarDaysIcon className="w-6 h-6 text-blue-600" />
                        <div>
                          <p className="text-sm text-blue-600">Submitted</p>
                          <p className="font-medium text-blue-900">
                            {new Date(application.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-green-50 rounded-xl p-4">
                      <div className="flex items-center space-x-3">
                        <EnvelopeIcon className="w-6 h-6 text-green-600" />
                        <div>
                          <p className="text-sm text-green-600">Email</p>
                          <p className="font-medium text-green-900">{application.user?.email}</p>
                        </div>
                      </div>
                    </div>
                    
                    {application.user?.phone_number && (
                      <div className="bg-purple-50 rounded-xl p-4">
                        <div className="flex items-center space-x-3">
                          <PhoneIcon className="w-6 h-6 text-purple-600" />
                          <div>
                            <p className="text-sm text-purple-600">Phone</p>
                            <p className="font-medium text-purple-900">{application.user.phone_number}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Quick Actions */}
                  {(application.status === 'pending' || application.status === 'under_review') && (
                    <div className="bg-gray-50 rounded-xl p-6">
                      <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h3>
                      <div className="flex space-x-4">
                        <button
                          onClick={() => handleStatusUpdate('under_review')}
                          disabled={updating}
                          className="flex items-center space-x-2 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white px-4 py-2 rounded-xl font-medium transition-colors"
                        >
                          <EyeIcon className="w-4 h-4" />
                          <span>Mark Under Review</span>
                        </button>
                        <button
                          onClick={() => handleStatusUpdate('approved')}
                          disabled={updating}
                          className="flex items-center space-x-2 bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white px-4 py-2 rounded-xl font-medium transition-colors"
                        >
                          <CheckCircleIcon className="w-4 h-4" />
                          <span>Approve Application</span>
                        </button>
                        <button
                          onClick={() => handleStatusUpdate('rejected')}
                          disabled={updating}
                          className="flex items-center space-x-2 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white px-4 py-2 rounded-xl font-medium transition-colors"
                        >
                          <XCircleIcon className="w-4 h-4" />
                          <span>Reject Application</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'details' && (
                application.application_type === 'restaurant' 
                  ? renderRestaurantDetails()
                  : renderRiderDetails()
              )}

              {activeTab === 'documents' && renderDocuments()}

              {activeTab === 'notes' && (
                <div className="space-y-6">
                  <div className="bg-gray-50 rounded-xl p-4">
                    <h3 className="text-lg font-bold text-gray-900 mb-2">Admin Notes</h3>
                    <p className="text-sm text-gray-600">Add notes for internal record keeping and applicant feedback.</p>
                  </div>
                  
                  <div>
                    <textarea
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      placeholder="Add your notes about this application..."
                      className="w-full h-40 p-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    />
                  </div>
                  
                  <div className="flex justify-end space-x-3">
                    <button
                      onClick={() => handleStatusUpdate(application.status)}
                      disabled={updating}
                      className="bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white px-6 py-2 rounded-xl font-medium transition-colors"
                    >
                      Save Notes
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer Actions */}
          {(application.status === 'pending' || application.status === 'under_review') && (
            <div className="border-t border-gray-200 bg-gray-50 px-6 py-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  Review complete? Take action on this application.
                </p>
                <div className="flex space-x-3">
                  <button
                    onClick={() => handleStatusUpdate('rejected')}
                    disabled={updating}
                    className="flex items-center space-x-2 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white px-4 py-2 rounded-xl font-medium transition-colors"
                  >
                    <XCircleIcon className="w-4 h-4" />
                    <span>Reject</span>
                  </button>
                  <button
                    onClick={() => handleStatusUpdate('approved')}
                    disabled={updating}
                    className="flex items-center space-x-2 bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white px-4 py-2 rounded-xl font-medium transition-colors"
                  >
                    <CheckCircleIcon className="w-4 h-4" />
                    <span>Approve</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  )
}

export default ApplicationReview