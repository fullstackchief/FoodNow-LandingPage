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
    
    const variants = {
      default: `border-2 bg-white ${
        error 
          ? 'border-red-300 focus:border-red-500 focus:ring-red-100' 
          : isFocused
          ? 'border-orange-500 focus:border-orange-600 focus:ring-orange-100'
          : 'border-gray-200 hover:border-gray-300 focus:border-orange-500 focus:ring-orange-100'
      }`,
      filled: `border-0 ${
        error
          ? 'bg-red-50 focus:bg-red-50 focus:ring-red-100'
          : 'bg-gray-100 hover:bg-gray-50 focus:bg-white focus:ring-orange-100'
      }`
    }

    const sizes = {
      sm: 'py-2 px-3 text-sm rounded-xl',
      md: 'py-3 px-4 text-base rounded-xl',
      lg: 'py-4 px-5 text-lg rounded-2xl'
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
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
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
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? (
                    <EyeSlashIcon className={iconSizes[size]} />
                  ) : (
                    <EyeIcon className={iconSizes[size]} />
                  )}
                </button>
              )}
              
              {icon && iconPosition === 'right' && !error && (
                <div className={`${iconSizes[size]} text-gray-400`}>{icon}</div>
              )}
            </div>
          )}
        </div>

        {/* Helper Text / Error */}
        {(helperText || error) && (
          <p className={`mt-2 text-sm ${error ? 'text-red-600' : 'text-gray-500'}`}>
            {error || helperText}
          </p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'

export default Input