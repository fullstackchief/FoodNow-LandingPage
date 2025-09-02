/**
 * CHECK ENUM TYPES IN DATABASE
 * ============================
 * Discovers what enum types actually exist vs what's needed
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

async function checkEnumTypes() {
  console.log('🔍 CHECKING ENUM TYPES IN DATABASE')
  console.log('==================================')
  console.log(`⏰ Started: ${new Date().toISOString()}`)

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  // Query all enum types
  const { data: enumTypes, error } = await supabase
    .rpc('exec_sql', { 
      sql_text: `
        SELECT 
          typname as enum_name,
          string_agg(enumlabel, ', ' ORDER BY enumsortorder) as enum_values
        FROM pg_type t 
        JOIN pg_enum e ON t.oid = e.enumtypid  
        WHERE t.typtype = 'e'
        GROUP BY typname
        ORDER BY typname
      `
    })

  if (error) {
    console.log('❌ Error checking enum types:', error.message)
    return
  }

  console.log('\n📋 EXISTING ENUM TYPES:')
  console.log('======================')
  
  const existingEnums = new Set()
  
  if (enumTypes && enumTypes.length > 0) {
    enumTypes.forEach(enumType => {
      console.log(`✅ ${enumType.enum_name}: ${enumType.enum_values}`)
      existingEnums.add(enumType.enum_name)
    })
  } else {
    console.log('❌ No enum types found')
  }

  // Check what enums our migration script needs
  const requiredEnums = [
    'application_type',
    'application_status', 
    'admin_role',
    'document_status'
  ]

  console.log('\n🎯 REQUIRED VS EXISTING ENUMS:')
  console.log('==============================')
  
  const missingEnums = []
  
  requiredEnums.forEach(enumName => {
    if (existingEnums.has(enumName)) {
      console.log(`✅ ${enumName} - EXISTS`)
    } else {
      console.log(`❌ ${enumName} - MISSING`)
      missingEnums.push(enumName)
    }
  })

  console.log('\n📊 SUMMARY:')
  console.log('===========')
  console.log(`Total existing enums: ${existingEnums.size}`)
  console.log(`Required enums: ${requiredEnums.length}`)
  console.log(`Missing enums: ${missingEnums.length}`)
  
  if (missingEnums.length > 0) {
    console.log('\n❌ MISSING ENUM TYPES:')
    missingEnums.forEach(enumName => console.log(`   - ${enumName}`))
    
    console.log('\n🔧 SOLUTION: Create minimal enum-only migration script')
  } else {
    console.log('\n✅ ALL REQUIRED ENUMS EXIST')
  }
}

checkEnumTypes()
  .then(() => {
    console.log('\n🎉 ENUM TYPE CHECK COMPLETE')
  })
  .catch(error => {
    console.error('💥 Check error:', error)
  })