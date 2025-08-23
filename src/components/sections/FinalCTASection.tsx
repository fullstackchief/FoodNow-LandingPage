'use client'

import { motion } from 'framer-motion'
import { useState } from 'react'
import { 
  EnvelopeIcon,
  CheckIcon,
  ShoppingBagIcon,
  DevicePhoneMobileIcon,
  StarIcon
} from '@heroicons/react/24/outline'

const FinalCTASection = () => {
  const [email, setEmail] = useState('')
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address')
      return
    }
    
    setIsLoading(true)
    setError('')
    
    try {
      // Simulate API call with potential error
      await new Promise((resolve, reject) => {
        setTimeout(() => {
          // 90% success rate simulation
          if (Math.random() > 0.1) {
            resolve(true)
          } else {
            reject(new Error('Network error'))
          }
        }, 2000)
      })
      
      setIsSubscribed(true)
      setEmail('')
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const stats = [
    { value: '10,000+', label: 'Happy Customers' },
    { value: '500+', label: 'Restaurant Partners' },
    { value: '98%', label: 'Customer Satisfaction' },
    { value: '15min', label: 'Average Delivery' }
  ]

  return (
    <section className="relative bg-gradient-to-br from-orange-500 via-red-500 to-red-600 overflow-hidden">
      {/* Curved Top Border */}
      <div className="absolute -top-24 left-0 right-0">
        <svg
          viewBox="0 0 1200 120"
          className="w-full h-24"
          preserveAspectRatio="none"
        >
          <path
            d="M0,120 C300,20 900,20 1200,120 L1200,0 L0,0 Z"
            fill="white"
          />
        </svg>
      </div>

      {/* Background Decorations */}
      <div className="absolute top-0 left-0 w-full h-full">
        <div className="absolute top-20 left-10 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-yellow-300/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-white/5 rounded-full blur-3xl"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        
        {/* Main CTA Content */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <motion.div
            animate={{ 
              scale: [1, 1.05, 1],
              rotate: [0, 1, -1, 0] 
            }}
            transition={{ 
              duration: 4, 
              repeat: Infinity,
              ease: "easeInOut" 
            }}
            className="inline-flex items-center space-x-2 bg-white/20 backdrop-blur-sm px-6 py-3 rounded-full mb-8 border border-white/30"
          >
            <StarIcon className="w-5 h-5 text-yellow-300" />
            <span className="text-white font-semibold">Premium Food Delivery Experience</span>
            <StarIcon className="w-5 h-5 text-yellow-300" />
          </motion.div>
          
          <h2 className="text-4xl lg:text-7xl font-black text-white mb-8 leading-tight">
            Ready to Experience
            <br />
            <span className="bg-gradient-to-r from-yellow-300 to-white bg-clip-text text-transparent">
              Premium Delivery?
            </span>
          </h2>
          
          <p className="text-xl lg:text-2xl text-white/90 max-w-4xl mx-auto leading-relaxed">
            Join thousands of Lagos food lovers who trust FoodNow for fast, 
            reliable, and premium food delivery from the city&apos;s best restaurants.
          </p>
        </motion.div>

        {/* Stats Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          viewport={{ once: true }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-8 mb-16"
        >
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.3 + index * 0.1 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <div className="bg-white/15 backdrop-blur-sm rounded-3xl p-6 border border-white/20 hover:bg-white/25 transition-all duration-300">
                <div className="text-3xl lg:text-4xl font-black text-white mb-2">
                  {stat.value}
                </div>
                <div className="text-white/80 font-medium text-sm lg:text-base">
                  {stat.label}
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Main CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          viewport={{ once: true }}
          className="flex flex-col lg:flex-row gap-6 justify-center items-center mb-16"
        >
          <motion.button
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => window.open('https://app.usefoodnow.com', '_blank')}
            className="group bg-white text-orange-600 font-black text-xl lg:text-2xl py-6 px-12 lg:px-16 rounded-full shadow-2xl hover:shadow-3xl transition-all duration-300 flex items-center space-x-4"
          >
            <ShoppingBagIcon className="w-6 h-6" />
            <span>Order Now</span>
            <span className="inline-block group-hover:translate-x-2 transition-transform">🚀</span>
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            className="group bg-white/10 backdrop-blur-sm border-2 border-white/30 text-white font-black text-xl lg:text-2xl py-6 px-12 lg:px-16 rounded-full hover:bg-white/20 transition-all duration-300 flex items-center space-x-4"
          >
            <DevicePhoneMobileIcon className="w-6 h-6" />
            <span>Download App</span>
            <span className="inline-block group-hover:rotate-12 transition-transform">📱</span>
          </motion.button>
        </motion.div>

        {/* Email Capture */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          viewport={{ once: true }}
          className="max-w-2xl mx-auto"
        >
          <div className="bg-white/10 backdrop-blur-md rounded-3xl p-8 lg:p-12 border border-white/20">
            <div className="text-center mb-8">
              <h3 className="text-2xl lg:text-3xl font-black text-white mb-4">
                Get Launch Notifications
              </h3>
              <p className="text-white/80 text-lg">
                Be the first to know about new restaurants, exclusive deals, and app updates.
              </p>
            </div>

            {!isSubscribed ? (
              <form onSubmit={handleEmailSubmit} className="space-y-6">
                <div className="flex flex-col lg:flex-row gap-4">
                  <div className="flex-1 relative">
                    <EnvelopeIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/60" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value)
                        if (error) setError('') // Clear error when user starts typing
                      }}
                      placeholder="Enter your email for exclusive updates"
                      className={`w-full pl-12 pr-4 py-5 bg-white/20 backdrop-blur-sm rounded-2xl border transition-all duration-300 font-medium text-white placeholder-white/60 text-lg ${
                        error 
                          ? 'border-red-400 focus:border-red-400 focus:ring-4 focus:ring-red-400/20' 
                          : 'border-white/30 focus:border-white focus:ring-4 focus:ring-white/20'
                      }`}
                      required
                    />
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    type="submit"
                    disabled={isLoading}
                    className="bg-white text-orange-600 font-bold py-5 px-8 lg:px-12 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-lg"
                  >
                    {isLoading ? (
                      <div className="flex items-center space-x-2">
                        <div className="w-5 h-5 border-2 border-orange-600 border-t-transparent rounded-full animate-spin"></div>
                        <span>Subscribing...</span>
                      </div>
                    ) : (
                      "Notify Me"
                    )}
                  </motion.button>
                </div>
                
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-red-500/20 border border-red-400/30 rounded-2xl p-4 backdrop-blur-sm"
                  >
                    <p className="text-red-200 text-sm flex items-center space-x-2">
                      <span>⚠️</span>
                      <span>{error}</span>
                    </p>
                  </motion.div>
                )}
                
                <p className="text-center text-white/70 text-sm">
                  🎁 Early subscribers get 50% off their first 3 orders + free delivery for a month!
                </p>
              </form>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center bg-green-500/20 rounded-2xl p-8 border border-green-400/30"
              >
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 0.6 }}
                  className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4"
                >
                  <CheckIcon className="w-8 h-8 text-white" />
                </motion.div>
                <h4 className="font-black text-white text-xl mb-2">You&apos;re All Set! 🎉</h4>
                <p className="text-green-100">
                  We&apos;ll send you exclusive updates and launch notifications.
                </p>
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* Trust Indicators */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          viewport={{ once: true }}
          className="text-center mt-16"
        >
          <div className="flex flex-col lg:flex-row items-center justify-center space-y-4 lg:space-y-0 lg:space-x-8 text-white/80">
            <div className="flex items-center space-x-2">
              <span className="text-2xl">🔒</span>
              <span className="font-semibold">Secure Payments</span>
            </div>
            <div className="hidden lg:block w-px h-6 bg-white/30"></div>
            <div className="flex items-center space-x-2">
              <span className="text-2xl">⚡</span>
              <span className="font-semibold">15-minute Delivery</span>
            </div>
            <div className="hidden lg:block w-px h-6 bg-white/30"></div>
            <div className="flex items-center space-x-2">
              <span className="text-2xl">🏆</span>
              <span className="font-semibold">Premium Quality</span>
            </div>
            <div className="hidden lg:block w-px h-6 bg-white/30"></div>
            <div className="flex items-center space-x-2">
              <span className="text-2xl">💬</span>
              <span className="font-semibold">24/7 Support</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

export default FinalCTASection