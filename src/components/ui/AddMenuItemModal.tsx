'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { XMarkIcon, PhotoIcon } from '@heroicons/react/24/outline'

interface MenuItemData {
  id: string
  name: string
  description: string
  price: number
  category: string
  image: string
  isAvailable: boolean
  preparationTime: number
  popular: boolean
  spicy: boolean
}

interface AddMenuItemModalProps {
  isOpen: boolean
  onClose: () => void
  onAddItem: (item: MenuItemData) => void
}

const AddMenuItemModal = ({ isOpen, onClose, onAddItem }: AddMenuItemModalProps) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'Rice Dishes',
    preparationTime: '',
    isAvailable: true,
    popular: false,
    spicy: false,
    isCombo: false,
    portions: {
      small: { price: '', servings: 1 },
      standard: { price: '', servings: 1 },
      large: { price: '', servings: 1 }
    },
    packOptions: {
      enabled: false,
      portionsPerPack: '',
      packPrice: '',
      platePrice: ''
    },
    addOns: [
      { name: '', price: '', maxQuantity: 1 },
      { name: '', price: '', maxQuantity: 1 },
      { name: '', price: '', maxQuantity: 1 },
      { name: '', price: '', maxQuantity: 1 }
    ],
    dietaryTags: []
  })

  const categories = [
    'Rice Dishes',
    'Soup & Swallow',
    'Grilled & Fried',
    'Beverages',
    'Desserts',
    'Appetizers',
    'Continental',
    'Combo Meals'
  ]


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    const newItem = {
      id: Date.now().toString(),
      name: formData.name,
      description: formData.description,
      price: parseFloat(formData.portions.standard.price) || 0,
      category: formData.category,
      image: '/api/placeholder/200/150',
      isAvailable: formData.isAvailable,
      preparationTime: parseInt(formData.preparationTime),
      popular: formData.popular,
      spicy: formData.spicy
    }

    onAddItem(newItem)
    
    // Reset form
    setFormData({
      name: '',
      description: '',
      category: 'Rice Dishes',
      preparationTime: '',
      isAvailable: true,
      popular: false,
      spicy: false,
      isCombo: false,
      portions: {
        small: { price: '', servings: 1 },
        standard: { price: '', servings: 1 },
        large: { price: '', servings: 1 }
      },
      packOptions: {
        enabled: false,
        portionsPerPack: '',
        packPrice: '',
        platePrice: ''
      },
      addOns: [
        { name: '', price: '', maxQuantity: 1 },
        { name: '', price: '', maxQuantity: 1 },
        { name: '', price: '', maxQuantity: 1 },
        { name: '', price: '', maxQuantity: 1 }
      ],
      dietaryTags: []
    })
    
    onClose()
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked
      setFormData(prev => ({ ...prev, [name]: checked }))
    } else {
      setFormData(prev => ({ ...prev, [name]: value }))
    }
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
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-50"
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h2 className="text-2xl font-bold text-gray-900">Add Menu Item</h2>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  <XMarkIcon className="w-6 h-6 text-gray-500" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                {/* Image Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Item Image
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-2xl p-8 text-center hover:border-orange-400 transition-colors">
                    <PhotoIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-2">Upload item photo</p>
                    <button
                      type="button"
                      className="text-orange-600 font-medium hover:text-orange-700"
                    >
                      Browse Files
                    </button>
                  </div>
                </div>

                {/* Item Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Item Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Enter item name"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description *
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    required
                    rows={3}
                    className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
                    placeholder="Describe your item..."
                  />
                </div>

                {/* Price and Time */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Price (₦) *
                    </label>
                    <input
                      type="number"
                      name="standard-price"
                      value={formData.portions.standard.price}
                      onChange={(e) => {
                        setFormData(prev => ({
                          ...prev,
                          portions: {
                            ...prev.portions,
                            standard: {
                              ...prev.portions.standard,
                              price: e.target.value
                            }
                          }
                        }))
                      }}
                      required
                      min="0"
                      step="0.01"
                      className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="0.00"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Preparation Time (minutes) *
                    </label>
                    <input
                      type="number"
                      name="preparationTime"
                      value={formData.preparationTime}
                      onChange={handleChange}
                      required
                      min="1"
                      className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="15"
                    />
                  </div>
                </div>

                {/* Category */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category *
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    required
                    className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    {categories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>

                {/* Options */}
                <div className="space-y-4">
                  <h3 className="font-medium text-gray-900">Item Options</h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <label className="flex items-center space-x-3 p-3 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors">
                      <input
                        type="checkbox"
                        name="isAvailable"
                        checked={formData.isAvailable}
                        onChange={handleChange}
                        className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                      />
                      <span className="text-sm font-medium text-gray-700">Available</span>
                    </label>

                    <label className="flex items-center space-x-3 p-3 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors">
                      <input
                        type="checkbox"
                        name="popular"
                        checked={formData.popular}
                        onChange={handleChange}
                        className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                      />
                      <span className="text-sm font-medium text-gray-700">Popular</span>
                    </label>

                    <label className="flex items-center space-x-3 p-3 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors">
                      <input
                        type="checkbox"
                        name="spicy"
                        checked={formData.spicy}
                        onChange={handleChange}
                        className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                      />
                      <span className="text-sm font-medium text-gray-700">Spicy 🌶️</span>
                    </label>
                  </div>
                </div>

                {/* Buttons */}
                <div className="flex space-x-4 pt-6">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 py-3 px-6 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 px-6 bg-green-500 hover:bg-green-600 text-white rounded-xl font-medium transition-colors"
                  >
                    Add Menu Item
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

export default AddMenuItemModal