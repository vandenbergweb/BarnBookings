import bcrypt from 'bcryptjs';
import { Strategy as LocalStrategy } from 'passport-local';
import passport from 'passport';
import { storage } from './storage';

// Configure Local Strategy for email/password authentication
export function setupLocalAuth() {
  passport.use('local-login', new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password'
  }, async (email, password, done) => {
    try {
      const user = await storage.getUserByEmail(email);
      
      if (!user) {
        return done(null, false, { message: 'No account found with this email address.' });
      }
      
      if (!user.passwordHash) {
        return done(null, false, { message: 'This account uses a different sign-in method.' });
      }
      
      const isValidPassword = await bcrypt.compare(password, user.passwordHash);
      
      if (!isValidPassword) {
        return done(null, false, { message: 'Incorrect password.' });
      }
      
      return done(null, user);
    } catch (error) {
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