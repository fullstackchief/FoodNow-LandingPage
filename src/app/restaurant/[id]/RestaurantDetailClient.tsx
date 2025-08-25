'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { 
  ArrowLeftIcon,
  StarIcon,
  ClockIcon,
  MapPinIcon,
  HeartIcon,
  ShareIcon,
  PlusIcon,
  MinusIcon
} from '@heroicons/react/24/outline'
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid'
import Navigation from '@/components/layout/Navigation'
import { useCartRedux as useCart } from '@/hooks/useCartRedux'

interface RestaurantDetailClientProps {
  id: string
}

const RestaurantDetailClient = ({ id }: RestaurantDetailClientProps) => {
  const [selectedCategory, setSelectedCategory] = useState('Popular')
  const [isFavorite, setIsFavorite] = useState(false)
  const { addItem, getItemQuantity, updateQuantity, removeItem, getCartItemCount, getCartTotal } = useCart()

  // Mock restaurant data - in real app, would fetch based on id
  const restaurant = {
    id: id,
    name: 'Mama Cass Kitchen',
    image: '/api/placeholder/400/300',
    rating: 4.8,
    reviewCount: 847,
    deliveryTime: '25-35 min',
    deliveryFee: 500,
    minimumOrder: 2500,
    address: '23 Allen Avenue, Ikeja, Lagos',
    cuisine: 'Nigerian Cuisine',
    description: 'Authentic Nigerian dishes made with love and traditional recipes passed down through generations. We specialize in local delicacies with a modern twist.',
    isOpen: true,
    openingHours: '9:00 AM - 10:00 PM'
  }

  // Mock menu items
  const menuItems = [
    {
      id: '1',
      name: 'Jollof Rice Special',
      description: 'Our signature jollof rice with grilled chicken, plantain, and salad',
      price: 2500,
      image: '/api/placeholder/200/150',
      category: 'Rice Dishes',
      popular: true,
      preparationTime: 15
    },
    {
      id: '2',
      name: 'Egusi with Pounded Yam',
      description: 'Traditional egusi soup with assorted meat served with pounded yam',
      price: 3200,
      image: '/api/placeholder/200/150',
      category: 'Soup & Swallow',
      popular: true,
      preparationTime: 20
    },
    {
      id: '3',
      name: 'Pepper Soup',
      description: 'Spicy pepper soup with catfish and goat meat',
      price: 2800,
      image: '/api/placeholder/200/150',
      category: 'Soups',
      popular: false,
      preparationTime: 12
    },
    {
      id: '4',
      name: 'Grilled Chicken & Chips',
      description: 'Marinated grilled chicken with crispy chips and coleslaw',
      price: 3500,
      image: '/api/placeholder/200/150',
      category: 'Grilled',
      popular: true,
      preparationTime: 18
    },
    {
      id: '5',
      name: 'Chapman Cocktail',
      description: 'Refreshing non-alcoholic cocktail with cucumber and orange',
      price: 1200,
      image: '/api/placeholder/200/150',
      category: 'Beverages'
    }
  ]

  const filteredMenuItems = menuItems.filter(item => 
    selectedCategory === 'Popular' ? item.popular : item.category === selectedCategory
  )

  const restaurantInfo = {
    id: restaurant.id,
    name: restaurant.name,
    deliveryTime: restaurant.deliveryTime,
    deliveryFee: restaurant.deliveryFee,
    minimumOrder: restaurant.minimumOrder
  }

  const addToCart = (itemId: string) => {
    const item = menuItems.find(i => i.id === itemId)
    if (item) {
      addItem({
        id: item.id,
        name: item.name,
        price: item.price,
        restaurantId: restaurant.id,
        restaurantName: restaurant.name,
        image: item.image
      }, restaurantInfo)
    }
  }

  const removeFromCart = (itemId: string) => {
    const currentQuantity = getItemQuantity(itemId)
    if (currentQuantity > 1) {
      updateQuantity(itemId, currentQuantity - 1)
    } else {
      removeItem(itemId)
    }
  }

  const categories = ['Popular', 'Rice Dishes', 'Soup & Swallow', 'Grilled', 'Soups', 'Beverages']

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      {/* Back Button */}
      <div className="pt-20 pb-4 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link href="/browse" className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors">
            <ArrowLeftIcon className="w-5 h-5 mr-2" />
            <span>Back to restaurants</span>
          </Link>
        </div>
      </div>

      {/* Restaurant Header */}
      <section className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Restaurant Image */}
            <div className="lg:col-span-1">
              <div className="aspect-w-4 aspect-h-3 rounded-2xl overflow-hidden bg-gradient-to-br from-orange-100 to-orange-200">
                <div className="w-full h-64 flex items-center justify-center">
                  <span className="text-6xl">🍽️</span>
                </div>
              </div>
            </div>

            {/* Restaurant Details */}
            <div className="lg:col-span-2">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h1 className="text-4xl font-black text-gray-900 mb-2">{restaurant.name}</h1>
                  <p className="text-lg text-gray-600 mb-4">{restaurant.description}</p>
                  
                  <div className="flex items-center space-x-6 mb-4">
                    <div className="flex items-center space-x-1">
                      <StarIcon className="w-5 h-5 text-yellow-400 fill-current" />
                      <span className="font-semibold text-gray-900">{restaurant.rating}</span>
                      <span className="text-gray-600">({restaurant.reviewCount} reviews)</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <ClockIcon className="w-5 h-5 text-gray-400" />
                      <span className="text-gray-600">{restaurant.deliveryTime}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <MapPinIcon className="w-5 h-5 text-gray-400" />
                      <span className="text-gray-600 text-sm">{restaurant.address}</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-6 text-sm text-gray-600">
                    <span>Delivery: ₦{restaurant.deliveryFee.toLocaleString()}</span>
                    <span>Minimum: ₦{restaurant.minimumOrder.toLocaleString()}</span>
                    <span className={restaurant.isOpen ? 'text-green-600' : 'text-red-600'}>
                      {restaurant.isOpen ? 'Open' : 'Closed'} • {restaurant.openingHours}
                    </span>
                  </div>
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={() => setIsFavorite(!isFavorite)}
                    className={`p-3 rounded-full border-2 transition-all ${
                      isFavorite
                        ? 'border-red-500 bg-red-50'
                        : 'border-gray-300 hover:border-red-300'
                    }`}
                  >
                    {isFavorite ? (
                      <HeartSolidIcon className="w-6 h-6 text-red-500" />
                    ) : (
                      <HeartIcon className="w-6 h-6 text-gray-400" />
                    )}
                  </button>
                  <button className="p-3 border-2 border-gray-300 rounded-full hover:border-gray-400 transition-colors">
                    <ShareIcon className="w-6 h-6 text-gray-400" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Menu Section */}
      <section className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900">Menu</h2>
            {getCartItemCount() > 0 && (
              <Link
                href="/checkout"
                className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-full font-semibold transition-colors flex items-center space-x-2"
              >
                <span>View Cart ({getCartItemCount()})</span>
                <span>₦{getCartTotal().toLocaleString()}</span>
              </Link>
            )}
          </div>

          {/* Category Filters */}
          <div className="flex items-center space-x-4 mb-8 overflow-x-auto scrollbar-hide">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`whitespace-nowrap px-6 py-2 rounded-full font-medium transition-all ${
                  selectedCategory === category
                    ? 'bg-orange-500 text-white'
                    : 'bg-white text-gray-600 border border-gray-300 hover:border-orange-300'
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          {/* Menu Items Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMenuItems.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-3xl shadow-lg overflow-hidden"
              >
                <div className="aspect-w-16 aspect-h-10">
                  <div className="w-full h-48 bg-gradient-to-br from-orange-100 to-orange-200 flex items-center justify-center">
                    <span className="text-4xl">🍽️</span>
                  </div>
                </div>
                
                <div className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-lg font-bold text-gray-900">{item.name}</h3>
                    {item.popular && (
                      <span className="bg-orange-100 text-orange-600 text-xs font-semibold px-2 py-1 rounded-full">
                        Popular
                      </span>
                    )}
                  </div>
                  
                  <p className="text-gray-600 text-sm mb-4 leading-relaxed">{item.description}</p>
                  
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-2xl font-bold text-gray-900">₦{item.price?.toLocaleString()}</span>
                    {item.preparationTime && (
                      <div className="flex items-center space-x-1 text-gray-500">
                        <ClockIcon className="w-4 h-4" />
                        <span className="text-sm">{item.preparationTime} min</span>
                      </div>
                    )}
                  </div>

                  {/* Add to Cart Controls */}
                  <div className="flex items-center justify-between">
                    {getItemQuantity(item.id) > 0 ? (
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center hover:bg-orange-600 transition-colors"
                        >
                          <MinusIcon className="w-4 h-4" />
                        </button>
                        <span className="font-semibold text-lg">{getItemQuantity(item.id)}</span>
                        <button
                          onClick={() => addToCart(item.id)}
                          className="w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center hover:bg-orange-600 transition-colors"
                        >
                          <PlusIcon className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => addToCart(item.id)}
                        className="flex items-center space-x-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-full font-medium transition-colors"
                      >
                        <PlusIcon className="w-4 h-4" />
                        <span>Add to Cart</span>
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Floating Cart Button for Mobile */}
      {getCartItemCount() > 0 && (
        <div className="fixed bottom-6 right-6 lg:hidden">
          <Link
            href="/checkout"
            className="bg-orange-500 hover:bg-orange-600 text-white p-4 rounded-full shadow-lg flex items-center space-x-2"
          >
            <span className="font-semibold">Cart ({getCartItemCount()})</span>
          </Link>
        </div>
      )}
    </div>
  )
}

export default RestaurantDetailClient