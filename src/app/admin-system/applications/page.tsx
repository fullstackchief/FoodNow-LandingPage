'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import AdminRoute from '@/components/ui/AdminRoute'
import ApplicationReview from '@/components/admin/ApplicationReview'
import {
  BuildingStorefrontIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  EyeIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  TruckIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline'
import Navigation from '@/components/layout/Navigation'
import { devLog, prodLog } from '@/lib/logger'

// Application interface matching actual database structure
interface ApplicationData {
  id: string
  user_id: string
  application_type: 'restaurant_owner' | 'rider'
  status: 'pending' | 'approved' | 'rejected' | 'under_review'
  
  // Restaurant fields
  restaurant_name?: string
  restaurant_description?: string
  restaurant_address?: string
  restaurant_phone?: string
  restaurant_email?: string
  cuisine_types?: string[]
  
  // Rider fields
  vehicle_type?: string
  vehicle_make?: string
  vehicle_model?: string
  vehicle_year?: number
  vehicle_plate_number?: string
  emergency_contact_name?: string
  emergency_contact_phone?: string
  
  // Review fields
  review_notes?: string
  reviewed_by?: string
  reviewed_at?: string
  approved_by?: string
  approved_at?: string
  
  // Additional data
  additional_documents?: any
  submitted_at: string
  created_at: string
  updated_at: string
  
  user?: {
    first_name: string
    last_name: string
    email: string
    phone?: string
  }
}

const ApplicationsManagement = () => {
  const [applications, setApplications] = useState<ApplicationData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedApplication, setSelectedApplication] = useState<ApplicationData | null>(null)
  const [showReviewModal, setShowReviewModal] = useState(false)
  
  // Filters and search
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [roleFilter, setRoleFilter] = useState('all')
  
  // Load applications
  useEffect(() => {
    loadApplications()
  }, [])

  const loadApplications = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/admin/applications', {
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error('Failed to load applications')
      }

      const { data, error: apiError } = await response.json()

      if (apiError) {
        throw new Error(apiError)
      }

      setApplications(data || [])
      devLog.info('Loaded applications', { count: data?.length || 0 })

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      prodLog.error('Failed to load applications', { error: errorMessage, action: 'load_applications' })
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  // Update application status
  const updateApplicationStatus = async (
    applicationId: string, 
    status: 'pending' | 'approved' | 'rejected' | 'under_review',
    reviewNotes?: string
  ) => {
    try {
      const response = await fetch(`/api/admin/applications/${applicationId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          status,
          review_notes: reviewNotes
        })
      })

      if (!response.ok) {
        throw new Error('Failed to update application status')
      }

      const { data } = await response.json()

      // Update local state
      setApplications(prev => 
        prev.map(app => 
          app.id === applicationId 
            ? { ...app, status, review_notes: reviewNotes, reviewed_at: new Date().toISOString() }
            : app
        )
      )

      // Update selected application if it's the one being updated
      if (selectedApplication?.id === applicationId) {
        setSelectedApplication(prev => 
          prev ? { ...prev, status, review_notes: reviewNotes, reviewed_at: new Date().toISOString() } : null
        )
      }

      prodLog.info('Application status updated', { applicationId, status, action: 'update_application_status' })
      return true

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      prodLog.error('Failed to update application status', { error: errorMessage, applicationId, status, action: 'update_application_status' })
      setError(errorMessage)
      return false
    }
  }

  // Filter applications
  const filteredApplications = applications.filter(app => {
    // Search filter
    const searchMatch = 
      app.user?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.user?.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (app.application_type === 'restaurant_owner' && app.restaurant_name?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (app.application_type === 'rider' && app.vehicle_make?.toLowerCase().includes(searchTerm.toLowerCase()))

    // Status filter
    const statusMatch = statusFilter === 'all' || app.status === statusFilter

    // Role filter
    const roleMatch = roleFilter === 'all' || app.application_type === roleFilter

    return searchMatch && statusMatch && roleMatch
  })

  // Get status styling
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

  const getRoleIcon = (role: string) => {
    return role === 'restaurant_owner' 
      ? <BuildingStorefrontIcon className="w-5 h-5 text-green-600" />
      : <TruckIcon className="w-5 h-5 text-blue-600" />
  }

  const formatRoleName = (role: string) => {
    return role === 'restaurant_owner' ? 'Restaurant Owner' : 'Rider'
  }

  // Handle review modal
  const openReviewModal = (application: ApplicationData) => {
    setSelectedApplication(application)
    setShowReviewModal(true)
  }

  const closeReviewModal = () => {
    setSelectedApplication(null)
    setShowReviewModal(false)
  }

  if (loading) {
    return (
      <AdminRoute>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading applications...</p>
          </div>
        </div>
      </AdminRoute>
    )
  }

  if (error) {
    return (
      <AdminRoute>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center max-w-md">
            <XCircleIcon className="w-12 h-12 text-red-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Applications</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={loadApplications}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium"
            >
              Try Again
            </button>
          </div>
        </div>
      </AdminRoute>
    )
  }

  return (
    <AdminRoute>
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        
        {/* Header */}
        <section className="bg-gradient-to-r from-blue-50 to-blue-100 pt-24 pb-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-black text-gray-900">Application Management</h1>
                <p className="text-gray-600 mt-2">Review and manage rider and restaurant owner applications</p>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="bg-white rounded-2xl shadow-lg p-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{applications.length}</div>
                    <div className="text-sm text-gray-600">Total Applications</div>
                  </div>
                </div>
                
                <div className="bg-white rounded-2xl shadow-lg p-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-600">
                      {applications.filter(app => app.status === 'pending').length}
                    </div>
                    <div className="text-sm text-gray-600">Pending Review</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Filters */}
        <section className="bg-white border-b border-gray-200 py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
              {/* Search */}
              <div className="relative flex-1 max-w-md">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search applications..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              {/* Filters */}
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <FunnelIcon className="w-5 h-5 text-gray-400" />
                  <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Roles</option>
                    <option value="restaurant_owner">Restaurant Owner</option>
                    <option value="rider">Rider</option>
                  </select>
                </div>
                
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="under_review">Under Review</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
            </div>
          </div>
        </section>

        {/* Applications List */}
        <section className="py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {filteredApplications.length === 0 ? (
              <div className="text-center py-16">
                <DocumentTextIcon className="w-24 h-24 text-gray-300 mx-auto mb-6" />
                <h3 className="text-2xl font-bold text-gray-900 mb-4">No Applications Found</h3>
                <p className="text-gray-600">
                  {searchTerm || statusFilter !== 'all' || roleFilter !== 'all'
                    ? 'Try adjusting your search or filter criteria.'
                    : 'No applications have been submitted yet.'
                  }
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredApplications.map((application, index) => (
                  <motion.div
                    key={application.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-3">
                          {getRoleIcon(application.application_type)}
                          <div>
                            <h3 className="text-lg font-bold text-gray-900">
                              {application.user?.first_name} {application.user?.last_name}
                            </h3>
                            <p className="text-sm text-gray-600">{formatRoleName(application.application_type)} Application</p>
                          </div>
                          <div className={`flex items-center space-x-2 px-3 py-1 rounded-full border text-sm font-medium ${getStatusColor(application.status)}`}>
                            {getStatusIcon(application.status)}
                            <span className="capitalize">{application.status.replace('_', ' ')}</span>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-gray-500">Email:</span>
                            <p className="font-medium text-gray-900">{application.user?.email}</p>
                          </div>
                          {application.user?.phone && (
                            <div>
                              <span className="text-gray-500">Phone:</span>
                              <p className="font-medium text-gray-900">{application.user.phone}</p>
                            </div>
                          )}
                          <div>
                            <span className="text-gray-500">Application ID:</span>
                            <p className="font-medium text-gray-900 font-mono">{application.id.slice(-8)}</p>
                          </div>
                          <div>
                            <span className="text-gray-500">Submitted:</span>
                            <p className="font-medium text-gray-900">
                              {new Date(application.submitted_at || application.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>

                        {/* Restaurant-specific info */}
                        {application.application_type === 'restaurant_owner' && application.restaurant_name && (
                          <div className="mt-3 p-3 bg-green-50 rounded-lg">
                            <p className="text-sm text-gray-600">Business Name:</p>
                            <p className="font-medium text-green-900">{application.restaurant_name}</p>
                            {application.restaurant_address && (
                              <div className="mt-1">
                                <p className="text-sm text-gray-600">Address:</p>
                                <p className="text-sm text-gray-800">{application.restaurant_address}</p>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Rider-specific info */}
                        {application.application_type === 'rider' && application.vehicle_type && (
                          <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                            <p className="text-sm text-gray-600">Vehicle:</p>
                            <p className="font-medium text-blue-900">
                              {application.vehicle_make} {application.vehicle_model} ({application.vehicle_type})
                            </p>
                            {application.emergency_contact_name && (
                              <div className="mt-1">
                                <p className="text-sm text-gray-600">Emergency Contact:</p>
                                <p className="text-sm text-gray-800">{application.emergency_contact_name}</p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      
                      {/* Action buttons */}
                      <div className="flex space-x-3">
                        <button
                          onClick={() => openReviewModal(application)}
                          className="flex items-center space-x-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-xl font-medium transition-colors"
                        >
                          <EyeIcon className="w-4 h-4" />
                          <span>Review</span>
                        </button>
                        
                        {(application.status === 'pending' || application.status === 'under_review') && (
                          <>
                            <button
                              onClick={() => updateApplicationStatus(application.id, 'approved')}
                              className="flex items-center space-x-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-xl font-medium transition-colors"
                            >
                              <CheckCircleIcon className="w-4 h-4" />
                              <span>Approve</span>
                            </button>
                            <button
                              onClick={() => updateApplicationStatus(application.id, 'rejected')}
                              className="flex items-center space-x-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-xl font-medium transition-colors"
                            >
                              <XCircleIcon className="w-4 h-4" />
                              <span>Reject</span>
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Application Review Modal */}
        {selectedApplication && (
          <ApplicationReview
            application={selectedApplication}
            isOpen={showReviewModal}
            onClose={closeReviewModal}
            onStatusUpdate={updateApplicationStatus}
          />
        )}
      </div>
    </AdminRoute>
  )
}

export default ApplicationsManagement