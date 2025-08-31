import type { Express } from "express";
import { createServer, type Server } from "http";
import Stripe from "stripe";
import passport from "passport";
import { storage } from "./storage";
import { registerSchema, loginSchema, passwordResetRequestSchema, passwordResetSchema, type RegisterRequest, type LoginRequest, type PasswordResetRequest, type PasswordReset } from "@shared/schema";
import { setupAuth, isAuthenticated, validateSession } from "./localAuth";
import { isAdmin } from "./adminAuth";
import { insertBookingSchema } from "@shared/schema";
import { sendBookingConfirmation, sendBookingReminder, sendPasswordResetEmail } from "./email";
import { nanoid } from "nanoid";
import bcrypt from "bcryptjs";

const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-07-30.basil",
}) : null;

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);
  
  // Add session validation middleware for debugging
  app.use(validateSession);

  // Initialize spaces and bundles data
  await initializeData();

  // Local authentication routes
  app.post('/api/auth/register', async (req, res) => {
    try {
      const validatedData = registerSchema.parse(req.body);
      
      // Use passport to handle registration
      passport.authenticate('local-register', (err: any, user: any, info: any) => {
        if (err) {
          console.error('Registration error:', err);
          return res.status(500).json({ message: 'Internal server error' });
        }
        
        if (!user) {
          return res.status(400).json({ message: info?.message || 'Registration failed' });
        }
        
        // Log the user in after successful registration
        req.logIn(user, (loginErr) => {
          if (loginErr) {
            console.error('Auto-login error:', loginErr);
            return res.status(500).json({ message: 'Registration successful but login failed' });
          }
          
          console.log('Registration and auto-login successful for:', user.email);
          res.json({ 
            message: 'Registration successful',
            user: {
              id: user.id,
              email: user.email,
              firstName: user.firstName,
              lastName: user.lastName,
            }
          });
        });
      })(req, res);
    } catch (error: any) {
      console.error('Registration validation error:', error);
      res.status(400).json({ 
        message: 'Validation failed',
        errors: error.errors || [{ message: error.message }]
      });
    }
  });

  app.post('/api/auth/login', async (req, res) => {
    try {
      console.log('Login attempt with body:', { email: req.body.email, hasPassword: !!req.body.password });
      const validatedData = loginSchema.parse(req.body);
      
      passport.authenticate('local-login', (err: any, user: any, info: any) => {
        console.log('Passport authenticate result:', { 
          hasError: !!err, 
          hasUser: !!user, 
          infoMessage: info?.message 
        });
        
        if (err) {
          console.error('Login error:', err);
          return res.status(500).json({ message: 'Internal server error' });
        }
        
        if (!user) {
          console.log('Login failed:', info?.message || 'Invalid credentials');
          return res.status(401).json({ message: info?.message || 'Invalid credentials' });
        }
        
        req.logIn(user, (loginErr) => {
          if (loginErr) {
            console.error('Login session error:', loginErr);
            return res.status(500).json({ message: 'Login failed' });
          }
          
          // Verify session was created properly
          console.log('Post-login session check:', {
            sessionID: req.sessionID,
            isAuthenticated: req.isAuthenticated(),
            hasUser: !!req.user,
            passportUser: (req.session as any)?.passport?.user
          });
          
          console.log('Login successful for user:', user.email);
          res.json({ 
            message: 'Login successful',
            user: {
              id: user.id,
              email: user.email,
              firstName: user.firstName,
              lastName: user.lastName,
            }
          });
        });
      })(req, res);
    } catch (error: any) {
      console.error('Login validation error:', error);
      res.status(400).json({ 
        message: 'Validation failed',
        errors: error.errors || [{ message: error.message }]
      });
    }
  });

  app.post('/api/auth/logout', (req: any, res) => {
    try {
      console.log('=== LOGOUT ENDPOINT CALLED ===');
      console.log('Session ID:', req.sessionID);
      console.log('User before logout:', req.user ? req.user.email : 'No user');
      console.log('Is authenticated before logout:', req.isAuthenticated());
      
      req.logout((err: any) => {
        if (err) {
          console.error('Passport logout error:', err);
          console.error('Error type:', typeof err);
          console.error('Error message:', err.message || err);
          console.error('Error stack:', err.stack);
          return res.status(500).json({ 
            message: 'Logout failed',
            error: err.message || 'Unknown logout error'
          });
        }
        
        console.log('Passport logout successful, destroying session...');
        
        // Also destroy the session
        req.session.destroy((sessionErr: any) => {
          if (sessionErr) {
            console.error('Session destruction error:', sessionErr);
            // Still return success since passport logout worked
          } else {
            console.log('Session destroyed successfully');
          }
          
          // Clear the session cookie
          res.clearCookie('connect.sid');
          console.log('Logout completed successfully');
          res.json({ message: 'Logged out successfully' });
        });
      });
    } catch (error) {
      console.error('Critical logout error:', error);
      res.status(500).json({ 
        message: 'Critical logout error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // GET logout route for direct browser navigation
  app.get('/api/logout', (req, res) => {
    req.logout((err) => {
      if (err) {
        console.error('Logout error:', err);
        return res.redirect('/login?error=logout_failed');
      }
      res.redirect('/login');
    });
  });

  // Password reset request
  app.post('/api/auth/password-reset-request', async (req, res) => {
    try {
      const validatedData = passwordResetRequestSchema.parse(req.body);
      
      // Find user by email
      const user = await storage.getUserByEmail(validatedData.email);
      
      if (!user || user.authProvider !== 'local') {
        // Don't reveal if user exists or not for security
        return res.json({ 
          message: 'If an account with that email exists, a password reset link has been sent.' 
        });
      }

      // Generate reset token
      const resetToken = nanoid(32);
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

      // Save reset token
      await storage.createPasswordResetToken(user.id, resetToken, expiresAt);

      // Send reset email
      const resetUrl = `${req.protocol}://${req.get('host')}/reset-password?token=${resetToken}`;
      await sendPasswordResetEmail(user.email, user.firstName || 'Customer', resetUrl);

      res.json({ 
        message: 'If an account with that email exists, a password reset link has been sent.' 
      });
    } catch (error: any) {
      console.error('Password reset request error:', error);
      res.status(400).json({ 
        message: 'Validation failed',
        errors: error.errors || [{ message: error.message }]
      });
    }
  });

  // Password reset completion
  app.post('/api/auth/password-reset', async (req, res) => {
    try {
      const validatedData = passwordResetSchema.parse(req.body);
      
      // Find and validate reset token
      const resetTokenData = await storage.getPasswordResetToken(validatedData.token);
      
      if (!resetTokenData || resetTokenData.used || new Date() > resetTokenData.expiresAt) {
        return res.status(400).json({ 
          message: 'Invalid or expired reset token' 
        });
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(validatedData.newPassword, 12);

      // Update user password
      await storage.updateUserPassword(resetTokenData.userId, hashedPassword);

      // Mark token as used
      await storage.markPasswordResetTokenUsed(validatedData.token);

      res.json({ message: 'Password has been reset successfully' });
    } catch (error: any) {
      console.error('Password reset error:', error);
      res.status(400).json({ 
        message: 'Validation failed',
        errors: error.errors || [{ message: error.message }]
      });
    }
  });

  // Emergency admin creation endpoint (only works if no admin exists)
  app.post('/api/create-admin-emergency', async (req, res) => {
    try {
      console.log('Emergency admin creation attempt');
      
      // Check if admin user already exists
      const adminEmail = process.env.ADMIN_EMAIL || 'admin@thebarnmi.com';
      const existingAdmin = await storage.getUserByEmail(adminEmail);
      
      if (existingAdmin) {
        return res.status(400).json({ message: 'Admin user already exists' });
      }
      
      // Get password from environment
      const adminPassword = process.env.ADMIN_PASSWORD;
      
      if (!adminPassword) {
        return res.status(400).json({ message: 'No admin password provided in environment' });
      }
      
      // Create admin user using raw database insert
      const bcrypt = await import('bcryptjs');
      const hashedPassword = await bcrypt.default.hash(adminPassword, 12);
      
      const { db } = await import('./db.js');
      const { users } = await import('../shared/schema.js');
      
      const [adminUser] = await db
        .insert(users)
        .values({
          email: adminEmail,
          passwordHash: hashedPassword,
          firstName: 'Admin',
          lastName: 'User',
          authProvider: 'local',
          isEmailVerified: true,
          role: 'admin'
        })
        .returning();
      
      console.log('Emergency admin created:', adminUser.email);
      res.json({ message: 'Admin user created successfully', email: adminUser.email });
    } catch (error) {
      console.error('Emergency admin creation failed:', error);
      res.status(500).json({ message: 'Failed to create admin user' });
    }
  });

  // Debug endpoint to check admin user status in production
  app.get('/api/debug-admin-status', async (req, res) => {
    try {
      const adminEmail = process.env.ADMIN_EMAIL || 'admin@thebarnmi.com';
      const adminUser = await storage.getUserByEmail(adminEmail);
      
      const status = {
        environment: process.env.NODE_ENV,
        hasAdminPassword: !!process.env.ADMIN_PASSWORD,
        hasSessionSecret: !!process.env.SESSION_SECRET,
        hasDatabaseUrl: !!process.env.DATABASE_URL,
        adminEmail,
        adminExists: !!adminUser,
        adminDetails: adminUser ? {
          id: adminUser.id,
          email: adminUser.email,
          role: adminUser.role,
          hasPasswordHash: !!adminUser.passwordHash,
          authProvider: adminUser.authProvider,
          isEmailVerified: adminUser.isEmailVerified,
          passwordHashLength: adminUser.passwordHash ? adminUser.passwordHash.length : 0
        } : null
      };
      
      console.log('Debug admin status check:', status);
      res.json(status);
    } catch (error) {
      console.error('Debug admin status failed:', error);
      res.status(500).json({ 
        error: 'Failed to check admin status',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Promote user to admin (requires existing admin or first-time setup)
  app.post('/api/promote-to-admin', async (req, res) => {
    try {
      console.log('=== PROMOTE TO ADMIN REQUEST ===');
      console.log('Request body:', req.body);
      console.log('User authenticated:', req.isAuthenticated());
      console.log('Current user:', req.user ? {
        id: (req.user as any).id,
        email: (req.user as any).email,
        role: (req.user as any).role
      } : 'No user');
      
      const { email } = req.body;
      
      if (!email) {
        console.log('Error: No email provided');
        return res.status(400).json({ message: 'Email is required' });
      }
      
      console.log('Looking up user with email:', email);
      
      // Check if user exists
      const user = await storage.getUserByEmail(email);
      console.log('User lookup result:', user ? {
        id: user.id,
        email: user.email,
        role: user.role,
        authProvider: user.authProvider
      } : 'User not found');
      
      if (!user) {
        console.log('Error: User not found for email:', email);
        return res.status(404).json({ 
          message: 'User not found. Please make sure you have created an account with this email address first.' 
        });
      }
      
      // Check if user is already admin
      if (user.role === 'admin') {
        console.log('Error: User is already admin');
        return res.status(400).json({ message: 'User is already an admin' });
      }
      
      // Check if there are any existing admins
      const { db } = await import('./db.js');
      const { users } = await import('../shared/schema.js');
      const { eq } = await import('drizzle-orm');
      
      console.log('Checking for existing admins...');
      const existingAdmins = await db
        .select()
        .from(users)
        .where(eq(users.role, 'admin'));
      
      console.log('Existing admins count:', existingAdmins.length);
      console.log('Existing admins:', existingAdmins.map(admin => ({
        email: admin.email,
        authProvider: admin.authProvider
      })));
      
      // Check if the only admin is the environment-created admin (admin@thebarnmi.com)
      const hasEnvironmentAdminOnly = existingAdmins.length === 1 && 
        existingAdmins[0].email === 'admin@thebarnmi.com' &&
        existingAdmins[0].authProvider === 'local';
      
      console.log('hasEnvironmentAdminOnly:', hasEnvironmentAdminOnly);
      console.log('First admin email:', existingAdmins[0]?.email);
      console.log('First admin authProvider:', existingAdmins[0]?.authProvider);
      
      // Allow promotion if:
      // 1. No admins exist, OR
      // 2. Only the environment admin exists (for first real user setup), OR  
      // 3. User is authenticated as an admin
      const shouldAllowPromotion = existingAdmins.length === 0 || hasEnvironmentAdminOnly || 
        (req.isAuthenticated() && (req.user as any)?.role === 'admin');
      
      if (!shouldAllowPromotion) {
        console.log('Error: Admin privileges required - conditions not met');
        console.log('- No admins exist:', existingAdmins.length === 0);
        console.log('- Only env admin:', hasEnvironmentAdminOnly);
        console.log('- Is authenticated:', req.isAuthenticated());
        console.log('- User role:', (req.user as any)?.role);
        return res.status(403).json({ 
          message: 'Admin privileges required. Another admin must promote you.' 
        });
      }
      
      console.log('Promotion allowed - proceeding...');
      
      console.log('Promoting user to admin...');
      
      // Promote user to admin
      const [updatedUser] = await db
        .update(users)
        .set({ role: 'admin' })
        .where(eq(users.email, email))
        .returning();
      
      console.log('User promoted to admin successfully:', {
        id: updatedUser.id,
        email: updatedUser.email,
        role: updatedUser.role
      });
      
      res.json({ 
        message: 'User promoted to admin successfully',
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          role: updatedUser.role
        }
      });
    } catch (error) {
      console.error('Failed to promote user to admin - detailed error:', error);
      res.status(500).json({ 
        message: 'Failed to promote user to admin',
        error: error instanceof Error ? error.message : 'Unknown error',
        details: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  });

  // List all admin users (admin only)
  app.get('/api/admin/users', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { db } = await import('./db.js');
      const { users } = await import('../shared/schema.js');
      
      const allUsers = await db.select({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        role: users.role,
        isEmailVerified: users.isEmailVerified,
        authProvider: users.authProvider,
        createdAt: users.createdAt
      }).from(users);
      
      res.json(allUsers);
    } catch (error) {
      console.error('Failed to get users:', error);
      res.status(500).json({ message: 'Failed to retrieve users' });
    }
  });

  // Remove admin privileges (admin only, cannot remove own admin)
  app.post('/api/remove-admin', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { email } = req.body;
      const currentUser = req.user as any;
      
      if (!email) {
        return res.status(400).json({ message: 'Email is required' });
      }
      
      // Prevent self-demotion
      if (currentUser.email === email) {
        return res.status(400).json({ message: 'Cannot remove your own admin privileges' });
      }
      
      // Check if user exists
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      if (user.role !== 'admin') {
        return res.status(400).json({ message: 'User is not an admin' });
      }
      
      // Remove admin privileges
      const { db } = await import('./db.js');
      const { users } = await import('../shared/schema.js');
      const { eq } = await import('drizzle-orm');
      
      const [updatedUser] = await db
        .update(users)
        .set({ role: 'customer' })
        .where(eq(users.email, email))
        .returning();
      
      console.log('Admin privileges removed from:', email);
      res.json({ 
        message: 'Admin privileges removed successfully',
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          role: updatedUser.role
        }
      });
    } catch (error) {
      console.error('Failed to remove admin privileges:', error);
      res.status(500).json({ message: 'Failed to remove admin privileges' });
    }
  });

  // Auth routes with comprehensive debugging
  app.get('/api/auth/user', async (req: any, res) => {
    try {
      console.log('=== AUTH USER ENDPOINT DEBUG ===');
      console.log('Session ID:', req.sessionID);
      console.log('Is Authenticated:', req.isAuthenticated());
      console.log('Has User:', !!req.user);
      console.log('Session Store Keys:', Object.keys(req.session || {}));
      console.log('Passport User:', req.session?.passport?.user);
      console.log('Request Headers:', {
        cookie: req.headers.cookie,
        userAgent: req.headers['user-agent'],
        host: req.headers.host
      });
      
      if (!req.isAuthenticated() || !req.user) {
        console.log('User not authenticated - returning 401');
        return res.status(401).json({ 
          message: "Not authenticated",
          debug: {
            isAuthenticated: req.isAuthenticated(),
            hasUser: !!req.user,
            sessionID: req.sessionID
          }
        });
      }
      
      const user = req.user;
      console.log("User authenticated successfully:", {
        id: user.id,
        email: user.email,
        role: user.role
      });
      
      // Return user without sensitive information
      const { passwordHash, authProvider, ...safeUser } = user;
      res.json(safeUser);
    } catch (error) {
      console.error("Error in auth/user endpoint:", error);
      res.status(500).json({ 
        message: "Failed to fetch user",
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Comprehensive production debugging endpoint
  app.get('/api/debug/session-info', async (req: any, res) => {
    try {
      const debug = {
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
        sessionID: req.sessionID,
        hasSession: !!req.session,
        sessionData: req.session ? Object.keys(req.session) : null,
        isAuthenticated: req.isAuthenticated(),
        hasUser: !!req.user,
        userInfo: req.user ? {
          id: req.user.id,
          email: req.user.email,
          role: req.user.role
        } : null,
        cookies: req.headers.cookie,
        passportSession: req.session?.passport,
        host: req.headers.host,
        userAgent: req.headers['user-agent'],
        databaseStatus: 'connected',
        sessionStore: !!req.sessionStore
      };
      
      console.log('Session debug info:', debug);
      res.json(debug);
    } catch (error) {
      console.error('Debug endpoint error:', error);
      res.status(500).json({
        error: 'Debug failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // TEMPORARY: Fix bundle names to shorter versions
  app.get('/api/admin/fix-bundle-names', async (req, res) => {
    try {
      console.log('🔄 Fixing bundle names to shorter versions...');
      
      // Import database connection
      const { db } = await import('./db.js');
      const { bundles } = await import('../shared/schema.js');
      const { eq } = await import('drizzle-orm');
      
      // Update Bundle 2 to shorter name
      const [updatedBundle2] = await db
        .update(bundles)
        .set({ name: 'Team Bundle 1' })
        .where(eq(bundles.id, 'bundle2'))
        .returning();
      
      // Update Bundle 3 to shorter name  
      const [updatedBundle3] = await db
        .update(bundles)
        .set({ name: 'Team Bundle 2' })
        .where(eq(bundles.id, 'bundle3'))
        .returning();
      
      const result = {
        timestamp: new Date().toISOString(),
        message: 'Bundle names fixed successfully!',
        changes: {
          bundle2: updatedBundle2,
          bundle3: updatedBundle3
        }
      };
      
      console.log('✅ Bundle names fixed:', result);
      
      res.json(result);
    } catch (error) {
      console.error('❌ Bundle name fix failed:', error);
      res.status(500).json({
        message: 'Bundle name fix failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    }
  });

  // TEMPORARY: Production data update endpoint
  app.get('/api/admin/update-production-data', async (req, res) => {
    try {
      console.log('🔄 Production data update requested via API');
      
      // Import database connection
      const { db } = await import('./db.js');
      const { spaces, bundles } = await import('../shared/schema.js');
      const { eq } = await import('drizzle-orm');
      
      // Check current state
      const currentSpaceB = await db.select().from(spaces).where(eq(spaces.id, 'B'));
      const currentBundles = await db.select().from(bundles);
      
      console.log('Current Space B:', currentSpaceB[0]);
      console.log('Current Bundles:', currentBundles);
      
      // Update Space B pricing to $30.00
      const [updatedSpaceB] = await db
        .update(spaces)
        .set({ hourlyRate: '30.00' })
        .where(eq(spaces.id, 'B'))
        .returning();
      
      // Deactivate Bundle 1
      const [updatedBundle1] = await db
        .update(bundles)
        .set({ isActive: false })
        .where(eq(bundles.id, 'bundle1'))
        .returning();
      
      // Rename Bundle 2
      const [updatedBundle2] = await db
        .update(bundles)
        .set({ name: 'Team Bundle 1' })
        .where(eq(bundles.id, 'bundle2'))
        .returning();
      
      // Rename Bundle 3
      const [updatedBundle3] = await db
        .update(bundles)
        .set({ name: 'Team Bundle 2' })
        .where(eq(bundles.id, 'bundle3'))
        .returning();
      
      const result = {
        timestamp: new Date().toISOString(),
        message: 'Production data updated successfully!',
        changes: {
          spaceB: updatedSpaceB,
          bundle1: updatedBundle1,
          bundle2: updatedBundle2,
          bundle3: updatedBundle3
        }
      };
      
      console.log('✅ Production update completed:', result);
      
      res.json(result);
    } catch (error) {
      console.error('❌ Production update failed:', error);
      res.status(500).json({
        message: 'Production update failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    }
  });

  // Diagnostic endpoint for debugging cache issues
  app.get('/api/debug/pricing', async (req, res) => {
    try {
      // No auth required for debugging
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Content-Type', 'text/plain');
      
      console.log('=== PRICING DEBUG ENDPOINT CALLED ===');
      const spaces = await storage.getSpaces();
      const spaceB = spaces.find(s => s.id === 'B');
      
      const debugInfo = `
PRICING DEBUG REPORT - ${new Date().toISOString()}
Environment: ${process.env.NODE_ENV}
Database URL exists: ${!!process.env.DATABASE_URL}
Space B from database: ${spaceB ? JSON.stringify(spaceB, null, 2) : 'NOT FOUND'}
All spaces: ${JSON.stringify(spaces, null, 2)}
Request headers: ${JSON.stringify(req.headers, null, 2)}
      `.trim();
      
      console.log(debugInfo);
      res.send(debugInfo);
    } catch (error) {
      console.error('Debug endpoint error:', error);
      res.status(500).send(`Debug endpoint error: ${error}`);
    }
  });

  // Spaces routes
  app.get('/api/spaces', async (req, res) => {
    try {
      // Ultra-aggressive cache-busting headers for deployment
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0, s-maxage=0');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.setHeader('ETag', `spaces-${Date.now()}-${Math.random()}`);
      res.setHeader('Last-Modified', new Date().toUTCString());
      res.setHeader('Vary', '*');
      res.setHeader('X-Pricing-Version', '2025-08-31-v3-nuclear'); // Nuclear cache fix deployment
      
      // Ultra-detailed logging for deployed environment debugging
      const timestamp = new Date().toISOString();
      console.log(`\n=== SPACES API CALLED [${timestamp}] ===`);
      console.log('Environment:', process.env.NODE_ENV);
      console.log('Database URL exists:', !!process.env.DATABASE_URL);
      console.log('Database URL starts with:', process.env.DATABASE_URL?.substring(0, 20) + '...');
      console.log('Request URL:', req.url);
      console.log('Request query params:', req.query);
      console.log('User Agent:', req.headers['user-agent']);
      
      const spaces = await storage.getSpaces();
      console.log('RAW DATABASE RESPONSE:', JSON.stringify(spaces, null, 2));
      console.log('SPACE COUNT:', spaces.length);
      console.log('PRICING VERIFICATION:', spaces.map(s => `${s.name}: $${s.hourlyRate}`));
      
      // Double-check Space B specifically with all details
      const spaceB = spaces.find(s => s.id === 'B');
      if (spaceB) {
        console.log('SPACE B FOUND WITH DETAILS:', JSON.stringify(spaceB, null, 2));
        console.log('SPACE B PRICE TYPE:', typeof spaceB.hourlyRate);
        console.log('SPACE B PRICE VALUE:', spaceB.hourlyRate);
      } else {
        console.log('SPACE B NOT FOUND IN DATABASE!');
      }
      
      console.log(`=== END SPACES API LOG [${timestamp}] ===\n`);
      
      res.json(spaces);
    } catch (error) {
      console.error("Error fetching spaces:", error);
      res.status(500).json({ message: "Failed to fetch spaces" });
    }
  });

  // Bundles routes
  app.get('/api/bundles', async (req, res) => {
    try {
      // Add cache-control headers to prevent browser caching
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      
      const bundles = await storage.getBundles();
      res.json(bundles);
    } catch (error) {
      console.error("Error fetching bundles:", error);
      res.status(500).json({ message: "Failed to fetch bundles" });
    }
  });

  // Bookings routes
  app.get('/api/bookings', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      
      if (!userId) {
        return res.status(400).json({ message: "User ID not found" });
      }
      
      const bookings = await storage.getUserBookings(userId);
      res.json(bookings);
    } catch (error) {
      console.error("Error fetching bookings:", error);
      res.status(500).json({ message: "Failed to fetch bookings" });
    }
  });

  // More specific route first - date-based availability check
  app.get('/api/bookings/availability/:date', async (req, res) => {
    try {
      const { date } = req.params;
      if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return res.status(400).json({ message: "Valid date in YYYY-MM-DD format is required" });
      }
      
      console.log(`Getting availability for date: ${date}`);
      
      // Get all bookings for the entire day
      const startOfDay = new Date(date + 'T00:00:00.000Z');
      const endOfDay = new Date(date + 'T23:59:59.999Z');
      
      const bookings = await storage.getBookingsForTimeRange(startOfDay, endOfDay);
      console.log(`Found ${bookings.length} bookings for ${date}`);
      res.json(bookings);
    } catch (error) {
      console.error("Error checking availability for date:", error);
      res.status(500).json({ message: "Failed to check availability" });
    }
  });

  // General availability route with query parameters
  app.get('/api/bookings/availability', async (req, res) => {
    try {
      const { startTime, endTime } = req.query;
      if (!startTime || !endTime) {
        return res.status(400).json({ message: "Start time and end time are required" });
      }
      
      const bookings = await storage.getBookingsForTimeRange(
        new Date(startTime as string),
        new Date(endTime as string)
      );
      res.json(bookings);
    } catch (error) {
      console.error("Error checking availability:", error);
      res.status(500).json({ message: "Failed to check availability" });
    }
  });

  // Get individual booking by ID
  app.get('/api/bookings/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      
      if (!userId) {
        return res.status(400).json({ message: "User ID not found" });
      }
      
      const booking = await storage.getBooking(id);
      
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }
      
      // Ensure the booking belongs to the authenticated user
      if (booking.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      res.json(booking);
    } catch (error) {
      console.error("Error fetching booking:", error);
      res.status(500).json({ message: "Failed to fetch booking" });
    }
  });

  app.post('/api/bookings', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      
      if (!userId) {
        return res.status(400).json({ message: "User ID not found" });
      }
      
      console.log("Creating booking for user:", userId);
      console.log("Request body:", req.body);
      
      // User already exists since they're authenticated via local auth
      const user = req.user;
      
      const bookingData = insertBookingSchema.parse({
        ...req.body,
        userId,
      });
      
      console.log("Parsed booking data:", bookingData);

      const booking = await storage.createBooking(bookingData);
      console.log("Booking created successfully:", booking);
      res.json(booking);
    } catch (error) {
      console.error("Error creating booking - Full details:", error);
      console.error("Error stack:", error instanceof Error ? error.stack : 'No stack trace');
      
      if (error instanceof Error) {
        res.status(500).json({ 
          message: "Failed to create booking", 
          error: error.message,
          details: error.stack?.split('\n')[0] 
        });
      } else {
        res.status(500).json({ message: "Failed to create booking", error: String(error) });
      }
    }
  });

  app.patch('/api/bookings/:id/status', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const userId = req.user.id;
      
      if (!userId) {
        return res.status(400).json({ message: "User ID not found" });
      }

      // Verify the booking belongs to the user
      const existingBooking = await storage.getBooking(id);
      if (!existingBooking || existingBooking.userId !== userId) {
        return res.status(404).json({ message: "Booking not found" });
      }

      const booking = await storage.updateBookingStatus(id, status);
      res.json(booking);
    } catch (error) {
      console.error("Error updating booking status:", error);
      res.status(500).json({ message: "Failed to update booking status" });
    }
  });

  // Stripe payment routes
  app.post("/api/create-payment-intent", isAuthenticated, async (req: any, res) => {
    try {
      console.log("Creating payment intent request:", req.body);
      
      if (!stripe) {
        console.log("Stripe not configured, returning 503");
        return res.status(503).json({ 
          message: "Payment processing is currently unavailable. Stripe is not configured." 
        });
      }

      const { amount, bookingId } = req.body;
      
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: "usd",
        metadata: {
          bookingId: bookingId || '',
        },
      });

      if (bookingId) {
        await storage.updateBookingPayment(bookingId, paymentIntent.id);
      }

      res.json({ 
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id 
      });
    } catch (error: any) {
      console.error("Payment intent creation failed:", {
        error: error.message,
        code: error.code,
        type: error.type,
        requestId: error.request_id,
        statusCode: error.statusCode,
        amount: req.body.amount,
        bookingId: req.body.bookingId
      });
      res.status(500).json({ 
        message: "Error creating payment intent: " + error.message,
        code: error.code || 'unknown_error'
      });
    }
  });

  // Stripe webhook for payment completion
  app.post("/api/stripe/webhook", async (req, res) => {
    try {
      if (!stripe) {
        return res.status(503).json({ message: "Stripe not configured" });
      }

      const event = req.body;
      
      // Handle the event
      switch (event.type) {
        case 'payment_intent.succeeded':
          const paymentIntent = event.data.object;
          const bookingId = paymentIntent.metadata?.bookingId;
          
          if (bookingId) {
            console.log(`Payment succeeded for booking ${bookingId}`);
            
            // Update booking status to confirmed
            await storage.updateBookingStatus(bookingId, 'confirmed');
            
            // Send confirmation email
            const booking = await storage.getBooking(bookingId);
            if (booking) {
              const user = await storage.getUser(booking.userId);
              if (user?.email) {
                let spaceName = 'Unknown Space';
                if (booking.spaceId) {
                  const space = await storage.getSpace(booking.spaceId);
                  spaceName = space?.name || 'Unknown Space';
                } else if (booking.bundleId) {
                  const bundle = await storage.getBundle(booking.bundleId);
                  spaceName = bundle?.name || 'Unknown Bundle';
                }

                const emailSent = await sendBookingConfirmation({
                  to: user.email,
                  userName: user.firstName || 'Valued Customer',
                  spaceName,
                  startTime: booking.startTime,
                  endTime: booking.endTime,
                  totalAmount: booking.totalAmount,
                  bookingId: booking.id,
                });

                if (emailSent) {
                  console.log(`Confirmation email sent to ${user.email} for booking ${bookingId}`);
                } else {
                  console.error(`Failed to send confirmation email for booking ${bookingId}`);
                }
              }
            }
          }
          break;
        
        case 'payment_intent.payment_failed':
          const failedPaymentIntent = event.data.object;
          const failedBookingId = failedPaymentIntent.metadata?.bookingId;
          
          if (failedBookingId) {
            console.log(`Payment failed for booking ${failedBookingId}`);
            await storage.updateBookingStatus(failedBookingId, 'payment_failed');
          }
          break;

        default:
          console.log(`Unhandled Stripe event type: ${event.type}`);
      }

      res.json({ received: true });
    } catch (error: any) {
      console.error('Stripe webhook error:', error);
      res.status(400).json({ message: 'Webhook handler failed' });
    }
  });

  // Manual confirmation email trigger (for payment success page)
  app.post('/api/send-confirmation-email', isAuthenticated, async (req: any, res) => {
    try {
      const { bookingId } = req.body;
      const userId = req.user.id;

      if (!bookingId) {
        return res.status(400).json({ message: 'Booking ID is required' });
      }

      const booking = await storage.getBooking(bookingId);
      if (!booking || booking.userId !== userId) {
        return res.status(404).json({ message: 'Booking not found' });
      }

      const user = await storage.getUser(booking.userId);
      if (!user?.email) {
        return res.status(400).json({ message: 'User email not found' });
      }

      let spaceName = 'Unknown Space';
      if (booking.spaceId) {
        const space = await storage.getSpace(booking.spaceId);
        spaceName = space?.name || 'Unknown Space';
      } else if (booking.bundleId) {
        const bundle = await storage.getBundle(booking.bundleId);
        spaceName = bundle?.name || 'Unknown Bundle';
      }

      const emailSent = await sendBookingConfirmation({
        to: user.email,
        userName: user.firstName || 'Valued Customer',
        spaceName,
        startTime: booking.startTime,
        endTime: booking.endTime,
        totalAmount: booking.totalAmount,
        bookingId: booking.id,
      });

      if (emailSent) {
        res.json({ message: 'Confirmation email sent successfully' });
      } else {
        res.status(500).json({ message: 'Failed to send confirmation email' });
      }
    } catch (error) {
      console.error('Error sending confirmation email:', error);
      res.status(500).json({ message: 'Failed to send confirmation email' });
    }
  });

  // Admin booking creation (cash payments or comps)
  app.post('/api/admin/bookings', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const { customerEmail, paymentMethod = 'cash', ...bookingData } = req.body;
      
      // Find or create customer user
      let customer = await storage.getUserByEmail(customerEmail);
      if (!customer) {
        // Create a basic customer account
        customer = await storage.createUser({
          email: customerEmail,
          firstName: bookingData.customerName || 'Customer',
          lastName: '',
          passwordHash: null, // No password for admin-created accounts
          role: 'customer'
        });
      }

      if (!customer) {
        return res.status(500).json({ message: "Failed to create or find customer" });
      }

      const booking = await storage.createBooking({
        ...insertBookingSchema.parse({
          ...bookingData,
          userId: customer.id,
          paymentMethod
        })
      });

      console.log(`Admin booking created: ${booking.id} for ${customerEmail} (${paymentMethod} payment)`);

      // Send confirmation email if customer has email
      if (customer?.email) {
        let spaceName = 'Unknown Space';
        if (booking.spaceId) {
          const space = await storage.getSpace(booking.spaceId);
          spaceName = space?.name || 'Unknown Space';
        } else if (booking.bundleId) {
          const bundle = await storage.getBundle(booking.bundleId);
          spaceName = bundle?.name || 'Unknown Bundle';
        }

        await sendBookingConfirmation({
          to: customer.email,
          userName: customer.firstName || 'Valued Customer',
          spaceName,
          startTime: booking.startTime,
          endTime: booking.endTime,
          totalAmount: booking.totalAmount,
          bookingId: booking.id,
        });
      }

      res.json(booking);
    } catch (error) {
      console.error("Error creating admin booking:", error);
      res.status(500).json({ message: "Failed to create admin booking" });
    }
  });

  // Get all bookings (admin only)
  app.get('/api/admin/bookings', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const bookings = await storage.getAllBookingsWithCustomerInfo();
      res.json(bookings);
    } catch (error) {
      console.error("Error fetching all bookings:", error);
      res.status(500).json({ message: "Failed to fetch bookings" });
    }
  });

  // Email reminder job (would typically be run via cron)
  app.post('/api/send-reminders', async (req, res) => {
    try {
      const bookingsNeedingReminders = await storage.getBookingsNeedingReminders();
      
      for (const booking of bookingsNeedingReminders) {
        const user = await storage.getUser(booking.userId);
        if (!user || !user.email) continue;

        let spaceName = 'Unknown Space';
        if (booking.spaceId) {
          const space = await storage.getSpace(booking.spaceId);
          spaceName = space?.name || 'Unknown Space';
        } else if (booking.bundleId) {
          const bundle = await storage.getBundle(booking.bundleId);
          spaceName = bundle?.name || 'Unknown Bundle';
        }

        const reminderSent = await sendBookingReminder({
          to: user.email,
          userName: user.firstName || 'Valued Customer',
          spaceName,
          startTime: booking.startTime,
          endTime: booking.endTime,
          totalAmount: booking.totalAmount,
        });

        if (reminderSent) {
          await storage.markReminderSent(booking.id);
        }
      }

      res.json({ 
        message: `Processed ${bookingsNeedingReminders.length} reminder(s)` 
      });
    } catch (error) {
      console.error("Error sending reminders:", error);
      res.status(500).json({ message: "Failed to send reminders" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

async function initializeData() {
  try {
    // Check if spaces already exist
    const existingSpaces = await storage.getSpaces();
    if (existingSpaces.length === 0) {
      // Initialize spaces data
      const { db } = await import("./db");
      const { spaces, bundles } = await import("@shared/schema");
      
      await db.insert(spaces).values([
        {
          id: "A",
          name: "Space A",
          description: "60' x 88' Open Practice Area",
          dimensions: "60' x 88'",
          equipment: "Includes cones, bases, balls, pitching mounds, mini hurdles, medicine balls, and sliding mat",
          hourlyRate: "75.00",
        },
        {
          id: "B", 
          name: "Space B",
          description: "12' x 40' Batting Cage",
          dimensions: "12' x 40'",
          equipment: "Includes batting tee, balls, Blast Technology, and L-screen",
          hourlyRate: "30.00",
        },
        {
          id: "C",
          name: "Space C", 
          description: "12' x 40' Batting Cage",
          dimensions: "12' x 40'",
          equipment: "Includes batting tee, balls, L-screen, Blast Technology, and Hack Attack Jr Pitching Machine",
          hourlyRate: "50.00",
        },
        {
          id: "D",
          name: "Space D",
          description: "12' x 70' Batting Cage", 
          dimensions: "12' x 70'",
          equipment: "Includes batting tee, balls, L-screen, Hit Tracks and Hack Attack Elite Pitching Machine",
          hourlyRate: "100.00",
        },
      ]);

      await db.insert(bundles).values([
        {
          id: "bundle2", 
          name: "Team Bundle 1",
          description: "Spaces A, B & C - Practice + batting cages",
          spaceIds: ["A", "B", "C"],
          hourlyRate: "120.00",
        },
        {
          id: "bundle3",
          name: "Team Bundle 2", 
          description: "Entire Facility - Spaces A, B, C & D",
          spaceIds: ["A", "B", "C", "D"],
          hourlyRate: "200.00",
        },
      ]);
    }
  } catch (error) {
    console.error("Error initializing data:", error);
  }
}
