-- Production Admin User Creation
-- Run this SQL in your production database to create the admin user
-- Email: admin@thebarnmi.com
-- Password: admin123

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
  '$2b$12$Xv8tt42tzmrpXV2OUYNt5.uEauubC0gSINLJyfaRb4Hb6dBXXJmAe',
  'Admin',
  'User', 
  'admin',
  true,
  'local'
) ON CONFLICT (email) DO NOTHING;