'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { Heart, Star, Clock, MapPin } from 'lucide-react'
import { cn } from '@/lib/utils'
import OptimizedImage from '@/components/ui/OptimizedImage'
import { Restaurant } from '@/types'

interface RestaurantCardProps {
  restaurant: Restaurant
  isFavorite?: boolean
  onToggleFavorite?: () => void
  viewMode?: 'grid' | 'list'
  delay?: number
  className?: string
}

export default function RestaurantCard({
  restaurant,
  isFavorite = false,
  onToggleFavorite,
  viewMode = 'grid',
  delay = 0,
  className
}: RestaurantCardProps) {
  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onToggleFavorite?.()
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className={cn(
        "bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group",
        viewMode === 'list' && "flex",
        className
      )}
    >
      <Link href={`/restaurant/${restaurant.id}`} className="block">
        <div className={cn(
          "relative",
          viewMode === 'list' ? "w-48 h-32" : "h-48"
        )}>
          <OptimizedImage
            src={restaurant.image_url || '/images/restaurants/default.jpg'}
            alt={restaurant.name}
            width={400}
            height={200}
            className="object-cover group-hover:scale-105 transition-transform duration-300 w-full h-full"
          />
          
          {/* Favorite button */}
          <button
            onClick={handleFavoriteClick}
            className={cn(
              "absolute top-3 right-3 p-2 rounded-full transition-colors",
              isFavorite 
                ? "bg-red-500 text-white" 
                : "bg-white/80 text-gray-600 hover:bg-white hover:text-red-500"
            )}
          >
            <Heart className={cn(
              "h-4 w-4",
              isFavorite && "fill-current"
            )} />
          </button>

          {/* Status badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-1">
            {!restaurant.is_open && (
              <span className="bg-red-500 text-white px-2 py-1 rounded text-xs font-medium">
                Closed
              </span>
            )}
            
            {restaurant.promotions && (
              <span className="bg-orange-500 text-white px-2 py-1 rounded text-xs font-medium">
                Promo
              </span>
            )}
          </div>
        </div>

        <div className={cn(
          "p-4",
          viewMode === 'list' && "flex-1"
        )}>
          <div className="flex items-start justify-between mb-2">
            <h3 className="font-semibold text-lg text-gray-900 group-hover:text-orange-600 transition-colors line-clamp-1">
              {restaurant.name}
            </h3>
            <div className="flex items-center gap-1 text-sm font-medium text-gray-900">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              {restaurant.rating.toFixed(1)}
            </div>
          </div>

          <p className="text-gray-600 text-sm mb-3 line-clamp-2">
            {restaurant.description}
          </p>

          <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {restaurant.delivery_time}
              </div>
              
              <div className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                ₦{restaurant.delivery_fee} delivery
              </div>
            </div>
            
            <span className="font-medium text-gray-900">
              {restaurant.price_range}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex flex-wrap gap-1">
              {restaurant.cuisine_types.slice(0, 2).map((cuisine, index) => (
                <span
                  key={index}
                  className="bg-orange-100 text-orange-800 px-2 py-1 rounded text-xs font-medium"
                >
                  {cuisine}
                </span>
              ))}
              {restaurant.cuisine_types.length > 2 && (
                <span className="text-gray-500 text-xs">
                  +{restaurant.cuisine_types.length - 2} more
                </span>
              )}
            </div>

            <div className="text-xs text-gray-500">
              {restaurant.review_count} reviews
            </div>
          </div>

          {restaurant.features && restaurant.features.length > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              <div className="flex flex-wrap gap-1">
                {restaurant.features.slice(0, 3).map((feature, index) => (
                  <span
                    key={index}
                    className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs"
                  >
                    {feature}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </Link>
    </motion.div>
  )
}