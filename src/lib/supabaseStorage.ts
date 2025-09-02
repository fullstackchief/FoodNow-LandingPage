import { supabase } from './supabase-client'

// Storage bucket names
export const STORAGE_BUCKETS = {
  RESTAURANTS: 'restaurants',
  MENU_ITEMS: 'menu-items',
  USERS: 'users',
  BANNERS: 'banners',
  RIDERS: 'riders',
  DELIVERY_PROOF: 'delivery-proof'
} as const

export type StorageBucket = typeof STORAGE_BUCKETS[keyof typeof STORAGE_BUCKETS]

// Image transformation options
export interface ImageTransformOptions {
  width?: number
  height?: number
  quality?: number // 1-100
  format?: 'origin' | 'avif' | 'webp'
  resize?: 'cover' | 'contain' | 'fill'
}

// Upload result type
export interface UploadResult {
  url: string
  path: string
  bucket: string
}

/**
 * Initialize storage buckets (run once during setup)
 */
export async function initializeStorageBuckets() {
  const buckets = Object.values(STORAGE_BUCKETS)
  
  for (const bucketName of buckets) {
    try {
      // Check if bucket exists
      const { data: existingBucket } = await supabase.storage.getBucket(bucketName)
      
      if (!existingBucket) {
        // Create bucket with public access for most buckets
        const isPublic = bucketName !== STORAGE_BUCKETS.DELIVERY_PROOF
        
        const { error } = await supabase.storage.createBucket(bucketName, {
          public: isPublic,
          fileSizeLimit: 5242880, // 5MB
          allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
        })
        
        if (error) {
          console.error(`Error creating bucket ${bucketName}:`, error)
        } else {
          console.log(`Bucket ${bucketName} created successfully`)
        }
      }
    } catch (error) {
      console.error(`Error checking bucket ${bucketName}:`, error)
    }
  }
}

/**
 * Upload an image to Supabase Storage
 */
export async function uploadImage(
  file: File,
  bucket: StorageBucket,
  path?: string
): Promise<UploadResult> {
  try {
    // Generate unique filename if path not provided
    const fileName = path || `${Date.now()}-${Math.random().toString(36).substring(7)}-${file.name}`
    
    // Upload file
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      })
    
    if (error) {
      throw new Error(`Upload failed: ${error.message}`)
    }
    
    // Get public URL
    const url = getImageUrl(bucket, data.path)
    
    return {
      url,
      path: data.path,
      bucket
    }
  } catch (error) {
    console.error('Error uploading image:', error)
    throw error
  }
}

/**
 * Upload multiple images
 */
export async function uploadImages(
  files: File[],
  bucket: StorageBucket,
  pathPrefix?: string
): Promise<UploadResult[]> {
  const uploads = files.map((file, index) => {
    const path = pathPrefix 
      ? `${pathPrefix}/${Date.now()}-${index}-${file.name}`
      : undefined
    return uploadImage(file, bucket, path)
  })
  
  return Promise.all(uploads)
}

/**
 * Get public URL for an image with optional transformations
 */
export function getImageUrl(
  bucket: StorageBucket,
  path: string,
  transform?: ImageTransformOptions
): string {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path)
  
  if (!transform || Object.keys(transform).length === 0) {
    return data.publicUrl
  }
  
  // Add transformation parameters
  const params = new URLSearchParams()
  
  if (transform.width) params.append('width', transform.width.toString())
  if (transform.height) params.append('height', transform.height.toString())
  if (transform.quality) params.append('quality', transform.quality.toString())
  if (transform.format) params.append('format', transform.format)
  if (transform.resize) params.append('resize', transform.resize)
  
  return `${data.publicUrl}?${params.toString()}`
}

/**
 * Get signed URL for private images (expires after specified seconds)
 */
export async function getSignedUrl(
  bucket: StorageBucket,
  path: string,
  expiresIn: number = 3600 // 1 hour default
): Promise<string | null> {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(path, expiresIn)
    
    if (error) {
      console.error('Error creating signed URL:', error)
      return null
    }
    
    return data.signedUrl
  } catch (error) {
    console.error('Error getting signed URL:', error)
    return null
  }
}

/**
 * Delete an image from storage
 */
