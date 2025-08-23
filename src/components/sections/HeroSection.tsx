'use client'

import { motion } from 'framer-motion'
import { ChevronRightIcon, ArrowDownIcon } from '@heroicons/react/24/solid'
import { SparklesIcon, MapPinIcon, UsersIcon } from '@heroicons/react/24/outline'

const HeroSection = () => {
  const serviceAreas = ['Isolo', 'Surulere', 'Ipaja', 'Ikeja', 'Yaba']
  
  const floatingFoods = [
    { emoji: '🍛', name: 'Jollof Rice', delay: 0, x: '85%', y: '15%' },
    { emoji: '🥘', name: 'Egusi Soup', delay: 2, x: '90%', y: '45%' },
    { emoji: '🍖', name: 'Suya', delay: 1, x: '75%', y: '70%' },
    { emoji: '🍲', name: 'Pepper Soup', delay: 3, x: '95%', y: '30%' },
  ]

  return (
    <section className="relative min-h-screen overflow-hidden">
      {/* Premium Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-orange-50 via-white to-orange-50/30"></div>
      
      {/* Curved Bottom Shape */}
      <div className="absolute bottom-0 left-0 right-0 h-32">
        <svg className="absolute bottom-0 w-full h-32" viewBox="0 0 1440 120" preserveAspectRatio="none">
          <path 
            d="M0,32 C480,128 960,128 1440,32 L1440,120 L0,120 Z" 
            fill="white"
            className="fill-white"
          />
        </svg>
      </div>

      {/* Decorative Circles */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-orange-200/20 rounded-full blur-3xl"></div>
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-green-200/20 rounded-full blur-3xl"></div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center min-h-[80vh]">
          
          {/* Left Content */}
          <motion.div className="space-y-8 z-10">
            {/* Premium Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center space-x-2 bg-gradient-to-r from-orange-100 to-yellow-100 px-5 py-2 rounded-full border border-orange-200"
            >
              <SparklesIcon className="w-5 h-5 text-orange-600" />
              <span className="text-sm font-semibold text-orange-700">Nigeria&apos;s #1 Food Delivery</span>
            </motion.div>

            {/* Main Headline */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.8 }}
              className="space-y-4"
            >
              <h1 className="text-5xl sm:text-6xl lg:text-8xl font-black leading-tight">
                <span className="bg-gradient-to-r from-orange-600 via-orange-500 to-yellow-500 bg-clip-text text-transparent">
                  FoodNow
                </span>
              </h1>
              <h2 className="text-2xl sm:text-3xl lg:text-5xl font-bold text-gray-800">
                Premium Food Delivery
                <span className="block text-xl sm:text-2xl lg:text-4xl mt-2 text-gray-700">in Lagos</span>
              </h2>
              <p className="text-lg lg:text-xl text-gray-600 max-w-lg leading-relaxed">
                Get your favorite Nigerian dishes delivered hot and fresh in just 
                <span className="font-bold text-orange-600"> 30 minutes</span>. 
                From local delicacies to continental cuisines.
              </p>
            </motion.div>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.8 }}
              className="flex flex-col sm:flex-row gap-4"
            >
              <button className="group relative bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold text-lg py-4 px-10 rounded-full transition-all duration-300 transform hover:scale-105 shadow-xl shadow-orange-500/30 hover:shadow-2xl hover:shadow-orange-500/40 flex items-center justify-center space-x-2">
                <span>Order Now</span>
                <ChevronRightIcon className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              
              <button className="group border-2 border-gray-300 text-gray-700 hover:border-orange-500 hover:text-orange-600 font-bold text-lg py-4 px-10 rounded-full transition-all duration-300 transform hover:scale-105 flex items-center justify-center space-x-2">
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                </svg>
                <span>Download App</span>
              </button>
            </motion.div>

            {/* Service Areas */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.8 }}
              className="flex items-center space-x-4"
            >
              <div className="flex items-center space-x-2 text-gray-600">
                <MapPinIcon className="w-5 h-5 text-orange-500" />
                <span className="text-sm font-medium">Delivering to:</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {serviceAreas.map((area, _index) => (
                  <span 
                    key={area}
                    className="text-xs font-semibold text-gray-700 bg-white/80 backdrop-blur-sm px-3 py-1 rounded-full border border-gray-200"
                  >
                    {area}
                  </span>
                ))}
              </div>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.8 }}
              className="flex gap-8 pt-8"
            >
              <div className="space-y-1">
                <div className="text-3xl font-black text-orange-600">10,000+</div>
                <div className="text-sm text-gray-600">Happy Customers</div>
              </div>
              <div className="space-y-1">
                <div className="text-3xl font-black text-green-600">50+</div>
                <div className="text-sm text-gray-600">Restaurant Partners</div>
              </div>
              <div className="space-y-1">
                <div className="text-3xl font-black text-blue-600">4.9★</div>
                <div className="text-sm text-gray-600">App Rating</div>
              </div>
            </motion.div>
          </motion.div>

          {/* Right Side - Phone Mockup & Food */}
          <motion.div
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4, duration: 1 }}
            className="relative lg:h-[600px]"
          >
            {/* Floating Food Items */}
            {floatingFoods.map((food, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ 
                  opacity: 1, 
                  scale: 1,
                  y: [0, -20, 0],
                }}
                transition={{
                  delay: food.delay,
                  duration: 1,
                  y: {
                    duration: 3,
                    repeat: Infinity,
                    ease: 'easeInOut',
                    delay: food.delay,
                  }
                }}
                className="absolute hidden lg:block"
                style={{ left: food.x, top: food.y }}
              >
                <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-3 shadow-xl border border-white/50">
                  <span className="text-4xl">{food.emoji}</span>
                  <p className="text-xs font-semibold text-gray-700 mt-1">{food.name}</p>
                </div>
              </motion.div>
            ))}

            {/* Phone Mockup */}
            <div className="relative mx-auto w-72 lg:w-80">
              {/* Glow Effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-orange-400 to-orange-600 rounded-[3rem] blur-2xl opacity-30"></div>
              
              {/* Phone Frame */}
              <div className="relative bg-gradient-to-br from-gray-900 to-gray-800 rounded-[3rem] p-2 shadow-2xl">
                <div className="bg-white rounded-[2.8rem] overflow-hidden">
                  {/* Phone Screen */}
                  <div className="relative h-[600px] bg-gradient-to-b from-orange-50 to-white">
                    {/* Status Bar */}
                    <div className="flex justify-between items-center px-6 py-3 text-xs">
                      <span className="font-semibold">9:41</span>
                      <div className="flex space-x-1">
                        <div className="w-4 h-3 bg-gray-800 rounded-sm"></div>
                        <div className="w-4 h-3 bg-gray-800 rounded-sm"></div>
                        <div className="w-4 h-3 bg-green-500 rounded-sm"></div>
                      </div>
                    </div>

                    {/* App Content */}
                    <div className="px-6 space-y-4">
                      {/* Header */}
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-2xl font-bold text-gray-800">Good Evening! 👋</h3>
                          <p className="text-gray-600">What are you craving today?</p>
                        </div>
                        <div className="w-12 h-12 bg-orange-100 rounded-2xl flex items-center justify-center">
                          <span className="text-2xl">🔔</span>
                        </div>
                      </div>

                      {/* Search */}
                      <div className="bg-gray-100 rounded-2xl p-4 flex items-center space-x-3">
                        <span className="text-gray-400">🔍</span>
                        <span className="text-gray-500">Search &quot;Jollof rice&quot;</span>
                      </div>

                      {/* Categories */}
                      <div className="flex gap-3 overflow-x-auto pb-2">
                        <div className="bg-orange-500 text-white px-4 py-2 rounded-xl font-semibold whitespace-nowrap">
                          🍚 Nigerian
                        </div>
                        <div className="bg-gray-100 px-4 py-2 rounded-xl font-semibold whitespace-nowrap">
                          🍕 Fast Food
                        </div>
                        <div className="bg-gray-100 px-4 py-2 rounded-xl font-semibold whitespace-nowrap">
                          🥗 Healthy
                        </div>
                      </div>

                      {/* Restaurant Cards */}
                      <div className="space-y-3">
                        <div className="bg-white rounded-2xl p-3 shadow-lg border border-gray-100">
                          <div className="flex gap-3">
                            <div className="w-20 h-20 bg-gradient-to-br from-orange-100 to-orange-200 rounded-xl flex items-center justify-center">
                              <span className="text-3xl">🍛</span>
                            </div>
                            <div className="flex-1">
                              <h4 className="font-bold text-gray-800">Mama&apos;s Kitchen</h4>
                              <p className="text-sm text-gray-600">Nigerian • Local Dishes</p>
                              <div className="flex items-center gap-4 mt-2">
                                <span className="text-sm font-semibold text-orange-600">⭐ 4.8</span>
                                <span className="text-sm text-gray-500">15-20 min</span>
                                <span className="text-sm text-green-600 font-semibold">₦500 delivery</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="bg-white rounded-2xl p-3 shadow-lg border border-gray-100">
                          <div className="flex gap-3">
                            <div className="w-20 h-20 bg-gradient-to-br from-green-100 to-green-200 rounded-xl flex items-center justify-center">
                              <span className="text-3xl">🥘</span>
                            </div>
                            <div className="flex-1">
                              <h4 className="font-bold text-gray-800">Buka Express</h4>
                              <p className="text-sm text-gray-600">Local • Soups & Swallow</p>
                              <div className="flex items-center gap-4 mt-2">
                                <span className="text-sm font-semibold text-orange-600">⭐ 4.9</span>
                                <span className="text-sm text-gray-500">20-25 min</span>
                                <span className="text-sm text-green-600 font-semibold">Free delivery</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Bottom Navigation */}
                      <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-3">
                        <div className="flex justify-around">
                          <div className="text-orange-500">🏠</div>
                          <div className="text-gray-400">🔍</div>
                          <div className="text-gray-400">🛒</div>
                          <div className="text-gray-400">👤</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1.2, duration: 0.6 }}
              className="absolute -bottom-4 -left-4 bg-white/90 backdrop-blur-sm rounded-2xl p-4 shadow-xl border border-white/50"
            >
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <UsersIcon className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <div className="text-2xl font-black text-gray-800">2,341</div>
                  <div className="text-xs text-gray-600">Orders Today</div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>

        {/* Scroll Indicator */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.5, duration: 0.8 }}
          className="absolute bottom-10 left-1/2 transform -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="flex flex-col items-center space-y-2 text-gray-400"
          >
            <span className="text-xs font-medium">Scroll to explore</span>
            <ArrowDownIcon className="w-5 h-5" />
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}

export default HeroSection