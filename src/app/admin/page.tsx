'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import AdminRoute from '@/components/ui/AdminRoute'
import {
  HomeIcon,
  BuildingStorefrontIcon,
  UserGroupIcon,
  ChartBarIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  EyeIcon,
  DocumentArrowDownIcon,
  MagnifyingGlassIcon,
  FunnelIcon
} from '@heroicons/react/24/outline'
import Navigation from '@/components/layout/Navigation'

interface RestaurantApplication {
  applicationId: string
  firstName: string
  lastName: string
  email: string
  phone: string
  restaurantName: string
  restaurantAddress: string
  city: string
  state: string
  cuisineType: string
  restaurantDescription: string
  managerName: string
  managerEmail: string
  managerPhone: string
  status: 'pending' | 'approved' | 'rejected' | 'under_review'
  submittedAt: string
  documents: {
    cac: { name: string; url: string }
    regulatory: { name: string; url: string }
    menu?: { name: string; url: string }
  }
}

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('applications')
  const [selectedApplication, setSelectedApplication] = useState<RestaurantApplication | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [showApplicationModal, setShowApplicationModal] = useState(false)

  // Mock applications data
  const [applications, setApplications] = useState<RestaurantApplication[]>([
    {
      applicationId: 'APP-1703875234567',
      firstName: 'Adebayo',
      lastName: 'Johnson',
      email: 'adebayo@mamacasskitchen.com',
      phone: '+234 901 234 5678',
      restaurantName: 'Mama Cass Kitchen',
      restaurantAddress: '15 Allen Avenue, Ikeja',
      city: 'Lagos',
      state: 'Lagos State',
      cuisineType: 'Nigerian',
      restaurantDescription: 'Authentic Nigerian cuisine with traditional recipes passed down through generations',
      managerName: 'Adebayo Johnson',
      managerEmail: 'manager@mamacasskitchen.com',
      managerPhone: '+234 901 234 5678',
      status: 'pending',
      submittedAt: '2024-01-15T14:30:00Z',
      documents: {
        cac: { name: 'CAC_Certificate.pdf', url: '/documents/cac1.pdf' },
        regulatory: { name: 'Food_License.pdf', url: '/documents/license1.pdf' },
        menu: { name: 'Menu_2024.pdf', url: '/documents/menu1.pdf' }
      }
    },
    {
      applicationId: 'APP-1703875234568',
      firstName: 'Fatima',
      lastName: 'Abdullahi',
      email: 'fatima@northerntaste.com',
      phone: '+234 802 345 6789',
      restaurantName: 'Northern Taste',
      restaurantAddress: '8 Garki District, Abuja',
      city: 'Abuja',
      state: 'FCT',
      cuisineType: 'Northern Nigerian',
      restaurantDescription: 'Specializing in authentic Northern Nigerian delicacies including tuwo, miyan kuka, and suya',
      managerName: 'Ibrahim Sani',
      managerEmail: 'ibrahim@northerntaste.com',
      managerPhone: '+234 803 456 7890',
      status: 'under_review',
      submittedAt: '2024-01-14T10:15:00Z',
      documents: {
        cac: { name: 'Northern_Taste_CAC.pdf', url: '/documents/cac2.pdf' },
        regulatory: { name: 'NAFDAC_Permit.pdf', url: '/documents/license2.pdf' }
      }
    },
    {
      applicationId: 'APP-1703875234569',
      firstName: 'Chioma',
      lastName: 'Okafor',
      email: 'chioma@igbokitchen.com',
      phone: '+234 703 456 7890',
      restaurantName: 'Igbo Kitchen Delights',
      restaurantAddress: '22 Onitsha Road, Awka',
      city: 'Awka',
      state: 'Anambra State',
      cuisineType: 'Igbo Traditional',
      restaurantDescription: 'Traditional Igbo cuisine featuring ofe nsala, nkwobi, ugba, and other eastern delicacies',
      managerName: 'Emeka Okafor',
      managerEmail: 'emeka@igbokitchen.com',
      managerPhone: '+234 704 567 8901',
      status: 'approved',
      submittedAt: '2024-01-12T16:45:00Z',
      documents: {
        cac: { name: 'Igbo_Kitchen_CAC.pdf', url: '/documents/cac3.pdf' },
        regulatory: { name: 'State_Food_License.pdf', url: '/documents/license3.pdf' },
        menu: { name: 'Traditional_Menu.pdf', url: '/documents/menu3.pdf' }
      }
    }
  ])

  const updateApplicationStatus = (applicationId: string, newStatus: RestaurantApplication['status']) => {
    setApplications(prev => prev.map(app =>
      app.applicationId === applicationId ? { ...app, status: newStatus } : app
    ))
  }

  const getStatusColor = (status: RestaurantApplication['status']) => {
    switch (status) {
      case 'pending': return 'text-yellow-700 bg-yellow-100 border-yellow-200'
      case 'under_review': return 'text-blue-700 bg-blue-100 border-blue-200'
      case 'approved': return 'text-green-700 bg-green-100 border-green-200'
      case 'rejected': return 'text-red-700 bg-red-100 border-red-200'
      default: return 'text-gray-700 bg-gray-100 border-gray-200'
    }
  }

  const getStatusIcon = (status: RestaurantApplication['status']) => {
    switch (status) {
      case 'pending': return <ClockIcon className="w-4 h-4" />
      case 'under_review': return <EyeIcon className="w-4 h-4" />
      case 'approved': return <CheckCircleIcon className="w-4 h-4" />
      case 'rejected': return <XCircleIcon className="w-4 h-4" />
      default: return <ClockIcon className="w-4 h-4" />
    }
  }

  const filteredApplications = applications.filter(app => {
    const matchesSearch = 
      app.restaurantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.applicationId.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || app.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const ApplicationDetailModal = () => {
    if (!selectedApplication || !showApplicationModal) return null

    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Application Review</h2>
              <p className="text-gray-600">{selectedApplication.applicationId}</p>
            </div>
            <button
              onClick={() => setShowApplicationModal(false)}
              className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
            >
              <XCircleIcon className="w-6 h-6 text-gray-500" />
            </button>
          </div>

          <div className="p-6">
            {/* Status and Actions */}
            <div className="flex items-center justify-between mb-8 p-4 bg-gray-50 rounded-xl">
              <div className="flex items-center space-x-3">
                <div className={`flex items-center space-x-2 px-3 py-1 rounded-full border text-sm font-medium ${getStatusColor(selectedApplication.status)}`}>
                  {getStatusIcon(selectedApplication.status)}
                  <span className="capitalize">{selectedApplication.status.replace('_', ' ')}</span>
                </div>
                <span className="text-gray-500 text-sm">
                  Submitted: {new Date(selectedApplication.submittedAt).toLocaleDateString()}
                </span>
              </div>
              
              {selectedApplication.status === 'pending' || selectedApplication.status === 'under_review' ? (
                <div className="flex space-x-3">
                  <button
                    onClick={() => {
                      updateApplicationStatus(selectedApplication.applicationId, 'under_review')
                      setSelectedApplication(prev => prev ? { ...prev, status: 'under_review' } : null)
                    }}
                    className="flex items-center space-x-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-xl font-medium transition-colors"
                  >
                    <EyeIcon className="w-4 h-4" />
                    <span>Under Review</span>
                  </button>
                  <button
                    onClick={() => {
                      updateApplicationStatus(selectedApplication.applicationId, 'approved')
                      setSelectedApplication(prev => prev ? { ...prev, status: 'approved' } : null)
                    }}
                    className="flex items-center space-x-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-xl font-medium transition-colors"
                  >
                    <CheckCircleIcon className="w-4 h-4" />
                    <span>Approve</span>
                  </button>
                  <button
                    onClick={() => {
                      updateApplicationStatus(selectedApplication.applicationId, 'rejected')
                      setSelectedApplication(prev => prev ? { ...prev, status: 'rejected' } : null)
                    }}
                    className="flex items-center space-x-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-xl font-medium transition-colors"
                  >
                    <XCircleIcon className="w-4 h-4" />
                    <span>Reject</span>
                  </button>
                </div>
              ) : (
                <div className="text-sm text-gray-500">
                  Status: <span className="font-medium capitalize">{selectedApplication.status.replace('_', ' ')}</span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Personal Information */}
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center space-x-2">
                    <UserGroupIcon className="w-5 h-5 text-blue-600" />
                    <span>Personal Information</span>
                  </h3>
                  <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-gray-500">Name:</span>
                        <p className="font-medium text-gray-900">{selectedApplication.firstName} {selectedApplication.lastName}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Email:</span>
                        <p className="font-medium text-gray-900">{selectedApplication.email}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Phone:</span>
                        <p className="font-medium text-gray-900">{selectedApplication.phone}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Restaurant Information */}
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center space-x-2">
                    <BuildingStorefrontIcon className="w-5 h-5 text-green-600" />
                    <span>Restaurant Information</span>
                  </h3>
                  <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
                    <div>
                      <span className="text-gray-500 text-sm">Restaurant Name:</span>
                      <p className="font-medium text-gray-900">{selectedApplication.restaurantName}</p>
                    </div>
                    <div>
                      <span className="text-gray-500 text-sm">Address:</span>
                      <p className="font-medium text-gray-900">{selectedApplication.restaurantAddress}</p>
                      <p className="text-gray-600">{selectedApplication.city}, {selectedApplication.state}</p>
                    </div>
                    <div>
                      <span className="text-gray-500 text-sm">Cuisine Type:</span>
                      <p className="font-medium text-gray-900">{selectedApplication.cuisineType}</p>
                    </div>
                    <div>
                      <span className="text-gray-500 text-sm">Description:</span>
                      <p className="font-medium text-gray-900">{selectedApplication.restaurantDescription}</p>
                    </div>
                  </div>
                </div>

                {/* Manager Information */}
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center space-x-2">
                    <UserGroupIcon className="w-5 h-5 text-purple-600" />
                    <span>Manager Details</span>
                  </h3>
                  <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
                    <div className="grid grid-cols-1 gap-3 text-sm">
                      <div>
                        <span className="text-gray-500">Manager Name:</span>
                        <p className="font-medium text-gray-900">{selectedApplication.managerName}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Manager Email:</span>
                        <p className="font-medium text-gray-900">{selectedApplication.managerEmail}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Manager Phone:</span>
                        <p className="font-medium text-gray-900">{selectedApplication.managerPhone}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Documents */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center space-x-2">
                  <DocumentArrowDownIcon className="w-5 h-5 text-orange-600" />
                  <span>Uploaded Documents</span>
                </h3>
                <div className="space-y-4">
                  <div className="bg-white border border-gray-200 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-gray-900">CAC Certificate *</span>
                      <span className="text-green-600 text-sm">✓ Uploaded</span>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{selectedApplication.documents.cac.name}</p>
                    <button className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 font-medium text-sm">
                      <DocumentArrowDownIcon className="w-4 h-4" />
                      <span>Download & Review</span>
                    </button>
                  </div>

                  <div className="bg-white border border-gray-200 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-gray-900">Regulatory License *</span>
                      <span className="text-green-600 text-sm">✓ Uploaded</span>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{selectedApplication.documents.regulatory.name}</p>
                    <button className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 font-medium text-sm">
                      <DocumentArrowDownIcon className="w-4 h-4" />
                      <span>Download & Review</span>
                    </button>
                  </div>

                  {selectedApplication.documents.menu && (
                    <div className="bg-white border border-gray-200 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-900">Menu Document</span>
                        <span className="text-green-600 text-sm">✓ Uploaded</span>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">{selectedApplication.documents.menu.name}</p>
                      <button className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 font-medium text-sm">
                        <DocumentArrowDownIcon className="w-4 h-4" />
                        <span>Download & Review</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    )
  }

  const renderApplications = () => (
    <div className="space-y-6">
      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
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
        
        <div className="flex items-center space-x-3">
          <FunnelIcon className="w-5 h-5 text-gray-400" />
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

      {/* Applications List */}
      <div className="space-y-4">
        {filteredApplications.map((application, index) => (
          <motion.div
            key={application.applicationId}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white rounded-3xl shadow-lg p-6 border border-gray-100"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <h3 className="text-xl font-bold text-gray-900">{application.restaurantName}</h3>
                  <div className={`flex items-center space-x-2 px-3 py-1 rounded-full border text-sm font-medium ${getStatusColor(application.status)}`}>
                    {getStatusIcon(application.status)}
                    <span className="capitalize">{application.status.replace('_', ' ')}</span>
                  </div>
                </div>
                <p className="text-gray-600 mb-2">{application.firstName} {application.lastName}</p>
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <span>{application.applicationId}</span>
                  <span>•</span>
                  <span>{application.cuisineType}</span>
                  <span>•</span>
                  <span>{application.city}, {application.state}</span>
                  <span>•</span>
                  <span>{new Date(application.submittedAt).toLocaleDateString()}</span>
                </div>
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setSelectedApplication(application)
                    setShowApplicationModal(true)
                  }}
                  className="flex items-center space-x-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-xl font-medium transition-colors"
                >
                  <EyeIcon className="w-4 h-4" />
                  <span>Review</span>
                </button>
                
                {(application.status === 'pending' || application.status === 'under_review') && (
                  <>
                    <button
                      onClick={() => updateApplicationStatus(application.applicationId, 'approved')}
                      className="flex items-center space-x-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-xl font-medium transition-colors"
                    >
                      <CheckCircleIcon className="w-4 h-4" />
                      <span>Approve</span>
                    </button>
                    <button
                      onClick={() => updateApplicationStatus(application.applicationId, 'rejected')}
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

      {filteredApplications.length === 0 && (
        <div className="text-center py-16">
          <BuildingStorefrontIcon className="w-24 h-24 text-gray-300 mx-auto mb-6" />
          <h3 className="text-2xl font-bold text-gray-900 mb-4">No Applications Found</h3>
          <p className="text-gray-600">
            {searchTerm || statusFilter !== 'all' 
              ? 'Try adjusting your search or filter criteria.'
              : 'No restaurant applications have been submitted yet.'
            }
          </p>
        </div>
      )}

      <ApplicationDetailModal />
    </div>
  )

  const tabs = [
    { id: 'applications', label: 'Applications', icon: BuildingStorefrontIcon },
    { id: 'overview', label: 'Overview', icon: HomeIcon },
    { id: 'restaurants', label: 'Restaurants', icon: BuildingStorefrontIcon },
    { id: 'analytics', label: 'Analytics', icon: ChartBarIcon }
  ]

  return (
    <AdminRoute>
      <div className="min-h-screen bg-gray-50">
        <Navigation />
      
      {/* Header */}
      <section className="bg-gradient-to-r from-blue-50 to-blue-100 pt-24 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-black text-gray-900">Admin Dashboard</h1>
              <p className="text-gray-600 mt-2">Manage restaurant applications and platform operations</p>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="bg-white rounded-2xl shadow-lg p-4">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium text-gray-900">Admin Online</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Tabs */}
      <section className="bg-white border-b border-gray-200 sticky top-20 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center space-x-8 overflow-x-auto scrollbar-hide">
            {tabs.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex items-center space-x-2 py-4 border-b-2 font-medium transition-colors whitespace-nowrap ${
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
        </div>
      </section>

      {/* Content */}
      <section className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {activeTab === 'applications' && renderApplications()}
          
          {activeTab === 'overview' && (
            <div className="text-center py-16">
              <HomeIcon className="w-24 h-24 text-gray-300 mx-auto mb-6" />
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Dashboard Overview Coming Soon</h3>
              <p className="text-gray-600">Platform statistics and overview will be available here.</p>
            </div>
          )}
          
          {activeTab === 'restaurants' && (
            <div className="text-center py-16">
              <BuildingStorefrontIcon className="w-24 h-24 text-gray-300 mx-auto mb-6" />
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Restaurant Management Coming Soon</h3>
              <p className="text-gray-600">Manage active restaurants and their performance here.</p>
            </div>
          )}
          
          {activeTab === 'analytics' && (
            <div className="text-center py-16">
              <ChartBarIcon className="w-24 h-24 text-gray-300 mx-auto mb-6" />
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Analytics Coming Soon</h3>
              <p className="text-gray-600">Platform analytics and insights will be available here.</p>
            </div>
          )}
        </div>
      </section>
      </div>
    </AdminRoute>
  )
}

export default AdminDashboard