#!/usr/bin/env node

/**
 * CHECK ORDER_ITEMS TABLE SCHEMA
 * ==============================
 * Verify the actual structure of the order_items table
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
})

async function checkOrderItemsSchema() {
  console.log('🔍 CHECKING ORDER_ITEMS TABLE SCHEMA')
  console.log('====================================')
  
  try {
    // Try to get table structure by attempting a select with limit 0
    const { data, error } = await supabase
      .from('order_items')
      .select('*')
      .limit(0)
    
    if (error) {
      console.log('❌ Error accessing order_items table:', error.message)
      return
    }
    
    console.log('✅ Successfully accessed order_items table')
    
    // Try inserting a minimal order item to see what fields are required
    console.log('\n🧪 Testing minimal order item insert...')
    const testOrderItemData = {
      order_id: '00000000-0000-0000-0000-000000000000', // Fake UUID
      menu_item_id: '00000000-0000-0000-0000-000000000000',
      quantity: 1,
      unit_price: 1000,
      total_price: 1000
    }
    
    const { data: insertTest, error: insertError } = await supabase
      .from('order_items')
      .insert(testOrderItemData)
      .select()
    
    if (insertError) {
      console.log('❌ Insert test failed (expected):', insertError.message)
      
      // The error message will tell us about missing required fields
      console.log('\n💡 This error helps identify the required fields')
    } else {
      console.log('✅ Insert test succeeded (unexpected)')
      
      // Clean up test data
      if (insertTest && insertTest.length > 0) {
        await supabase
          .from('order_items')
          .delete()
          .eq('id', insertTest[0].id)
        console.log('🧹 Cleaned up test data')
      }
    }
    
  } catch (error) {
    console.error('💥 Schema check failed:', error)
  }
}

checkOrderItemsSchema()