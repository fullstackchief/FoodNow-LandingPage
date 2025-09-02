'use client'

import { motion, useAnimation, useInView } from 'framer-motion'
import { ReactNode, useEffect, useRef, useState } from 'react'

interface StatsCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: ReactNode
  trend?: {
    value: number
    isPositive: boolean
    label: string
  }
  color?: 'orange' | 'green' | 'gray' | 'red' | 'purple'
  animate?: boolean
  className?: string
}

const StatsCard = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  color = 'orange',
  animate = true,
  className = ''
}: StatsCardProps) => {
  const controls = useAnimation()
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, amount: 0.3 })
  const [displayValue, setDisplayValue] = useState(0)

  // Animate number counting
  useEffect(() => {
    if (isInView && animate && typeof value === 'number') {
      const timer = setInterval(() => {
        setDisplayValue(prev => {
          if (prev < value) {
            return Math.min(prev + Math.ceil(value / 50), value)
          }
          clearInterval(timer)
          return value
        })
      }, 30)
      
      return () => clearInterval(timer)
    }
  }, [isInView, value, animate])

  useEffect(() => {
    if (isInView) {
      controls.start('visible')
    }
  }, [isInView, controls])

  const colorVariants = {
    orange: {
      bg: 'from-orange-50 to-orange-100/50',
      icon: 'text-orange-600 bg-orange-100',
      text: 'text-orange-700',
      accent: 'border-orange-200'
    },
    green: {
      bg: 'from-green-50 to-green-100/50',
      icon: 'text-green-600 bg-green-100',
      text: 'text-green-700',
      accent: 'border-green-200'
    },
    gray: {
      bg: 'from-gray-50 to-gray-100/50',
      icon: 'text-gray-600 bg-gray-100',
      text: 'text-gray-700',
      accent: 'border-gray-200'
    },
    red: {
      bg: 'from-red-50 to-red-100/50',
      icon: 'text-red-600 bg-red-100',
      text: 'text-red-700',
      accent: 'border-red-200'
    },
    purple: {
      bg: 'from-purple-50 to-purple-100/50',
      icon: 'text-purple-600 bg-purple-100',
      text: 'text-purple-700',
      accent: 'border-purple-200'
    }
  }

  const cardVariants = {
    hidden: {
      opacity: 0,
      y: 30,
      scale: 0.9
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.6,
        ease: [0.25, 0.25, 0, 1] as [number, number, number, number]
      }
    }
  }

  return (
    <motion.div
      ref={ref}
      variants={cardVariants}
      initial="hidden"
      animate={controls}
      className={`relative overflow-hidden ${className}`}
    >
      <div className={`
        bg-gradient-to-br ${colorVariants[color].bg} 
        border ${colorVariants[color].accent}
        rounded-2xl p-6 shadow-sm hover:shadow-lg
        transition-all duration-300 hover:-translate-y-1
        relative overflow-hidden group
      `}>
        {/* Background Pattern */}
        <div className="absolute top-0 right-0 w-32 h-32 opacity-5">
          <div className="w-full h-full bg-gradient-to-br from-current to-transparent rounded-full transform rotate-45 translate-x-8 -translate-y-8"></div>
        </div>

        <div className="relative z-10 flex items-start justify-between">
          {/* Content */}
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-4">
              <div className={`
                w-12 h-12 ${colorVariants[color].icon} 
                rounded-xl flex items-center justify-center
                group-hover:scale-110 transition-transform duration-300
              `}>
                {icon}
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-600 uppercase tracking-wide">
                  {title}
                </h3>
                {subtitle && (
                  <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
                )}
              </div>
            </div>

            {/* Value Display */}
            <div className="mb-2">
              <motion.span
                className={`text-3xl font-bold ${colorVariants[color].text}`}
                initial={{ scale: 1 }}
                animate={isInView ? { scale: [1, 1.1, 1] } : {}}
                transition={{ duration: 0.6, delay: 0.3 }}
              >
                {animate && typeof value === 'number' ? displayValue.toLocaleString() : value}
              </motion.span>
            </div>

            {/* Trend Indicator */}
            {trend && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
                className="flex items-center space-x-2"
              >
                <div className={`
                  flex items-center px-2 py-1 rounded-lg text-xs font-medium
                  ${trend.isPositive 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-red-100 text-red-700'}
                `}>
                  <span className={`mr-1 ${trend.isPositive ? '↗' : '↘'}`}>
                    {trend.isPositive ? '↗' : '↘'}
                  </span>
                  {Math.abs(trend.value)}%
                </div>
                <span className="text-xs text-gray-500">{trend.label}</span>
              </motion.div>
            )}
          </div>
        </div>

        {/* Shimmer Effect on Hover */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-out"></div>
      </div>
    </motion.div>
  )
}

export default StatsCard