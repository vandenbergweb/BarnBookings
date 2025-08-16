// One-time script to create admin user in production database
// Run this with: node setup-production-admin.js

import { neon } from '@neondatabase/serverless';
import bcrypt from 'bcryptjs';

async function createProductionAdmin() {
  try {
    console.log('Connecting to production database...');
    
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL environment variable not found');
    }
    
    const sql = neon(process.env.DATABASE_URL);
    
    console.log('Checking if admin user already exists...');
    
    // Check if admin user exists
    const existingAdmin = await sql`
      SELECT email FROM users WHERE email = 'admin@thebarnmi.com'
    `;
    
    if (existingAdmin.length > 0) {
      console.log('✅ Admin user already exists in production database');
      return;
    }
    
    console.log('Creating admin user...');
    
    // Hash the password
    const hashedPassword = await bcrypt.hash('admin123', 12);
    
    // Create admin user
    const result = await sql`
      INSERT INTO users (
        email, 
        password_hash, 
        first_name, 
        last_name, 
        role, 
        is_email_verified, 
        auth_provider
      ) VALUES (
        'admin@thebarnmi.com',
        ${hashedPassword},
        'Admin',
        'User',
        'admin',
        true,
        'local'
      )
      RETURNING email, role
    `;
    
    console.log('✅ Admin user created successfully in production:', result[0]);
    console.log('🔑 Login credentials:');
    console.log('   Email: admin@thebarnmi.com');
    console.log('   Password: admin123');
    console.log('🌐 Test at: https://thebarnmi.com');
    
  } catch (error) {
    console.error('❌ Failed to create admin user:', error.message);
    process.exit(1);
  }
}

createProductionAdmin();