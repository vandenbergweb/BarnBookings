import bcrypt from 'bcryptjs';
import { db } from './db.js';
import { users } from '../shared/schema.js';
import { eq } from 'drizzle-orm';

export async function initializeAdminUser() {
  try {
    console.log('Checking for admin user...');
    console.log('Environment check:', {
      hasPassword: !!process.env.ADMIN_PASSWORD,
      hasEmail: !!process.env.ADMIN_EMAIL,
      nodeEnv: process.env.NODE_ENV,
      databaseUrl: !!process.env.DATABASE_URL
    });
    
    // Use environment variables for admin credentials
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@thebarnmi.com';
    const adminPassword = process.env.ADMIN_PASSWORD;
    
    // Skip admin creation if no password is provided in production
    if (!adminPassword) {
      console.log('No ADMIN_PASSWORD environment variable found. Skipping admin user creation for security.');
      console.log('To create an admin user, set ADMIN_EMAIL and ADMIN_PASSWORD environment variables.');
      return;
    }
    
    console.log('Searching for existing admin user with email:', adminEmail);
    
    // Ensure database tables exist first
    console.log('Ensuring database tables exist...');
    
    // Check if admin user already exists
    const existingAdmin = await db
      .select()
      .from(users)
      .where(eq(users.email, adminEmail))
      .limit(1);

    console.log('Existing admin search result:', { found: existingAdmin.length > 0, count: existingAdmin.length });

    if (existingAdmin.length > 0) {
      console.log('Admin user already exists with ID:', existingAdmin[0].id);
      console.log('Admin user details:', {
        email: existingAdmin[0].email,
        role: existingAdmin[0].role,
        hasPasswordHash: !!existingAdmin[0].passwordHash,
        authProvider: existingAdmin[0].authProvider
      });
      return;
    }

    console.log('Creating new admin user...');
    
    // Hash the admin password from environment variable
    const hashedPassword = await bcrypt.hash(adminPassword, 12);
    console.log('Password hashed successfully, length:', hashedPassword.length);
    
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

    console.log('Admin user created successfully:', {
      id: adminUser.id,
      email: adminUser.email,
      role: adminUser.role,
      hasPasswordHash: !!adminUser.passwordHash
    });
  } catch (error) {
    console.error('Failed to initialize admin user:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    // Don't fail the app startup if admin creation fails
  }
}