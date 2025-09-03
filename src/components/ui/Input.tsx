'use client'

import { forwardRef, useState, ReactNode } from 'react'
import { EyeIcon, EyeSlashIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline'

interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string
  error?: string
  helperText?: string
  icon?: ReactNode
  iconPosition?: 'left' | 'right'
  size?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'filled'
  theme?: 'customer' | 'restaurant' | 'rider' | 'admin' | 'default'
  fullWidth?: boolean
  showPasswordToggle?: boolean
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({
    label,
    error,
    helperText,
    icon,
    iconPosition = 'left',
    size = 'md',
    variant = 'default',
    theme = 'default',
    fullWidth = true,
    showPasswordToggle = false,
    type = 'text',
    className = '',
    disabled,
    ...props
  }, ref) => {
    const [showPassword, setShowPassword] = useState(false)
    const [isFocused, setIsFocused] = useState(false)

    const inputType = showPasswordToggle && type === 'password' 
      ? (showPassword ? 'text' : 'password') 
      : type

    const baseClasses = 'w-full transition-all duration-300 focus:outline-none focus:ring-4'
    
    const getThemeColors = (theme: string) => {
      const themeConfigs = {
        customer: {
          focus: 'border-orange-500 focus:border-orange-600 focus:ring-orange-100',
          normal: 'border-gray-200 hover:border-gray-300 focus:border-orange-500 focus:ring-orange-100'
        },
        restaurant: {
          focus: 'border-green-500 focus:border-green-600 focus:ring-green-100',
          normal: 'border-gray-200 hover:border-gray-300 focus:border-green-500 focus:ring-green-100'
        },
        rider: {
          focus: 'border-purple-500 focus:border-purple-600 focus:ring-purple-100',
          normal: 'border-gray-200 hover:border-gray-300 focus:border-purple-500 focus:ring-purple-100'
        },
        admin: {
          focus: 'border-blue-500 focus:border-blue-600 focus:ring-blue-100',
          normal: 'border-gray-200 hover:border-gray-300 focus:border-blue-500 focus:ring-blue-100'
        },
        default: {
          focus: 'border-orange-500 focus:border-orange-600 focus:ring-orange-100',
          normal: 'border-gray-200 hover:border-gray-300 focus:border-orange-500 focus:ring-orange-100'
        }
      }
      
      return themeConfigs[theme as keyof typeof themeConfigs] || themeConfigs.default
    }
    
    const themeColors = getThemeColors(theme)
    
    const variants = {
      default: `border-2 bg-white ${
        error 
          ? 'border-red-300 focus:border-red-500 focus:ring-red-100' 
          : isFocused
          ? themeColors.focus
          : themeColors.normal
      }`,
      filled: `border-0 ${
        error
          ? 'bg-red-50 focus:bg-red-50 focus:ring-red-100'
          : 'bg-gray-100 hover:bg-gray-50 focus:bg-white focus:ring-orange-100'
      }`
    }

    const sizes = {
      sm: 'py-2 px-3 text-sm rounded-lg mobile-input',
      md: 'py-3 px-4 text-base rounded-lg mobile-input',
      lg: 'py-4 px-5 text-lg rounded-lg mobile-input'
    }

    const iconSizes = {
      sm: 'w-4 h-4',
      md: 'w-5 h-5',
      lg: 'w-6 h-6'
    }

    const widthClass = fullWidth ? 'w-full' : ''

    return (
      <div className={widthClass}>
        {/* Label */}
        {label && (
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            {label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}

        {/* Input Container */}
        <div className="relative">
          {/* Left Icon */}
          {icon && iconPosition === 'left' && (
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
              <div className={iconSizes[size]}>{icon}</div>
            </div>
          )}

          {/* Input */}
          <input
            ref={ref}
            type={inputType}
            className={`
              ${baseClasses}
              ${variants[variant]}
              ${sizes[size]}
              ${icon && iconPosition === 'left' ? 'pl-10' : ''}
              ${(icon && iconPosition === 'right') || showPasswordToggle ? 'pr-10' : ''}
              ${error ? 'text-red-900' : 'text-gray-900'}
              ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
              ${className}
            `}
            disabled={disabled}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={error ? `${props.id}-error` : helperText ? `${props.id}-helper` : undefined}
            {...props}
          />

          {/* Right Icon or Password Toggle */}
          {((icon && iconPosition === 'right') || showPasswordToggle || error) && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
              {error && (
                <ExclamationCircleIcon className={`${iconSizes[size]} text-red-500`} />
              )}
              
              {showPasswordToggle && type === 'password' && (
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-gray-500 hover:text-gray-700 transition-colors mobile-touch-optimized"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeSlashIcon className={iconSizes[size]} />
                  ) : (
                    <EyeIcon className={iconSizes[size]} />
                  )}
                </button>
              )}
              
              {icon && iconPosition === 'right' && !error && (
                <div className={`${iconSizes[size]} text-gray-500`}>{icon}</div>
              )}
            </div>
          )}
        </div>

        {/* Helper Text / Error */}
        {(helperText || error) && (
          <p 
            id={error ? `${props.id}-error` : `${props.id}-helper`}
            className={`mt-2 text-sm ${error ? 'text-red-600' : 'text-gray-600'}`}
          >
            {error || helperText}
          </p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'

export default Input