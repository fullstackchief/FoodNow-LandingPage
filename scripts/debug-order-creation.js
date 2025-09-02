#!/usr/bin/env node

/**
 * DEBUG ORDER CREATION FAILURE
 * ============================
 * This script diagnoses the order creation failure by:
 * 1. Testing order insertion with real data structure
 * 2. Checking field compatibility
 * 3. Identifying the exact error cause
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

async function inspectOrdersTable() {
  console.log('🔍 INSPECTING ORDERS TABLE SCHEMA')
  console.log('================================')
  
  try {
    // Check existing orders schema by getting sample record
    const { data: existingOrders, error } = await supabase
      .from('orders')
      .select('*')
      .limit(1)
    
    if (error) {
      console.log(`❌ Cannot access orders table: ${error.message}`)
      return false
    }
    
    if (existingOrders && existingOrders.length > 0) {
      console.log('✅ Sample order structure:')
      console.log(JSON.stringify(existingOrders[0], null, 2))
      
      console.log('\n📋 Available fields:')
      Object.keys(existingOrders[0]).forEach(field => {
        console.log(`   - ${field}: ${typeof existingOrders[0][field]}`)
      })
    } else {
      console.log('⚠️  Orders table is empty - cannot inspect structure')
    }
    
    return true
  } catch (error) {
    console.log(`❌ Orders table inspection failed: ${error.message}`)
    return false
  }
}

async function testOrderInsertion() {
  console.log('\n🧪 TESTING ORDER INSERTION')
  console.log('=========================')
  
  // Use real user and restaurant data from verification
  const testUserId = '22222222-2222-2222-2222-222222222222' // Kemi from verification
  const testRestaurantId = '550e8400-e29b-41d4-a716-446655440001' // Mama Cass Kitchen
  
  console.log(`👤 Test User ID: ${testUserId}`)
  console.log(`🏪 Test Restaurant ID: ${testRestaurantId}`)
  
  // Create minimal test order that matches the app's data structure
  const orderNumber = `TEST${Date.now()}`
  const testOrder = {
    order_number: orderNumber,
    user_id: testUserId,
    restaurant_id: testRestaurantId,
    delivery_info: {
      address: "Test Address Lagos",
      area: "Victoria Island",
      phone: "+2348023456789"
    },
    subtotal: 2500,
    delivery_fee: 500,
    service_fee: 250,
    tax: 0,
    discount: 0,
    total: 3250,
    status: 'pending',
    payment_method: 'card',
    payment_status: 'processing',
    special_instructions: 'Test order - debug',
    estimated_delivery_time: new Date(Date.now() + 45 * 60000).toISOString(),
    tracking_updates: []
  }
  
  console.log('\n📦 Test order data:')
  console.log(JSON.stringify(testOrder, null, 2))
  
  try {
    console.log('\n🚀 Attempting order insertion...')
    
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert(testOrder)
      .select()
      .single()
    
    if (orderError) {
      console.log('❌ ORDER INSERTION FAILED:')
      console.log(`   Error Code: ${orderError.code}`)
      console.log(`   Error Message: ${orderError.message}`)
      console.log(`   Error Details: ${orderError.details}`)
      console.log(`   Error Hint: ${orderError.hint}`)
      console.log('\n🔍 FULL ERROR OBJECT:')
      console.log(JSON.stringify(orderError, null, 2))
      
      // Test with minimal data to isolate issue
      console.log('\n🧪 Testing with minimal data...')
      const minimalOrder = {
        order_number: `MIN${Date.now()}`,
        user_id: testUserId,
        restaurant_id: testRestaurantId,
        total: 1000,
        status: 'pending'
      }
      
      const { data: minOrder, error: minError } = await supabase
        .from('orders')
        .insert(minimalOrder)
        .select()
        .single()
      
      if (minError) {
        console.log('❌ Even minimal order failed:')
        console.log(JSON.stringify(minError, null, 2))
      } else {
        console.log('✅ Minimal order succeeded - issue is with specific fields')
        console.log(minOrder)
      }
      
    } else {
      console.log('✅ ORDER INSERTION SUCCESSFUL!')
      console.log(order)
    }
    
  } catch (error) {
    console.log(`❌ Exception during order insertion: ${error.message}`)
    console.log(error)
  }
}

async function main() {
  console.log('🔧 DEBUGGING ORDER CREATION FAILURE')
  console.log('===================================\n')
  
  const canInspect = await inspectOrdersTable()
  if (canInspect) {
    await testOrderInsertion()
  }
  
  console.log('\n🎯 DIAGNOSIS COMPLETE')
  console.log('Check output above for specific error details')
}

main().catch(error => {
  console.error('💥 Debug script failed:', error)
  process.exit(1)
})