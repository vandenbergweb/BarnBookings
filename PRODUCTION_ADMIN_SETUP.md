# Production Admin Setup

## Issue
After deployment, the production database is separate from development and doesn't have the admin user.

## Solution
The admin initialization code in `server/init-admin.ts` should automatically create the admin user when the production server starts. However, if it's not working, here's how to manually create it:

## Option 1: Check Production Logs
Look for these messages in your production deployment logs:
- "Checking for admin user..."
- "Admin user created successfully: admin@thebarnmi.com"

If you don't see these messages, the initialization might not be running.

## Option 2: Manual Database Creation
If the auto-initialization fails, you can manually create the admin user by:

1. Access your production database via the Replit Database tab
2. Run this SQL command:

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

## Note
The password hash above is pre-computed for "admin123" using bcrypt with 12 salt rounds.