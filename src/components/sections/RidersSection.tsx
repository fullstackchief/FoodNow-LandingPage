'use client'

import { motion } from 'framer-motion'
import { 
  ClockIcon, 
  CurrencyDollarIcon, 
  TruckIcon, 
  CalendarDaysIcon,
  MapPinIcon,
  PhoneIcon
} from '@heroicons/react/24/outline'

const RidersSection = () => {
  const benefits = [
    {
      id: 1,
      title: "Work Your Hours",
      description: "Choose when you work. Part-time, full-time, or just weekends - you decide",
      icon: ClockIcon,
      color: "from-orange-400 to-orange-600",
      bgColor: "from-orange-50 to-orange-100"
    },
    {
      id: 2,
      title: "Weekly Payouts",
      description: "Get paid every week directly to your bank account. No waiting, no delays",
      icon: CurrencyDollarIcon,
      color: "from-green-400 to-green-600", 
      bgColor: "from-green-50 to-green-100"
    },
    {
      id: 3,
      title: "Free Equipment",
      description: "Get delivery bag, helmet, and branded gear at no cost when you join",
      icon: TruckIcon,
      color: "from-orange-500 to-red-500",
      bgColor: "from-orange-50 to-red-50"
    }
  ]

  const earnings = [
    {
      time: "Part-time (4 hours)",
      amount: "₦15,000 - ₦25,000",
      description: "Perfect for students or side income"
    },
    {
      time: "Full-time (8 hours)", 
      amount: "₦35,000 - ₦55,000",
      description: "Ideal for dedicated riders"
    },
    {
      time: "Weekend Warrior",
      amount: "₦20,000 - ₦30,000", 
      description: "Just weekends, great extra income"
    }
  ]

  const riderTestimonials = [
    {
      name: "Daniel Okonkwo",
      area: "Lekki Rider",
      avatar: "🏍️",
      earning: "₦48,000/week",
      quote: "Best delivery job I've had. Flexible hours and good money!"
    },
    {
      name: "Emmanuel Adebayo", 
      area: "VI Rider",
      avatar: "🚴‍♂️",
      earning: "₦52,000/week", 
      quote: "Started part-time, now it's my main income. Love the freedom!"
    }
  ]

  return (
    <section className="py-20 bg-gradient-to-br from-orange-50 to-white relative overflow-hidden">
      {/* Background Decorations */}
      <div className="absolute top-10 left-10 w-80 h-80 bg-orange-200/20 rounded-full blur-3xl"></div>
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-red-200/20 rounded-full blur-3xl"></div>
      
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
            <span className="text-orange-600">🏍️</span>
            <span className="text-sm font-semibold text-orange-700">Rider Program</span>
          </div>
          
          <h2 className="text-4xl lg:text-6xl font-black text-gray-900 mb-6">
            Earn <span className="bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">₦50,000+</span>
            <br />Monthly
          </h2>
          
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Join Lagos&apos; highest-paying delivery platform. Work flexible hours, 
            earn great money, and be part of Nigeria&apos;s food delivery revolution.
          </p>
        </motion.div>

        {/* Two Column Layout */}
        <div className="grid lg:grid-cols-2 gap-16 items-center mb-20">
          
          {/* Left: Benefits */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="space-y-6"
          >
            {benefits.map((benefit, index) => (
              <motion.div
                key={benefit.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                viewport={{ once: true }}
                className="group"
              >
                <motion.div
                  whileHover={{ x: 10, scale: 1.02 }}
                  transition={{ type: "spring", stiffness: 300 }}
                  className={`relative bg-white/80 backdrop-blur-sm rounded-3xl p-6 shadow-lg border border-white/50 group-hover:shadow-xl transition-all duration-300 flex items-center space-x-6`}
                >
                  {/* Background Gradient on Hover */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${benefit.bgColor} opacity-0 group-hover:opacity-100 rounded-3xl transition-opacity duration-500`}></div>
                  
                  {/* Icon */}
                  <div className="relative">
                    <div className={`w-16 h-16 bg-gradient-to-br ${benefit.color} rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                      <benefit.icon className="w-8 h-8 text-white" />
                    </div>
                  </div>

                  {/* Content */}
                  <div className="relative flex-1">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      {benefit.title}
                    </h3>
                    <p className="text-gray-600 leading-relaxed">
                      {benefit.description}
                    </p>
                  </div>
                </motion.div>
              </motion.div>
            ))}
          </motion.div>

          {/* Right: Earning Potential */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            viewport={{ once: true }}
            className="space-y-6"
          >
            <div className="bg-gradient-to-br from-orange-500 to-red-500 rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden">
              {/* Background Pattern */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-4 right-4 w-32 h-32 bg-white rounded-full"></div>
                <div className="absolute bottom-8 left-8 w-24 h-24 bg-white rounded-full"></div>
              </div>
              
              <div className="relative space-y-6">
                <h3 className="text-3xl font-black">Weekly Earning Potential</h3>
                
                {earnings.map((earning, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: 0.4 + index * 0.1 }}
                    viewport={{ once: true }}
                    className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20"
                  >
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-semibold text-green-100">{earning.time}</span>
                      <span className="font-black text-2xl text-white">{earning.amount}</span>
                    </div>
                    <p className="text-sm text-green-100">{earning.description}</p>
                  </motion.div>
                ))}
              </div>
            </div>
            
            {/* Requirements */}
            <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-6 shadow-lg border border-white/50">
              <h4 className="text-lg font-bold text-gray-900 mb-4">Basic Requirements:</h4>
              <div className="space-y-3">
                <div className="flex items-center space-x-3 text-gray-700">
                  <span className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-green-600 text-sm">✓</span>
                  </span>
                  <span>Own motorcycle or bicycle</span>
                </div>
                <div className="flex items-center space-x-3 text-gray-700">
                  <span className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-green-600 text-sm">✓</span>
                  </span>
                  <span>Valid driver&apos;s license</span>
                </div>
                <div className="flex items-center space-x-3 text-gray-700">
                  <span className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-green-600 text-sm">✓</span>
                  </span>
                  <span>Android/iOS smartphone</span>
                </div>
                <div className="flex items-center space-x-3 text-gray-700">
                  <span className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-green-600 text-sm">✓</span>
                  </span>
                  <span>18+ years old</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Rider Testimonials */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          viewport={{ once: true }}
          className="grid md:grid-cols-2 gap-8 mb-16"
        >
          {riderTestimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 + index * 0.2 }}
              viewport={{ once: true }}
              className="bg-white/90 backdrop-blur-sm rounded-3xl p-6 shadow-lg border border-white/50"
            >
              <div className="flex items-start space-x-4">
                <div className="w-16 h-16 bg-gradient-to-br from-orange-100 to-green-100 rounded-2xl flex items-center justify-center">
                  <span className="text-3xl">{testimonial.avatar}</span>
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-bold text-gray-900">{testimonial.name}</h4>
                      <p className="text-sm text-gray-600">{testimonial.area}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-black text-green-600">{testimonial.earning}</div>
                      <div className="text-xs text-gray-500">Average weekly</div>
                    </div>
                  </div>
                  <blockquote className="text-gray-700 italic">
                    &ldquo;{testimonial.quote}&rdquo;
                  </blockquote>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <div className="bg-gradient-to-br from-gray-50 to-orange-50 rounded-3xl p-8 lg:p-12 border border-orange-200/50">
            <h3 className="text-3xl font-black text-gray-900 mb-4">
              Ready to Start Earning?
            </h3>
            <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
              Join hundreds of riders already earning great money with flexible 
              schedules. Apply now and start earning within 48 hours.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => window.open('https://riders.usefoodnow.com', '_blank')}
                className="group bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold text-xl py-5 px-12 rounded-full shadow-xl shadow-orange-500/30 hover:shadow-2xl hover:shadow-orange-500/40 transition-all duration-300"
              >
                <span className="mr-2">Start Earning</span>
                <span className="inline-block group-hover:translate-x-1 transition-transform">💪</span>
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="border-2 border-gray-300 hover:border-orange-500 text-gray-700 hover:text-orange-600 font-bold text-xl py-5 px-12 rounded-full transition-all duration-300 flex items-center justify-center space-x-2"
              >
                <PhoneIcon className="w-5 h-5" />
                <span>Call Us</span>
              </motion.button>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mt-8 text-sm text-gray-600">
              <div className="flex items-center space-x-2">
                <CalendarDaysIcon className="w-4 h-4" />
                <span>Quick 48-hour approval</span>
              </div>
              <div className="hidden sm:block w-px h-4 bg-gray-300"></div>
              <div className="flex items-center space-x-2">
                <MapPinIcon className="w-4 h-4" />
                <span>Currently hiring in VI, Lekki, Ikeja</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

export default RidersSection