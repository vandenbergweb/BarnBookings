#!/usr/bin/env node
// Script to update admin password directly in database
import bcrypt from 'bcryptjs';
import { db } from './db.js';
import { users } from '../shared/schema.js';
import { eq } from 'drizzle-orm';

async function updateAdminPassword() {
  try {
    const newPassword = 'yellow123';
    const adminEmail = 'admin@thebarnmi.com';
    
    console.log('Updating admin password...');
    
    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    console.log('New password hashed successfully');
    
    // Update the password in database
    const result = await db
      .update(users)
      .set({ passwordHash: hashedPassword })
      .where(eq(users.email, adminEmail))
      .returning({ email: users.email });
    
    if (result.length > 0) {
      console.log('✅ Admin password updated successfully for:', result[0].email);
      console.log('Admin can now login with: admin@thebarnmi.com / yellow123');
    } else {
      console.log('❌ Admin user not found');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error updating admin password:', error);
    process.exit(1);
  }
}

updateAdminPassword();