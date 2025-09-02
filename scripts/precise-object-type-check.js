/**
 * PRECISE OBJECT TYPE CHECK
 * =========================
 * Uses PostgreSQL system catalogs to get exact object types
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')

async function preciseObjectTypeCheck() {
  console.log('🔍 PRECISE OBJECT TYPE INVESTIGATION')
  console.log('====================================')

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  console.log('\n📋 USING POSTGRESQL SYSTEM CATALOGS:')
  console.log('====================================')

  try {
    // Use pg_class to get exact object types
    const { data: result, error } = await supabase
      .rpc('exec_sql', { 
        sql_text: `
          SELECT 
            c.relname as object_name,
            CASE c.relkind 
              WHEN 'r' THEN 'TABLE'
              WHEN 'v' THEN 'VIEW'
              WHEN 'm' THEN 'MATERIALIZED_VIEW'
              WHEN 'i' THEN 'INDEX'
              WHEN 'S' THEN 'SEQUENCE'
              WHEN 'f' THEN 'FOREIGN_TABLE'
              WHEN 'p' THEN 'PARTITIONED_TABLE'
              ELSE 'OTHER'
            END as object_type,
            CASE 
              WHEN c.relkind = 'r' THEN 'YES'
              ELSE 'NO'
            END as can_apply_rls,
            n.nspname as schema_name
          FROM pg_class c
          JOIN pg_namespace n ON n.oid = c.relnamespace
          WHERE n.nspname = 'public'
          AND c.relkind IN ('r', 'v', 'm')
          ORDER BY c.relname
        `
      })

    if (error) {
      console.log('❌ System catalog query failed:', error.message)
      return
    }

    if (!result || result.length === 0 || result[0].result.includes('ERROR:')) {
      console.log('❌ No valid result from system catalog')
      console.log('Result:', result)
      
      // Fallback: Test specific problem objects
      console.log('\n🔍 FALLBACK: Testing specific problem objects:')
      
      const problemObjects = ['user_order_history', 'spatial_ref_sys']
      
      for (const objName of problemObjects) {
        console.log(`\n🧪 Testing: ${objName}`)
        
        // Try to enable RLS and see what error we get
        const { data: rlsTest, error: rlsError } = await supabase
          .rpc('exec_sql', { 
            sql_text: `ALTER TABLE public.${objName} ENABLE ROW LEVEL SECURITY`
          })

        if (rlsError) {
          console.log(`   ❌ RPC Error: ${rlsError.message}`)
        } else if (rlsTest && rlsTest[0].result.includes('ERROR:')) {
          const errorMsg = rlsTest[0].result
          if (errorMsg.includes('not supported for views')) {
            console.log(`   📋 ${objName}: VIEW (Cannot apply RLS)`)
          } else if (errorMsg.includes('must be owner')) {
            console.log(`   ⚠️  ${objName}: SYSTEM TABLE (No ownership)`)
          } else if (errorMsg.includes('does not exist')) {
            console.log(`   ❌ ${objName}: DOES NOT EXIST`)
          } else {
            console.log(`   ❓ ${objName}: Unknown error - ${errorMsg}`)
          }
        } else {
          console.log(`   ✅ ${objName}: TABLE (RLS enabled successfully)`)
        }
      }
      
      return null
    }

    console.log('✅ System catalog query successful')
    return result

  } catch (error) {
    console.error('💥 Investigation failed:', error)
    return null
  }
}

preciseObjectTypeCheck()
  .then(result => {
    console.log('\n🎉 PRECISE TYPE CHECK COMPLETE')
  })
  .catch(error => {
    console.error('💥 Error:', error)
  })