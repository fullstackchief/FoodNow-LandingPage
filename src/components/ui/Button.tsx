'use client'

import { motion, HTMLMotionProps } from 'framer-motion'
import { forwardRef } from 'react'

interface ButtonProps extends Omit<HTMLMotionProps<"button">, "children"> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  theme?: 'customer' | 'restaurant' | 'rider' | 'admin' | 'default'
  children: React.ReactNode
  loading?: boolean
  icon?: React.ReactNode
  fullWidth?: boolean
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    variant = 'primary', 
    size = 'md', 
    theme = 'default',
    children, 
    loading = false,
    icon,
    fullWidth = false,
    className = '',
    disabled,
    ...props 
  }, ref) => {
    const baseClasses = 'inline-flex items-center justify-center font-semibold rounded-lg transition-all duration-300 focus:outline-none focus:ring-4 disabled:opacity-50 disabled:cursor-not-allowed mobile-touch-optimized'
    
    const getThemeVariants = (theme: string) => {
      const themeConfigs = {
        customer: {
          primary: 'bg-orange-500 hover:bg-orange-600 text-white shadow-lg hover:shadow-xl focus:ring-orange-200',
          secondary: 'bg-orange-100 hover:bg-orange-200 text-orange-700 shadow-sm hover:shadow-md focus:ring-orange-200',
          outline: 'border-2 border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-white focus:ring-orange-200',
          ghost: 'text-orange-500 hover:bg-orange-50 hover:text-orange-600 focus:ring-orange-200'
        },
        restaurant: {
          primary: 'bg-green-500 hover:bg-green-600 text-white shadow-lg hover:shadow-xl focus:ring-green-200',
          secondary: 'bg-green-100 hover:bg-green-200 text-green-700 shadow-sm hover:shadow-md focus:ring-green-200',
          outline: 'border-2 border-green-500 text-green-500 hover:bg-green-500 hover:text-white focus:ring-green-200',
          ghost: 'text-green-500 hover:bg-green-50 hover:text-green-600 focus:ring-green-200'
        },
        rider: {
          primary: 'bg-purple-500 hover:bg-purple-600 text-white shadow-lg hover:shadow-xl focus:ring-purple-200',
          secondary: 'bg-purple-100 hover:bg-purple-200 text-purple-700 shadow-sm hover:shadow-md focus:ring-purple-200',
          outline: 'border-2 border-purple-500 text-purple-500 hover:bg-purple-500 hover:text-white focus:ring-purple-200',
          ghost: 'text-purple-500 hover:bg-purple-50 hover:text-purple-600 focus:ring-purple-200'
        },
        admin: {
          primary: 'bg-blue-500 hover:bg-blue-600 text-white shadow-lg hover:shadow-xl focus:ring-blue-200',
          secondary: 'bg-slate-100 hover:bg-slate-200 text-slate-700 shadow-sm hover:shadow-md focus:ring-slate-200',
          outline: 'border-2 border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white focus:ring-blue-200',
          ghost: 'text-blue-500 hover:bg-blue-50 hover:text-blue-600 focus:ring-blue-200'
        },
        default: {
          primary: 'bg-orange-500 hover:bg-orange-600 text-white shadow-lg hover:shadow-xl focus:ring-orange-200',
          secondary: 'bg-gray-100 hover:bg-gray-200 text-gray-700 shadow-sm hover:shadow-md focus:ring-gray-200',
          outline: 'border-2 border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-white focus:ring-orange-200',
          ghost: 'text-orange-500 hover:bg-orange-50 hover:text-orange-600 focus:ring-orange-200'
        }
      }
      
      return themeConfigs[theme as keyof typeof themeConfigs] || themeConfigs.default
    }
    
    const variants = getThemeVariants(theme)
    
    const sizes = {
      sm: 'py-2 px-4 text-sm',
      md: 'py-3 px-6 text-base',
      lg: 'py-4 px-8 text-lg'
    }
    
    const widthClass = fullWidth ? 'w-full' : ''
    
    return (
      <motion.button
        ref={ref}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${widthClass} ${className}`}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <svg
            className="animate-spin -ml-1 mr-3 h-5 w-5 text-current"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
        )}
        {icon && !loading && <span className="mr-2">{icon}</span>}
        {children}
      </motion.button>
    )
  }
)

Button.displayName = 'Button'

export default Button