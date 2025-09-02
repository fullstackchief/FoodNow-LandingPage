'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Plus, Minus, AlertCircle } from 'lucide-react'
import { MenuItem, CartItemCustomization } from '@/types'
import OptimizedImage from './OptimizedImage'

interface MenuItemCustomizationModalProps {
  item: MenuItem
  isOpen: boolean
  onClose: () => void
  onAddToCart: (
    item: MenuItem, 
    quantity: number, 
    customizations: CartItemCustomization[],
    specialRequests?: string
  ) => void
  initialQuantity?: number
}

const MenuItemCustomizationModal = ({
  item,
  isOpen,
  onClose,
  onAddToCart,
  initialQuantity = 1
}: MenuItemCustomizationModalProps) => {
  const [quantity, setQuantity] = useState(initialQuantity)
  const [selectedCustomizations, setSelectedCustomizations] = useState<CartItemCustomization[]>([])
  const [specialRequests, setSpecialRequests] = useState('')
  const [validationErrors, setValidationErrors] = useState<string[]>([])

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setQuantity(initialQuantity)
      setSelectedCustomizations([])
      setSpecialRequests('')
      setValidationErrors([])
    }
  }, [isOpen, initialQuantity])

  // Calculate total price
  const calculateTotalPrice = () => {
    const customizationPrice = selectedCustomizations.reduce(
      (total, customization) => total + customization.additionalPrice, 
      0
    )
    return (item.base_price + customizationPrice) * quantity
  }

  // Handle customization selection
  const handleCustomizationChange = (
    customizationGroup: any,
    option: any,
    isSelected: boolean
  ) => {
    setSelectedCustomizations(prev => {
      // Remove existing customization for this group if it exists
      const filtered = prev.filter(c => c.id !== customizationGroup.id)
      
      if (isSelected) {
        // Add new customization
        const existingCustomization = prev.find(c => c.id === customizationGroup.id)
        
        if (customizationGroup.maxSelections === 1) {
          // Single selection - replace existing
          return [
            ...filtered,
            {
              id: customizationGroup.id,
              name: customizationGroup.name,
              selectedOptions: [option],
              additionalPrice: option.price
            }
          ]
        } else {
          // Multiple selection - add to existing or create new
          const selectedOptions = existingCustomization 
            ? [...existingCustomization.selectedOptions, option]
            : [option]
            
          // Check max selections limit
          if (customizationGroup.maxSelections && 
              selectedOptions.length > customizationGroup.maxSelections) {
            return prev // Don't allow exceeding limit
          }
          
          return [
            ...filtered,
            {
              id: customizationGroup.id,
              name: customizationGroup.name,
              selectedOptions,
              additionalPrice: selectedOptions.reduce((sum, opt) => sum + opt.price, 0)
            }
          ]
        }
      } else {
        // Remove option from customization
        const existingCustomization = prev.find(c => c.id === customizationGroup.id)
        if (existingCustomization) {
          const updatedOptions = existingCustomization.selectedOptions.filter(
            opt => opt.id !== option.id
          )
          
          if (updatedOptions.length === 0) {
            return filtered // Remove entire customization if no options selected
          }
          
          return [
            ...filtered,
            {
              ...existingCustomization,
              selectedOptions: updatedOptions,
              additionalPrice: updatedOptions.reduce((sum, opt) => sum + opt.price, 0)
            }
          ]
        }
        return prev
      }
    })
  }

  // Check if option is selected
  const isOptionSelected = (customizationId: string, optionId: string) => {
    const customization = selectedCustomizations.find(c => c.id === customizationId)
    return customization?.selectedOptions.some(opt => opt.id === optionId) || false
  }

  // Validate required customizations
  const validateCustomizations = () => {
    const errors: string[] = []
    
    if (item.customizationsData) {
      item.customizationsData.forEach(group => {
        if (group.required) {
          const selectedGroup = selectedCustomizations.find(c => c.id === group.id)
          if (!selectedGroup || selectedGroup.selectedOptions.length === 0) {
            errors.push(`${group.name} is required`)
          }
        }
      })
    }
    
    setValidationErrors(errors)
    return errors.length === 0
  }

  // Handle add to cart
  const handleAddToCart = () => {
    if (validateCustomizations()) {
      onAddToCart(item, quantity, selectedCustomizations, specialRequests)
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/50"
          onClick={onClose}
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-hidden"
        >
          {/* Header */}
          <div className="relative">
            <OptimizedImage
              src={item.image_url || '/images/placeholder-food.jpg'}
              alt={item.name}
              className="w-full h-48 object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
            <button
              onClick={onClose}
              className="absolute top-4 right-4 w-10 h-10 bg-white/90 hover:bg-white rounded-full flex items-center justify-center transition-colors"
            >
              <X className="w-5 h-5 text-gray-700" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-12rem)]">
            {/* Item Info */}
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{item.name}</h2>
              <p className="text-gray-600 mb-4">{item.description}</p>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-orange-600">
                  ₦{item.base_price.toLocaleString()}
                </span>
                {item.preparation_time && (
                  <span className="text-sm text-gray-500">
                    ~{item.preparation_time} min
                  </span>
                )}
              </div>
            </div>

            {/* Validation Errors */}
            {validationErrors.length > 0 && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-start">
                  <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium text-red-800 mb-2">Please fix the following:</h4>
                    <ul className="text-sm text-red-700 space-y-1">
                      {validationErrors.map((error, index) => (
                        <li key={index}>• {error}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Customizations */}
            {item.customizationsData && item.customizationsData.length > 0 && (
              <div className="mb-6 space-y-6">
                <h3 className="text-lg font-semibold text-gray-900">Customize Your Order</h3>
                
                {item.customizationsData.map((group) => (
                  <div key={group.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="mb-3">
                      <h4 className="font-medium text-gray-900">
                        {group.name}
                        {group.required && <span className="text-red-500 ml-1">*</span>}
                      </h4>
                      {group.maxSelections && (
                        <p className="text-sm text-gray-500">
                          {group.maxSelections === 1 
                            ? 'Choose one' 
                            : `Choose up to ${group.maxSelections}`
                          }
                        </p>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      {group.options.map((option) => {
                        const isSelected = isOptionSelected(group.id, option.id)
                        
                        return (
                          <label
                            key={option.id}
                            className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-all ${
                              isSelected 
                                ? 'border-orange-500 bg-orange-50' 
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <div className="flex items-center">
                              <input
                                type={group.maxSelections === 1 ? 'radio' : 'checkbox'}
                                name={`customization-${group.id}`}
                                checked={isSelected}
                                onChange={(e) => 
                                  handleCustomizationChange(group, option, e.target.checked)
                                }
                                className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                              />
                              <span className="ml-3 font-medium text-gray-900">
                                {option.name}
                              </span>
                            </div>
                            {option.price > 0 && (
                              <span className="text-orange-600 font-medium">
                                +₦{option.price.toLocaleString()}
                              </span>
                            )}
                          </label>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Special Requests */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Special Requests</h3>
              <textarea
                value={specialRequests}
                onChange={(e) => setSpecialRequests(e.target.value)}
                placeholder="Any special instructions for the kitchen? (e.g., extra spicy, no onions)"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
                rows={3}
                maxLength={200}
              />
              <p className="text-xs text-gray-500 mt-2">
                {specialRequests.length}/200 characters
              </p>
            </div>

            {/* Quantity and Add to Cart */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <span className="font-medium text-gray-700">Quantity:</span>
                <div className="flex items-center border border-gray-300 rounded-lg">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="p-2 hover:bg-gray-50 transition-colors"
                    disabled={quantity <= 1}
                  >
                    <Minus className="w-4 h-4 text-gray-600" />
                  </button>
                  <span className="px-4 py-2 font-medium">{quantity}</span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="p-2 hover:bg-gray-50 transition-colors"
                  >
                    <Plus className="w-4 h-4 text-gray-600" />
                  </button>
                </div>
              </div>
              
              <button
                onClick={handleAddToCart}
                className="bg-orange-600 hover:bg-orange-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
              >
                Add ₦{calculateTotalPrice().toLocaleString()}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}

export default MenuItemCustomizationModal