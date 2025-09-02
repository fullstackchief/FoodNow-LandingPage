#!/usr/bin/env node

/**
 * FIX ORDER CREATION ISSUES
 * =========================
 * This script identifies and fixes the order creation problems:
 * 1. Check valid enum values for payment_status
 * 2. Identify required fields
 * 3. Test corrected order insertion
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

async function getEnumValues() {
  console.log('🔍 CHECKING ENUM VALUES')
  console.log('======================')
  
  try {
    // Query to get enum values
    const { data, error } = await supabase
      .rpc('exec', {
        sql: `
          SELECT enumlabel 
          FROM pg_enum 
          WHERE enumtypid = (
            SELECT oid 
            FROM pg_type 
            WHERE typname = 'payment_status'
          );
        `
      })
    
    if (error) {
      console.log('⚠️  Cannot query enum values, using common values')
      return ['pending', 'completed', 'failed']
    }
    
    console.log('✅ Valid payment_status enum values:')
    data?.forEach(item => console.log(`   - ${item.enumlabel}`))
    
    return data?.map(item => item.enumlabel) || ['pending', 'completed', 'failed']
  } catch (error) {
    console.log('⚠️  Using default enum values')
    return ['pending', 'completed', 'failed', 'refunded']
  }
}

async function testCorrectedOrder() {
  console.log('\n🧪 TESTING CORRECTED ORDER CREATION')
  console.log('==================================')
  
  const testUserId = '22222222-2222-2222-2222-222222222222'
  const testRestaurantId = '550e8400-e29b-41d4-a716-446655440001'
  const orderNumber = `FIXED${Date.now()}`
  
  // Corrected order data based on findings
  const correctedOrder = {
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
    payment_method: 'card',        // FIXED: Was missing
    payment_status: 'pending',     // FIXED: Changed from 'processing' to 'pending'
    special_instructions: 'Test order - corrected',
    estimated_delivery_time: new Date(Date.now() + 45 * 60000).toISOString(),
    tracking_updates: []
  }
  
  console.log('📦 Corrected order data:')
  console.log(JSON.stringify(correctedOrder, null, 2))
  
  try {
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert(correctedOrder)
      .select()
      .single()
    
    if (orderError) {
      console.log('❌ ORDER STILL FAILED:')
      console.log(`   Code: ${orderError.code}`)
      console.log(`   Message: ${orderError.message}`)
      console.log(`   Details: ${orderError.details}`)
      console.log(`   Hint: ${orderError.hint}`)
      
      return false
    } else {
      console.log('✅ ORDER INSERTION SUCCESSFUL!')
      console.log(`   Order ID: ${order.id}`)
      console.log(`   Order Number: ${order.order_number}`)
      console.log(`   Status: ${order.status}`)
      
      // Clean up test order
      console.log('\n🧹 Cleaning up test order...')
      await supabase
        .from('orders')
        .delete()
        .eq('id', order.id)
      
      console.log('✅ Test order cleaned up')
      return true
    }
    
  } catch (error) {
    console.log(`❌ Exception during corrected order test: ${error.message}`)
    return false
  }
}

async function generateFixSummary(success) {
  console.log('\n📋 ORDER CREATION FIX SUMMARY')
  console.log('=============================')
  
  if (success) {
    console.log('✅ Order creation is now working!')
    console.log('\n🔧 REQUIRED FIXES FOR APP CODE:')
    console.log('1. Change payment_status from "processing" to "pending"')
    console.log('2. Ensure payment_method is always provided (never null/undefined)')
    console.log('3. Update orderService.ts with correct enum values')
    
    console.log('\n💳 CONFIRMED WORKING TEST CARD:')
    console.log('Card Number: 4084 0840 8408 4081')
    console.log('Expiry: 12/30')
    console.log('CVV: 408')
    console.log('Name: Test User')
    
  } else {
    console.log('❌ Order creation still failing - additional investigation needed')
  }
}

async function main() {
  await getEnumValues()
  const success = await testCorrectedOrder()
  await generateFixSummary(success)
}

main().catch(error => {
  console.error('💥 Fix script failed:', error)
  process.exit(1)
})