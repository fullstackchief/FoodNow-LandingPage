'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { XMarkIcon, SparklesIcon } from '@heroicons/react/24/outline'

interface ComingSoonModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  description?: string
}

const ComingSoonModal = ({ 
  isOpen, 
  onClose, 
  title = "Coming Soon!", 
  description = "We're working hard to bring you this feature. Stay tuned for updates!" 
}: ComingSoonModalProps) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            {/* Modal */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl relative overflow-hidden"
            >
              {/* Background decoration */}
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-orange-500 to-red-500"></div>
              
              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 transition-colors"
              >
                <XMarkIcon className="w-5 h-5 text-gray-500" />
              </button>

              {/* Content */}
              <div className="text-center space-y-6 pt-4">
                {/* Icon */}
                <div className="w-20 h-20 bg-gradient-to-br from-orange-100 to-orange-200 rounded-full flex items-center justify-center mx-auto">
                  <SparklesIcon className="w-10 h-10 text-orange-600" />
                </div>

                {/* Title */}
                <h3 className="text-2xl font-bold text-gray-800">
                  {title}
                </h3>

                {/* Description */}
                <p className="text-gray-600 leading-relaxed">
                  {description}
                </p>

                {/* CTA */}
                <div className="space-y-3">
                  <button
                    onClick={onClose}
                    className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold py-3 px-6 rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all duration-300"
                  >
                    Got it!
                  </button>
                  
                  <p className="text-sm text-gray-500">
                    Follow us on social media for updates
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

export default ComingSoonModal