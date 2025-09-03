const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co'
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'your_anon_key_here'

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkTables() {
  console.log('Checking what tables are accessible...')
  
  const tables = ['users', 'customers', 'profiles', 'restaurants', 'menu_items', 'orders', 'order_items']
  
  for (const table of tables) {
    try {
      const { data, error, count } = await supabase.from(table).select('*', { count: 'exact', head: true })
      if (error) {
        console.log(`❌ ${table}: ${error.message}`)
      } else {
        console.log(`✅ ${table}: ${count} rows`)
        
        if (count > 0 && (table === 'users' || table === 'customers' || table === 'profiles')) {
          // Get sample data for user tables
          const { data: sample } = await supabase.from(table).select('*').limit(1)
          console.log(`   Sample: ${JSON.stringify(sample[0], null, 2)}`)
        }
      }
    } catch (err) {
      console.log(`💥 ${table}: ${err.message}`)
    }
  }
}

checkTables()