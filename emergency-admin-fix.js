// Emergency fix: Create a completely new admin user with fresh hash
import { neon } from '@neondatabase/serverless';
import bcrypt from 'bcryptjs';

async function emergencyAdminFix() {
  try {
    console.log('🚨 EMERGENCY ADMIN FIX STARTING...');
    
    const sql = neon(process.env.DATABASE_URL);
    
    // First, check current admin user
    console.log('1. Checking current admin user...');
    const currentUsers = await sql`SELECT email, password_hash, auth_provider FROM users WHERE email = 'admin@thebarnmi.com'`;
    console.log('Current admin:', currentUsers[0]);
    
    // Delete existing admin user completely
    console.log('2. Removing existing admin user...');
    await sql`DELETE FROM users WHERE email = 'admin@thebarnmi.com'`;
    
    // Create completely fresh admin user with new hash
    console.log('3. Creating fresh admin user...');
    const freshHash = await bcrypt.hash('admin123', 12);
    
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
        ${freshHash},
        'Admin',
        'User',
        'admin',
        true,
        'local'
      )
      RETURNING email, role, password_hash IS NOT NULL as has_password
    `;
    
    console.log('4. Fresh admin created:', result[0]);
    
    // Test the new hash immediately
    console.log('5. Testing new password hash...');
    const testUsers = await sql`SELECT password_hash FROM users WHERE email = 'admin@thebarnmi.com'`;
    const isValid = await bcrypt.compare('admin123', testUsers[0].password_hash);
    console.log('6. Password validation:', isValid ? 'SUCCESS' : 'FAILED');
    
    console.log('✅ EMERGENCY FIX COMPLETE');
    console.log('🔑 Login: admin@thebarnmi.com / admin123');
    
  } catch (error) {
    console.error('💥 Emergency fix failed:', error.message);
  }
}

emergencyAdminFix();