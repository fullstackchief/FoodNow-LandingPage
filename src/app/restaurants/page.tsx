'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  ChartBarIcon,
  CurrencyDollarIcon,
  ClockIcon,
  StarIcon,
  UserGroupIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline'
import Navigation from '@/components/layout/Navigation'
import RestaurantOnboardingModal from '@/components/ui/RestaurantOnboardingModal'

export default function RestaurantPartners() {
  const [showOnboardingModal, setShowOnboardingModal] = useState(false)

  const benefits = [
    {
      icon: CurrencyDollarIcon,
      title: 'Increase Revenue',
      description: 'Reach thousands of hungry customers and boost your sales by up to 40%'
    },
    {
      icon: UserGroupIcon,
      title: 'Expand Customer Base',
      description: 'Access our growing network of 10,000+ active food lovers in Lagos'
    },
    {
      icon: ChartBarIcon,
      title: 'Business Analytics',
      description: 'Get detailed insights on orders, popular items, and customer preferences'
    },
    {
      icon: ClockIcon,
      title: 'Flexible Operations',
      description: 'Manage your availability, delivery zones, and operating hours easily'
    },
    {
      icon: ShieldCheckIcon,
      title: 'Secure Payments',
      description: 'Get paid quickly and securely with our trusted payment processing'
    },
    {
      icon: StarIcon,
      title: 'Brand Visibility',
      description: 'Showcase your restaurant to Lagos food enthusiasts with premium listings'
    }
  ]

  const handleApplicationComplete = (applicationData: {
    firstName: string
    lastName: string
    email: string
    phone: string
    restaurantName: string
    restaurantAddress: string
    cacDocument: File | null
    regulatoryId: File | null
    managerName: string
    managerEmail: string
    managerPhone: string
    applicationId?: string
    status?: string
    submittedAt?: string
  }) => {
    // In a real app, this would submit to Supabase
    console.log('Restaurant application submitted:', applicationData)
    
    // Store application data locally for demo purposes
    localStorage.setItem('restaurantApplication', JSON.stringify(applicationData))
    
    // Show success message and option to access dashboard
    setTimeout(() => {
      const accessDashboard = confirm('Application submitted successfully! Would you like to access your dashboard?')
      if (accessDashboard) {
        window.location.href = '/restaurant-dashboard'
      }
    }, 1000)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50/30">
      <Navigation />
      
      {/* Hero Section */}
      <section className="relative pt-24 pb-16 overflow-hidden">
        {/* Decorative Elements */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-green-200/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-green-300/20 rounded-full blur-3xl"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-5xl md:text-6xl font-black text-gray-900 mb-6"
            >
              Partner with{' '}
              <span className="bg-gradient-to-r from-green-600 to-green-500 bg-clip-text text-transparent">
                FoodNow
              </span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto mb-8"
            >
              Join Lagos&apos; fastest-growing food delivery platform and reach thousands of hungry customers every day
            </motion.p>
            
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <button
                onClick={() => setShowOnboardingModal(true)}
                className="bg-gradient-to-r from-green-500 to-green-600 text-white font-bold text-lg py-4 px-8 rounded-full transition-all duration-300 transform hover:scale-105 shadow-xl shadow-green-500/30 hover:shadow-2xl hover:shadow-green-500/40"
              >
                Join as Restaurant Partner
              </button>
              <Link
                href="/restaurant-dashboard"
                className="border-2 border-green-500 text-green-600 hover:bg-green-500 hover:text-white font-bold text-lg py-4 px-8 rounded-full transition-all duration-300 transform hover:scale-105"
              >
                Access Dashboard
              </Link>
            </motion.div>
          </div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16"
          >
            <div className="text-center">
              <div className="text-4xl font-black text-green-600 mb-2">500+</div>
              <div className="text-gray-600">Partner Restaurants</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-black text-green-600 mb-2">10K+</div>
              <div className="text-gray-600">Daily Orders</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-black text-green-600 mb-2">₦50M+</div>
              <div className="text-gray-600">Monthly Revenue</div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-gray-900 mb-4">
              Why Partner with <span className="text-green-600">FoodNow</span>?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              We provide everything you need to grow your restaurant business in the digital age
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {benefits.map((benefit, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-gradient-to-br from-green-50 to-white p-8 rounded-3xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2"
              >
                <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mb-6">
                  <benefit.icon className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">{benefit.title}</h3>
                <p className="text-gray-600">{benefit.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 bg-gradient-to-br from-green-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-gray-900 mb-4">
              Simple Onboarding Process
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Get started in just a few easy steps
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              { step: 1, title: 'Apply', description: 'Fill out our simple application form' },
              { step: 2, title: 'Review', description: 'We review your application within 24 hours' },
              { step: 3, title: 'Setup', description: 'Complete your menu and restaurant profile' },
              { step: 4, title: 'Launch', description: 'Start receiving orders immediately' }
            ].map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="text-center"
              >
                <div className="w-16 h-16 bg-green-500 text-white rounded-full flex items-center justify-center font-bold text-xl mb-4 mx-auto">
                  {step.step}
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{step.title}</h3>
                <p className="text-gray-600">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-green-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-black text-white mb-4">
            Ready to Grow Your Restaurant?
          </h2>
          <p className="text-xl text-green-100 mb-8">
            Join thousands of successful restaurants already partnered with FoodNow
          </p>
          <button
            onClick={() => setShowOnboardingModal(true)}
            className="bg-white text-green-600 hover:bg-gray-100 font-bold text-lg py-4 px-8 rounded-full transition-all duration-300 transform hover:scale-105 shadow-xl"
          >
            Start Your Application
          </button>
        </div>
      </section>

      {/* Restaurant Onboarding Modal */}
      <RestaurantOnboardingModal
        isOpen={showOnboardingModal}
        onClose={() => setShowOnboardingModal(false)}
        onComplete={handleApplicationComplete}
      />
    </div>
  )
}