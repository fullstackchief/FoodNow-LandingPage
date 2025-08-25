'use client'

import { useRouter } from 'next/navigation'
import Navigation from '@/components/layout/Navigation'
import Footer from '@/components/layout/Footer'
import OptimizedImage from '@/components/ui/OptimizedImage'
import { motion } from 'framer-motion'
import { 
  Search, 
  TrendingUp, 
  Clock, 
  Star, 
  ChevronRight,
  Filter,
  Sparkles
} from 'lucide-react'
import { cn } from '@/lib/utils'

// Category data with beautiful images
const categories = [
  {
    id: 'nigerian',
    name: 'Nigerian',
    description: 'Traditional Nigerian cuisine',
    image: 'https://images.unsplash.com/photo-1596797038530-2c107229654b?w=800&h=600&fit=crop&auto=format',
    count: 156,
    color: 'from-green-500 to-emerald-600'
  },
  {
    id: 'fast-food',
    name: 'Fast Food',
    description: 'Quick bites & burgers',
    image: 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=800&h=600&fit=crop&auto=format',
    count: 89,
    color: 'from-red-500 to-orange-600'
  },
  {
    id: 'asian',
    name: 'Asian',
    description: 'Chinese, Japanese & more',
    image: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800&h=600&fit=crop&auto=format',
    count: 67,
    color: 'from-purple-500 to-pink-600'
  },
  {
    id: 'continental',
    name: 'Continental',
    description: 'European & American dishes',
    image: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=800&h=600&fit=crop&auto=format',
    count: 45,
    color: 'from-blue-500 to-indigo-600'
  },
  {
    id: 'healthy',
    name: 'Healthy',
    description: 'Salads & organic meals',
    image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&h=600&fit=crop&auto=format',
    count: 38,
    color: 'from-green-400 to-teal-600'
  },
  {
    id: 'desserts',
    name: 'Desserts',
    description: 'Sweet treats & pastries',
    image: 'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=800&h=600&fit=crop&auto=format',
    count: 42,
    color: 'from-pink-400 to-rose-600'
  },
  {
    id: 'drinks',
    name: 'Drinks',
    description: 'Beverages & smoothies',
    image: 'https://images.unsplash.com/photo-1553979459-d2229ba7433a?w=800&h=600&fit=crop&auto=format',
    count: 31,
    color: 'from-cyan-400 to-blue-600'
  },
  {
    id: 'seafood',
    name: 'Seafood',
    description: 'Fresh fish & ocean delights',
    image: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=800&h=600&fit=crop&auto=format',
    count: 28,
    color: 'from-blue-400 to-cyan-600'
  }
]

// Popular dishes data
const popularDishes = [
  {
    id: 1,
    name: 'Jollof Rice',
    image: 'https://images.unsplash.com/photo-1596797038530-2c107229654b?w=400&h=300&fit=crop&auto=format',
    orders: '2.3k+ orders today'
  },
  {
    id: 2,
    name: 'Pizza',
    image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400&h=300&fit=crop&auto=format',
    orders: '1.8k+ orders today'
  },
  {
    id: 3,
    name: 'Burgers',
    image: 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=400&h=300&fit=crop&auto=format',
    orders: '1.5k+ orders today'
  },
  {
    id: 4,
    name: 'Sushi',
    image: 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=400&h=300&fit=crop&auto=format',
    orders: '987 orders today'
  },
  {
    id: 5,
    name: 'Salads',
    image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=300&fit=crop&auto=format',
    orders: '756 orders today'
  },
  {
    id: 6,
    name: 'Pasta',
    image: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=400&h=300&fit=crop&auto=format',
    orders: '643 orders today'
  }
]

// Trending restaurants
const trendingRestaurants = [
  {
    id: 1,
    name: 'Lagos Jollof Palace',
    cuisine: 'Nigerian',
    rating: 4.8,
    deliveryTime: '15-25 min',
    image: 'https://images.unsplash.com/photo-1596797038530-2c107229654b?w=400&h=300&fit=crop&auto=format',
    badge: 'Top Rated'
  },
  {
    id: 2,
    name: 'Dragon Wok',
    cuisine: 'Asian',
    rating: 4.7,
    deliveryTime: '20-30 min',
    image: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400&h=300&fit=crop&auto=format',
    badge: 'New'
  },
  {
    id: 3,
    name: 'Pizza Paradise',
    cuisine: 'Italian',
    rating: 4.6,
    deliveryTime: '25-35 min',
    image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400&h=300&fit=crop&auto=format',
    badge: 'Popular'
  }
]

