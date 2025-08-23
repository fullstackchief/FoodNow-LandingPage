'use client'

import { motion } from 'framer-motion'
import { 
  UsersIcon, 
  CurrencyDollarIcon, 
  ChartBarIcon, 
  HeartIcon 
} from '@heroicons/react/24/outline'

const RestaurantPartners = () => {
  const benefits = [
    {
      id: 1,
      title: "Reach 10,000+ Customers",
      description: "Expand your customer base with our growing community of food lovers across Lagos",
      icon: UsersIcon,
      color: "from-blue-400 to-blue-600",
      bgColor: "from-blue-50 to-blue-100",
      delay: 0.1
    },
    {
      id: 2,
      title: "Zero Setup Fees",
      description: "Join our platform completely free with no hidden costs or setup charges",
      icon: CurrencyDollarIcon,
      color: "from-green-400 to-green-600",
      bgColor: "from-green-50 to-green-100", 
      delay: 0.2
    },
    {
      id: 3,
      title: "Real-time Analytics",
      description: "Track orders, revenue, and customer insights with our advanced dashboard",
      icon: ChartBarIcon,
      color: "from-purple-400 to-purple-600",
      bgColor: "from-purple-50 to-purple-100",
      delay: 0.3
    },
    {
      id: 4,
      title: "Dedicated Support",
      description: "Get 24/7 support from our team to help your business grow and succeed",
      icon: HeartIcon,
      color: "from-red-400 to-red-600", 
      bgColor: "from-red-50 to-red-100",
      delay: 0.4
    }
  ]

  const restaurantFeatures = [
    "📊 Sales Analytics Dashboard",
    "🚀 Marketing Campaign Support", 
    "💳 Instant Payment Processing",
    "📱 Mobile-friendly Partner App",
    "🎯 Targeted Customer Promotions",
    "📞 Priority Customer Service"
  ]

  return (
    <section className="py-20 bg-gradient-to-br from-orange-50 to-white relative overflow-hidden">
      {/* Background Decorations */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-orange-200/20 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-200/20 rounded-full blur-3xl"></div>
      
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
            <span className="text-orange-600">🤝</span>
            <span className="text-sm font-semibold text-orange-700">Partnership Program</span>
          </div>
          
          <h2 className="text-4xl lg:text-6xl font-black text-gray-900 mb-6">
            <span className="bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">Grow Your</span>
            <br />Restaurant Business
          </h2>
          
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Join Lagos&apos; fastest-growing food delivery platform and reach thousands 
            of hungry customers ready to discover your amazing dishes.
          </p>
        </motion.div>

        {/* Two Column Layout */}
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          
          {/* Left: Benefits Grid */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {benefits.map((benefit) => (
                <motion.div
                  key={benefit.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: benefit.delay }}
                  viewport={{ once: true }}
                  className="group"
                >
                  <motion.div
                    whileHover={{ y: -8, scale: 1.05 }}
                    transition={{ type: "spring", stiffness: 300 }}
                    className={`relative bg-white/80 backdrop-blur-sm rounded-3xl p-6 shadow-lg border border-white/50 group-hover:shadow-xl transition-all duration-300`}
                  >
                    {/* Background Gradient on Hover */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${benefit.bgColor} opacity-0 group-hover:opacity-100 rounded-3xl transition-opacity duration-500`}></div>
                    
                    {/* Icon */}
                    <div className="relative mb-4">
                      <div className={`w-14 h-14 bg-gradient-to-br ${benefit.color} rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                        <benefit.icon className="w-7 h-7 text-white" />
                      </div>
                    </div>

                    {/* Content */}
                    <div className="relative space-y-3">
                      <h3 className="text-lg font-bold text-gray-900 group-hover:text-gray-800">
                        {benefit.title}
                      </h3>
                      <p className="text-sm text-gray-600 leading-relaxed">
                        {benefit.description}
                      </p>
                    </div>
                  </motion.div>
                </motion.div>
              ))}
            </div>

            {/* Additional Features */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              viewport={{ once: true }}
              className="mt-8 bg-white/90 backdrop-blur-sm rounded-3xl p-6 shadow-lg border border-white/50"
            >
              <h4 className="text-lg font-bold text-gray-900 mb-4">Additional Benefits:</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {restaurantFeatures.map((feature, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: 0.7 + index * 0.1 }}
                    viewport={{ once: true }}
                    className="flex items-center space-x-2 text-sm text-gray-700"
                  >
                    <span>✨</span>
                    <span>{feature}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </motion.div>

          {/* Right: Illustration/Stats */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            viewport={{ once: true }}
            className="relative"
          >
            {/* Main Stats Card */}
            <div className="bg-gradient-to-br from-orange-500 to-red-500 rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden">
              {/* Background Pattern */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-4 right-4 w-32 h-32 bg-white rounded-full"></div>
                <div className="absolute bottom-8 left-8 w-24 h-24 bg-white rounded-full"></div>
              </div>
              
              <div className="relative space-y-6">
                <h3 className="text-3xl font-black">Join 50+ Partners</h3>
                <p className="text-orange-100">
                  Our restaurant partners see an average of 40% increase in 
                  revenue within the first 3 months of joining FoodNow.
                </p>
                
                {/* Stats */}
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <div className="text-4xl font-black text-white">40%</div>
                    <div className="text-sm text-orange-100">Revenue Increase</div>
                  </div>
                  <div>
                    <div className="text-4xl font-black text-white">200+</div>
                    <div className="text-sm text-orange-100">Orders/Month</div>
                  </div>
                  <div>
                    <div className="text-4xl font-black text-white">4.8★</div>
                    <div className="text-sm text-orange-100">Partner Rating</div>
                  </div>
                  <div>
                    <div className="text-4xl font-black text-white">24/7</div>
                    <div className="text-sm text-orange-100">Support</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating Success Stories */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.8 }}
              viewport={{ once: true }}
              className="absolute -top-6 -right-6 bg-white/90 backdrop-blur-sm rounded-2xl p-4 shadow-xl border border-white/50 max-w-xs"
            >
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <span className="text-2xl">👨‍🍳</span>
                </div>
                <div>
                  <div className="text-sm font-bold text-gray-900">Chef Ibrahim</div>
                  <div className="text-xs text-gray-600">Lagos Kitchen</div>
                  <div className="text-xs text-green-600 font-semibold">+60% revenue</div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 1 }}
              viewport={{ once: true }}
              className="absolute -bottom-6 -left-6 bg-white/90 backdrop-blur-sm rounded-2xl p-4 shadow-xl border border-white/50 max-w-xs"
            >
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                  <span className="text-2xl">👩‍🍳</span>
                </div>
                <div>
                  <div className="text-sm font-bold text-gray-900">Mama Cynthia</div>
                  <div className="text-xs text-gray-600">Heritage Bistro</div>
                  <div className="text-xs text-purple-600 font-semibold">300+ new customers</div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          viewport={{ once: true }}
          className="text-center mt-16"
        >
          <div className="bg-gradient-to-br from-gray-50 to-orange-50 rounded-3xl p-8 lg:p-12 border border-orange-200/50">
            <h3 className="text-3xl font-black text-gray-900 mb-4">
              Ready to Grow Your Business?
            </h3>
            <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
              Join Lagos&apos; most trusted food delivery platform and start 
              reaching thousands of new customers today.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => window.open('https://partners.usefoodnow.com', '_blank')}
                className="group bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold text-xl py-5 px-12 rounded-full shadow-xl shadow-orange-500/30 hover:shadow-2xl hover:shadow-orange-500/40 transition-all duration-300"
              >
                <span className="mr-2">Join Our Partners</span>
                <span className="inline-block group-hover:translate-x-1 transition-transform">🚀</span>
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="border-2 border-gray-300 hover:border-orange-500 text-gray-700 hover:text-orange-600 font-bold text-xl py-5 px-12 rounded-full transition-all duration-300"
              >
                Learn More
              </motion.button>
            </div>

            <p className="text-sm text-gray-500 mt-6">
              🎉 Limited time: Get your first 100 orders commission-free!
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

export default RestaurantPartners