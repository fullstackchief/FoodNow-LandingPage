'use client'

import { motion, useScroll, useTransform } from 'framer-motion'
import { useState, useRef } from 'react'
import { 
  MapPinIcon,
  CreditCardIcon,
  HeartIcon,
  ClockIcon,
  CheckIcon,
  EnvelopeIcon
} from '@heroicons/react/24/outline'
import Button from '@/components/ui/Button'

const MobileAppSection = () => {
  const [email, setEmail] = useState('')
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["0 1", "1.33 1"]
  })
  
  const scaleProgress = useTransform(scrollYProgress, [0, 1], [0.8, 1])
  const opacityProgress = useTransform(scrollYProgress, [0, 1], [0.6, 1])

  const appFeatures = [
    {
      id: 1,
      title: "Real-time Tracking",
      description: "Watch your food journey from kitchen to your doorstep with live GPS tracking",
      icon: MapPinIcon,
      color: "from-orange-400 to-orange-600",
      bgColor: "from-orange-50 to-orange-100"
    },
    {
      id: 2,
      title: "Easy Payments", 
      description: "Pay seamlessly with cards, bank transfer, or cash on delivery",
      icon: CreditCardIcon,
      color: "from-green-400 to-green-600",
      bgColor: "from-green-50 to-green-100"
    },
    {
      id: 3,
      title: "Favorite Restaurants",
      description: "Save your favorite spots and reorder your usual meals with one tap",
      icon: HeartIcon,
      color: "from-orange-500 to-red-500", 
      bgColor: "from-orange-50 to-red-100"
    },
    {
      id: 4,
      title: "Order History",
      description: "Keep track of all your orders and easily reorder previous meals",
      icon: ClockIcon,
      color: "from-green-400 to-green-600",
      bgColor: "from-green-50 to-green-100"
    }
  ]

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return
    
    setIsLoading(true)
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    setIsSubscribed(true)
    setIsLoading(false)
    setEmail('')
  }

  return (
    <section ref={ref} className="py-20 bg-gradient-to-br from-orange-50 to-white relative overflow-hidden">
      {/* Background Decorations */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-orange-200/20 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 right-0 w-80 h-80 bg-red-200/20 rounded-full blur-3xl"></div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center space-x-2 bg-orange-100 px-4 py-2 rounded-full mb-6">
            <span className="text-orange-600">📱</span>
            <span className="text-sm font-semibold text-orange-700">Coming Soon</span>
          </div>
          
          <h2 className="text-4xl lg:text-6xl font-black text-gray-900 mb-6">
            Get the <span className="bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">FoodNow</span>
            <br />Experience
          </h2>
          
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Our mobile app is launching soon with an amazing experience designed 
            to make food ordering faster, easier, and more enjoyable than ever.
          </p>
        </motion.div>

        {/* Two Column Layout */}
        <div className="grid lg:grid-cols-2 gap-16 items-center mb-20">
          
          {/* Left: App Features */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {appFeatures.map((feature, index) => (
                <motion.div
                  key={feature.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="group"
                >
                  <motion.div
                    whileHover={{ y: -8, scale: 1.05 }}
                    transition={{ type: "spring", stiffness: 300 }}
                    className={`relative bg-white/80 backdrop-blur-sm rounded-3xl p-6 shadow-lg border border-white/50 group-hover:shadow-xl transition-all duration-300`}
                  >
                    {/* Background Gradient on Hover */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${feature.bgColor} opacity-0 group-hover:opacity-100 rounded-3xl transition-opacity duration-500`}></div>
                    
                    {/* Icon */}
                    <div className="relative mb-4">
                      <div className={`w-14 h-14 bg-gradient-to-br ${feature.color} rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                        <feature.icon className="w-7 h-7 text-white" />
                      </div>
                    </div>

                    {/* Content */}
                    <div className="relative space-y-3">
                      <h3 className="text-lg font-bold text-gray-900">
                        {feature.title}
                      </h3>
                      <p className="text-sm text-gray-600 leading-relaxed">
                        {feature.description}
                      </p>
                    </div>
                  </motion.div>
                </motion.div>
              ))}
            </div>

            {/* Coming Soon Features */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              viewport={{ once: true }}
              className="bg-gradient-to-br from-orange-500 to-red-500 rounded-3xl p-8 text-white shadow-2xl"
            >
              <h3 className="text-2xl font-black mb-4">App Launch Features:</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  "🎯 Smart recommendations",
                  "🏆 Loyalty rewards program", 
                  "👥 Group ordering",
                  "⏰ Scheduled deliveries",
                  "💬 In-app chat support",
                  "🎉 Exclusive app-only deals"
                ].map((feature, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: 0.5 + index * 0.1 }}
                    viewport={{ once: true }}
                    className="flex items-center space-x-2 text-sm"
                  >
                    <span>✨</span>
                    <span>{feature}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </motion.div>

          {/* Right: Phone Mockups with Parallax */}
          <motion.div
            style={{ scale: scaleProgress, opacity: opacityProgress }}
            className="relative lg:h-[600px]"
          >
            {/* Main Phone */}
            <div className="relative mx-auto w-80 lg:w-96">
              {/* Glow Effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-orange-400 to-red-600 rounded-[3rem] blur-2xl opacity-30"></div>
              
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

                    {/* Coming Soon Screen */}
                    <div className="flex flex-col items-center justify-center h-full px-8 text-center">
                      <motion.div
                        animate={{ 
                          scale: [1, 1.1, 1],
                          rotate: [0, 5, -5, 0] 
                        }}
                        transition={{ 
                          duration: 4, 
                          repeat: Infinity,
                          ease: "easeInOut" 
                        }}
                        className="w-32 h-32 bg-gradient-to-br from-purple-500 to-pink-500 rounded-3xl flex items-center justify-center mb-8 shadow-xl"
                      >
                        <span className="text-white font-black text-4xl">F</span>
                      </motion.div>
                      
                      <h3 className="text-3xl font-black text-gray-900 mb-4">
                        Coming Soon!
                      </h3>
                      
                      <p className="text-gray-600 mb-6 leading-relaxed">
                        We&apos;re crafting the perfect food delivery experience for you. 
                        Get notified when we launch!
                      </p>
                      
                      <div className="bg-purple-100 rounded-2xl p-6 w-full">
                        <div className="space-y-3">
                          {["🚀 Lightning fast ordering", "🎨 Beautiful design", "🔔 Smart notifications"].map((feature, index) => (
                            <div key={index} className="flex items-center space-x-3 text-sm text-purple-700">
                              <CheckIcon className="w-4 h-4 text-purple-600" />
                              <span>{feature}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating Screenshots */}
            <motion.div
              animate={{ 
                y: [0, -15, 0],
                rotate: [0, 2, -2, 0] 
              }}
              transition={{ 
                duration: 6, 
                repeat: Infinity,
                ease: "easeInOut",
                delay: 0.5 
              }}
              className="absolute -top-8 -left-8 w-24 h-48 bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden opacity-80"
            >
              <div className="bg-gradient-to-b from-orange-100 to-orange-200 h-full flex flex-col items-center justify-center p-2">
                <span className="text-2xl mb-2">🍕</span>
                <div className="text-xs text-gray-700 text-center">
                  <div className="font-semibold">Pizza Palace</div>
                  <div>⭐ 4.9</div>
                </div>
              </div>
            </motion.div>

            <motion.div
              animate={{ 
                y: [0, -20, 0],
                rotate: [0, -3, 3, 0] 
              }}
              transition={{ 
                duration: 5, 
                repeat: Infinity,
                ease: "easeInOut",
                delay: 1 
              }}
              className="absolute -bottom-8 -right-8 w-28 h-52 bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden opacity-80"
            >
              <div className="bg-gradient-to-b from-green-100 to-green-200 h-full flex flex-col items-center justify-center p-2">
                <span className="text-3xl mb-2">🛒</span>
                <div className="text-xs text-gray-700 text-center">
                  <div className="font-semibold">Your Cart</div>
                  <div>₦2,500</div>
                  <div className="bg-green-500 text-white px-2 py-1 rounded-full mt-1">Order</div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>

        {/* Email Capture & Download Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          viewport={{ once: true }}
          className="bg-gradient-to-br from-gray-50 to-orange-50 rounded-3xl p-8 lg:p-12 border border-orange-200/50"
        >
          <div className="text-center mb-8">
            <h3 className="text-3xl font-black text-gray-900 mb-4">
              Be the First to Know!
            </h3>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Get notified when our mobile app launches and receive exclusive 
              early access perks and special launch offers.
            </p>
          </div>

          {/* Email Form */}
          {!isSubscribed ? (
            <form onSubmit={handleEmailSubmit} className="max-w-md mx-auto mb-8">
              <div className="flex gap-3">
                <div className="flex-1 relative">
                  <EnvelopeIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email address"
                    className="w-full pl-12 pr-4 py-4 bg-white/90 backdrop-blur-sm rounded-2xl border border-gray-200 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/20 transition-all duration-300 font-medium"
                    required
                  />
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type="submit"
                  disabled={isLoading}
                  className="bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold py-4 px-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? "..." : "Notify Me"}
                </motion.button>
              </div>
            </form>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="max-w-md mx-auto mb-8 bg-green-100 rounded-2xl p-6 text-center"
            >
              <CheckIcon className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <h4 className="font-bold text-green-800 mb-1">You&apos;re all set!</h4>
              <p className="text-green-700 text-sm">We&apos;ll notify you when the app launches.</p>
            </motion.div>
          )}

          {/* Download Buttons (Coming Soon) */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <div className="flex gap-4">
              <Button 
                disabled
                variant="outline"
                className="flex items-center space-x-3 bg-gray-100 text-gray-400 font-semibold py-3 px-6 rounded-2xl cursor-not-allowed opacity-60"
                icon={<span className="text-2xl">📱</span>}
              >
                <div className="text-left">
                  <div className="text-xs">Download on the</div>
                  <div className="text-sm font-bold">App Store</div>
                </div>
              </Button>
              
              <Button 
                disabled
                variant="outline"
                className="flex items-center space-x-3 bg-gray-100 text-gray-400 font-semibold py-3 px-6 rounded-2xl cursor-not-allowed opacity-60"
                icon={<span className="text-2xl">🤖</span>}
              >
                <div className="text-left">
                  <div className="text-xs">Get it on</div>
                  <div className="text-sm font-bold">Google Play</div>
                </div>
              </Button>
            </div>
            
            {/* QR Code */}
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-4 shadow-lg border border-white/50">
              <div className="w-20 h-20 bg-gray-100 rounded-xl flex flex-col items-center justify-center">
                <span className="text-2xl mb-1">🔲</span>
                <span className="text-xs text-gray-500">QR Code</span>
              </div>
              <p className="text-xs text-gray-600 mt-2 text-center">Scan for quick<br />access later</p>
            </div>
          </div>

          <p className="text-sm text-gray-500 text-center mt-6">
            🎉 Early subscribers get 50% off their first 3 orders!
          </p>
        </motion.div>
      </div>
    </section>
  )
}

export default MobileAppSection