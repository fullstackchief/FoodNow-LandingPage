'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { XMarkIcon, PlusIcon } from '@heroicons/react/24/outline'
import Button from '@/components/ui/Button'
import ImageUploader from '@/components/ui/ImageUploader'
import { STORAGE_BUCKETS } from '@/lib/supabaseStorage'

interface AddMenuItemModalProps {
  isOpen: boolean
  onClose: () => void
  restaurantId: string
  onSuccess: () => void
}

const categories = [
  'Rice Dishes',
  'Pasta & Noodles',
  'Soups & Stews',
  'Grilled Items',
  'Fried Items',
  'Snacks & Appetizers',
  'Beverages',
  'Desserts',
  'Main Course',
  'Local Cuisine'
]

export default function AddMenuItemModal({ isOpen, onClose, restaurantId, onSuccess }: AddMenuItemModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    price: '',
    image_url: '',
    preparation_time: 25,
    customization_options: ['']
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name === 'price' || name === 'preparation_time' ? parseFloat(value) || 0 : value
    }))
  }

  const handleImageUpload = (url: string) => {
    setFormData(prev => ({ ...prev, image_url: url }))
  }

  const handleCustomizationChange = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      customization_options: prev.customization_options.map((option, i) => 
        i === index ? value : option
      )
    }))
  }

  const addCustomizationOption = () => {
    setFormData(prev => ({
      ...prev,
      customization_options: [...prev.customization_options, '']
    }))
  }

  const removeCustomizationOption = (index: number) => {
    setFormData(prev => ({
      ...prev,
      customization_options: prev.customization_options.filter((_, i) => i !== index)
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      const response = await fetch('/api/restaurants/menu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restaurantId,
          name: formData.name,
          description: formData.description,
          category: formData.category,
          price: formData.price,
          image_url: formData.image_url,
          customization_options: formData.customization_options.filter(option => option.trim()),
          preparation_time: formData.preparation_time
        })
      })

      if (response.ok) {
        const result = await response.json()
        onSuccess()
        onClose()
        // Reset form
        setFormData({
          name: '',
          description: '',
          category: '',
          price: '',
          image_url: '',
          preparation_time: 25,
          customization_options: ['']
        })
      } else {
        const error = await response.json()
        setError(error.error || 'Failed to create menu item')
      }
    } catch (error) {
      setError('Failed to create menu item. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
          
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="inline-block w-full max-w-2xl p-6 my-8 overflow-hidden text-left align-middle bg-white shadow-xl rounded-2xl transform transition-all"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Add New Menu Item</h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Item Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="e.g., Jollof Rice Special"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category *
                  </label>
                  <select
                    name="category"
                    required
                    value={formData.category}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="">Select category</option>
                    {categories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description *
                </label>
                <textarea
                  name="description"
                  required
                  rows={3}
                  value={formData.description}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                  placeholder="Describe your dish..."
                />
              </div>

              {/* Pricing & Time */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Price (₦) *
                  </label>
                  <input
                    type="number"
                    name="price"
                    required
                    min="100"
                    value={formData.price}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="2500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Prep Time (minutes)
                  </label>
                  <select
                    name="preparation_time"
                    value={formData.preparation_time}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    {Array.from({ length: 6 }, (_, i) => 25 + i).map(time => (
                      <option key={time} value={time}>{time} minutes</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Image Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Food Image
                </label>
                <ImageUploader
                  bucket={STORAGE_BUCKETS.RESTAURANTS}
                  onUploadComplete={handleImageUpload}
                  onUploadError={(error) => setError(`Image upload failed: ${error}`)}
                  aspectRatio="square"
                  label="Upload Food Image"
                  currentImageUrl={formData.image_url}
                  maxSizeMB={5}
                />
              </div>

              {/* Customization Options */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Customization Options (Optional)
                </label>
                <div className="space-y-2">
                  {formData.customization_options.map((option, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={option}
                        onChange={(e) => handleCustomizationChange(index, e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="e.g., Extra spicy, Less salt"
                      />
                      {formData.customization_options.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeCustomizationOption(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <XMarkIcon className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addCustomizationOption}
                    className="flex items-center space-x-1 text-green-600 hover:text-green-700 text-sm"
                  >
                    <PlusIcon className="w-4 h-4" />
                    <span>Add option</span>
                  </button>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end space-x-3 pt-4">
                <Button
                  type="button"
                  onClick={onClose}
                  theme="restaurant"
                  variant="outline"
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  theme="restaurant"
                  variant="primary"
                  loading={isSubmitting}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Creating...' : 'Create Menu Item'}
                </Button>
              </div>
            </form>

            {/* Info Note */}
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> New menu items require admin approval before they appear to customers.
                You'll be notified once your item is approved.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  )
}