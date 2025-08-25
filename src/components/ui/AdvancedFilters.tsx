'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  SlidersHorizontal, 
  X, 
  ChevronDown, 
  Star, 
  Clock, 
  DollarSign,
  Utensils,
  Leaf,
  Zap,
  Heart,
  Award,
  MapPin
} from 'lucide-react'
import { cn } from '@/lib/utils'

export interface AdvancedFiltersState {
  cuisine: string[]
  priceRange: string[]
  rating: number
  deliveryTime: number
  dietary: string[]
  features: string[]
  distance: number
  sortBy: string
  offers: string[]
}

interface FilterSection {
  id: string
  title: string
  icon: React.ReactNode
  options: Array<{
    id: string
    label: string
    count?: number
    icon?: React.ReactNode
  }>
  type: 'checkbox' | 'radio' | 'range'
  multiple?: boolean
}

interface AdvancedFiltersProps {
  isOpen: boolean
  onClose: () => void
  filters: AdvancedFiltersState
  onFiltersChange: (filters: AdvancedFiltersState) => void
  onApply: () => void
  onClear: () => void
  restaurantCount?: number
}

const filterSections: FilterSection[] = [
  {
    id: 'cuisine',
    title: 'Cuisine Type',
    icon: <Utensils className="w-5 h-5" />,
    type: 'checkbox',
    multiple: true,
    options: [
      { id: 'nigerian', label: 'Nigerian', count: 156, icon: <span>🇳🇬</span> },
      { id: 'chinese', label: 'Chinese', count: 89, icon: <span>🇨🇳</span> },
      { id: 'italian', label: 'Italian', count: 67, icon: <span>🇮🇹</span> },
      { id: 'american', label: 'American', count: 54, icon: <span>🇺🇸</span> },
      { id: 'indian', label: 'Indian', count: 43, icon: <span>🇮🇳</span> },
      { id: 'french', label: 'French', count: 31, icon: <span>🇫🇷</span> },
      { id: 'japanese', label: 'Japanese', count: 28, icon: <span>🇯🇵</span> },
      { id: 'mexican', label: 'Mexican', count: 24, icon: <span>🇲🇽</span> },
      { id: 'thai', label: 'Thai', count: 19, icon: <span>🇹🇭</span> },
      { id: 'mediterranean', label: 'Mediterranean', count: 16, icon: <span>🌊</span> }
    ]
  },
  {
    id: 'priceRange',
    title: 'Price Range',
    icon: <DollarSign className="w-5 h-5" />,
    type: 'radio',
    options: [
      { id: '$', label: '₦ - Budget Friendly', icon: <span>💰</span> },
      { id: '$$', label: '₦₦ - Moderate', icon: <span>💰💰</span> },
      { id: '$$$', label: '₦₦₦ - Expensive', icon: <span>💰💰💰</span> },
      { id: '$$$$', label: '₦₦₦₦ - Fine Dining', icon: <span>💎</span> }
    ]
  },
  {
    id: 'deliveryTime',
    title: 'Delivery Time',
    icon: <Clock className="w-5 h-5" />,
    type: 'radio',
    options: [
      { id: '15', label: 'Under 15 min', icon: <Zap className="w-4 h-4 text-green-500" /> },
      { id: '30', label: 'Under 30 min', icon: <Clock className="w-4 h-4 text-blue-500" /> },
      { id: '45', label: 'Under 45 min', icon: <Clock className="w-4 h-4 text-yellow-500" /> },
      { id: '60', label: 'Under 1 hour', icon: <Clock className="w-4 h-4 text-orange-500" /> }
    ]
  },
  {
    id: 'dietary',
    title: 'Dietary Options',
    icon: <Leaf className="w-5 h-5" />,
    type: 'checkbox',
    multiple: true,
    options: [
      { id: 'vegetarian', label: 'Vegetarian', icon: <span>🥬</span> },
      { id: 'vegan', label: 'Vegan', icon: <span>🌱</span> },
      { id: 'halal', label: 'Halal', icon: <span>☪️</span> },
      { id: 'kosher', label: 'Kosher', icon: <span>✡️</span> },
      { id: 'gluten-free', label: 'Gluten Free', icon: <span>🌾</span> },
      { id: 'keto', label: 'Keto Friendly', icon: <span>🥑</span> },
      { id: 'low-carb', label: 'Low Carb', icon: <span>🥒</span> },
      { id: 'diabetic', label: 'Diabetic Friendly', icon: <span>💚</span> }
    ]
  },
  {
    id: 'features',
    title: 'Restaurant Features',
    icon: <Award className="w-5 h-5" />,
    type: 'checkbox',
    multiple: true,
    options: [
      { id: 'pickup', label: 'Pickup Available', icon: <span>🚶</span> },
      { id: 'dine-in', label: 'Dine-in Available', icon: <span>🪑</span> },
      { id: 'outdoor', label: 'Outdoor Seating', icon: <span>🌤️</span> },
      { id: 'parking', label: 'Parking Available', icon: <span>🅿️</span> },
      { id: 'wifi', label: 'Free WiFi', icon: <span>📶</span> },
      { id: 'family', label: 'Family Friendly', icon: <span>👨‍👩‍👧‍👦</span> },
      { id: 'romantic', label: 'Romantic Setting', icon: <span>💕</span> },
      { id: 'business', label: 'Business Meetings', icon: <span>💼</span> }
    ]
  },
  {
    id: 'offers',
    title: 'Offers & Promotions',
    icon: <Heart className="w-5 h-5" />,
    type: 'checkbox',
    multiple: true,
    options: [
      { id: 'free-delivery', label: 'Free Delivery', icon: <span>🚚</span> },
      { id: 'discount', label: 'Discount Available', icon: <span>🏷️</span> },
      { id: 'new-customer', label: 'New Customer Offer', icon: <span>🎁</span> },
      { id: 'loyalty', label: 'Loyalty Rewards', icon: <span>⭐</span> },
      { id: 'bulk-order', label: 'Bulk Order Discount', icon: <span>📦</span> },
      { id: 'happy-hour', label: 'Happy Hour', icon: <span>🍹</span> }
    ]
  }
]

