import bcrypt from 'bcryptjs';
import { db } from './db.js';
import { users } from '../shared/schema.js';
import { eq } from 'drizzle-orm';

export async function initializeAdminUser() {
  try {
    console.log('Checking for admin user...');
    
    // Use environment variables for admin credentials
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@thebarnmi.com';
    const adminPassword = process.env.ADMIN_PASSWORD;
    
    // Skip admin creation if no password is provided in production
    if (!adminPassword) {
      console.log('No ADMIN_PASSWORD environment variable found. Skipping admin user creation for security.');
      console.log('To create an admin user, set ADMIN_EMAIL and ADMIN_PASSWORD environment variables.');
      return;
    }
    
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
    
    // Hash the admin password from environment variable
    const hashedPassword = await bcrypt.hash(adminPassword, 12);
    
    // Create admin user
    const [adminUser] = await db
      .insert(users)
      .values({
        email: adminEmail,
        passwordHash: hashedPassword,
        firstName: 'Admin',
        lastName: 'User',
        role: 'admin',
        isEmailVerified: true,
        authProvider: 'local'
      })
      .returning();

    console.log('Admin user created successfully:', adminUser.email);
  } catch (error) {
    console.error('Failed to initialize admin user:', error);
    // Don't fail the app startup if admin creation fails
  }
}