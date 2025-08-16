# Production Admin Setup - URGENT FIX NEEDED

## Current Issue
✅ **Development (Preview)**: All users work perfectly - admin and test accounts login successfully
❌ **Production (thebarnmi.com)**: NO users can login - production database is empty

## Root Cause
Replit has separate development and production databases. The production database needs to be populated with users.

## IMMEDIATE FIX - Option 1: Manual Database Setup
**This is the fastest solution to get your site working now:**

1. Go to your Replit project
2. Click the "Database" tab 
3. Make sure you're connected to the PRODUCTION database (not development)
4. Run this SQL command to create the admin user:

```sql
INSERT INTO users (email, password_hash, first_name, last_name, role, is_email_verified, auth_provider) 
VALUES (
  'admin@thebarnmi.com', 
  '$2b$12$Xv8tt42tzmrpXV2OUYNt5.uEauubC0gSINLJyfaRb4Hb6dBXXJmAe',
  'Admin',
  'User', 
  'admin',
  true,
  'local'
) ON CONFLICT (email) DO NOTHING;
```

## Login Credentials
- Email: admin@thebarnmi.com
- Password: admin123

## Option 2: Check if Production Database Has Tables
If the SQL above fails, your production database might not have the user table yet. Run this to check:

```sql
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';
```

If no tables exist, you need to run the database migrations in production:
```bash
npm run db:push
```

## Option 3: Redeploy with Auto-Initialization
The server startup code should create the admin user automatically, but it may not be working in production mode.

## Testing the Fix
Once the admin user is created in production:
- Visit thebarnmi.com
- Login with: admin@thebarnmi.com / admin123
- You should see the admin dashboard

## Note
- The password hash above is pre-computed for "admin123" using bcrypt with 12 salt rounds
- Production databases persist forever - once created, the admin user won't be lost on redeployments
- All other users who registered on the preview site will need to re-register on the production site