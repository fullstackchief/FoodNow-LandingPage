'use client'

import { motion, HTMLMotionProps } from 'framer-motion'
import { forwardRef } from 'react'

interface CardProps extends Omit<HTMLMotionProps<"div">, "children"> {
  children: React.ReactNode
  hover?: boolean
  glass?: boolean
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ children, hover = true, glass = false, className = '', ...props }, ref) => {
    const baseClasses = 'rounded-3xl p-8 transition-all duration-300'
    const hoverClasses = hover ? 'hover:shadow-xl hover:-translate-y-1' : ''
    const backgroundClasses = glass 
      ? 'glassmorphism' 
      : 'bg-white shadow-lg'
    
    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className={`${baseClasses} ${backgroundClasses} ${hoverClasses} ${className}`}
        {...props}
      >
        {children}
      </motion.div>
    )
  }
)

Card.displayName = 'Card'

export default Card