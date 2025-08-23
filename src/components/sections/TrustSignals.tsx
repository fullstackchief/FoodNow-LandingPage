'use client'

import { motion } from 'framer-motion'
import { StarIcon, ShieldCheckIcon, CheckBadgeIcon } from '@heroicons/react/24/solid'
import { ChatBubbleLeftIcon } from '@heroicons/react/24/outline'

const TrustSignals = () => {
  const testimonials = [
    {
      id: 1,
      name: "Adebayo Johnson",
      role: "Business Executive, VI",
      avatar: "👨🏾‍💼",
      rating: 5,
      text: "FoodNow has completely changed how I get my meals! The jollof rice from Lagos Kitchen is always perfect, and delivery is incredibly fast. Best food delivery service in Lagos!",
      location: "Victoria Island"
    },
    {
      id: 2,
      name: "Funmi Adebisi", 
      role: "Doctor, Lekki",
      avatar: "👩🏾‍⚕️",
      rating: 5,
      text: "As a busy doctor, FoodNow is a lifesaver. The quality is consistently excellent and I love supporting local restaurants. The pepper soup from Island Flavors is my favorite!",
      location: "Lekki"
    },
    {
      id: 3,
      name: "Kemi Okafor",
      role: "Tech Professional, Yaba", 
      avatar: "👩🏾‍💻",
      rating: 5,
      text: "The app is so user-friendly and the food always arrives hot. I&apos;ve tried almost every restaurant partner - Heritage Bistro&apos;s egusi is exceptional. Highly recommended!",
      location: "Yaba"
    }
  ]

  const trustBadges = [
    {
      title: "Lagos' #1",
      subtitle: "Premium Food Delivery",
      icon: "🏆",
      color: "from-yellow-400 to-orange-500"
    },
    {
      title: "10,000+",
      subtitle: "Trusted Customers",
      icon: "👥",
      color: "from-green-400 to-blue-500"
    },
    {
      title: "SSL Secured",
      subtitle: "Safe Payments",
      icon: "🔒",
      color: "from-blue-400 to-purple-500"
    },
    {
      title: "99.9%",
      subtitle: "Delivery Success",
      icon: "✅",
      color: "from-purple-400 to-pink-500"
    }
  ]

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
          <div className="inline-flex items-center space-x-2 bg-green-100 px-4 py-2 rounded-full mb-4">
            <ShieldCheckIcon className="w-5 h-5 text-green-600" />
            <span className="text-sm font-semibold text-green-700">Trusted & Secure</span>
          </div>
          
          <h2 className="text-4xl lg:text-6xl font-black text-gray-900 mb-4">
            <span className="bg-gradient-to-r from-green-500 to-blue-500 bg-clip-text text-transparent">Loved</span> by Lagos
          </h2>
          
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Join thousands of satisfied customers who trust FoodNow 
            for authentic, premium food delivery experiences.
          </p>
        </motion.div>

        {/* Trust Badges */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          viewport={{ once: true }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-20"
        >
          {trustBadges.map((badge, index) => (
            <motion.div
              key={index}
              whileHover={{ y: -5, scale: 1.05 }}
              transition={{ type: "spring", stiffness: 300 }}
              className="group bg-white/80 backdrop-blur-sm rounded-2xl p-6 text-center shadow-lg border border-white/50 hover:shadow-xl transition-all duration-300"
            >
              <div className={`w-12 h-12 bg-gradient-to-br ${badge.color} rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform duration-300`}>
                <span className="text-2xl">{badge.icon}</span>
              </div>
              <div className="text-xl font-black text-gray-900">{badge.title}</div>
              <div className="text-sm text-gray-600">{badge.subtitle}</div>
            </motion.div>
          ))}
        </motion.div>

        {/* Testimonials */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.id}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: index * 0.2 }}
              viewport={{ once: true }}
              className="group"
            >
              <motion.div
                whileHover={{ y: -10, scale: 1.02 }}
                transition={{ type: "spring", stiffness: 300 }}
                className="relative bg-white/90 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-white/50 group-hover:shadow-2xl transition-all duration-500 h-full"
              >
                {/* Quote Icon */}
                <div className="absolute -top-4 left-8">
                  <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center shadow-lg">
                    <ChatBubbleLeftIcon className="w-5 h-5 text-white" />
                  </div>
                </div>

                {/* Rating Stars */}
                <div className="flex items-center space-x-1 mb-4 pt-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <StarIcon key={i} className="w-5 h-5 text-yellow-500" />
                  ))}
                </div>

                {/* Testimonial Text */}
                <blockquote className="text-gray-700 leading-relaxed mb-6 italic">
                  &ldquo;{testimonial.text}&rdquo;
                </blockquote>

                {/* Author Info */}
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-orange-100 to-red-100 rounded-full flex items-center justify-center">
                    <span className="text-2xl">{testimonial.avatar}</span>
                  </div>
                  <div>
                    <div className="font-bold text-gray-900">{testimonial.name}</div>
                    <div className="text-sm text-gray-600">{testimonial.role}</div>
                    <div className="text-xs text-orange-600 font-semibold flex items-center space-x-1">
                      <span>📍</span>
                      <span>{testimonial.location}</span>
                    </div>
                  </div>
                </div>

                {/* Hover Glow */}
                <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              </motion.div>
            </motion.div>
          ))}
        </div>

        {/* Security Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          viewport={{ once: true }}
          className="mt-20"
        >
          <div className="bg-gradient-to-br from-blue-50 to-green-50 rounded-3xl p-8 lg:p-12 text-center border border-blue-200/50">
            <div className="mb-8">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-green-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <ShieldCheckIcon className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-3xl font-black text-gray-900 mb-4">
                Your Security is Our Priority
              </h3>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8">
                We use bank-level encryption and secure payment processing 
                to protect your personal information and transactions.
              </p>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="flex flex-col items-center space-y-2">
                <CheckBadgeIcon className="w-8 h-8 text-green-600" />
                <span className="text-sm font-semibold text-gray-700">SSL Encrypted</span>
              </div>
              <div className="flex flex-col items-center space-y-2">
                <CheckBadgeIcon className="w-8 h-8 text-blue-600" />
                <span className="text-sm font-semibold text-gray-700">PCI Compliant</span>
              </div>
              <div className="flex flex-col items-center space-y-2">
                <CheckBadgeIcon className="w-8 h-8 text-purple-600" />
                <span className="text-sm font-semibold text-gray-700">Data Protected</span>
              </div>
              <div className="flex flex-col items-center space-y-2">
                <CheckBadgeIcon className="w-8 h-8 text-red-600" />
                <span className="text-sm font-semibold text-gray-700">Privacy First</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Final CTA */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          viewport={{ once: true }}
          className="text-center mt-16"
        >
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => window.open('https://app.usefoodnow.com', '_blank')}
            className="group bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold text-xl py-5 px-12 rounded-full shadow-xl shadow-orange-500/30 hover:shadow-2xl hover:shadow-orange-500/40 transition-all duration-300"
          >
            <span className="mr-3">Join 10,000+ Happy Customers</span>
            <span className="inline-block group-hover:translate-x-1 transition-transform">🚀</span>
          </motion.button>
          
          <p className="text-sm text-gray-500 mt-4">
            * No signup fees • Free first delivery • Cancel anytime
          </p>
        </motion.div>
      </div>
    </section>
  )
}

export default TrustSignals