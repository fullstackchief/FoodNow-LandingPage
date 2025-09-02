'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Save, 
  MapPin, 
  Phone, 
  Mail, 
  Clock, 
  Star,
  DollarSign,
  Users,
  Camera
} from 'lucide-react'
import ImageUploader, { MultiImageUploader } from '@/components/ui/ImageUploader'
import { STORAGE_BUCKETS } from '@/lib/supabaseStorage'

interface RestaurantProfileData {
  id: string
  name: string
  description: string
  image_url: string
  cover_image_url: string | null
  phone_number: string
  email: string
  location: string
  opening_hours: Record<string, any>
  cuisine_types: string[]
  price_range: 'budget' | 'mid-range' | 'expensive'
  delivery_fee: number
  minimum_order: number
  delivery_time: string
  features: string[]
  gallery_images?: Array<{ url: string; path: string }>
}

interface RestaurantProfileManagerProps {
  restaurant?: RestaurantProfileData
  onSave: (data: Partial<RestaurantProfileData>) => Promise<void>
  isLoading?: boolean
}

const cuisineTypes = [
  'Nigerian',
  'Italian',
  'Chinese', 
  'Indian',
  'Continental',
  'Fast Food',
  'BBQ & Grills',
  'Healthy',
  'Desserts',
  'Beverages'
]

const restaurantFeatures = [
  'Free Delivery',
  'Quick Service',
  'Halal Certified',
  'Vegetarian Options',
  'Outdoor Seating',
  'Air Conditioned',
  'Card Payment',
  'Online Ordering',
  'Catering Services',
  'Party Bookings'
]

