'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { User, Mail, Phone, MapPin, Camera, Save, ArrowLeft } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import ImageUploader from '@/components/ui/ImageUploader'
import { STORAGE_BUCKETS } from '@/lib/supabaseStorage'
import OptimizedImage from '@/components/ui/OptimizedImage'

export default function ProfilePage() {
  const router = useRouter()
  const { user, updateProfile, isLoading } = useAuth()
  const [isUpdating, setIsUpdating] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  
  const [profileData, setProfileData] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    phone: user?.phone || '',
    avatar_url: user?.avatar_url || ''
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleAvatarUpload = (url: string, path: string) => {
    setProfileData(prev => ({
      ...prev,
      avatar_url: url
    }))
    setMessage({ type: 'success', text: 'Avatar uploaded successfully!' })
  }

  const handleAvatarError = (error: string) => {
    setMessage({ type: 'error', text: `Upload failed: ${error}` })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsUpdating(true)
    setMessage(null)

    try {
      const result = await updateProfile(profileData)
      
      if (result.success) {
        setMessage({ type: 'success', text: 'Profile updated successfully!' })
      } else {
        setMessage({ type: 'error', text: result.error || 'Update failed' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'An unexpected error occurred' })
    } finally {
      setIsUpdating(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-6">You need to be logged in to view your profile.</p>
          <Link
            href="/auth/login"
            className="bg-orange-500 text-white px-6 py-2 rounded-lg hover:bg-orange-600 transition-colors"
          >
            Sign In
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.back()}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                Back
              </button>
              <h1 className="text-2xl font-bold text-gray-800">My Profile</h1>
            </div>
            <Link href="/" className="text-orange-600 hover:text-orange-700 font-medium">
              FoodNow
            </Link>
          </div>
        </div>
      </div>

      {/* Profile Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-sm overflow-hidden"
        >
          {/* Profile Header */}
          <div className="bg-gradient-to-r from-orange-500 to-red-500 h-32 relative">
            <div className="absolute -bottom-16 left-8">
              <div className="relative">
                {user.avatar_url ? (
                  <div className="w-32 h-32 rounded-full border-4 border-white overflow-hidden bg-white">
                    <OptimizedImage
                      src={user.avatar_url}
                      alt={`${user.first_name} ${user.last_name}`}
                      width={128}
                      height={128}
                      className="w-full h-full"
                      objectFit="cover"
                    />
                  </div>
                ) : (
                  <div className="w-32 h-32 rounded-full border-4 border-white bg-gray-200 flex items-center justify-center">
                    <User className="w-12 h-12 text-gray-400" />
                  </div>
                )}
                
                <div className="absolute bottom-0 right-0 bg-orange-500 rounded-full p-2 border-2 border-white">
                  <Camera className="w-4 h-4 text-white" />
                </div>
              </div>
            </div>
          </div>

          {/* Profile Form */}
          <div className="pt-20 p-8">
            {message && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`p-4 rounded-lg mb-6 ${
                  message.type === 'success'
                    ? 'bg-green-50 text-green-800 border border-green-200'
                    : 'bg-red-50 text-red-800 border border-red-200'
                }`}
              >
                {message.text}
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Avatar Upload Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800">Profile Picture</h3>
                <div className="max-w-sm">
                  <ImageUploader
                    bucket={STORAGE_BUCKETS.USERS}
                    onUploadComplete={handleAvatarUpload}
                    onUploadError={handleAvatarError}
                    aspectRatio="square"
                    label="Upload New Avatar"
                    currentImageUrl={profileData.avatar_url}
                    maxSizeMB={2}
                  />
                </div>
                <p className="text-sm text-gray-500">
                  Upload a square image for best results. Maximum size: 2MB.
                </p>
              </div>

              {/* Personal Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800">Personal Information</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="first_name" className="block text-sm font-medium text-gray-700 mb-1">
                      First Name
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="text"
                        id="first_name"
                        name="first_name"
                        value={profileData.first_name}
                        onChange={handleInputChange}
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                        placeholder="Enter your first name"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="last_name" className="block text-sm font-medium text-gray-700 mb-1">
                      Last Name
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="text"
                        id="last_name"
                        name="last_name"
                        value={profileData.last_name}
                        onChange={handleInputChange}
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                        placeholder="Enter your last name"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="email"
                      id="email"
                      value={user.email}
                      disabled
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500 cursor-not-allowed"
                      placeholder="Email cannot be changed"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Email address cannot be changed from this page
                  </p>
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={profileData.phone}
                      onChange={handleInputChange}
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                      placeholder="+234 xxx xxx xxxx"
                    />
                  </div>
                </div>
              </div>

              {/* Account Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800">Account Information</h3>
                
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-gray-700">Account Type:</span>
                    <span className="text-sm text-gray-600 capitalize">{user.user_role}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-gray-700">Account Status:</span>
                    <span className={`text-sm ${user.is_verified ? 'text-green-600' : 'text-yellow-600'}`}>
                      {user.is_verified ? 'Verified' : 'Pending Verification'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-gray-700">Member Since:</span>
                    <span className="text-sm text-gray-600">
                      {new Date(user.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="w-full md:w-auto flex justify-center items-center gap-2 px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isUpdating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Updating...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Update Profile
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </motion.div>
      </div>
    </div>
  )
}