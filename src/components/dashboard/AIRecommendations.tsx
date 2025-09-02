'use client'

import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  SparklesIcon,
  ClockIcon,
  MapPinIcon,
  FireIcon,
  StarIcon,
  HeartIcon,
  ArrowRightIcon,
  SunIcon,
  MoonIcon
} from '@heroicons/react/24/outline'
import { useAuth } from '@/contexts/AuthContext'
import DashboardCard from '@/components/ui/DashboardCard'
import OptimizedImage from '@/components/ui/OptimizedImage'

interface RecommendationItem {
  id: string
  type: 'restaurant' | 'dish'
  title: string
  subtitle: string
  image: string
  price?: number
  rating?: number
  delivery_time?: string
  reason: string
  restaurant_name?: string
  href: string
  badge?: string
}

const AIRecommendations = () => {
  const { user } = useAuth()
  const [timeOfDay, setTimeOfDay] = useState<'morning' | 'afternoon' | 'evening'>('morning')
  const [recommendations, setRecommendations] = useState<RecommendationItem[]>([])

  useEffect(() => {
    const hour = new Date().getHours()
    if (hour < 12) setTimeOfDay('morning')
    else if (hour < 17) setTimeOfDay('afternoon')
    else setTimeOfDay('evening')

    // Generate smart recommendations based on user data and time
    generateRecommendations()
  }, [user])

  const generateRecommendations = () => {
    // This would normally call an AI service, but for now we'll use smart logic
    const userPreferences = user?.preferences as any
    const cuisinePrefs = userPreferences?.cuisine || []
    const spiceLevel = userPreferences?.spiceLevel || 'medium'
    
    const baseRecommendations: RecommendationItem[] = [
      {
        id: '1',
        type: 'dish',
        title: 'Special Jollof Rice',
        subtitle: '₦2,500 • Mama Cass Kitchen',
        image: '/images/food/jollof-rice-1.jpg',
        price: 2500,
        rating: 4.8,
        delivery_time: '25-30 min',
        reason: cuisinePrefs.includes('Nigerian') ? 'Based on your cuisine preference' : 'Popular in your area',
        restaurant_name: 'Mama Cass Kitchen',
        href: '/restaurant/550e8400-e29b-41d4-a716-446655440001',
        badge: spiceLevel === 'hot' ? 'Perfect Spice Level' : undefined
      },
      {
        id: '2',
        type: 'restaurant',
        title: 'Dragon Wok Chinese Kitchen',
        subtitle: 'Authentic Chinese • 4.7 ⭐',
        image: '/images/restaurants/dragon-wok.jpg',
        rating: 4.7,
        delivery_time: '30-40 min',
        reason: timeOfDay === 'evening' ? 'Perfect for dinner' : 'Highly rated',
        href: '/restaurant/550e8400-e29b-41d4-a716-446655440002',
        badge: 'New Menu Items'
      },
      {
        id: '3',
        type: 'dish',
        title: 'Mediterranean Power Bowl',
        subtitle: '₦3,800 • Green Bowl Healthy Kitchen',
        image: '/images/food/healthy-salad.jpg',
        price: 3800,
        rating: 4.5,
        delivery_time: '20-30 min',
        reason: userPreferences?.dietary?.includes('vegetarian') ? 'Matches your dietary needs' : 'Light and healthy',
        restaurant_name: 'Green Bowl Healthy Kitchen',
        href: '/restaurant/550e8400-e29b-41d4-a716-446655440005',
        badge: timeOfDay === 'morning' ? 'Perfect for Breakfast' : undefined
      }
    ]

    setRecommendations(baseRecommendations)
  }

  const timeBasedGreeting = {
    morning: { icon: <SunIcon className="w-5 h-5" />, text: 'Good Morning', color: 'text-yellow-600' },
    afternoon: { icon: <SunIcon className="w-5 h-5" />, text: 'Good Afternoon', color: 'text-orange-600' },
    evening: { icon: <MoonIcon className="w-5 h-5" />, text: 'Good Evening', color: 'text-indigo-600' }
  }

  const currentGreeting = timeBasedGreeting[timeOfDay]

  return (
    <div className="space-y-6">
      {/* Personalized Greeting */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-3xl p-6 text-white relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-white/10 via-transparent to-white/10 animate-pulse"></div>
        
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
              {currentGreeting.icon}
            </div>
            <div>
              <h2 className="text-xl font-bold">
                {currentGreeting.text}, {user?.first_name}!
              </h2>
              <p className="text-orange-100 text-sm">
                What would you like to eat today?
              </p>
            </div>
          </div>
          
          <Link href="/explore">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white px-4 py-2 rounded-xl font-medium transition-all duration-300 flex items-center space-x-2"
            >
              <span>Browse All</span>
              <ArrowRightIcon className="w-4 h-4" />
            </motion.button>
          </Link>
        </div>
      </motion.div>

      {/* Smart Recommendations */}
      <DashboardCard
        title="Recommended for You"
        subtitle="Powered by AI based on your preferences"
        icon={<SparklesIcon className="w-6 h-6 text-orange-600" />}
        variant="premium"
      >
        <div className="space-y-4">
          {recommendations.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Link href={item.href}>
                <motion.div
                  whileHover={{ scale: 1.02, x: 4 }}
                  whileTap={{ scale: 0.98 }}
                  className="group flex items-center space-x-4 p-4 rounded-2xl hover:bg-orange-50/50 transition-all duration-300 cursor-pointer border border-transparent hover:border-orange-200/50"
                >
                  {/* Image */}
                  <div className="relative flex-shrink-0">
                    <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-100">
                      <OptimizedImage
                        src={item.image}
                        alt={item.title}
                        width={64}
                        height={64}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                    </div>
                    {item.badge && (
                      <div className="absolute -top-2 -right-2 bg-orange-500 text-white text-xs px-2 py-0.5 rounded-full font-medium">
                        {item.badge}
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="min-w-0 flex-1">
                        <h4 className="font-semibold text-gray-900 truncate group-hover:text-orange-600 transition-colors">
                          {item.title}
                        </h4>
                        <p className="text-sm text-gray-600 mt-1">{item.subtitle}</p>
                        
                        {/* Meta Info */}
                        <div className="flex items-center space-x-4 mt-2">
                          {item.rating && (
                            <div className="flex items-center space-x-1">
                              <StarIcon className="w-3 h-3 text-yellow-400 fill-current" />
                              <span className="text-xs text-gray-500">{item.rating}</span>
                            </div>
                          )}
                          {item.delivery_time && (
                            <div className="flex items-center space-x-1">
                              <ClockIcon className="w-3 h-3 text-gray-400" />
                              <span className="text-xs text-gray-500">{item.delivery_time}</span>
                            </div>
                          )}
                        </div>

                        {/* AI Reason */}
                        <div className="flex items-center space-x-1 mt-2">
                          <SparklesIcon className="w-3 h-3 text-orange-500" />
                          <span className="text-xs text-orange-600 font-medium">{item.reason}</span>
                        </div>
                      </div>

                      {/* Price & Action */}
                      <div className="flex-shrink-0 text-right ml-4">
                        {item.price && (
                          <div className="text-lg font-bold text-gray-900 mb-1">
                            ₦{item.price.toLocaleString()}
                          </div>
                        )}
                        <motion.div
                          whileHover={{ x: 4 }}
                          className="text-orange-500 group-hover:text-orange-600"
                        >
                          <ArrowRightIcon className="w-4 h-4" />
                        </motion.div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </Link>
            </motion.div>
          ))}

          {/* View All Link */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="pt-4 border-t border-gray-100"
          >
            <Link
              href="/explore"
              className="flex items-center justify-center space-x-2 text-orange-600 hover:text-orange-700 font-medium transition-colors group"
            >
              <span>View All Restaurants</span>
              <motion.div
                whileHover={{ x: 4 }}
                transition={{ duration: 0.2 }}
              >
                <ArrowRightIcon className="w-4 h-4" />
              </motion.div>
            </Link>
          </motion.div>
        </div>
      </DashboardCard>
    </div>
  )
}

export default AIRecommendations