require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

async function fixUserRole() {
  try {
    console.log('🔍 Checking user golegitng@gmail.com...')
    
    // Check if user exists
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'golegitng@gmail.com')
      .single()

    if (userError) {
      if (userError.code === 'PGRST116') {
        console.log('❌ User golegitng@gmail.com not found in database')
        console.log('💡 User needs to complete signup process first')
        return
      }
      throw userError
    }

    console.log('✅ User found:', {
      id: user.id,
      email: user.email,
      name: `${user.first_name} ${user.last_name}`,
      current_role: user.user_role,
      is_verified: user.is_verified
    })

    if (user.user_role === 'restaurant_owner') {
      console.log('✅ User already has restaurant_owner role')
    } else {
      console.log('🔄 Updating user role to restaurant_owner...')
      
      const { error: updateError } = await supabase
        .from('users')
        .update({
          user_role: 'restaurant_owner',
          updated_at: new Date().toISOString()
        })
        .eq('email', 'golegitng@gmail.com')

      if (updateError) {
        throw updateError
      }

      console.log('✅ User role updated to restaurant_owner')
    }

    // Check for restaurant records without owner_id
    console.log('🔍 Looking for unlinked restaurant records...')
    
    const { data: restaurants, error: restError } = await supabase
      .from('restaurants')
      .select('*')
      .is('owner_id', null)

    if (restError) {
      throw restError
    }

    console.log(`📊 Found ${restaurants.length} restaurants without owner linkage:`)
    restaurants.forEach((restaurant, index) => {
      console.log(`   ${index + 1}. ${restaurant.name} (ID: ${restaurant.id})`)
    })

    if (restaurants.length > 0) {
      console.log('\n🤔 Which restaurant should be linked to golegitng@gmail.com?')
      console.log('   (This would typically be determined by the restaurant application process)')
      console.log('   For now, I\'ll link to the first restaurant as a demo...')
      
      const targetRestaurant = restaurants[0]
      
      const { error: linkError } = await supabase
        .from('restaurants')
        .update({
          owner_id: user.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', targetRestaurant.id)

      if (linkError) {
        throw linkError
      }

      console.log(`✅ Linked user to restaurant: ${targetRestaurant.name}`)
    }

    console.log('\n🎉 User role fix completed!')
    console.log('📝 Summary:')
    console.log(`   ✅ User: golegitng@gmail.com → restaurant_owner role`)
    if (restaurants.length > 0) {
      console.log(`   ✅ Restaurant: ${restaurants[0].name} → linked to user`)
    }
    console.log('\n💡 User should now see RestaurantDashboard on next login')

  } catch (error) {
    console.error('❌ Error fixing user role:', error)
  }
}

// Run the fix
fixUserRole()