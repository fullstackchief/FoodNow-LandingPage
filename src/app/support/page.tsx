'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { 
  QuestionMarkCircleIcon,
  ChatBubbleLeftRightIcon,
  PhoneIcon,
  EnvelopeIcon,
  ArrowLeftIcon,
  MagnifyingGlassIcon,
  ChevronDownIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'
import Navigation from '@/components/layout/Navigation'
import Button from '@/components/ui/Button'

const faqs = [
  {
    category: 'Orders',
    questions: [
      {
        question: 'How can I track my order?',
        answer: 'You can track your order using the order number sent to your phone/email. Visit our Track Order page or check your order details in your dashboard.'
      },
      {
        question: 'Can I cancel my order?',
        answer: 'Orders can be cancelled within 5 minutes of placement if the restaurant hasn\'t started preparing. Contact support for assistance.'
      },
      {
        question: 'What if my order is late?',
        answer: 'If your order is significantly delayed beyond the estimated time, please contact our support team and we\'ll help resolve the issue.'
      },
      {
        question: 'Can I modify my order after placing it?',
        answer: 'Unfortunately, orders cannot be modified once placed and payment is confirmed. You can place a new order if needed.'
      }
    ]
  },
  {
    category: 'Payments',
    questions: [
      {
        question: 'What payment methods do you accept?',
        answer: 'We accept all major debit/credit cards (Visa, Mastercard, Verve), bank transfers, and USSD payments through Paystack.'
      },
      {
        question: 'Is my payment information secure?',
        answer: 'Yes, all payments are processed securely through Paystack, which is PCI DSS compliant. We never store your card details.'
      },
      {
        question: 'Can I get a refund?',
        answer: 'Refunds are processed for cancelled orders or in case of quality issues. Refunds typically take 3-7 business days to reflect in your account.'
      }
    ]
  },
  {
    category: 'Delivery',
    questions: [
      {
        question: 'What are your delivery areas?',
        answer: 'Currently, we deliver within Lagos, starting with Isolo and surrounding areas. Check our coverage map for your specific location.'
      },
      {
        question: 'How much does delivery cost?',
        answer: 'Delivery fees vary based on distance and time of day. You\'ll see the exact fee before confirming your order.'
      },
      {
        question: 'Can I schedule a delivery for later?',
        answer: 'Yes, you can schedule deliveries up to 24 hours in advance during our operating hours.'
      }
    ]
  },
  {
    category: 'Account',
    questions: [
      {
        question: 'How do I reset my password?',
        answer: 'Use the "Forgot Password" link on the login page. You\'ll receive a reset link via email.'
      },
      {
        question: 'Can I change my phone number?',
        answer: 'Yes, you can update your phone number in your profile settings. You\'ll need to verify the new number.'
      },
      {
        question: 'How do I delete my account?',
        answer: 'Account deletion can be requested through your profile settings or by contacting our support team.'
      }
    ]
  }
]

