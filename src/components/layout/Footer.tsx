'use client'

import { motion } from 'framer-motion'
import { 
  EnvelopeIcon, 
  PhoneIcon, 
  MapPinIcon,
  HeartIcon
} from '@heroicons/react/24/outline'

const Footer = () => {
  const companyLinks = [
    { name: 'About FoodNow', href: '#about' },
    { name: 'Our Mission', href: '#mission' },
    { name: 'Careers', href: '#careers' },
    { name: 'Press Kit', href: '#press' },
    { name: 'Blog', href: '#blog' }
  ]

  const serviceLinks = [
    { name: 'Food Delivery', href: '#delivery' },
    { name: 'Restaurant Partners', href: '#restaurants' },
    { name: 'Rider Network', href: '#riders' },
    { name: 'Corporate Catering', href: '#corporate' },
    { name: 'API Integration', href: '#api' }
  ]

  const partnerLinks = [
    { name: 'Become a Partner', href: '#partner' },
    { name: 'Restaurant Portal', href: '#portal' },
    { name: 'Rider Application', href: '#apply' },
    { name: 'Business Solutions', href: '#business' },
    { name: 'Franchise Opportunities', href: '#franchise' }
  ]

  const socialLinks = [
    { name: 'Facebook', href: '#', icon: '📘' },
    { name: 'Instagram', href: '#', icon: '📷' },
    { name: 'Twitter', href: '#', icon: '🐦' },
    { name: 'LinkedIn', href: '#', icon: '💼' },
    { name: 'YouTube', href: '#', icon: '📺' }
  ]

  return (
    <footer className="relative bg-gradient-to-b from-gray-900 to-black overflow-hidden">
      {/* Curved Top Border */}
      <div className="absolute -top-24 left-0 right-0">
        <svg
          viewBox="0 0 1200 120"
          className="w-full h-24"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="footerGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#FF6B35" />
              <stop offset="50%" stopColor="#FF8A65" />
              <stop offset="100%" stopColor="#FF5722" />
            </linearGradient>
          </defs>
          <path
            d="M0,120 C300,0 900,0 1200,120 L1200,0 L0,0 Z"
            fill="url(#footerGradient)"
          />
        </svg>
      </div>

      {/* Background Decorations */}
      <div className="absolute top-10 left-10 w-80 h-80 bg-orange-500/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-red-500/10 rounded-full blur-3xl"></div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-12">
        
        {/* Main Footer Content */}
        <div className="grid lg:grid-cols-4 md:grid-cols-2 gap-8 lg:gap-12 mb-16">
          
          {/* Company Column */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="space-y-6"
          >
            <div>
              <h3 className="text-3xl font-black bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent mb-3">
                FoodNow
              </h3>
              <p className="text-gray-300 leading-relaxed mb-6">
                Lagos&apos; premium food delivery platform, connecting you with the finest restaurants 
                for an exceptional culinary experience delivered to your doorstep.
              </p>
              <div className="bg-gradient-to-r from-orange-500/20 to-red-500/20 rounded-2xl p-4 border border-orange-500/30">
                <p className="text-orange-300 text-sm font-semibold flex items-center">
                  <HeartIcon className="w-4 h-4 mr-2" />
                  Made with love in Lagos, Nigeria
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-bold text-white text-lg">Company</h4>
              <ul className="space-y-3">
                {companyLinks.map((link, index) => (
                  <motion.li
                    key={index}
                    whileHover={{ x: 5 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <a
                      href={link.href}
                      className="text-gray-400 hover:text-orange-400 transition-colors duration-300 text-sm"
                    >
                      {link.name}
                    </a>
                  </motion.li>
                ))}
              </ul>
            </div>
          </motion.div>

          {/* Services Column */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            viewport={{ once: true }}
            className="space-y-6"
          >
            <div>
              <h4 className="font-bold text-white text-lg mb-6">Our Services</h4>
              <ul className="space-y-3">
                {serviceLinks.map((link, index) => (
                  <motion.li
                    key={index}
                    whileHover={{ x: 5 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <a
                      href={link.href}
                      className="text-gray-400 hover:text-orange-400 transition-colors duration-300 text-sm"
                    >
                      {link.name}
                    </a>
                  </motion.li>
                ))}
              </ul>
            </div>

            <div className="bg-gray-800/50 rounded-2xl p-4 border border-gray-700">
              <h5 className="text-white font-semibold mb-2">Service Hours</h5>
              <p className="text-gray-300 text-sm">
                <span className="block">Mon-Sun: 6:00 AM - 11:00 PM</span>
                <span className="block text-orange-400">24/7 Customer Support</span>
              </p>
            </div>
          </motion.div>

          {/* Partners Column */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            viewport={{ once: true }}
            className="space-y-6"
          >
            <div>
              <h4 className="font-bold text-white text-lg mb-6">Partners</h4>
              <ul className="space-y-3">
                {partnerLinks.map((link, index) => (
                  <motion.li
                    key={index}
                    whileHover={{ x: 5 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <a
                      href={link.href}
                      className="text-gray-400 hover:text-orange-400 transition-colors duration-300 text-sm"
                    >
                      {link.name}
                    </a>
                  </motion.li>
                ))}
              </ul>
            </div>

            <div className="bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl p-4 text-white">
              <h5 className="font-bold mb-2">Join Our Network</h5>
              <p className="text-sm opacity-90 mb-3">
                Partner with Lagos&apos; fastest growing food delivery platform
              </p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-white/20 backdrop-blur-sm text-white font-semibold py-2 px-4 rounded-xl text-sm hover:bg-white/30 transition-all duration-300"
              >
                Learn More
              </motion.button>
            </div>
          </motion.div>

          {/* Contact Column */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            viewport={{ once: true }}
            className="space-y-6"
          >
            <div>
              <h4 className="font-bold text-white text-lg mb-6">Contact Us</h4>
              
              <div className="space-y-4">
                <motion.div 
                  whileHover={{ scale: 1.02 }}
                  className="flex items-center space-x-3 bg-gray-800/50 rounded-xl p-3 border border-gray-700"
                >
                  <EnvelopeIcon className="w-5 h-5 text-orange-400" />
                  <div>
                    <p className="text-white text-sm font-medium">Email</p>
                    <a href="mailto:hello@usefoodnow.com" className="text-gray-300 text-xs hover:text-orange-400 transition-colors">
                      hello@usefoodnow.com
                    </a>
                  </div>
                </motion.div>

                <motion.div 
                  whileHover={{ scale: 1.02 }}
                  className="flex items-center space-x-3 bg-gray-800/50 rounded-xl p-3 border border-gray-700"
                >
                  <PhoneIcon className="w-5 h-5 text-orange-400" />
                  <div>
                    <p className="text-white text-sm font-medium">Phone</p>
                    <a href="tel:+2341234567890" className="text-gray-300 text-xs hover:text-orange-400 transition-colors">
                      +234 123 456 7890
                    </a>
                  </div>
                </motion.div>

                <motion.div 
                  whileHover={{ scale: 1.02 }}
                  className="flex items-center space-x-3 bg-gray-800/50 rounded-xl p-3 border border-gray-700"
                >
                  <MapPinIcon className="w-5 h-5 text-orange-400" />
                  <div>
                    <p className="text-white text-sm font-medium">Address</p>
                    <p className="text-gray-300 text-xs">
                      Victoria Island, Lagos<br />
                      Nigeria
                    </p>
                  </div>
                </motion.div>
              </div>
            </div>

            {/* Social Media */}
            <div>
              <h5 className="font-bold text-white mb-4">Follow Us</h5>
              <div className="flex space-x-3">
                {socialLinks.map((social, index) => (
                  <motion.a
                    key={index}
                    href={social.href}
                    whileHover={{ scale: 1.1, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    className="w-10 h-10 bg-gray-800 hover:bg-gradient-to-br hover:from-orange-500 hover:to-red-500 rounded-xl flex items-center justify-center transition-all duration-300 border border-gray-700 hover:border-orange-500"
                  >
                    <span className="text-lg">{social.icon}</span>
                  </motion.a>
                ))}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Bottom Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          viewport={{ once: true }}
          className="border-t border-gray-800 pt-8"
        >
          <div className="flex flex-col lg:flex-row justify-between items-center space-y-4 lg:space-y-0">
            <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-6">
              <p className="text-gray-400 text-sm">
                © 2024 FoodNow. All rights reserved.
              </p>
              <div className="flex space-x-6 text-xs text-gray-500">
                <a href="#privacy" className="hover:text-orange-400 transition-colors">Privacy Policy</a>
                <a href="#terms" className="hover:text-orange-400 transition-colors">Terms of Service</a>
                <a href="#cookies" className="hover:text-orange-400 transition-colors">Cookie Policy</a>
              </div>
            </div>
            
            <div className="flex items-center space-x-2 text-sm text-gray-400">
              <span>Built with</span>
              <HeartIcon className="w-4 h-4 text-red-500" />
              <span>in Lagos</span>
            </div>
          </div>
        </motion.div>
      </div>
    </footer>
  )
}

export default Footer