export async function deleteImage(
  bucket: StorageBucket,
  path: string
): Promise<boolean> {
  try {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([path])
    
    if (error) {
      console.error('Error deleting image:', error)
      return false
    }
    
    return true
  } catch (error) {
    console.error('Error deleting image:', error)
    return false
  }
}

/**
 * Delete multiple images
 */
export async function deleteImages(
  bucket: StorageBucket,
  paths: string[]
): Promise<boolean> {
  try {
    const { error } = await supabase.storage
      .from(bucket)
      .remove(paths)
    
    if (error) {
      console.error('Error deleting images:', error)
      return false
    }
    
    return true
  } catch (error) {
    console.error('Error deleting images:', error)
    return false
  }
}

/**
 * List files in a bucket folder
 */
export async function listFiles(
  bucket: StorageBucket,
  folder?: string,
  limit?: number,
  offset?: number
) {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .list(folder, {
        limit: limit || 100,
        offset: offset || 0,
        sortBy: { column: 'created_at', order: 'desc' }
      })
    
    if (error) {
      console.error('Error listing files:', error)
      return []
    }
    
    return data
  } catch (error) {
    console.error('Error listing files:', error)
    return []
  }
}

/**
 * Move/rename a file
 */
export async function moveFile(
  bucket: StorageBucket,
  fromPath: string,
  toPath: string
): Promise<boolean> {
  try {
    const { error } = await supabase.storage
      .from(bucket)
      .move(fromPath, toPath)
    
    if (error) {
      console.error('Error moving file:', error)
      return false
    }
    
    return true
  } catch (error) {
    console.error('Error moving file:', error)
    return false
  }
}

/**
 * Copy a file
 */
export async function copyFile(
  bucket: StorageBucket,
  fromPath: string,
  toPath: string
): Promise<boolean> {
  try {
    const { error } = await supabase.storage
      .from(bucket)
      .copy(fromPath, toPath)
    
    if (error) {
      console.error('Error copying file:', error)
      return false
    }
    
    return true
  } catch (error) {
    console.error('Error copying file:', error)
    return false
  }
}

/**
 * Get optimized image URL with automatic format detection
 */
export function getOptimizedImageUrl(
  bucket: StorageBucket,
  path: string,
  options?: {
    thumbnail?: boolean
    mobile?: boolean
    desktop?: boolean
  }
): string {
  let transform: ImageTransformOptions = {
    quality: 80,
    format: 'webp'
  }
  
  if (options?.thumbnail) {
    transform = { ...transform, width: 150, height: 150, resize: 'cover' }
  } else if (options?.mobile) {
    transform = { ...transform, width: 640, quality: 75 }
  } else if (options?.desktop) {
    transform = { ...transform, width: 1920, quality: 85 }
  }
  
  return getImageUrl(bucket, path, transform)
}

/**
 * Upload image from URL (for migration or external images)
 */
export async function uploadImageFromUrl(
  imageUrl: string,
  bucket: StorageBucket,
  path?: string
): Promise<UploadResult | null> {
  try {
    // Fetch image
    const response = await fetch(imageUrl)
    if (!response.ok) {
      throw new Error('Failed to fetch image')
    }
    
    // Convert to blob
    const blob = await response.blob()
    
    // Create File object
    const fileName = path || imageUrl.split('/').pop() || 'image.jpg'
    const file = new File([blob], fileName, { type: blob.type })
    
    // Upload using existing function
    return uploadImage(file, bucket, path)
  } catch (error) {
    console.error('Error uploading image from URL:', error)
    return null
  }
}

// Helper to validate file before upload
export function validateImageFile(
  file: File,
  maxSizeMB: number = 5
): { valid: boolean; error?: string } {
  const maxSize = maxSizeMB * 1024 * 1024 // Convert to bytes
  
  // Check file size
  if (file.size > maxSize) {
    return {
      valid: false,
      error: `File size exceeds ${maxSizeMB}MB limit`
    }
  }
  
  // Check file type
  const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  if (!validTypes.includes(file.type)) {
    return {
      valid: false,
      error: 'Invalid file type. Please upload a JPEG, PNG, WebP or GIF image'
    }
  }
  
  return { valid: true }
}