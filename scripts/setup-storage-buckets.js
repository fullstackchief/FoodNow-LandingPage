#!/usr/bin/env node

/**
 * SUPABASE STORAGE BUCKETS SETUP
 * ==============================
 * Creates and configures all required storage buckets for FoodNow
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const REQUIRED_BUCKETS = {
  'restaurants': {
    public: true,
    description: 'Restaurant profile images, covers, interior photos',
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
    fileSizeLimit: 5242880 // 5MB
  },
  'menu-items': {
    public: true,
    description: 'Menu item photos and food images',
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
    fileSizeLimit: 3145728 // 3MB
  },
  'users': {
    public: false,
    description: 'User profile pictures and personal documents',
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
    fileSizeLimit: 2097152 // 2MB
  },
  'banners': {
    public: true,
    description: 'Promotional banners and marketing images',
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'],
    fileSizeLimit: 10485760 // 10MB
  },
  'riders': {
    public: false,
    description: 'Rider documents, photos, and verification files',
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
    fileSizeLimit: 5242880 // 5MB
  },
  'delivery-proof': {
    public: false,
    description: 'Delivery confirmation photos and proof of delivery',
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
    fileSizeLimit: 3145728 // 3MB
  },
  'documents': {
    public: false,
    description: 'Legal documents, certificates, and official papers',
    allowedMimeTypes: ['application/pdf', 'image/jpeg', 'image/png'],
    fileSizeLimit: 10485760 // 10MB
  }
}

async function checkExistingBuckets() {
  console.log('🔍 CHECKING EXISTING STORAGE BUCKETS')
  console.log('===================================')
  
  try {
    const { data: buckets, error } = await supabase.storage.listBuckets()
    
    if (error) {
      console.log('❌ Error checking buckets:', error.message)
      return []
    }
    
    console.log(`📋 Found ${buckets.length} existing buckets:`)
    buckets.forEach(bucket => {
      console.log(`   - ${bucket.name} (${bucket.public ? 'Public' : 'Private'})`)
    })
    
    return buckets.map(bucket => bucket.name)
    
  } catch (error) {
    console.log('❌ Error listing buckets:', error.message)
    return []
  }
}

async function createMissingBuckets(existingBuckets) {
  console.log('\n🏗️  CREATING MISSING STORAGE BUCKETS')
  console.log('====================================')
  
  const results = {
    created: [],
    failed: [],
    skipped: []
  }
  
  for (const [bucketName, config] of Object.entries(REQUIRED_BUCKETS)) {
    try {
      if (existingBuckets.includes(bucketName)) {
        console.log(`⏭️  ${bucketName}: Already exists, skipping`)
        results.skipped.push(bucketName)
        continue
      }
      
      console.log(`🔨 Creating: ${bucketName} (${config.public ? 'Public' : 'Private'})...`)
      
      const { data, error } = await supabase.storage.createBucket(bucketName, {
        public: config.public,
        fileSizeLimit: config.fileSizeLimit,
        allowedMimeTypes: config.allowedMimeTypes
      })
      
      if (error) {
        console.log(`❌ ${bucketName}: ${error.message}`)
        results.failed.push({ bucket: bucketName, error: error.message })
      } else {
        console.log(`✅ ${bucketName}: Created successfully`)
        results.created.push(bucketName)
      }
      
    } catch (error) {
      console.log(`❌ ${bucketName}: ${error.message}`)
      results.failed.push({ bucket: bucketName, error: error.message })
    }
  }
  
  return results
}

async function setupBucketPolicies() {
  console.log('\n🔒 SETTING UP BUCKET POLICIES')
  console.log('============================')
  
  // Basic policies for each bucket type
  const policies = [
    {
      bucket: 'users',
      name: 'Users can upload their own files',
      definition: {
        operation: 'INSERT',
        check: `bucket_id = 'users' AND (storage.foldername(name))[1] = auth.uid()::text`
      }
    },
    {
      bucket: 'users', 
      name: 'Users can view their own files',
      definition: {
        operation: 'SELECT',
        using: `bucket_id = 'users' AND (storage.foldername(name))[1] = auth.uid()::text`
      }
    },
    {
      bucket: 'riders',
      name: 'Riders can upload their documents',
      definition: {
        operation: 'INSERT', 
        check: `bucket_id = 'riders' AND (storage.foldername(name))[1] = auth.uid()::text`
      }
    },
    {
      bucket: 'delivery-proof',
      name: 'Riders can upload delivery proof',
      definition: {
        operation: 'INSERT',
        check: `bucket_id = 'delivery-proof' AND EXISTS (SELECT 1 FROM public.riders WHERE user_id = auth.uid())`
      }
    }
  ]
  
  for (const policy of policies) {
    try {
      console.log(`🔐 Creating policy: ${policy.name} for ${policy.bucket}`)
      
      // Note: Storage policies need to be created via Dashboard or direct SQL
      // This is for reference and documentation
      console.log(`   Policy details: ${JSON.stringify(policy.definition, null, 2)}`)
      
    } catch (error) {
      console.log(`❌ Policy creation failed: ${error.message}`)
    }
  }
  
  console.log('\n💡 Storage policies need to be created manually in Supabase Dashboard')
  console.log('   Go to Storage > Policies > New Policy for each bucket')
}

async function main() {
  console.log('🚀 SUPABASE STORAGE BUCKETS SETUP')
  console.log('=================================')
  console.log(`⏰ Started: ${new Date().toISOString()}`)
  
  try {
    // Check existing buckets
    const existingBuckets = await checkExistingBuckets()
    
    // Create missing buckets
    const results = await createMissingBuckets(existingBuckets)
    
    // Setup policies (documentation)
    await setupBucketPolicies()
    
    // Summary
    console.log('\n📊 STORAGE BUCKET SETUP SUMMARY')
    console.log('==============================')
    console.log(`✅ Created: ${results.created.length} buckets`)
    console.log(`❌ Failed: ${results.failed.length} buckets`)
    console.log(`⏭️  Skipped: ${results.skipped.length} buckets (already exist)`)
    
    if (results.created.length > 0) {
      console.log('\n✅ NEWLY CREATED BUCKETS:')
      results.created.forEach(bucket => console.log(`   - ${bucket}`))
    }
    
    if (results.failed.length > 0) {
      console.log('\n❌ FAILED BUCKETS:')
      results.failed.forEach(({ bucket, error }) => console.log(`   - ${bucket}: ${error}`))
    }
    
    const allSuccess = results.failed.length === 0
    
    if (allSuccess) {
      console.log('\n🎉 ALL STORAGE BUCKETS CONFIGURED SUCCESSFULLY!')
      console.log('✅ File upload system is ready for use')
    } else {
      console.log('\n⚠️  SOME BUCKETS FAILED TO CREATE')
      console.log('🔧 Check Supabase Dashboard manually for remaining setup')
    }
    
    return allSuccess
    
  } catch (error) {
    console.error('💥 Storage setup failed:', error.message)
    return false
  }
}

if (require.main === module) {
  main()
    .then(success => {
      if (success) {
        console.log('\n🚀 STORAGE SETUP COMPLETE!')
      } else {
        console.log('\n💡 Manual intervention required')
      }
    })
    .catch(console.error)
}

module.exports = { checkExistingBuckets, createMissingBuckets }