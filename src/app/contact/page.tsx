import Link from 'next/link'
import { ArrowLeftIcon, EnvelopeIcon, PhoneIcon, MapPinIcon } from '@heroicons/react/24/outline'

export default function Contact() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-50/30">
      <div className="max-w-4xl mx-auto px-4 py-20">
        {/* Back Button */}
        <Link 
          href="/"
          className="inline-flex items-center space-x-2 text-purple-600 hover:text-purple-700 mb-8 transition-colors"
        >
          <ArrowLeftIcon className="w-5 h-5" />
          <span>Back to Home</span>
        </Link>

        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-black text-gray-800 mb-4">
            Contact <span className="bg-gradient-to-r from-purple-600 to-purple-500 bg-clip-text text-transparent">FoodNow</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Get in touch with our team. We&apos;re here to help with any questions or feedback.
          </p>
        </div>

        {/* Contact Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white rounded-2xl p-6 text-center shadow-lg">
            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <EnvelopeIcon className="w-6 h-6 text-orange-600" />
            </div>
            <h3 className="font-bold text-gray-800 mb-2">Email</h3>
            <a href="mailto:hello@usefoodnow.com" className="text-gray-600 hover:text-orange-600 transition-colors">
              hello@usefoodnow.com
            </a>
          </div>

          <div className="bg-white rounded-2xl p-6 text-center shadow-lg">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <PhoneIcon className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="font-bold text-gray-800 mb-2">Phone</h3>
            <a href="tel:+2341234567890" className="text-gray-600 hover:text-green-600 transition-colors">
              +234 123 456 7890
            </a>
          </div>

          <div className="bg-white rounded-2xl p-6 text-center shadow-lg">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <MapPinIcon className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="font-bold text-gray-800 mb-2">Address</h3>
            <p className="text-gray-600">
              Victoria Island<br />
              Lagos, Nigeria
            </p>
          </div>
        </div>

        {/* Contact Form */}
        <div className="bg-white rounded-3xl shadow-xl p-12">
          <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center">Send us a Message</h2>
          
          <form className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Name</label>
                <input 
                  type="text" 
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Your name"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                <input 
                  type="email" 
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="your@email.com"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Subject</label>
              <input 
                type="text" 
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="How can we help?"
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Message</label>
              <textarea 
                rows={6}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Tell us more about your inquiry..."
              ></textarea>
            </div>
            
            <div className="text-center">
              <button 
                type="submit"
                className="bg-purple-500 hover:bg-purple-600 text-white font-semibold py-3 px-8 rounded-full transition-colors"
              >
                Send Message
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}