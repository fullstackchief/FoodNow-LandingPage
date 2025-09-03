#!/usr/bin/env node

/**
 * Database Admin Setup Script
 * Creates super admin user directly in admin_users table
 * Compatible with /api/admin/auth endpoint
 */

require('dotenv').config({ path: '.env.local' });
const bcrypt = require('bcryptjs');
const { createClient } = require('@supabase/supabase-js');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function promptUser(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

async function hashPassword(password) {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
}

async function main() {
  console.log('\n🔒 FoodNow Database Admin Setup');
  console.log('================================\n');

  // Validate environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing required environment variables:');
    console.error('- NEXT_PUBLIC_SUPABASE_URL');
    console.error('- SUPABASE_SERVICE_ROLE_KEY');
    console.error('\nPlease check your .env.local file.');
    process.exit(1);
  }

  // Initialize Supabase with service role key
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  console.log('This script will create a super admin user in the admin_users table.\n');

  // Get admin email
  const adminEmail = await promptUser('Enter admin email: ');
  if (!adminEmail) {
    console.error('❌ Email is required');
    process.exit(1);
  }

  // Get admin password
  let adminPassword;
  while (!adminPassword || adminPassword.length < 8) {
    adminPassword = await promptUser('Enter admin password (min 8 characters): ');
    if (!adminPassword || adminPassword.length < 8) {
      console.log('❌ Password must be at least 8 characters long.\n');
    }
  }

  console.log('\n🔄 Creating admin user in database...\n');

  try {
    // Check if admin user already exists
    const { data: existingAdmin, error: checkError } = await supabase
      .from('admin_users')
      .select('id, email')
      .eq('email', adminEmail)
      .single();

    if (existingAdmin && !checkError) {
      const updateExisting = await promptUser(`Admin user ${adminEmail} already exists. Update password? (y/n): `);
      
      if (updateExisting.toLowerCase() === 'y') {
        // Update existing admin
        const passwordHash = await hashPassword(adminPassword);
        
        const { error: updateError } = await supabase
          .from('admin_users')
          .update({
            password_hash: passwordHash,
            failed_login_attempts: 0,
            locked_until: null,
            updated_at: new Date().toISOString()
          })
          .eq('email', adminEmail);

        if (updateError) {
          console.error('❌ Failed to update admin user:', updateError.message);
          process.exit(1);
        }

        console.log('✅ Admin user password updated successfully!\n');
      } else {
        console.log('✅ Using existing admin user\n');
      }
    } else {
      // Create new admin user
      const passwordHash = await hashPassword(adminPassword);
      
      const { data: newAdmin, error: createError } = await supabase
        .from('admin_users')
        .insert({
          email: adminEmail,
          password_hash: passwordHash,
          role: 'super_admin',
          permissions: {
            orders: ['view_all', 'manage_all', 'cancel_orders', 'refund_orders'],
            restaurants: ['view_all', 'approve_applications', 'manage_menus', 'suspend_accounts'],
            riders: ['view_all', 'approve_applications', 'assign_zones', 'manage_payouts'],
            customers: ['view_all', 'manage_accounts', 'handle_complaints'],
            system: ['admin_access', 'financial_reports', 'system_settings', 'create_admins'],
            financial: ['view_all_reports', 'process_payouts', 'manage_pricing', 'refund_unlimited']
          },
          is_active: true,
          failed_login_attempts: 0,
          last_login: null,
          locked_until: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (createError) {
        console.error('❌ Failed to create admin user:', createError.message);
        process.exit(1);
      }

      console.log('✅ Super admin user created successfully!\n');
    }

    // Test the authentication
    console.log('🔄 Testing authentication...\n');
    
    const testResponse = await fetch('http://localhost:3000/api/admin/auth', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: adminEmail,
        password: adminPassword
      })
    });

    if (testResponse.ok) {
      const testResult = await testResponse.json();
      if (testResult.success) {
        console.log('✅ Authentication test passed!\n');
      } else {
        console.log('⚠️ Authentication test failed:', testResult.error);
      }
    } else {
      console.log('⚠️ Could not test authentication - server may not be running');
    }

    console.log('🎉 Admin setup complete!\n');
    console.log('Admin Credentials:');
    console.log('==================');
    console.log(`Email: ${adminEmail}`);
    console.log(`Password: ${adminPassword}`);
    console.log(`Role: super_admin (God Mode)`);
    console.log('\n⚠️ IMPORTANT SECURITY NOTES:');
    console.log('- Save these credentials securely');
    console.log('- Delete this terminal history');
    console.log('- Login at: http://localhost:3000/admin-system');
    console.log('- Consider changing password after first login\n');

  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  } finally {
    rl.close();
  }
}

main().catch(console.error);