const ratingOptions = [
  { value: 0, label: 'Any Rating' },
  { value: 3.5, label: '3.5+ Stars' },
  { value: 4.0, label: '4.0+ Stars' },
  { value: 4.5, label: '4.5+ Stars' },
  { value: 4.8, label: '4.8+ Stars (Premium)' }
]

const sortOptions = [
  { id: 'popular', label: 'Most Popular' },
  { id: 'rating', label: 'Highest Rated' },
  { id: 'deliveryTime', label: 'Fastest Delivery' },
  { id: 'distance', label: 'Nearest First' },
  { id: 'priceAsc', label: 'Price: Low to High' },
  { id: 'priceDesc', label: 'Price: High to Low' },
  { id: 'newest', label: 'Newest First' },
  { id: 'offers', label: 'Best Offers' }
]

export default function AdvancedFilters({
  isOpen,
  onClose,
  filters,
  onFiltersChange,
  onApply,
  onClear,
  restaurantCount = 0
}: AdvancedFiltersProps) {
  const [expandedSections, setExpandedSections] = useState<string[]>(['cuisine', 'priceRange'])

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => 
      prev.includes(sectionId) 
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    )
  }

  const handleFilterChange = (sectionId: string, optionId: string, checked: boolean) => {
    const section = filterSections.find(s => s.id === sectionId)
    if (!section) return

    const newFilters = { ...filters }

    if (section.type === 'checkbox' && section.multiple) {
      const currentValues = (newFilters as any)[sectionId] || []
      if (checked) {
        newFilters[sectionId as keyof AdvancedFiltersState] = [...currentValues, optionId] as any
      } else {
        newFilters[sectionId as keyof AdvancedFiltersState] = currentValues.filter((id: string) => id !== optionId) as any
      }
    } else if (section.type === 'radio') {
      if (sectionId === 'deliveryTime') {
        newFilters.deliveryTime = checked ? Number(optionId) : 0
      } else {
        newFilters[sectionId as keyof AdvancedFiltersState] = checked ? [optionId] : [] as any
      }
    }

    onFiltersChange(newFilters)
  }

  const handleRatingChange = (rating: number) => {
    onFiltersChange({ ...filters, rating })
  }

  const handleSortChange = (sortBy: string) => {
    onFiltersChange({ ...filters, sortBy })
  }

  const handleDistanceChange = (distance: number) => {
    onFiltersChange({ ...filters, distance })
  }

  const activeFiltersCount = 
    filters.cuisine.length + 
    filters.priceRange.length + 
    filters.dietary.length + 
    filters.features.length + 
    filters.offers.length +
    (filters.rating > 0 ? 1 : 0) +
    (filters.deliveryTime > 0 ? 1 : 0) +
    (filters.distance > 0 ? 1 : 0)

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
            className="fixed inset-0 bg-black/50 z-50 lg:hidden"
          />

          {/* Filter Panel */}
          <motion.div
            initial={{ x: -400, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -400, opacity: 0 }}
            className={cn(
              "fixed top-0 left-0 h-full bg-white shadow-2xl z-50 overflow-y-auto",
              "lg:relative lg:top-auto lg:left-auto lg:shadow-lg lg:rounded-xl",
              "w-80 lg:w-96"
            )}
          >
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <SlidersHorizontal className="w-5 h-5 text-brand-600" />
                <h3 className="text-lg font-semibold">Advanced Filters</h3>
                {activeFiltersCount > 0 && (
                  <span className="bg-brand-100 text-brand-800 text-xs font-bold px-2 py-1 rounded-full">
                    {activeFiltersCount}
                  </span>
                )}
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg lg:hidden"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-6">
              {/* Sort Options */}
              <div className="space-y-3">
                <h4 className="font-medium flex items-center space-x-2">
                  <Award className="w-4 h-4 text-brand-600" />
                  <span>Sort By</span>
                </h4>
                <select
                  value={filters.sortBy}
                  onChange={(e) => handleSortChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                >
                  {sortOptions.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Rating Filter */}
              <div className="space-y-3">
                <h4 className="font-medium flex items-center space-x-2">
                  <Star className="w-4 h-4 text-yellow-500" />
                  <span>Minimum Rating</span>
                </h4>
                <div className="space-y-2">
                  {ratingOptions.map((option) => (
                    <label key={option.value} className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="radio"
                        name="rating"
                        checked={filters.rating === option.value}
                        onChange={() => handleRatingChange(option.value)}
                        className="text-brand-600 focus:ring-brand-500"
                      />
                      <div className="flex items-center space-x-1">
                        {option.value > 0 && (
                          <div className="flex">
                            {[...Array(5)].map((_, i) => (
                              <Star 
                                key={i} 
                                className={cn(
                                  "w-3 h-3",
                                  i < Math.floor(option.value) 
                                    ? "text-yellow-400 fill-current" 
                                    : "text-gray-300"
                                )} 
                              />
                            ))}
                          </div>
                        )}
                        <span className="text-sm">{option.label}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Distance Filter */}
              <div className="space-y-3">
                <h4 className="font-medium flex items-center space-x-2">
                  <MapPin className="w-4 h-4 text-brand-600" />
                  <span>Distance</span>
                </h4>
                <div className="space-y-2">
                  <input
                    type="range"
                    min={0}
                    max={25}
                    step={5}
                    value={filters.distance}
                    onChange={(e) => handleDistanceChange(Number(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Any distance</span>
                    <span>{filters.distance > 0 ? `${filters.distance}km` : 'Any'}</span>
                  </div>
                </div>
              </div>

              {/* Filter Sections */}
              {filterSections.map((section) => (
                <div key={section.id} className="border border-gray-200 rounded-lg">
                  <button
                    onClick={() => toggleSection(section.id)}
                    className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50"
                  >
                    <div className="flex items-center space-x-3">
                      {section.icon}
                      <span className="font-medium">{section.title}</span>
                      {(filters as any)[section.id]?.length > 0 && (
                        <span className="bg-brand-100 text-brand-800 text-xs font-bold px-2 py-1 rounded-full">
                          {(filters as any)[section.id].length}
                        </span>
                      )}
                    </div>
                    <ChevronDown 
                      className={cn(
                        "w-4 h-4 transition-transform",
                        expandedSections.includes(section.id) ? "rotate-180" : ""
                      )} 
                    />
                  </button>
                  
                  <AnimatePresence>
                    {expandedSections.includes(section.id) && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="border-t border-gray-200"
                      >
                        <div className="p-4 space-y-2 max-h-64 overflow-y-auto">
                          {section.options.map((option) => {
                            const isChecked = section.type === 'radio' 
                              ? (filters as any)[section.id]?.includes(option.id) || 
                                (section.id === 'deliveryTime' && filters.deliveryTime === Number(option.id))
                              : (filters as any)[section.id]?.includes(option.id)

                            return (
                              <label 
                                key={option.id} 
                                className="flex items-center space-x-3 cursor-pointer hover:bg-gray-50 p-2 rounded"
                              >
                                <input
                                  type={section.type === 'radio' ? 'radio' : 'checkbox'}
                                  name={section.type === 'radio' ? section.id : undefined}
                                  checked={isChecked}
                                  onChange={(e) => handleFilterChange(section.id, option.id, e.target.checked)}
                                  className="text-brand-600 focus:ring-brand-500"
                                />
                                <div className="flex items-center space-x-2 flex-1">
                                  {option.icon}
                                  <span className="text-sm">{option.label}</span>
                                  {option.count && (
                                    <span className="text-xs text-gray-500">({option.count})</span>
                                  )}
                                </div>
                              </label>
                            )
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 space-y-3">
              <div className="text-sm text-gray-600 text-center">
                {restaurantCount} restaurants match your filters
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={onClear}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Clear All
                </button>
                <button
                  onClick={onApply}
                  className="flex-1 px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors font-medium"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}