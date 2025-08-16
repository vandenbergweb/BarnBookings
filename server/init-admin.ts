import bcrypt from 'bcryptjs';
import { db } from './db.js';
import { users } from '../shared/schema.js';
import { eq } from 'drizzle-orm';

export async function initializeAdminUser() {
  try {
    console.log('Checking for admin user...');
    
    const adminEmail = 'admin@thebarnmi.com';
    
    // Check if admin user already exists
    const existingAdmin = await db
      .select()
      .from(users)
      .where(eq(users.email, adminEmail))
      .limit(1);

    if (existingAdmin.length > 0) {
      console.log('Admin user already exists');
      return;
    }

    console.log('Creating admin user...');
    
    // Hash the admin password
    const hashedPassword = await bcrypt.hash('admin123', 12);
    
    // Create admin user
    const [adminUser] = await db
      .insert(users)
      .values({
        email: adminEmail,
        password: hashedPassword,
        firstName: 'Admin',
        lastName: 'User',
        role: 'admin'
      })
      .returning();

    console.log('Admin user created successfully:', adminUser.email);
  } catch (error) {
    console.error('Failed to initialize admin user:', error);
    // Don't fail the app startup if admin creation fails
  }
}