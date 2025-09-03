'use client'

import { motion } from 'framer-motion'
import { StarIcon, ClockIcon, MapPinIcon } from '@heroicons/react/24/solid'
import { useState } from 'react'
import { FEATURED_RESTAURANTS_DATA } from '@/constants/featured-restaurants-data'
import Button from '@/components/ui/Button'

const FeaturedRestaurants = () => {
  const [hoveredCard, setHoveredCard] = useState<number | null>(null)
  
  // Use real seeded data from database instead of mock data
  const restaurants = FEATURED_RESTAURANTS_DATA

  const handleCardClick = (restaurantId: string) => {
    window.location.href = `/restaurant/${restaurantId}`
  }

  return (
    <section className="py-20 bg-gradient-to-b from-white to-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center space-x-2 bg-orange-100 px-4 py-2 rounded-full mb-4">
            <span className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></span>
            <span className="text-sm font-semibold text-orange-700">Premium Partners</span>
          </div>
          
          <h2 className="text-4xl lg:text-6xl font-black text-gray-900 mb-4">
            Lagos&apos; <span className="bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">Premium</span>
            <br />Restaurants
          </h2>
          
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Discover the finest dining experiences Lagos has to offer, 
            delivered fresh to your doorstep in minutes.
          </p>
        </motion.div>

        {/* Restaurant Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {restaurants.map((restaurant, index) => (
            <motion.div
              key={restaurant.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
              onClick={() => handleCardClick(restaurant.id)}
              onHoverStart={() => setHoveredCard(index)}
              onHoverEnd={() => setHoveredCard(null)}
              className="group cursor-pointer"
            >
              <motion.div
                whileHover={{ y: -10, scale: 1.02 }}
                transition={{ type: "spring", stiffness: 300 }}
                className={`relative bg-white/80 backdrop-blur-sm rounded-3xl p-6 shadow-xl border border-white/50 overflow-hidden transition-all duration-300 ${
                  hoveredCard === index ? 'shadow-2xl shadow-orange-500/20' : ''
                }`}
              >
                {/* Glow Effect on Hover */}
                <div className={`absolute inset-0 bg-gradient-to-br ${restaurant.bgGradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300 rounded-3xl`} />
                
                {/* Restaurant Image/Emoji */}
                <div className="relative mb-4">
                  <div className={`w-20 h-20 bg-gradient-to-br ${restaurant.bgGradient} rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                    <span className="text-4xl">{restaurant.image}</span>
                  </div>
                  
                  {/* Rating Badge */}
                  <div className="absolute top-0 right-0 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1 flex items-center space-x-1 shadow-lg">
                    <StarIcon className="w-4 h-4 text-yellow-500" />
                    <span className="text-sm font-bold text-gray-800">{restaurant.rating}</span>
                  </div>
                </div>

                {/* Restaurant Info */}
                <div className="space-y-3">
                  <h3 className="text-xl font-bold text-gray-900 group-hover:text-orange-600 transition-colors">
                    {restaurant.name}
                  </h3>
                  
                  <p className="text-sm font-medium text-gray-600">
                    {restaurant.cuisine}
                  </p>
                  
                  <p className="text-sm text-orange-600 font-semibold">
                    {restaurant.specialty}
                  </p>
                  
                  {/* Delivery Info */}
                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <div className="flex items-center space-x-1 text-gray-500">
                      <ClockIcon className="w-4 h-4" />
                      <span className="text-xs">{restaurant.deliveryTime}</span>
                    </div>
                    
                    <div className="flex items-center space-x-1 text-gray-500">
                      <MapPinIcon className="w-4 h-4" />
                      <span className="text-xs">{restaurant.location}</span>
                    </div>
                  </div>
                </div>

                {/* Hover Overlay */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: hoveredCard === index ? 1 : 0 }}
                  className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent rounded-3xl flex items-center justify-center"
                >
                  <div className="bg-white/90 backdrop-blur-sm rounded-full px-6 py-2 shadow-lg">
                    <span className="text-sm font-bold text-orange-600">Order Now →</span>
                  </div>
                </motion.div>
              </motion.div>
            </motion.div>
          ))}
        </div>

        {/* View All Button */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          viewport={{ once: true }}
          className="text-center mt-16"
        >
          <Button 
            onClick={() => window.location.href = '/explore'}
            theme="customer"
            variant="primary"
            size="lg"
            className="rounded-full shadow-xl shadow-orange-500/30 hover:shadow-2xl hover:shadow-orange-500/40 group"
          >
            <span className="mr-2">View All Restaurants</span>
            <span className="inline-block group-hover:translate-x-1 transition-transform">→</span>
          </Button>
        </motion.div>
      </div>
    </section>
  )
}

export default FeaturedRestaurants