// Image utility functions for FoodNow
export interface ImageSource {
  url: string
  alt: string
  width?: number
  height?: number
}

// High-quality food placeholder images using Unsplash
export const foodImages = {
  // Restaurant categories
  nigerian: {
    jollofRice: 'https://images.unsplash.com/photo-1596797038530-2c107229654b?w=800&h=600&fit=crop&auto=format',
    pepperedChicken: 'https://images.unsplash.com/photo-1598103442097-8b74394b95c6?w=800&h=600&fit=crop&auto=format',
    friedRice: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=800&h=600&fit=crop&auto=format',
    suya: 'https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=800&h=600&fit=crop&auto=format',
    poundedYam: 'https://images.unsplash.com/photo-1596797038530-2c107229654b?w=800&h=600&fit=crop&auto=format'
  },
  
  // Fast food
  pizza: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&h=600&fit=crop&auto=format',
  burger: 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=800&h=600&fit=crop&auto=format',
  chicken: 'https://images.unsplash.com/photo-1562967914-608f82629710?w=800&h=600&fit=crop&auto=format',
  fries: 'https://images.unsplash.com/photo-1576107232684-1279f390859f?w=800&h=600&fit=crop&auto=format',
  
  // Healthy
  salad: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&h=600&fit=crop&auto=format',
  smoothie: 'https://images.unsplash.com/photo-1553979459-d2229ba7433a?w=800&h=600&fit=crop&auto=format',
  bowl: 'https://images.unsplash.com/photo-1546793665-c74683f339c1?w=800&h=600&fit=crop&auto=format',
  
  // Asian
  noodles: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800&h=600&fit=crop&auto=format',
  sushi: 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=800&h=600&fit=crop&auto=format',
  ramen: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800&h=600&fit=crop&auto=format',
  
  // Continental
  pasta: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=800&h=600&fit=crop&auto=format',
  steak: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=800&h=600&fit=crop&auto=format',
  salmon: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=800&h=600&fit=crop&auto=format'
}

// Restaurant placeholder images
export const restaurantImages = {
  nigerian: [
    'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&h=600&fit=crop&auto=format', // Restaurant interior
    'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&h=600&fit=crop&auto=format', // Modern restaurant
    'https://images.unsplash.com/photo-1592861956120-e524fc739696?w=800&h=600&fit=crop&auto=format'  // Cozy dining
  ],
  
  fastFood: [
    'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=800&h=600&fit=crop&auto=format', // Burger place
    'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&h=600&fit=crop&auto=format', // Pizza place
    'https://images.unsplash.com/photo-1562967914-608f82629710?w=800&h=600&fit=crop&auto=format'  // Chicken place
  ],
  
  healthy: [
    'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&h=600&fit=crop&auto=format', // Salad bar
    'https://images.unsplash.com/photo-1546793665-c74683f339c1?w=800&h=600&fit=crop&auto=format', // Healthy bowls
    'https://images.unsplash.com/photo-1553979459-d2229ba7433a?w=800&h=600&fit=crop&auto=format'  // Smoothie bar
  ],
  
  continental: [
    'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=800&h=600&fit=crop&auto=format', // Pasta restaurant
    'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=800&h=600&fit=crop&auto=format', // Fine dining
    'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=800&h=600&fit=crop&auto=format'  // Upscale dining
  ],
  
  asian: [
    'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800&h=600&fit=crop&auto=format', // Asian restaurant
    'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=800&h=600&fit=crop&auto=format', // Sushi bar
    'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&h=600&fit=crop&auto=format'  // Asian dining
  ]
}

// Category icons - beautiful food photography instead of emojis
export const categoryImages = {
  all: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=200&h=200&fit=crop&auto=format',
  nigerian: 'https://images.unsplash.com/photo-1596797038530-2c107229654b?w=200&h=200&fit=crop&auto=format',
  fastFood: 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=200&h=200&fit=crop&auto=format',
  healthy: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=200&h=200&fit=crop&auto=format',
  continental: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=200&h=200&fit=crop&auto=format',
  asian: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=200&h=200&fit=crop&auto=format'
}

// Get random restaurant image for a cuisine type
export function getRestaurantImage(cuisineType: string, index: number = 0): string {
  const cuisine = cuisineType.toLowerCase().replace(/\s+/g, '')
  const images = restaurantImages[cuisine as keyof typeof restaurantImages] || restaurantImages.nigerian
  return images[index % images.length]
}

// Get food image for a dish
export function getFoodImage(dishName: string): string {
  const dish = dishName.toLowerCase().replace(/\s+/g, '')
  
  // Map common dish names to images
  const dishMappings: Record<string, string> = {
    'jollof': foodImages.nigerian.jollofRice,
    'jollofrice': foodImages.nigerian.jollofRice,
    'friedrice': foodImages.nigerian.friedRice,
    'chicken': foodImages.nigerian.pepperedChicken,
    'suya': foodImages.nigerian.suya,
    'pizza': foodImages.pizza,
    'burger': foodImages.burger,
    'salad': foodImages.salad,
    'pasta': foodImages.pasta,
    'noodles': foodImages.noodles,
    'sushi': foodImages.sushi,
    'smoothie': foodImages.smoothie,
    'steak': foodImages.steak
  }
  
  // Try exact match first
  if (dishMappings[dish]) {
    return dishMappings[dish]
  }
  
  // Try partial matches
  for (const [key, image] of Object.entries(dishMappings)) {
    if (dish.includes(key) || key.includes(dish)) {
      return image
    }
  }
  
  // Default to a beautiful general food image
  return 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&h=600&fit=crop&auto=format'
}

// Get category image
export function getCategoryImage(category: string): string {
  const cat = category.toLowerCase().replace(/\s+/g, '')
  return categoryImages[cat as keyof typeof categoryImages] || categoryImages.all
}

// Image optimization utility
export function optimizeImage(url: string, width: number = 800, height: number = 600, quality: number = 80): string {
  if (url.includes('unsplash.com')) {
    return `${url}&w=${width}&h=${height}&q=${quality}&auto=format,compress`
  }
  return url
}

// Get placeholder with better loading
export function getImageWithFallback(primaryUrl: string, fallbackUrl?: string): ImageSource {
  return {
    url: primaryUrl,
    alt: 'Delicious food',
    width: 800,
    height: 600
  }
}