export default function ExplorePage() {
  const router = useRouter()

  const handleCategoryClick = (categoryId: string) => {
    router.push(`/browse?category=${categoryId}`)
  }

  const handleDishClick = (dishName: string) => {
    router.push(`/browse?q=${encodeURIComponent(dishName)}`)
  }

  return (
    <>
      <Navigation />
      
      <main className="min-h-screen bg-gray-50 pt-20">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-brand-500 to-brand-600 text-white py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center"
            >
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                Explore Delicious Food
              </h1>
              <p className="text-xl text-white/90 mb-8">
                Discover cuisines from around the world, delivered to your door
              </p>
              
              {/* Search Bar */}
              <div className="max-w-2xl mx-auto">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search for restaurants, dishes, or cuisines..."
                    className="w-full px-6 py-4 pr-12 rounded-full text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-4 focus:ring-white/30"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        const value = (e.target as HTMLInputElement).value
                        if (value) router.push(`/browse?q=${encodeURIComponent(value)}`)
                      }
                    }}
                  />
                  <button className="absolute right-2 top-1/2 -translate-y-1/2 p-3 bg-brand-600 text-white rounded-full hover:bg-brand-700 transition-colors">
                    <Search className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Categories Grid */}
        <section className="py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-bold text-gray-900">Browse by Category</h2>
              <button className="flex items-center space-x-2 text-brand-600 hover:text-brand-700">
                <span>View all</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {categories.map((category, index) => (
                <motion.div
                  key={category.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ scale: 1.05 }}
                  onClick={() => handleCategoryClick(category.id)}
                  className="cursor-pointer group"
                >
                  <div className="relative rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300">
                    <OptimizedImage
                      src={category.image}
                      alt={category.name}
                      width={400}
                      height={300}
                      className="w-full h-48 object-cover"
                    />
                    
                    {/* Gradient Overlay */}
                    <div className={cn(
                      "absolute inset-0 bg-gradient-to-t opacity-80 group-hover:opacity-90 transition-opacity",
                      category.color
                    )} />
                    
                    {/* Content */}
                    <div className="absolute inset-0 p-4 flex flex-col justify-end text-white">
                      <h3 className="text-xl font-bold mb-1">{category.name}</h3>
                      <p className="text-sm text-white/90 mb-2">{category.description}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-white/80">{category.count} restaurants</span>
                        <ChevronRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Popular Dishes */}
        <section className="py-12 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center space-x-2 mb-8">
              <TrendingUp className="w-6 h-6 text-brand-600" />
              <h2 className="text-3xl font-bold text-gray-900">Popular Right Now</h2>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {popularDishes.map((dish, index) => (
                <motion.div
                  key={dish.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => handleDishClick(dish.name)}
                  className="cursor-pointer group"
                >
                  <div className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-shadow">
                    <OptimizedImage
                      src={dish.image}
                      alt={dish.name}
                      width={200}
                      height={150}
                      className="w-full h-32 object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                    <div className="p-3">
                      <h4 className="font-semibold text-gray-900 mb-1">{dish.name}</h4>
                      <p className="text-xs text-gray-500">{dish.orders}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Trending Restaurants */}
        <section className="py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center space-x-2 mb-8">
              <Sparkles className="w-6 h-6 text-brand-600" />
              <h2 className="text-3xl font-bold text-gray-900">Trending Restaurants</h2>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {trendingRestaurants.map((restaurant, index) => (
                <motion.div
                  key={restaurant.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow cursor-pointer"
                  onClick={() => router.push(`/restaurant/${restaurant.id}`)}
                >
                  <div className="relative">
                    <OptimizedImage
                      src={restaurant.image}
                      alt={restaurant.name}
                      width={400}
                      height={200}
                      className="w-full h-48 object-cover"
                    />
                    <span className="absolute top-3 left-3 px-3 py-1 bg-brand-500 text-white text-xs font-semibold rounded-full">
                      {restaurant.badge}
                    </span>
                  </div>
                  
                  <div className="p-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">{restaurant.name}</h3>
                    <p className="text-sm text-gray-600 mb-3">{restaurant.cuisine}</p>
                    
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center space-x-1">
                        <Star className="w-4 h-4 text-yellow-400 fill-current" />
                        <span className="font-medium">{restaurant.rating}</span>
                      </div>
                      <div className="flex items-center space-x-1 text-gray-500">
                        <Clock className="w-4 h-4" />
                        <span>{restaurant.deliveryTime}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Quick Filters */}
        <section className="py-12 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center space-x-2 mb-8">
              <Filter className="w-6 h-6 text-brand-600" />
              <h2 className="text-3xl font-bold text-gray-900">Quick Filters</h2>
            </div>

            <div className="flex flex-wrap gap-3">
              {[
                { label: 'Free Delivery', icon: '🚚' },
                { label: 'New Restaurants', icon: '✨' },
                { label: 'Top Rated', icon: '⭐' },
                { label: 'Fast Delivery', icon: '⚡' },
                { label: 'Budget Friendly', icon: '💰' },
                { label: 'Open Now', icon: '🕐' },
                { label: 'Vegetarian', icon: '🥗' },
                { label: 'Offers', icon: '🎉' }
              ].map((filter) => (
                <button
                  key={filter.label}
                  onClick={() => router.push(`/browse?filter=${encodeURIComponent(filter.label.toLowerCase().replace(' ', '-'))}`)}
                  className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-brand-50 hover:text-brand-600 rounded-full transition-colors"
                >
                  <span>{filter.icon}</span>
                  <span className="font-medium">{filter.label}</span>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-gradient-to-r from-brand-500 to-brand-600">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold text-white mb-4">
              Can&apos;t find what you&apos;re looking for?
            </h2>
            <p className="text-xl text-white/90 mb-8">
              Browse all restaurants or use our advanced search
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => router.push('/browse')}
                className="px-8 py-3 bg-white text-brand-600 font-semibold rounded-full hover:bg-gray-100 transition-colors"
              >
                Browse All Restaurants
              </button>
              <button
                onClick={() => router.push('/browse?advanced=true')}
                className="px-8 py-3 bg-brand-700 text-white font-semibold rounded-full hover:bg-brand-800 transition-colors"
              >
                Advanced Search
              </button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  )
}