'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Save, Image as ImageIcon, Clock, Star, Flame } from 'lucide-react'
import ImageUploader from '@/components/ui/ImageUploader'
import { STORAGE_BUCKETS } from '@/lib/supabaseStorage'
import { useAuth } from '@/contexts/AuthContext'

interface MenuItemData {
  id: string
  restaurant_id: string
  name: string
  description: string
  base_price: number
  image_url: string
  category_id: string
  is_available: boolean
  is_popular: boolean
  preparation_time: number
  tags: string[]
  dietary_tags: string[]
}

interface AddMenuItemWithImagesProps {
  isOpen: boolean
  onClose: () => void
  onSave: (item: Partial<MenuItemData>) => Promise<void>
  restaurantId: string
}

const categoryOptions = [
  'Rice Dishes',
  'Pasta & Noodles', 
  'Grilled & Barbecue',
  'Soups & Stews',
  'Appetizers',
  'Main Course',
  'Desserts',
  'Beverages',
  'Salads',
  'Fast Food'
]

const dietaryTags = [
  'Vegetarian',
  'Vegan', 
  'Gluten-Free',
  'Dairy-Free',
  'Halal',
  'Spicy',
  'Low-Carb',
  'Protein-Rich'
]

export default function AddMenuItemWithImages({
  isOpen,
  onClose,
  onSave,
  restaurantId
}: AddMenuItemWithImagesProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)
  const [uploadedImageUrl, setUploadedImageUrl] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    base_price: '',
    category_id: categoryOptions[0],
    preparation_time: '15',
    is_available: true,
    is_popular: false,
    tags: [] as string[],
    dietary_tags: [] as string[]
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked
      setFormData(prev => ({ ...prev, [name]: checked }))
    } else {
      setFormData(prev => ({ ...prev, [name]: value }))
    }
  }

  const toggleTag = (tag: string, type: 'tags' | 'dietary_tags') => {
    setFormData(prev => ({
      ...prev,
      [type]: prev[type].includes(tag)
        ? prev[type].filter(t => t !== tag)
        : [...prev[type], tag]
    }))
  }

  const handleImageUpload = (url: string) => {
    setUploadedImageUrl(url)
    setSuccess('Image uploaded successfully!')
    setTimeout(() => setSuccess(''), 3000)
  }

  const handleImageError = (error: string) => {
    setError(`Image upload failed: ${error}`)
    setTimeout(() => setError(''), 5000)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      // Validation
      if (!formData.name.trim()) {
        throw new Error('Item name is required')
      }
      if (!formData.description.trim()) {
        throw new Error('Description is required')
      }
      if (!formData.base_price || parseFloat(formData.base_price) <= 0) {
        throw new Error('Valid price is required')
      }
      if (!uploadedImageUrl) {
        throw new Error('Please upload an image for the menu item')
      }

      const menuItemData: Partial<MenuItemData> = {
        restaurant_id: restaurantId,
        name: formData.name.trim(),
        description: formData.description.trim(),
        base_price: parseFloat(formData.base_price),
        image_url: uploadedImageUrl,
        category_id: formData.category_id,
        is_available: formData.is_available,
        is_popular: formData.is_popular,
        preparation_time: parseInt(formData.preparation_time),
        tags: formData.tags,
        dietary_tags: formData.dietary_tags
      }

      await onSave(menuItemData)
      
      // Reset form
      setFormData({
        name: '',
        description: '',
        base_price: '',
        category_id: categoryOptions[0],
        preparation_time: '15',
        is_available: true,
        is_popular: false,
        tags: [],
        dietary_tags: []
      })
      setUploadedImageUrl('')
      setCurrentStep(1)
      setSuccess('Menu item added successfully!')
      
      // Close modal after brief delay
      setTimeout(() => {
        setSuccess('')
        onClose()
      }, 1500)

    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to add menu item')
    } finally {
      setIsLoading(false)
    }
  }

  const nextStep = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const steps = [
    { number: 1, title: 'Basic Info', description: 'Name, description, price' },
    { number: 2, title: 'Image Upload', description: 'Add item photo' },
    { number: 3, title: 'Details', description: 'Category, tags, options' }
  ]

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500 to-red-500 px-6 py-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Add New Menu Item</h2>
              <p className="text-orange-100">Step {currentStep} of 3: {steps[currentStep - 1].title}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-4 flex space-x-2">
            {steps.map((step) => (
              <div
                key={step.number}
                className={`flex-1 h-2 rounded-full transition-colors ${
                  step.number <= currentStep ? 'bg-white' : 'bg-white/30'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800">
            {error}
          </div>
        )}
        
        {success && (
          <div className="mx-6 mt-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-800">
            {success}
          </div>
        )}

        <div className="p-6 max-h-[calc(90vh-200px)] overflow-y-auto">
          <form onSubmit={handleSubmit}>
            <AnimatePresence mode="wait">
              {/* Step 1: Basic Information */}
              {currentStep === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                      Item Name *
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="e.g., Jollof Rice with Chicken"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                      Description *
                    </label>
                    <textarea
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      rows={4}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
                      placeholder="Describe your delicious menu item..."
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="base_price" className="block text-sm font-medium text-gray-700 mb-2">
                      Price (₦) *
                    </label>
                    <input
                      type="number"
                      id="base_price"
                      name="base_price"
                      value={formData.base_price}
                      onChange={handleInputChange}
                      min="0"
                      step="0.01"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="0.00"
                      required
                    />
                  </div>

                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        name="is_available"
                        checked={formData.is_available}
                        onChange={handleInputChange}
                        className="w-4 h-4 text-orange-500 rounded"
                      />
                      <span className="text-sm text-gray-700">Available now</span>
                    </label>

                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        name="is_popular"
                        checked={formData.is_popular}
                        onChange={handleInputChange}
                        className="w-4 h-4 text-orange-500 rounded"
                      />
                      <Star className="w-4 h-4 text-orange-500" />
                      <span className="text-sm text-gray-700">Popular item</span>
                    </label>
                  </div>
                </motion.div>
              )}

              {/* Step 2: Image Upload */}
              {currentStep === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="text-center">
                    <ImageIcon className="mx-auto w-12 h-12 text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-800 mb-2">Upload Menu Item Photo</h3>
                    <p className="text-gray-600 mb-6">
                      Add an appetizing photo of your menu item. High-quality images increase orders by up to 30%!
                    </p>
                  </div>

                  <div className="max-w-md mx-auto">
                    <ImageUploader
                      bucket={STORAGE_BUCKETS.MENU_ITEMS}
                      onUploadComplete={handleImageUpload}
                      onUploadError={handleImageError}
                      aspectRatio="4:3"
                      label="Upload Menu Item Photo"
                      currentImageUrl={uploadedImageUrl}
                      maxSizeMB={3}
                    />
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-medium text-blue-800 mb-2">📸 Photo Tips:</h4>
                    <ul className="text-sm text-blue-700 space-y-1">
                      <li>• Use natural lighting when possible</li>
                      <li>• Show the food clearly with minimal background</li>
                      <li>• Ensure food looks fresh and appetizing</li>
                      <li>• Use a 4:3 aspect ratio for best display</li>
                    </ul>
                  </div>
                </motion.div>
              )}

              {/* Step 3: Details */}
              {currentStep === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="category_id" className="block text-sm font-medium text-gray-700 mb-2">
                        Category
                      </label>
                      <select
                        id="category_id"
                        name="category_id"
                        value={formData.category_id}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      >
                        {categoryOptions.map(category => (
                          <option key={category} value={category}>{category}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label htmlFor="preparation_time" className="block text-sm font-medium text-gray-700 mb-2">
                        <Clock className="inline w-4 h-4 mr-1" />
                        Prep Time (minutes)
                      </label>
                      <input
                        type="number"
                        id="preparation_time"
                        name="preparation_time"
                        value={formData.preparation_time}
                        onChange={handleInputChange}
                        min="1"
                        max="120"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Dietary Tags (optional)
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {dietaryTags.map(tag => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => toggleTag(tag, 'dietary_tags')}
                          className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                            formData.dietary_tags.includes(tag)
                              ? 'bg-green-500 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {tag === 'Spicy' && <Flame className="inline w-3 h-3 mr-1" />}
                          {tag === 'Vegetarian' && '🌱 '}
                          {tag === 'Vegan' && '🌿 '}
                          {tag === 'Halal' && '☪️ '}
                          {tag}
                        </button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between pt-6 border-t border-gray-200 mt-8">
              <button
                type="button"
                onClick={prevStep}
                disabled={currentStep === 1}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 disabled:text-gray-400 disabled:cursor-not-allowed"
              >
                Previous
              </button>

              <div className="flex space-x-3">
                {currentStep < 3 ? (
                  <button
                    type="button"
                    onClick={nextStep}
                    className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                  >
                    Continue
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={isLoading || !uploadedImageUrl}
                    className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Adding...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        Add Menu Item
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  )
}