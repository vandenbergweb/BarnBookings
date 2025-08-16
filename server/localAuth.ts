import bcrypt from 'bcryptjs';
import { Strategy as LocalStrategy } from 'passport-local';
import passport from 'passport';
import session from "express-session";
import connectPg from "connect-pg-simple";
import type { Express, RequestHandler } from "express";
import { storage } from './storage';

// Configure Local Strategy for email/password authentication
export function setupLocalAuth() {
  passport.use('local-login', new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password'
  }, async (email, password, done) => {
    try {
      console.log(`User found: ${!!await storage.getUserByEmail(email) ? 'Yes' : 'No'} ${email}`);
      const user = await storage.getUserByEmail(email);
      
      if (!user) {
        console.log(`Login failed: No user found for ${email}`);
        return done(null, false, { message: 'No account found with this email address.' });
      }
      
      if (!user.passwordHash) {
        console.log(`Login failed: No password hash for ${email}`);
        return done(null, false, { message: 'This account uses a different sign-in method.' });
      }
      
      const isValidPassword = await bcrypt.compare(password, user.passwordHash);
      
      if (!isValidPassword) {
        console.log(`Login failed: Invalid password for ${email}`);
        return done(null, false, { message: 'Incorrect password.' });
      }
      
      console.log(`Login successful for ${email}`);
      return done(null, user);
    } catch (error) {
      console.error(`Login error for ${email}:`, error);
      return done(error);
    }
  }));

  passport.use('local-register', new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password',
    passReqToCallback: true
  }, async (req, email, password, done) => {
    try {
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      
      if (existingUser) {
        return done(null, false, { message: 'An account with this email already exists.' });
      }
      
      // Hash password
      const saltRounds = 12;
      const passwordHash = await bcrypt.hash(password, saltRounds);
      
      // Create new user
      const userData = {
        email,
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        passwordHash,
        authProvider: 'local' as const,
        isEmailVerified: false, // In production, you'd want email verification
      };
      
      const newUser = await storage.createLocalUser(userData);
      return done(null, newUser);
    } catch (error) {
      return done(error);
    }
  }));
}

export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12;
  return bcrypt.hash(password, saltRounds);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  return session({
    secret: process.env.SESSION_SECRET!,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: sessionTtl,
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    },
  });
}

export async function setupAuth(app: Express) {
  // Setup sessions
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  // Setup local authentication strategies
  setupLocalAuth();

  passport.serializeUser((user: Express.User, cb) => {
    const localUser = user as any;
    cb(null, { id: localUser.id, authProvider: 'local' });
  });
  
  passport.deserializeUser(async (sessionData: any, cb) => {
    try {
      if (sessionData.authProvider === 'local') {
        const user = await storage.getUser(sessionData.id);
        if (user) {
          cb(null, { ...user, authProvider: 'local' });
        } else {
          cb(null, false);
        }
      } else {
        cb(null, false);
      }
    } catch (error) {
      cb(error);
    }
  });
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  
  // For local auth users, just check if they're logged in
  return next();
};