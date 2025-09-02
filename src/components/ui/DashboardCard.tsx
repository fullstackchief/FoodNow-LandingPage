'use client'

import { motion } from 'framer-motion'
import { ReactNode } from 'react'

interface DashboardCardProps {
  title?: string
  subtitle?: string
  children: ReactNode
  className?: string
  variant?: 'default' | 'premium' | 'glass' | 'stats'
  hover?: boolean
  padding?: 'sm' | 'md' | 'lg'
  icon?: ReactNode
  rightElement?: ReactNode
}

const DashboardCard = ({
  title,
  subtitle,
  children,
  className = '',
  variant = 'default',
  hover = true,
  padding = 'lg',
  icon,
  rightElement
}: DashboardCardProps) => {
  const variants = {
    default: 'card-premium',
    premium: 'card-premium bg-gradient-to-br from-white via-white to-orange-50/30',
    glass: 'card-glass',
    stats: 'card-stats'
  }

  const paddings = {
    sm: 'p-4',
    md: 'p-6', 
    lg: 'p-8'
  }

  const hoverEffect = hover ? 'hover-lift' : ''

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`${variants[variant]} ${paddings[padding]} ${hoverEffect} ${className}`}
    >
      {/* Header Section */}
      {(title || icon || rightElement) && (
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            {icon && (
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-100 to-orange-200 rounded-2xl flex items-center justify-center">
                  {icon}
                </div>
              </div>
            )}
            {title && (
              <div>
                <h3 className="text-premium text-lg">{title}</h3>
                {subtitle && (
                  <p className="text-muted-premium text-sm mt-1">{subtitle}</p>
                )}
              </div>
            )}
          </div>
          {rightElement && (
            <div className="flex-shrink-0">
              {rightElement}
            </div>
          )}
        </div>
      )}
      
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </motion.div>
  )
}

export default DashboardCard