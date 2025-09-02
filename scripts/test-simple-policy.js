/**
 * TEST SIMPLE BLOCKING POLICY
 * ===========================
 * Tests if the simple policy created in debug migration works
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

async function testSimplePolicy() {
  console.log('🔍 TESTING SIMPLE BLOCKING POLICY')
  console.log('=================================')

  // Test with service role (should work)
  const serviceSupabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  // Test with anon key (should be blocked)
  const anonSupabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )

  console.log('\n🔑 Testing SERVICE ROLE access to users:')
  try {
    const { count, error } = await serviceSupabase
      .from('users')
      .select('*', { count: 'exact', head: true })

    if (error) {
      console.log(`❌ Service role BLOCKED: ${error.message}`)
    } else {
      console.log(`✅ Service role ALLOWED: ${count} rows`)
    }
  } catch (err) {
    console.log(`💥 Service role ERROR: ${err.message}`)
  }

  console.log('\n🔑 Testing ANONYMOUS access to users (should be blocked):')
  try {
    const { count, error } = await anonSupabase
      .from('users')
      .select('*', { count: 'exact', head: true })

    if (error) {
      if (error.code === 'PGRST116' || error.message.includes('row')) {
        console.log(`🔒 Anonymous PROPERLY BLOCKED: ${error.message}`)
        console.log('✅ RLS IS WORKING!')
      } else {
        console.log(`❌ Anonymous blocked with different error: ${error.message}`)
      }
    } else {
      console.log(`❌ Anonymous STILL ALLOWED: ${count} rows`)
      console.log('🚨 RLS STILL NOT WORKING!')
    }
  } catch (err) {
    console.log(`💥 Anonymous ERROR: ${err.message}`)
  }

  // Test restaurants table (should allow anon access per policy)
  console.log('\n🔑 Testing ANONYMOUS access to restaurants (should be allowed):')
  try {
    const { count, error } = await anonSupabase
      .from('restaurants')
      .select('*', { count: 'exact', head: true })

    if (error) {
      console.log(`❌ Anonymous blocked from restaurants: ${error.message}`)
    } else {
      console.log(`✅ Anonymous can browse restaurants: ${count} rows`)
    }
  } catch (err) {
    console.log(`💥 Restaurants test ERROR: ${err.message}`)
  }
}

testSimplePolicy()
  .then(() => {
    console.log('\n🎉 SIMPLE POLICY TEST COMPLETE')
  })
  .catch(error => {
    console.error('💥 Test error:', error)
  })