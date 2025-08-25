import Link from 'next/link'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'

export default function About() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50/30">
      <div className="max-w-4xl mx-auto px-4 py-20">
        {/* Back Button */}
        <Link 
          href="/"
          className="inline-flex items-center space-x-2 text-orange-600 hover:text-orange-700 mb-8 transition-colors"
        >
          <ArrowLeftIcon className="w-5 h-5" />
          <span>Back to Home</span>
        </Link>

        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-black text-gray-800 mb-4">
            About <span className="bg-gradient-to-r from-orange-600 to-orange-500 bg-clip-text text-transparent">FoodNow</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Lagos&apos; premier food delivery platform, connecting you with the finest restaurants for an exceptional culinary experience.
          </p>
        </div>

        {/* Content */}
        <div className="bg-white rounded-3xl shadow-xl p-12 text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-orange-100 to-orange-200 rounded-full flex items-center justify-center mx-auto mb-8">
            <span className="text-4xl">🚀</span>
          </div>
          
          <h2 className="text-3xl font-bold text-gray-800 mb-6">Coming Soon</h2>
          <p className="text-gray-600 text-lg leading-relaxed mb-8">
            We&apos;re crafting an amazing story about FoodNow - from our humble beginnings to becoming Lagos&apos; favorite food delivery platform. 
            Stay tuned for our complete company story, mission, and vision.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/"
              className="bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 px-8 rounded-full transition-colors"
            >
              Back to Home
            </Link>
            <button className="border-2 border-gray-300 hover:border-orange-500 hover:text-orange-600 font-semibold py-3 px-8 rounded-full transition-colors">
              Notify Me When Ready
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}