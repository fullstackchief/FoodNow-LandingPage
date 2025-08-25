'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { XMarkIcon } from '@heroicons/react/24/outline'

interface EnhancedMenuItemData {
  id: string
  name: string
  description: string
  basePrice: number
  portions: {
    standard: { price: number; servings: number }
    small: { price: number; servings: number }
    large: { price: number; servings: number }
  }
  packOptions?: {
    portionsPerPack: number
    packPrice: number
    platePrice: number
  }
  addOns: Array<{
    id: string
    name: string
    price: number
    maxQuantity: number
  }>
  category: string
  image: string
  isAvailable: boolean
  preparationTime: number
  popular: boolean
  spicy: boolean
  isCombo: boolean
  dietaryTags: string[]
}

interface EnhancedAddMenuItemModalProps {
  isOpen: boolean
  onClose: () => void
  onAddItem: (item: EnhancedMenuItemData) => void
}

const EnhancedAddMenuItemModal = ({ isOpen, onClose, onAddItem }: EnhancedAddMenuItemModalProps) => {
  const [currentStep, setCurrentStep] = useState(1)
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
      portionsPerPack: '4',
      packPrice: '',
      platePrice: ''
    },
    addOns: [
      { name: '', price: '', maxQuantity: 1 },
      { name: '', price: '', maxQuantity: 1 },
      { name: '', price: '', maxQuantity: 1 },
      { name: '', price: '', maxQuantity: 1 }
    ],
    dietaryTags: [] as string[]
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

  const dietaryOptions = [
    'Vegetarian', 'Vegan', 'Halal', 'Gluten-Free', 'Dairy-Free', 
    'Nut-Free', 'Family Size', 'Low Calorie'
  ]

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    const newItem = {
      id: Date.now().toString(),
      name: formData.name,
      description: formData.description,
      basePrice: parseFloat(formData.portions.standard.price) || 0,
      portions: {
        standard: { 
          price: parseFloat(formData.portions.standard.price) || 0, 
          servings: formData.portions.standard.servings 
        },
        small: { 
          price: parseFloat(formData.portions.small.price) || 0, 
          servings: formData.portions.small.servings 
        },
        large: { 
          price: parseFloat(formData.portions.large.price) || 0, 
          servings: formData.portions.large.servings 
        }
      },
      packOptions: formData.packOptions.enabled ? {
        portionsPerPack: parseInt(formData.packOptions.portionsPerPack) || 4,
        packPrice: parseFloat(formData.packOptions.packPrice) || 0,
        platePrice: parseFloat(formData.packOptions.platePrice) || 0
      } : undefined,
      addOns: formData.addOns
        .filter(addon => addon.name.trim() && addon.price.trim())
        .map((addon, index) => ({
          id: `ao${Date.now()}_${index}`,
          name: addon.name,
          price: parseFloat(addon.price),
          maxQuantity: addon.maxQuantity
        })),
      category: formData.category,
      image: '/api/placeholder/200/150',
      isAvailable: formData.isAvailable,
      preparationTime: parseInt(formData.preparationTime),
      popular: formData.popular,
      spicy: formData.spicy,
      isCombo: formData.isCombo,
      dietaryTags: formData.dietaryTags
    }

    onAddItem(newItem)
    resetForm()
    onClose()
  }

  const resetForm = () => {
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
        portionsPerPack: '4',
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
    setCurrentStep(1)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked
      setFormData(prev => ({ ...prev, [name]: checked }))
    } else {
      setFormData(prev => ({ ...prev, [name]: value }))
    }
  }

  const handlePortionChange = (size: 'small' | 'standard' | 'large', field: 'price' | 'servings', value: string | number) => {
    setFormData(prev => ({
      ...prev,
      portions: {
        ...prev.portions,
        [size]: {
          ...prev.portions[size],
          [field]: value
        }
      }
    }))
  }

  const handlePackOptionChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      packOptions: {
        ...prev.packOptions,
        [field]: value
      }
    }))
  }

  const handleAddOnChange = (index: number, field: string, value: string | number) => {
    const newAddOns = [...formData.addOns]
    newAddOns[index] = { ...newAddOns[index], [field]: value }
    setFormData(prev => ({ ...prev, addOns: newAddOns }))
  }

  const toggleDietaryTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      dietaryTags: prev.dietaryTags.includes(tag)
        ? prev.dietaryTags.filter(t => t !== tag)
        : [...prev.dietaryTags, tag]
    }))
  }

  const renderStep1 = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
      
      {/* Item Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Item Name *</label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleInputChange}
          required
          className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
          placeholder="Enter item name"
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleInputChange}
          required
          rows={3}
          className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
          placeholder="Describe your item..."
        />
      </div>

      {/* Category and Prep Time */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Category *</label>
          <select
            name="category"
            value={formData.category}
            onChange={handleInputChange}
            required
            className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            {categories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Prep Time (minutes) *</label>
          <input
            type="number"
            name="preparationTime"
            value={formData.preparationTime}
            onChange={handleInputChange}
            required
            min="1"
            className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
            placeholder="15"
          />
        </div>
      </div>

      {/* Item Options */}
      <div className="space-y-3">
        <h4 className="font-medium text-gray-900">Item Options</h4>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { key: 'isAvailable', label: 'Available' },
            { key: 'popular', label: 'Popular' },
            { key: 'spicy', label: 'Spicy 🌶️' },
            { key: 'isCombo', label: 'Combo Meal' }
          ].map(option => (
            <label key={option.key} className="flex items-center space-x-2 p-2 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
              <input
                type="checkbox"
                name={option.key}
                checked={formData[option.key as keyof typeof formData] as boolean}
                onChange={handleInputChange}
                className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
              />
              <span className="text-sm font-medium text-gray-700">{option.label}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  )

  const renderStep2 = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Pricing & Portions</h3>
      
      {/* Portion Sizes */}
      <div className="space-y-4">
        <h4 className="font-medium text-gray-900">Portion Sizes</h4>
        {['small', 'standard', 'large'].map((size) => (
          <div key={size} className="grid grid-cols-3 gap-4 items-center p-3 bg-gray-50 rounded-xl">
            <div>
              <label className="block text-sm font-medium text-gray-700 capitalize">{size}</label>
            </div>
            <div>
              <input
                type="number"
                placeholder="Price"
                value={formData.portions[size as keyof typeof formData.portions].price}
                onChange={(e) => handlePortionChange(size as 'small' | 'standard' | 'large', 'price', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                required={size === 'standard'}
              />
            </div>
            <div>
              <input
                type="number"
                placeholder="Servings"
                value={formData.portions[size as keyof typeof formData.portions].servings}
                onChange={(e) => handlePortionChange(size as 'small' | 'standard' | 'large', 'servings', parseInt(e.target.value))}
                className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                min="1"
              />
            </div>
          </div>
        ))}
      </div>

      {/* Pack Options */}
      <div className="space-y-3">
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={formData.packOptions.enabled}
            onChange={(e) => handlePackOptionChange('enabled', e.target.checked)}
            className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
          />
          <label className="font-medium text-gray-900">Offer Pack Option</label>
        </div>
        
        {formData.packOptions.enabled && (
          <div className="grid grid-cols-3 gap-4 p-3 bg-blue-50 rounded-xl">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Portions per Pack</label>
              <input
                type="number"
                value={formData.packOptions.portionsPerPack}
                onChange={(e) => handlePackOptionChange('portionsPerPack', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                min="2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Pack Price</label>
              <input
                type="number"
                value={formData.packOptions.packPrice}
                onChange={(e) => handlePackOptionChange('packPrice', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Price per Plate</label>
              <input
                type="number"
                value={formData.packOptions.platePrice}
                onChange={(e) => handlePackOptionChange('platePrice', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="0"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )

  const renderStep3 = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Add-ons & Dietary Tags</h3>
      
      {/* Add-ons */}
      <div className="space-y-3">
        <h4 className="font-medium text-gray-900">Add-ons (Max 4)</h4>
        {formData.addOns.map((addon, index) => (
          <div key={index} className="grid grid-cols-4 gap-3 p-3 bg-orange-50 rounded-xl">
            <div className="col-span-2">
              <input
                type="text"
                placeholder="Add-on name"
                value={addon.name}
                onChange={(e) => handleAddOnChange(index, 'name', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <input
                type="number"
                placeholder="Price"
                value={addon.price}
                onChange={(e) => handleAddOnChange(index, 'price', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <input
                type="number"
                placeholder="Max qty"
                value={addon.maxQuantity}
                onChange={(e) => handleAddOnChange(index, 'maxQuantity', parseInt(e.target.value) || 1)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                min="1"
                max="10"
              />
            </div>
          </div>
        ))}
      </div>

      {/* Dietary Tags */}
      <div className="space-y-3">
        <h4 className="font-medium text-gray-900">Dietary Tags</h4>
        <div className="grid grid-cols-3 gap-2">
          {dietaryOptions.map(tag => (
            <button
              key={tag}
              type="button"
              onClick={() => toggleDietaryTag(tag)}
              className={`p-2 rounded-lg text-sm font-medium transition-colors ${
                formData.dietaryTags.includes(tag)
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>
    </div>
  )

  const steps = [
    { number: 1, title: 'Basic Info', component: renderStep1 },
    { number: 2, title: 'Pricing', component: renderStep2 },
    { number: 3, title: 'Add-ons', component: renderStep3 }
  ]

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
            <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Add Menu Item</h2>
                  <p className="text-sm text-gray-600 mt-1">Step {currentStep} of 3</p>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  <XMarkIcon className="w-6 h-6 text-gray-500" />
                </button>
              </div>

              {/* Progress Steps */}
              <div className="flex items-center justify-center p-4 border-b border-gray-200">
                {steps.map((step, index) => (
                  <div key={step.number} className="flex items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                      currentStep >= step.number
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-200 text-gray-600'
                    }`}>
                      {step.number}
                    </div>
                    <span className={`ml-2 text-sm font-medium ${
                      currentStep >= step.number ? 'text-green-600' : 'text-gray-500'
                    }`}>
                      {step.title}
                    </span>
                    {index < steps.length - 1 && (
                      <div className={`w-16 h-px mx-4 ${
                        currentStep > step.number ? 'bg-green-500' : 'bg-gray-200'
                      }`} />
                    )}
                  </div>
                ))}
              </div>

              {/* Form Content */}
              <form onSubmit={handleSubmit}>
                <div className="p-6 max-h-[60vh] overflow-y-auto">
                  {steps[currentStep - 1].component()}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between p-6 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={currentStep > 1 ? () => setCurrentStep(prev => prev - 1) : onClose}
                    className="px-6 py-2 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium transition-colors"
                  >
                    {currentStep > 1 ? 'Previous' : 'Cancel'}
                  </button>
                  
                  {currentStep < steps.length ? (
                    <button
                      type="button"
                      onClick={() => setCurrentStep(prev => prev + 1)}
                      className="px-6 py-2 bg-green-500 hover:bg-green-600 text-white rounded-xl font-medium transition-colors"
                    >
                      Next
                    </button>
                  ) : (
                    <button
                      type="submit"
                      className="px-6 py-2 bg-green-500 hover:bg-green-600 text-white rounded-xl font-medium transition-colors"
                    >
                      Add Menu Item
                    </button>
                  )}
                </div>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

export default EnhancedAddMenuItemModal