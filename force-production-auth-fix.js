// Force authentication fix for production
// This script will test authentication directly against production DB

import { neon } from '@neondatabase/serverless';
import bcrypt from 'bcryptjs';

async function testProductionAuth() {
  try {
    console.log('🔍 Testing production authentication...');
    
    const sql = neon(process.env.DATABASE_URL);
    
    // Simulate the exact authentication logic
    const email = 'admin@thebarnmi.com';
    const password = 'admin123';
    
    console.log(`📧 Looking up user: ${email}`);
    const users = await sql`SELECT * FROM users WHERE email = ${email}`;
    const user = users[0];
    
    if (!user) {
      console.log('❌ User not found');
      return;
    }
    
    console.log('✅ User found');
    console.log(`🔐 Password hash exists: ${!!user.password_hash}`);
    console.log(`🔐 Password hash length: ${user.password_hash?.length}`);
    
    if (!user.password_hash) {
      console.log('❌ No password hash - this would cause "different sign-in method" error');
      
      // Fix it by adding password hash
      console.log('🔧 Adding password hash...');
      const hashedPassword = await bcrypt.hash(password, 12);
      
      await sql`
        UPDATE users 
        SET password_hash = ${hashedPassword}
        WHERE email = ${email}
      `;
      
      console.log('✅ Password hash added');
      return;
    }
    
    // Test password validation
    const isValid = await bcrypt.compare(password, user.password_hash);
    console.log(`🔓 Password validation: ${isValid ? 'SUCCESS' : 'FAILED'}`);
    
    if (isValid) {
      console.log('🎉 Authentication should work! The production deployment might still be updating.');
    } else {
      console.log('❌ Password validation failed - hash mismatch');
    }
    
  } catch (error) {
    console.error('💥 Error:', error.message);
  }
}

testProductionAuth();