export default function RestaurantProfileManager({
  restaurant,
  onSave,
  isLoading = false
}: RestaurantProfileManagerProps) {
  const [activeTab, setActiveTab] = useState('basic')
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const [profileData, setProfileData] = useState<Partial<RestaurantProfileData>>({
    name: restaurant?.name || '',
    description: restaurant?.description || '',
    image_url: restaurant?.image_url || '',
    cover_image_url: restaurant?.cover_image_url || '',
    phone_number: restaurant?.phone_number || '',
    email: restaurant?.email || '',
    location: restaurant?.location || '',
    cuisine_types: restaurant?.cuisine_types || [],
    price_range: restaurant?.price_range || 'mid-range',
    delivery_fee: restaurant?.delivery_fee || 0,
    minimum_order: restaurant?.minimum_order || 0,
    delivery_time: restaurant?.delivery_time || '30-45 minutes',
    features: restaurant?.features || [],
    gallery_images: restaurant?.gallery_images || []
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    
    if (type === 'number') {
      setProfileData(prev => ({ ...prev, [name]: parseFloat(value) || 0 }))
    } else {
      setProfileData(prev => ({ ...prev, [name]: value }))
    }
  }

  const toggleArrayItem = (item: string, field: 'cuisine_types' | 'features') => {
    setProfileData(prev => ({
      ...prev,
      [field]: prev[field]?.includes(item)
        ? prev[field].filter(i => i !== item)
        : [...(prev[field] || []), item]
    }))
  }

  const handleLogoUpload = (url: string) => {
    setProfileData(prev => ({ ...prev, image_url: url }))
    showMessage('success', 'Logo updated successfully!')
  }

  const handleCoverUpload = (url: string) => {
    setProfileData(prev => ({ ...prev, cover_image_url: url }))
    showMessage('success', 'Cover image updated successfully!')
  }

  const handleGalleryUpdate = (images: Array<{ url: string; path: string }>) => {
    setProfileData(prev => ({ ...prev, gallery_images: images }))
    showMessage('success', 'Gallery updated successfully!')
  }

  const handleUploadError = (error: string) => {
    showMessage('error', `Upload failed: ${error}`)
  }

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), 5000)
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await onSave(profileData)
      showMessage('success', 'Profile updated successfully!')
    } catch (error) {
      showMessage('error', error instanceof Error ? error.message : 'Failed to update profile')
    } finally {
      setIsSaving(false)
    }
  }

  const tabs = [
    { id: 'basic', label: 'Basic Info', icon: Users },
    { id: 'images', label: 'Images', icon: Camera },
    { id: 'details', label: 'Details', icon: Star },
    { id: 'settings', label: 'Settings', icon: Clock }
  ]

  return (
    <div className="bg-white rounded-xl shadow-sm">
      {/* Header */}
      <div className="border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-800">Restaurant Profile</h2>
            <p className="text-gray-600">Manage your restaurant information and images</p>
          </div>
          <button
            onClick={handleSave}
            disabled={isSaving || isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 transition-colors"
          >
            {isSaving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Changes
              </>
            )}
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 mt-4">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-orange-100 text-orange-700'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Message */}
      {message && (
        <div className={`mx-6 mt-4 p-3 rounded-lg ${
          message.type === 'success' 
            ? 'bg-green-50 border border-green-200 text-green-800'
            : 'bg-red-50 border border-red-200 text-red-800'
        }`}>
          {message.text}
        </div>
      )}

      {/* Content */}
      <div className="p-6">
        {/* Basic Info Tab */}
        {activeTab === 'basic' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Restaurant Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={profileData.name || ''}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Enter restaurant name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Phone className="inline w-4 h-4 mr-1" />
                  Phone Number
                </label>
                <input
                  type="tel"
                  name="phone_number"
                  value={profileData.phone_number || ''}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="+234 xxx xxx xxxx"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <textarea
                name="description"
                value={profileData.description || ''}
                onChange={handleInputChange}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
                placeholder="Describe your restaurant, cuisine, and what makes you special..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Mail className="inline w-4 h-4 mr-1" />
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={profileData.email || ''}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="restaurant@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <MapPin className="inline w-4 h-4 mr-1" />
                  Location
                </label>
                <input
                  type="text"
                  name="location"
                  value={profileData.location || ''}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Street, Area, City"
                />
              </div>
            </div>
          </motion.div>
        )}

        {/* Images Tab */}
        {activeTab === 'images' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            {/* Logo Upload */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Restaurant Logo</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <ImageUploader
                    bucket={STORAGE_BUCKETS.RESTAURANTS}
                    onUploadComplete={handleLogoUpload}
                    onUploadError={handleUploadError}
                    aspectRatio="square"
                    label="Upload Logo"
                    currentImageUrl={profileData.image_url}
                    maxSizeMB={2}
                  />
                </div>
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-700">Logo Guidelines:</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Square format (1:1 ratio) works best</li>
                    <li>• High contrast and clear text</li>
                    <li>• Minimum 200x200 pixels</li>
                    <li>• Maximum 2MB file size</li>
                    <li>• PNG with transparent background preferred</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Cover Image Upload */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Cover Image</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <ImageUploader
                    bucket={STORAGE_BUCKETS.RESTAURANTS}
                    onUploadComplete={handleCoverUpload}
                    onUploadError={handleUploadError}
                    aspectRatio="16:9"
                    label="Upload Cover Image"
                    currentImageUrl={profileData.cover_image_url || ''}
                    maxSizeMB={3}
                  />
                </div>
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-700">Cover Image Tips:</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• 16:9 aspect ratio (1920x1080 recommended)</li>
                    <li>• Show your restaurant interior or signature dish</li>
                    <li>• Bright, inviting imagery</li>
                    <li>• Avoid text overlay</li>
                    <li>• High quality and well-lit photos</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Gallery */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Photo Gallery</h3>
              <p className="text-gray-600 mb-4">
                Upload photos of your restaurant, food, and ambiance to showcase your establishment.
              </p>
              <MultiImageUploader
                bucket={STORAGE_BUCKETS.RESTAURANTS}
                maxImages={10}
                onImagesChange={handleGalleryUpdate}
                currentImages={profileData.gallery_images}
              />
            </div>
          </motion.div>
        )}

        {/* Details Tab */}
        {activeTab === 'details' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Cuisine Types */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Cuisine Types
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {cuisineTypes.map(cuisine => (
                  <button
                    key={cuisine}
                    type="button"
                    onClick={() => toggleArrayItem(cuisine, 'cuisine_types')}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      profileData.cuisine_types?.includes(cuisine)
                        ? 'bg-orange-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {cuisine}
                  </button>
                ))}
              </div>
            </div>

            {/* Features */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Restaurant Features
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {restaurantFeatures.map(feature => (
                  <button
                    key={feature}
                    type="button"
                    onClick={() => toggleArrayItem(feature, 'features')}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      profileData.features?.includes(feature)
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {feature}
                  </button>
                ))}
              </div>
            </div>

            {/* Price Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <DollarSign className="inline w-4 h-4 mr-1" />
                Price Range
              </label>
              <select
                name="price_range"
                value={profileData.price_range || 'mid-range'}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                <option value="budget">Budget (₦ - Under ₦2000)</option>
                <option value="mid-range">Mid-range (₦₦ - ₦2000-₦5000)</option>
                <option value="expensive">Premium (₦₦₦ - Above ₦5000)</option>
              </select>
            </div>
          </motion.div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Delivery Fee (₦)
                </label>
                <input
                  type="number"
                  name="delivery_fee"
                  value={profileData.delivery_fee || 0}
                  onChange={handleInputChange}
                  min="0"
                  step="100"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Minimum Order (₦)
                </label>
                <input
                  type="number"
                  name="minimum_order"
                  value={profileData.minimum_order || 0}
                  onChange={handleInputChange}
                  min="0"
                  step="500"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Clock className="inline w-4 h-4 mr-1" />
                  Delivery Time
                </label>
                <select
                  name="delivery_time"
                  value={profileData.delivery_time || '30-45 minutes'}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  <option value="15-30 minutes">15-30 minutes</option>
                  <option value="30-45 minutes">30-45 minutes</option>
                  <option value="45-60 minutes">45-60 minutes</option>
                  <option value="60+ minutes">60+ minutes</option>
                </select>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}