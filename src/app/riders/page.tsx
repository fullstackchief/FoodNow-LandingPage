'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  TruckIcon,
  BanknotesIcon,
  ClockIcon,
  MapPinIcon,
  ShieldCheckIcon,
  UserGroupIcon,
  ChartBarIcon,
  CheckCircleIcon,
  ArrowTrendingUpIcon
} from '@heroicons/react/24/outline'
import Navigation from '@/components/layout/Navigation'
import RiderOnboardingModal from '@/components/ui/RiderOnboardingModal'

export default function RiderPartners() {
  const [showOnboardingModal, setShowOnboardingModal] = useState(false)

  const benefits = [
    {
      icon: BanknotesIcon,
      title: 'Earn More Money',
      description: 'Make up to ₦15,000 - ₦25,000 daily with flexible working hours',
      highlight: '₦500k+/month'
    },
    {
      icon: ClockIcon,
      title: 'Flexible Schedule',
      description: 'Work when you want, as much as you want. Be your own boss',
      highlight: 'Your Time'
    },
    {
      icon: MapPinIcon,
      title: 'Know Your Routes',
      description: 'Smart routing system helps you deliver faster and earn more',
      highlight: 'Optimized'
    },
    {
      icon: ShieldCheckIcon,
      title: 'Insurance Coverage',
      description: 'Comprehensive insurance coverage while you deliver',
      highlight: 'Protected'
    },
    {
      icon: ChartBarIcon,
      title: 'Track Performance',
      description: 'Real-time earnings dashboard and performance metrics',
      highlight: 'Analytics'
    },
    {
      icon: UserGroupIcon,
      title: 'Rider Community',
      description: 'Join thousands of riders earning with FoodNow',
      highlight: '5000+ Riders'
    }
  ]

  const requirements = [
    'Valid driver\'s license or rider\'s permit',
    'Smartphone with Android 5.0+ or iOS 12+',
    'Motorcycle or bicycle in good condition',
    'Age 18 years or older',
    'Bank account for payments',
    'Clean criminal record'
  ]

  const earningsBreakdown = [
    { type: 'Base Delivery Fee', amount: '₦300 - ₦500', description: 'Per delivery' },
    { type: 'Distance Bonus', amount: '₦50 - ₦200', description: 'Based on km' },
    { type: 'Peak Hour Bonus', amount: '+30%', description: 'Lunch & dinner rush' },
    { type: 'Tips', amount: '₦100 - ₦500', description: 'Keep 100% of tips' },
    { type: 'Weekly Bonus', amount: '₦5,000', description: '50+ deliveries/week' }
  ]

  const handleApplicationComplete = (applicationData: {
    firstName: string
    lastName: string
    email: string
    phone: string
    vehicleType: string
    vehicleMake: string
    vehicleModel: string
    vehiclePlateNumber: string
    driversLicense: File | null
    vehicleRegistration: File | null
    profilePhoto: File | null
    bankName: string
    accountNumber: string
    applicationId?: string
    status?: string
    submittedAt?: string
  }) => {
    console.log('Rider application submitted:', applicationData)
    localStorage.setItem('riderApplication', JSON.stringify(applicationData))
    
    setTimeout(() => {
      const accessDashboard = confirm('Application submitted successfully! Would you like to access your rider dashboard?')
      if (accessDashboard) {
        window.location.href = '/dashboard'
      }
    }, 1000)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-50/30">
      <Navigation />
      
      {/* Hero Section */}
      <section className="relative pt-24 pb-16 overflow-hidden">
        {/* Decorative Elements */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-purple-200/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-purple-300/20 rounded-full blur-3xl"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-5xl md:text-6xl font-black text-gray-900 mb-6"
            >
              Deliver with{' '}
              <span className="bg-gradient-to-r from-purple-600 to-purple-500 bg-clip-text text-transparent">
                FoodNow
              </span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto mb-8"
            >
              Join Lagos&apos; fastest-growing delivery network and earn up to ₦500,000 monthly with flexible hours
            </motion.p>
            
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <button
                onClick={() => setShowOnboardingModal(true)}
                className="bg-gradient-to-r from-purple-500 to-purple-600 text-white font-bold text-lg py-4 px-8 rounded-full transition-all duration-300 transform hover:scale-105 shadow-xl shadow-purple-500/30 hover:shadow-2xl hover:shadow-purple-500/40"
              >
                Start Earning Today
              </button>
              <Link
                href="/dashboard"
                className="border-2 border-purple-500 text-purple-600 hover:bg-purple-500 hover:text-white font-bold text-lg py-4 px-8 rounded-full transition-all duration-300 transform hover:scale-105"
              >
                Rider Dashboard
              </Link>
            </motion.div>
          </div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-16"
          >
            <div className="text-center">
              <div className="text-4xl font-black text-purple-600 mb-2">5000+</div>
              <div className="text-gray-600">Active Riders</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-black text-purple-600 mb-2">₦15K+</div>
              <div className="text-gray-600">Daily Average</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-black text-purple-600 mb-2">2M+</div>
              <div className="text-gray-600">Deliveries Made</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-black text-purple-600 mb-2">4.9★</div>
              <div className="text-gray-600">Rider Rating</div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Earnings Breakdown */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-black text-gray-900 mb-4">
              Your Earning <span className="text-purple-600">Potential</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Transparent pricing with multiple income streams
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-4">
              {earningsBreakdown.map((earning, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-white rounded-2xl border border-purple-100"
                >
                  <div className="flex-1">
                    <h4 className="font-bold text-gray-900">{earning.type}</h4>
                    <p className="text-sm text-gray-600">{earning.description}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-bold text-purple-600">{earning.amount}</span>
                  </div>
                </motion.div>
              ))}
            </div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 }}
              className="bg-gradient-to-br from-purple-600 to-purple-700 rounded-3xl p-8 text-white shadow-2xl"
            >
              <div className="text-center">
                <ArrowTrendingUpIcon className="w-16 h-16 mx-auto mb-4 text-purple-200" />
                <h3 className="text-3xl font-bold mb-2">Potential Monthly Earnings</h3>
                <div className="text-5xl font-black mb-4">₦300K - ₦500K</div>
                <p className="text-purple-100 mb-6">Based on full-time riders (8-10 hours/day)</p>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="bg-white/10 rounded-xl p-3">
                    <div className="font-bold text-lg">Part-time</div>
                    <div className="text-purple-100">₦150K - ₦250K/month</div>
                  </div>
                  <div className="bg-white/10 rounded-xl p-3">
                    <div className="font-bold text-lg">Full-time</div>
                    <div className="text-purple-100">₦300K - ₦500K/month</div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Benefits Grid */}
      <section className="py-16 bg-gradient-to-br from-purple-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-gray-900 mb-4">
              Why Ride with <span className="text-purple-600">FoodNow</span>?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Join the best delivery platform with unmatched benefits
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {benefits.map((benefit, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-3xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2 p-8"
              >
                <div className="flex items-start space-x-4">
                  <div className="w-14 h-14 bg-purple-100 rounded-2xl flex items-center justify-center flex-shrink-0">
                    <benefit.icon className="w-7 h-7 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <span className="text-xs font-bold text-purple-600 uppercase tracking-wider">{benefit.highlight}</span>
                    <h3 className="text-xl font-bold text-gray-900 mt-1 mb-2">{benefit.title}</h3>
                    <p className="text-gray-600">{benefit.description}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Requirements */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-black text-gray-900 mb-6">
                Simple <span className="text-purple-600">Requirements</span>
              </h2>
              <p className="text-xl text-gray-600 mb-8">
                Start earning in less than 24 hours with these basic requirements:
              </p>
              
              <div className="space-y-4">
                {requirements.map((req, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center space-x-3"
                  >
                    <CheckCircleIcon className="w-6 h-6 text-green-500 flex-shrink-0" />
                    <span className="text-gray-700 font-medium">{req}</span>
                  </motion.div>
                ))}
              </div>

              <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                onClick={() => setShowOnboardingModal(true)}
                className="mt-8 bg-gradient-to-r from-purple-500 to-purple-600 text-white font-bold text-lg py-4 px-8 rounded-full transition-all duration-300 transform hover:scale-105 shadow-xl shadow-purple-500/30"
              >
                Apply Now
              </motion.button>
            </div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className="relative"
            >
              <div className="bg-gradient-to-br from-purple-100 to-purple-200 rounded-3xl p-8 shadow-2xl">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white rounded-2xl p-4 text-center">
                    <TruckIcon className="w-12 h-12 text-purple-600 mx-auto mb-2" />
                    <div className="font-bold text-gray-900">Quick Setup</div>
                    <div className="text-sm text-gray-600">Start in 24hrs</div>
                  </div>
                  <div className="bg-white rounded-2xl p-4 text-center">
                    <BanknotesIcon className="w-12 h-12 text-green-600 mx-auto mb-2" />
                    <div className="font-bold text-gray-900">Daily Pay</div>
                    <div className="text-sm text-gray-600">Instant cash-out</div>
                  </div>
                  <div className="bg-white rounded-2xl p-4 text-center">
                    <ShieldCheckIcon className="w-12 h-12 text-blue-600 mx-auto mb-2" />
                    <div className="font-bold text-gray-900">Insured</div>
                    <div className="text-sm text-gray-600">Full coverage</div>
                  </div>
                  <div className="bg-white rounded-2xl p-4 text-center">
                    <UserGroupIcon className="w-12 h-12 text-orange-600 mx-auto mb-2" />
                    <div className="font-bold text-gray-900">Support</div>
                    <div className="text-sm text-gray-600">24/7 help</div>
                  </div>
                </div>
              </div>
              
              {/* Floating badge */}
              <div className="absolute -top-4 -right-4 bg-green-500 text-white px-4 py-2 rounded-full font-bold shadow-lg animate-bounce">
                Hiring Now! 🚀
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 bg-gradient-to-br from-purple-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-gray-900 mb-4">
              Start Earning in <span className="text-purple-600">4 Simple Steps</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Quick and easy onboarding process
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              { step: 1, title: 'Apply Online', description: 'Fill out the simple application form', icon: '📝' },
              { step: 2, title: 'Document Verification', description: 'Upload required documents', icon: '📄' },
              { step: 3, title: 'Training', description: 'Complete quick online training', icon: '🎓' },
              { step: 4, title: 'Start Earning', description: 'Accept orders and earn money', icon: '💰' }
            ].map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="text-center"
              >
                <div className="w-20 h-20 bg-purple-500 text-white rounded-full flex items-center justify-center font-bold text-2xl mb-4 mx-auto shadow-lg">
                  <span className="text-3xl">{step.icon}</span>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Step {step.step}: {step.title}</h3>
                <p className="text-gray-600">{step.description}</p>
                {index < 3 && (
                  <div className="hidden md:block absolute top-10 left-full w-full">
                    <div className="w-full h-0.5 bg-purple-200"></div>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-purple-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-black text-white mb-4">
            Ready to Start Your Journey?
          </h2>
          <p className="text-xl text-purple-100 mb-8">
            Join thousands of riders earning great money with flexible hours
          </p>
          <button
            onClick={() => setShowOnboardingModal(true)}
            className="bg-white text-purple-600 hover:bg-gray-100 font-bold text-lg py-4 px-8 rounded-full transition-all duration-300 transform hover:scale-105 shadow-xl"
          >
            Become a FoodNow Rider
          </button>
          
          <div className="mt-8 flex items-center justify-center space-x-8 text-white">
            <div className="flex items-center space-x-2">
              <CheckCircleIcon className="w-5 h-5" />
              <span>No registration fee</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircleIcon className="w-5 h-5" />
              <span>Start today</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircleIcon className="w-5 h-5" />
              <span>24/7 support</span>
            </div>
          </div>
        </div>
      </section>

      {/* Rider Onboarding Modal */}
      <RiderOnboardingModal
        isOpen={showOnboardingModal}
        onClose={() => setShowOnboardingModal(false)}
        onComplete={handleApplicationComplete}
      />
    </div>
  )
}