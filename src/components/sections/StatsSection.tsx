'use client'

import { motion, useInView } from 'framer-motion'
import { useRef, useEffect, useState } from 'react'
import { ClockIcon, StarIcon, BuildingStorefrontIcon, MapPinIcon } from '@heroicons/react/24/outline'

const StatsSection = () => {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true })
  
  const [counters, setCounters] = useState({
    deliveryTime: 0,
    rating: 0,
    partners: 0,
    locations: 0
  })

  const stats = [
    {
      id: 1,
      title: "Average Delivery",
      value: 30,
      suffix: "Minutes",
      icon: ClockIcon,
      color: "from-orange-500 to-red-500",
      bgColor: "from-orange-50 to-red-50",
      counter: counters.deliveryTime,
      description: "Lightning fast delivery across Lagos"
    },
    {
      id: 2, 
      title: "Customer Rating",
      value: 4.8,
      suffix: "/5 Stars",
      icon: StarIcon,
      color: "from-yellow-500 to-orange-500",
      bgColor: "from-yellow-50 to-orange-50",
      counter: counters.rating,
      description: "Trusted by satisfied customers"
    },
    {
      id: 3,
      title: "Restaurant",
      value: 50,
      suffix: "+ Partners",
      icon: BuildingStorefrontIcon,
      color: "from-green-500 to-blue-500", 
      bgColor: "from-green-50 to-blue-50",
      counter: counters.partners,
      description: "Premium dining partners"
    },
    {
      id: 4,
      title: "Service",
      value: 3,
      suffix: " Locations",
      icon: MapPinIcon,
      color: "from-blue-500 to-purple-500",
      bgColor: "from-blue-50 to-purple-50", 
      counter: counters.locations,
      description: "Growing across Lagos"
    }
  ]

  useEffect(() => {
    if (!isInView) return

    const duration = 2000 // 2 seconds
    const frameRate = 60
    const totalFrames = Math.round(duration / (1000 / frameRate))

    let frame = 0
    const counter = setInterval(() => {
      const progress = frame / totalFrames
      const easeOutProgress = 1 - Math.pow(1 - progress, 3) // Ease out cubic
      
      setCounters({
        deliveryTime: Math.round(30 * easeOutProgress),
        rating: Number((4.8 * easeOutProgress).toFixed(1)),
        partners: Math.round(50 * easeOutProgress), 
        locations: Math.round(3 * easeOutProgress)
      })

      if (frame === totalFrames) {
        clearInterval(counter)
        setCounters({
          deliveryTime: 30,
          rating: 4.8,
          partners: 50,
          locations: 3
        })
      }
      
      frame++
    }, 1000 / frameRate)

    return () => clearInterval(counter)
  }, [isInView])

  return (
    <section className="py-20 relative overflow-hidden">
      {/* Curved Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-orange-50/30">
        <svg className="absolute top-0 w-full h-32" viewBox="0 0 1440 120" preserveAspectRatio="none">
          <path 
            d="M0,32 C480,128 960,128 1440,32 L1440,0 L0,0 Z" 
            fill="white"
            className="fill-white"
          />
        </svg>
        <svg className="absolute bottom-0 w-full h-32" viewBox="0 0 1440 120" preserveAspectRatio="none">
          <path 
            d="M0,88 C480,-8 960,-8 1440,88 L1440,120 L0,120 Z" 
            fill="white"
            className="fill-white"
          />
        </svg>
      </div>

      {/* Decorative Elements */}
      <div className="absolute top-20 left-10 w-32 h-32 bg-orange-200/30 rounded-full blur-2xl"></div>
      <div className="absolute bottom-20 right-10 w-40 h-40 bg-green-200/30 rounded-full blur-2xl"></div>
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" ref={ref}>
        
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center space-x-2 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full mb-6 border border-orange-200/50">
            <span className="text-orange-600">📊</span>
            <span className="text-sm font-semibold text-orange-700">Our Impact</span>
          </div>
          
          <h2 className="text-4xl lg:text-6xl font-black text-gray-900 mb-4">
            Trusted by <span className="bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">Lagos</span>
          </h2>
          
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Numbers that speak to our commitment to premium food delivery excellence
          </p>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.id}
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.8, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="group"
            >
              <motion.div
                whileHover={{ y: -8, scale: 1.05 }}
                transition={{ type: "spring", stiffness: 300 }}
                className={`relative bg-white/80 backdrop-blur-sm rounded-3xl p-8 text-center shadow-xl border border-white/50 group-hover:shadow-2xl transition-all duration-500`}
              >
                {/* Gradient Background on Hover */}
                <div className={`absolute inset-0 bg-gradient-to-br ${stat.bgColor} opacity-0 group-hover:opacity-100 rounded-3xl transition-opacity duration-500`}></div>
                
                {/* Icon */}
                <div className="relative mb-6">
                  <div className={`w-16 h-16 bg-gradient-to-br ${stat.color} rounded-2xl flex items-center justify-center mx-auto shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    <stat.icon className="w-8 h-8 text-white" />
                  </div>
                </div>

                {/* Stats */}
                <div className="relative space-y-2 mb-4">
                  <div className="text-4xl lg:text-5xl font-black text-gray-900">
                    {stat.id === 2 ? stat.counter.toFixed(1) : stat.counter}
                    <span className="text-2xl lg:text-3xl ml-1 font-bold bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">
                      {stat.id === 2 ? '/5' : stat.id === 3 ? '+' : ''}
                    </span>
                  </div>
                  <div className="text-sm font-bold text-gray-600 uppercase tracking-wider">
                    {stat.suffix}
                  </div>
                </div>

                {/* Title & Description */}
                <div className="relative space-y-2">
                  <h3 className="text-lg font-black text-gray-900">
                    {stat.title}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {stat.description}
                  </p>
                </div>

                {/* Glow Effect */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ 
                    opacity: isInView ? [0, 0.5, 0] : 0,
                    scale: isInView ? [0.8, 1.2, 1] : 0.8
                  }}
                  transition={{ 
                    duration: 2,
                    delay: index * 0.2,
                    ease: "easeOut"
                  }}
                  className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-0 group-hover:opacity-10 rounded-3xl blur-xl`}
                ></motion.div>
              </motion.div>
            </motion.div>
          ))}
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          viewport={{ once: true }}
          className="text-center mt-16"
        >
          <div className="inline-flex items-center space-x-6 bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/50">
            <div className="text-center">
              <div className="text-2xl font-black text-gray-900">Join 10,000+</div>
              <div className="text-sm text-gray-600">Happy Customers</div>
            </div>
            <div className="w-px h-12 bg-gray-200"></div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => window.open('https://app.usefoodnow.com', '_blank')}
              className="bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold py-3 px-8 rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
            >
              Order Now
            </motion.button>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

export default StatsSection