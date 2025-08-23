'use client'

import { motion } from 'framer-motion'
import { DevicePhoneMobileIcon, TruckIcon, HeartIcon } from '@heroicons/react/24/outline'

const HowItWorks = () => {
  const steps = [
    {
      id: 1,
      title: "Order",
      description: "Browse premium restaurants and select your favorite Nigerian dishes",
      icon: DevicePhoneMobileIcon,
      color: "from-orange-400 to-orange-600",
      bgColor: "from-orange-50 to-orange-100",
      delay: 0.1
    },
    {
      id: 2,
      title: "Prepare",
      description: "Our partner chefs prepare your meal with fresh, authentic ingredients",
      icon: () => <span className="text-2xl">👨‍🍳</span>,
      color: "from-green-400 to-green-600", 
      bgColor: "from-green-50 to-green-100",
      delay: 0.2
    },
    {
      id: 3,
      title: "Deliver",
      description: "Fast delivery riders bring your hot meal straight to your doorstep",
      icon: TruckIcon,
      color: "from-blue-400 to-blue-600",
      bgColor: "from-blue-50 to-blue-100", 
      delay: 0.3
    },
    {
      id: 4,
      title: "Enjoy",
      description: "Savor authentic Lagos flavors in the comfort of your home",
      icon: HeartIcon,
      color: "from-red-400 to-red-600",
      bgColor: "from-red-50 to-red-100",
      delay: 0.4
    }
  ]

  return (
    <section className="py-20 bg-white relative overflow-hidden">
      {/* Background Decorations */}
      <div className="absolute top-10 right-10 w-64 h-64 bg-orange-200/20 rounded-full blur-3xl"></div>
      <div className="absolute bottom-10 left-10 w-64 h-64 bg-green-200/20 rounded-full blur-3xl"></div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-20"
        >
          <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-orange-100 to-yellow-100 px-4 py-2 rounded-full mb-6">
            <span className="text-orange-600">⚡</span>
            <span className="text-sm font-semibold text-orange-700">Simple Process</span>
          </div>
          
          <h2 className="text-4xl lg:text-6xl font-black text-gray-900 mb-6">
            How <span className="bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">FoodNow</span>
            <br />Works
          </h2>
          
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            From craving to satisfaction in just 4 simple steps. 
            Experience Lagos&apos; fastest premium food delivery.
          </p>
        </motion.div>

        {/* Steps Grid */}
        <div className="relative">
          {/* Connecting Lines - Desktop */}
          <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-orange-200 via-green-200 via-blue-200 to-red-200 transform -translate-y-1/2 z-0"></div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative z-10">
            {steps.map((step, index) => (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: step.delay }}
                viewport={{ once: true }}
                className="group"
              >
                <motion.div
                  whileHover={{ y: -10, scale: 1.05 }}
                  transition={{ type: "spring", stiffness: 300 }}
                  className={`relative bg-gradient-to-br ${step.bgColor} rounded-3xl p-8 text-center shadow-lg border border-white/50 backdrop-blur-sm group-hover:shadow-xl transition-all duration-300`}
                >
                  {/* Step Number */}
                  <div className={`absolute -top-4 left-1/2 transform -translate-x-1/2 w-10 h-10 bg-gradient-to-br ${step.color} rounded-full flex items-center justify-center shadow-lg`}>
                    <span className="text-white font-black text-lg">{step.id}</span>
                  </div>

                  {/* Icon */}
                  <div className="mb-6 mt-4">
                    <div className={`w-16 h-16 bg-gradient-to-br ${step.color} rounded-2xl flex items-center justify-center mx-auto group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                      {step.id === 2 ? (
                        <step.icon />
                      ) : (
                        <step.icon className="w-8 h-8 text-white" />
                      )}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="space-y-4">
                    <h3 className="text-2xl font-black text-gray-900">
                      {step.title}
                    </h3>
                    <p className="text-gray-600 leading-relaxed">
                      {step.description}
                    </p>
                  </div>

                  {/* Hover Glow Effect */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${step.color} opacity-0 group-hover:opacity-5 rounded-3xl transition-opacity duration-300`}></div>
                </motion.div>

                {/* Mobile Connecting Line */}
                {index < steps.length - 1 && (
                  <div className="lg:hidden flex justify-center mt-6 mb-2">
                    <div className="w-0.5 h-8 bg-gradient-to-b from-gray-300 to-transparent"></div>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          viewport={{ once: true }}
          className="text-center mt-20"
        >
          <div className="bg-gradient-to-br from-orange-50 to-yellow-50 rounded-3xl p-8 lg:p-12 border border-orange-200/50">
            <h3 className="text-3xl font-black text-gray-900 mb-4">
              Ready to experience premium food delivery?
            </h3>
            <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
              Join thousands of satisfied customers who trust FoodNow 
              for authentic Lagos flavors delivered fast.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => window.open('https://app.usefoodnow.com', '_blank')}
                className="bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold text-lg py-4 px-10 rounded-full shadow-xl shadow-orange-500/30 hover:shadow-2xl hover:shadow-orange-500/40 transition-all duration-300"
              >
                Start Ordering Now
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="border-2 border-gray-300 hover:border-orange-500 text-gray-700 hover:text-orange-600 font-bold text-lg py-4 px-10 rounded-full transition-all duration-300"
              >
                Download App
              </motion.button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

export default HowItWorks