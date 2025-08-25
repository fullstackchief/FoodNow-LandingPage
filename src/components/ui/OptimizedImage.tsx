'use client'

import { useState, useMemo } from 'react'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { getImageUrl, type StorageBucket } from '@/lib/supabaseStorage'

interface OptimizedImageProps {
  src: string
  alt: string
  width?: number
  height?: number
  className?: string
  fallbackSrc?: string
  showLoader?: boolean
  priority?: boolean
  objectFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down'
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | 'full'
  overlay?: boolean
  overlayClass?: string
  // Supabase Storage specific props
  supabaseBucket?: StorageBucket
  supabasePath?: string
  quality?: number
}

export default function OptimizedImage({
  src,
  alt,
  width = 800,
  height = 600,
  className = '',
  fallbackSrc = 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&h=600&fit=crop&auto=format',
  showLoader = true,
  priority = false,
  objectFit = 'cover',
  rounded = 'none',
  overlay = false,
  overlayClass = 'bg-black/20',
  supabaseBucket,
  supabasePath,
  quality = 80
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  
  // Generate optimized URL if using Supabase Storage
  const imageUrl = useMemo(() => {
    if (supabaseBucket && supabasePath) {
      return getImageUrl(supabaseBucket, supabasePath, {
        width,
        height,
        quality,
        format: 'webp',
        resize: objectFit as 'cover' | 'contain' | 'fill'
      })
    }
    return src
  }, [supabaseBucket, supabasePath, src, width, height, quality, objectFit])
  
  const [currentSrc, setCurrentSrc] = useState(imageUrl)

  const handleLoad = () => {
    setIsLoading(false)
  }

  const handleError = () => {
    setHasError(true)
    setIsLoading(false)
    if (currentSrc !== fallbackSrc) {
      setCurrentSrc(fallbackSrc)
      setHasError(false)
      setIsLoading(true)
    }
  }

  const roundedClasses = {
    none: '',
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    xl: 'rounded-xl',
    '2xl': 'rounded-2xl',
    '3xl': 'rounded-3xl',
    full: 'rounded-full'
  }

  const objectFitClasses = {
    cover: 'object-cover',
    contain: 'object-contain',
    fill: 'object-fill',
    none: 'object-none',
    'scale-down': 'object-scale-down'
  }

  return (
    <div className={cn('relative overflow-hidden', roundedClasses[rounded], className)}>
      {/* Loading skeleton */}
      {isLoading && showLoader && (
        <div className={cn(
          'absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center',
          roundedClasses[rounded]
        )}>
          <div className="w-8 h-8 border-4 border-gray-300 border-t-brand-500 rounded-full animate-spin"></div>
        </div>
      )}

      {/* Main image */}
      <Image
        src={currentSrc}
        alt={alt}
        width={width}
        height={height}
        priority={priority}
        className={cn(
          'transition-opacity duration-300',
          objectFitClasses[objectFit],
          isLoading ? 'opacity-0' : 'opacity-100',
          className
        )}
        onLoad={handleLoad}
        onError={handleError}
        style={{ width: '100%', height: '100%' }}
      />

      {/* Overlay */}
      {overlay && (
        <div className={cn('absolute inset-0', overlayClass)} />
      )}

      {/* Error state */}
      {hasError && currentSrc === fallbackSrc && (
        <div className={cn(
          'absolute inset-0 bg-gray-100 flex items-center justify-center text-gray-400',
          roundedClasses[rounded]
        )}>
          <div className="text-center">
            <div className="text-2xl mb-2">🍽️</div>
            <div className="text-xs">Image unavailable</div>
          </div>
        </div>
      )}
    </div>
  )
}