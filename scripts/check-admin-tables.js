/**
 * CHECK ADMIN TABLES EXISTENCE
 * ============================
 * Specifically checks if admin_users and admin_sessions exist
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

async function checkAdminTables() {
  console.log('🔍 CHECKING ADMIN TABLES')
  console.log('========================')

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  const adminTables = ['admin_users', 'admin_sessions', 'role_applications', 'guarantor_verifications']
  
  for (const tableName of adminTables) {
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(1)

      if (error) {
        console.log(`❌ ${tableName} - ERROR: ${error.message}`)
      } else {
        console.log(`✅ ${tableName} - EXISTS`)
      }
    } catch (err) {
      console.log(`💥 ${tableName} - EXCEPTION: ${err.message}`)
    }
  }

  // Check if system has any default admin user
  try {
    const { data: adminUsers, error } = await supabase
      .from('admin_users')
      .select('email, role, is_active')
      .limit(5)

    if (!error && adminUsers) {
      console.log('\n👤 EXISTING ADMIN USERS:')
      console.log('======================')
      if (adminUsers.length === 0) {
        console.log('❌ No admin users found')
      } else {
        adminUsers.forEach(admin => {
          console.log(`✅ ${admin.email} (${admin.role}) - Active: ${admin.is_active}`)
        })
      }
    }
  } catch (err) {
    console.log('\n❌ Could not check admin users')
  }
}

checkAdminTables()
  .then(() => console.log('\n🎉 ADMIN TABLES CHECK COMPLETE'))
  .catch(error => console.error('💥 Check error:', error))