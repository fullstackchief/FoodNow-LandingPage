#!/usr/bin/env node

/**
 * Admin Setup Script
 * Generates secure admin credentials and updates .env.local
 */

const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function generateSecureSecret(length = 32) {
  return crypto.randomBytes(length).toString('hex');
}

async function hashPassword(password) {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
}

function updateEnvFile(envPath, updates) {
  let envContent = '';
  
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf8');
  }

  // Update or add each environment variable
  Object.entries(updates).forEach(([key, value]) => {
    const regex = new RegExp(`^${key}=.*$`, 'm');
    if (regex.test(envContent)) {
      envContent = envContent.replace(regex, `${key}=${value}`);
    } else {
      envContent += `\n${key}=${value}`;
    }
  });

  fs.writeFileSync(envPath, envContent);
}

async function promptUser(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

async function main() {
  console.log('\n🔒 FoodNow Admin Security Setup');
  console.log('================================\n');

  console.log('This script will generate secure admin credentials for your application.\n');

  // Get admin email
  const adminEmail = await promptUser('Enter admin email (default: admin@foodnow.com): ') || 'admin@foodnow.com';

  // Get admin password
  let adminPassword;
  while (!adminPassword || adminPassword.length < 8) {
    adminPassword = await promptUser('Enter admin password (min 8 characters): ');
    if (adminPassword.length < 8) {
      console.log('❌ Password must be at least 8 characters long.\n');
    }
  }

  console.log('\n🔄 Generating secure credentials...\n');

  // Generate secure credentials
  const passwordHash = await hashPassword(adminPassword);
  const jwtSecret = generateSecureSecret(32);

  console.log('✅ Generated password hash');
  console.log('✅ Generated JWT secret');

  // Update .env.local
  const envPath = path.join(process.cwd(), '.env.local');
  const updates = {
    'ADMIN_EMAIL': adminEmail,
    'ADMIN_PASSWORD_HASH': passwordHash,
    'JWT_SECRET': jwtSecret,
    'ADMIN_SESSION_TIMEOUT': '3600',
    'RATE_LIMIT_WINDOW': '900000',
    'RATE_LIMIT_MAX_ATTEMPTS': '5'
  };

  updateEnvFile(envPath, updates);

  console.log(`✅ Updated ${envPath}\n`);

  console.log('🎉 Admin setup complete!\n');
  console.log('Admin Credentials:');
  console.log('==================');
  console.log(`Email: ${adminEmail}`);
  console.log(`Password: ${adminPassword}`);
  console.log('\n⚠️  IMPORTANT SECURITY NOTES:');
  console.log('- Save these credentials in a secure password manager');
  console.log('- Delete this terminal history after setup');
  console.log('- Never commit .env.local to version control');
  console.log('- Change the password regularly in production');
  console.log('- Consider enabling MFA in Phase 2');

  console.log('\n🚀 Your admin authentication is now secure!');
  console.log('You can now login at: http://localhost:3000/admin\n');

  rl.close();
}

main().catch(console.error);