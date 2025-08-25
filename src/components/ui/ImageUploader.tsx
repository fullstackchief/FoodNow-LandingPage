'use client'

import { useState, useRef } from 'react'
import { Upload, X, Loader2 } from 'lucide-react'
import { uploadImage, validateImageFile, type StorageBucket } from '@/lib/supabaseStorage'
import OptimizedImage from './OptimizedImage'
import { cn } from '@/lib/utils'

interface ImageUploaderProps {
  bucket: StorageBucket
  onUploadComplete?: (url: string, path: string) => void
  onUploadError?: (error: string) => void
  className?: string
  maxSizeMB?: number
  aspectRatio?: 'square' | '16:9' | '4:3' | 'free'
  label?: string
  currentImageUrl?: string
}

export default function ImageUploader({
  bucket,
  onUploadComplete,
  onUploadError,
  className = '',
  maxSizeMB = 5,
  aspectRatio = 'free',
  label = 'Upload Image',
  currentImageUrl
}: ImageUploaderProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(currentImageUrl || null)
  const [uploadedPath, setUploadedPath] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file
    const validation = validateImageFile(file, maxSizeMB)
    if (!validation.valid) {
      onUploadError?.(validation.error!)
      return
    }

    // Show preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setPreview(reader.result as string)
    }
    reader.readAsDataURL(file)

    // Upload to Supabase
    setIsUploading(true)
    try {
      const result = await uploadImage(file, bucket)
      setUploadedPath(result.path)
      onUploadComplete?.(result.url, result.path)
    } catch (error) {
      console.error('Upload error:', error)
      onUploadError?.(error instanceof Error ? error.message : 'Upload failed')
      setPreview(null)
    } finally {
      setIsUploading(false)
    }
  }

  const clearImage = () => {
    setPreview(null)
    setUploadedPath(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const aspectRatioClasses = {
    square: 'aspect-square',
    '16:9': 'aspect-video',
    '4:3': 'aspect-[4/3]',
    free: ''
  }

  return (
    <div className={cn('relative', className)}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={handleFileSelect}
        className="hidden"
        disabled={isUploading}
      />

      {preview ? (
        <div className={cn('relative group', aspectRatioClasses[aspectRatio])}>
          {uploadedPath ? (
            <OptimizedImage
              src={preview}
              alt="Uploaded image"
              width={800}
              height={600}
              className="w-full h-full"
              objectFit="cover"
              rounded="lg"
              supabaseBucket={bucket}
              supabasePath={uploadedPath}
            />
          ) : (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={preview}
                alt="Preview"
                className="w-full h-full object-cover rounded-lg"
              />
            </>
          )}
          
          {isUploading && (
            <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-white animate-spin" />
            </div>
          )}

          {!isUploading && (
            <button
              onClick={clearImage}
              className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      ) : (
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className={cn(
            "w-full border-2 border-dashed border-gray-300 rounded-lg p-8",
            "hover:border-brand-500 transition-colors",
            "flex flex-col items-center justify-center",
            aspectRatioClasses[aspectRatio],
            isUploading && "opacity-50 cursor-not-allowed"
          )}
        >
          <Upload className="w-12 h-12 text-gray-400 mb-4" />
          <span className="text-sm font-medium text-gray-700">{label}</span>
          <span className="text-xs text-gray-500 mt-1">
            JPG, PNG, WebP or GIF (max {maxSizeMB}MB)
          </span>
        </button>
      )}
    </div>
  )
}

// Multiple image uploader component
interface MultiImageUploaderProps {
  bucket: StorageBucket
  maxImages?: number
  onImagesChange?: (images: Array<{ url: string; path: string }>) => void
  className?: string
  currentImages?: Array<{ url: string; path: string }>
}

export function MultiImageUploader({
  bucket,
  maxImages = 5,
  onImagesChange,
  className = '',
  currentImages = []
}: MultiImageUploaderProps) {
  const [images, setImages] = useState<Array<{ url: string; path: string }>>(currentImages)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFilesSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    if (files.length === 0) return

    // Check max images limit
    if (images.length + files.length > maxImages) {
      alert(`Maximum ${maxImages} images allowed`)
      return
    }

    setIsUploading(true)
    const newImages: Array<{ url: string; path: string }> = []

    for (const file of files) {
      const validation = validateImageFile(file, 5)
      if (validation.valid) {
        try {
          const result = await uploadImage(file, bucket)
          newImages.push({ url: result.url, path: result.path })
        } catch (error) {
          console.error('Upload error:', error)
        }
      }
    }

    const updatedImages = [...images, ...newImages]
    setImages(updatedImages)
    onImagesChange?.(updatedImages)
    setIsUploading(false)
  }

  const removeImage = (index: number) => {
    const updatedImages = images.filter((_, i) => i !== index)
    setImages(updatedImages)
    onImagesChange?.(updatedImages)
  }

  return (
    <div className={cn('space-y-4', className)}>
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={handleFilesSelect}
        className="hidden"
        disabled={isUploading}
      />

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {images.map((image, index) => (
          <div key={index} className="relative group aspect-square">
            <OptimizedImage
              src={image.url}
              alt={`Image ${index + 1}`}
              width={200}
              height={200}
              className="w-full h-full"
              objectFit="cover"
              rounded="lg"
            />
            <button
              onClick={() => removeImage(index)}
              className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}

        {images.length < maxImages && (
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="aspect-square border-2 border-dashed border-gray-300 rounded-lg hover:border-brand-500 transition-colors flex flex-col items-center justify-center"
          >
            {isUploading ? (
              <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
            ) : (
              <>
                <Upload className="w-6 h-6 text-gray-400" />
                <span className="text-xs text-gray-500 mt-1">Add Image</span>
              </>
            )}
          </button>
        )}
      </div>

      <p className="text-sm text-gray-500">
        {images.length} of {maxImages} images uploaded
      </p>
    </div>
  )
}