const SupportPage = () => {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [openFAQ, setOpenFAQ] = useState<string | null>(null)
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    orderNumber: '',
    subject: '',
    message: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitMessage, setSubmitMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const filteredFAQs = faqs.filter(category => {
    if (selectedCategory !== 'all' && category.category.toLowerCase() !== selectedCategory) {
      return false
    }
    
    if (searchQuery) {
      return category.questions.some(q => 
        q.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.answer.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }
    
    return true
  })

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSubmitMessage(null)

    try {
      // Simulate form submission
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setSubmitMessage({ 
        type: 'success', 
        text: 'Your message has been sent! We\'ll get back to you within 24 hours.' 
      })
      
      setContactForm({
        name: '',
        email: '',
        orderNumber: '',
        subject: '',
        message: ''
      })
    } catch (error) {
      setSubmitMessage({ 
        type: 'error', 
        text: 'Failed to send message. Please try again.' 
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="pt-20 pb-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Header */}
          <div className="text-center mb-12">
            <Link 
              href="/"
              className="inline-flex items-center space-x-2 text-gray-600 hover:text-orange-600 transition-colors mb-6"
            >
              <ArrowLeftIcon className="w-5 h-5" />
              <span>Back to Home</span>
            </Link>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <h1 className="text-4xl font-bold text-gray-900 mb-4">How can we help?</h1>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Find answers to common questions or get in touch with our support team
              </p>
            </motion.div>
          </div>

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12"
          >
            <div className="bg-white rounded-2xl shadow-sm p-6 text-center">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MagnifyingGlassIcon className="w-8 h-8 text-orange-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Track Order</h3>
              <p className="text-gray-600 mb-4">Check the status of your current order</p>
              <Link href="/track-order">
                <Button theme="customer" variant="outline" size="sm">
                  Track Now
                </Button>
              </Link>
            </div>

            <div className="bg-white rounded-2xl shadow-sm p-6 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <ChatBubbleLeftRightIcon className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Live Chat</h3>
              <p className="text-gray-600 mb-4">Chat with our support team</p>
              <Button theme="customer" variant="outline" size="sm">
                Start Chat
              </Button>
            </div>

            <div className="bg-white rounded-2xl shadow-sm p-6 text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <PhoneIcon className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Call Us</h3>
              <p className="text-gray-600 mb-4">Speak directly with support</p>
              <a href="tel:+2348100000000">
                <Button theme="customer" variant="outline" size="sm">
                  Call Now
                </Button>
              </a>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            
            {/* FAQ Section */}
            <div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl shadow-sm p-6"
              >
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Frequently Asked Questions</h2>
                
                {/* Search & Filter */}
                <div className="space-y-4 mb-6">
                  <div className="relative">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search FAQs..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                  </div>
                  
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  >
                    <option value="all">All Categories</option>
                    <option value="orders">Orders</option>
                    <option value="payments">Payments</option>
                    <option value="delivery">Delivery</option>
                    <option value="account">Account</option>
                  </select>
                </div>

                {/* FAQ List */}
                <div className="space-y-4">
                  {filteredFAQs.map((category) => (
                    <div key={category.category}>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">
                        {category.category}
                      </h3>
                      <div className="space-y-2">
                        {category.questions.map((faq, index) => {
                          const faqId = `${category.category}-${index}`
                          const isOpen = openFAQ === faqId
                          
                          return (
                            <div key={faqId} className="border border-gray-200 rounded-lg">
                              <button
                                onClick={() => setOpenFAQ(isOpen ? null : faqId)}
                                className="w-full px-4 py-3 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
                              >
                                <span className="font-medium text-gray-900">{faq.question}</span>
                                <ChevronDownIcon 
                                  className={`w-5 h-5 text-gray-400 transform transition-transform ${
                                    isOpen ? 'rotate-180' : ''
                                  }`} 
                                />
                              </button>
                              {isOpen && (
                                <div className="px-4 pb-3 border-t border-gray-100">
                                  <p className="text-gray-600">{faq.answer}</p>
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>

                {filteredFAQs.length === 0 && (
                  <div className="text-center py-8">
                    <QuestionMarkCircleIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No FAQs found matching your search.</p>
                  </div>
                )}
              </motion.div>
            </div>

            {/* Contact Form */}
            <div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-2xl shadow-sm p-6"
              >
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Contact Support</h2>
                
                {submitMessage && (
                  <div className={`p-4 rounded-lg mb-6 ${
                    submitMessage.type === 'success'
                      ? 'bg-green-50 text-green-800 border border-green-200'
                      : 'bg-red-50 text-red-800 border border-red-200'
                  }`}>
                    {submitMessage.text}
                  </div>
                )}

                <form onSubmit={handleContactSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Full Name
                      </label>
                      <input
                        type="text"
                        required
                        value={contactForm.name}
                        onChange={(e) => setContactForm(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        placeholder="Your full name"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email Address
                      </label>
                      <input
                        type="email"
                        required
                        value={contactForm.email}
                        onChange={(e) => setContactForm(prev => ({ ...prev, email: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        placeholder="your@email.com"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Order Number (Optional)
                    </label>
                    <input
                      type="text"
                      value={contactForm.orderNumber}
                      onChange={(e) => setContactForm(prev => ({ ...prev, orderNumber: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="e.g., FN20241225001"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Subject
                    </label>
                    <select
                      required
                      value={contactForm.subject}
                      onChange={(e) => setContactForm(prev => ({ ...prev, subject: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    >
                      <option value="">Select a topic</option>
                      <option value="order-issue">Order Issue</option>
                      <option value="payment-problem">Payment Problem</option>
                      <option value="delivery-delay">Delivery Delay</option>
                      <option value="refund-request">Refund Request</option>
                      <option value="account-help">Account Help</option>
                      <option value="restaurant-partner">Restaurant Partnership</option>
                      <option value="rider-application">Rider Application</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Message
                    </label>
                    <textarea
                      required
                      rows={6}
                      value={contactForm.message}
                      onChange={(e) => setContactForm(prev => ({ ...prev, message: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
                      placeholder="Please describe your issue or question in detail..."
                    />
                  </div>

                  <Button
                    type="submit"
                    theme="customer"
                    variant="primary"
                    fullWidth
                    loading={isSubmitting}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Sending...' : 'Send Message'}
                  </Button>
                </form>

                {/* Contact Info */}
                <div className="mt-8 pt-6 border-t border-gray-100">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Other Ways to Reach Us</h3>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3 text-gray-600">
                      <PhoneIcon className="w-5 h-5" />
                      <span>+234 810 000 0000</span>
                    </div>
                    <div className="flex items-center space-x-3 text-gray-600">
                      <EnvelopeIcon className="w-5 h-5" />
                      <span>support@foodnow.ng</span>
                    </div>
                    <div className="flex items-center space-x-3 text-gray-600">
                      <ChatBubbleLeftRightIcon className="w-5 h-5" />
                      <span>Live chat available 9 AM - 10 PM</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>

          {/* Emergency Contact */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-12 bg-red-50 border border-red-200 rounded-2xl p-6"
          >
            <div className="flex items-start space-x-3">
              <ExclamationTriangleIcon className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-lg font-semibold text-red-900 mb-2">Emergency or Urgent Issues</h3>
                <p className="text-red-800 mb-4">
                  For urgent delivery issues, safety concerns, or payment problems, 
                  call our emergency hotline immediately.
                </p>
                <a 
                  href="tel:+2348100000000"
                  className="inline-flex items-center space-x-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  <PhoneIcon className="w-4 h-4" />
                  <span>Emergency: +234 810 000 0000</span>
                </a>
              </div>
            </div>
          </motion.div>

        </div>
      </div>
    </div>
  )
}

export default SupportPage