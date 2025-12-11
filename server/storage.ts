import {
  users,
  spaces,
  bundles,
  bookings,
  passwordResetTokens,
  facilitySettings,
  type User,
  type UpsertUser,
  type Space,
  type Bundle,
  type Booking,
  type InsertBooking,
  type FacilitySettings,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, gte, lte, lt, gt, desc, asc } from "drizzle-orm";

export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  createLocalUser(userData: {
    email: string;
    firstName: string;
    lastName: string;
    passwordHash: string;
    authProvider: 'local';
    isEmailVerified: boolean;
  }): Promise<User>;
  createUser(userData: {
    email: string;
    firstName: string;
    lastName: string;
    passwordHash: string | null;
    role?: string;
  }): Promise<User>;
  updateStripeCustomerId(userId: string, customerId: string): Promise<User>;
  
  // Space operations
  getSpaces(): Promise<Space[]>;
  getSpace(id: string): Promise<Space | undefined>;
  
  // Bundle operations
  getBundles(): Promise<Bundle[]>;
  getBundle(id: string): Promise<Bundle | undefined>;
  
  // Booking operations
  createBooking(booking: InsertBooking): Promise<Booking>;
  getUserBookings(userId: string): Promise<Booking[]>;
  getAllBookings(): Promise<Booking[]>;
  getAllBookingsWithCustomerInfo(): Promise<(Booking & { customerName: string; customerEmail: string })[]>;
  getBooking(id: string): Promise<Booking | undefined>;
  updateBookingStatus(id: string, status: string): Promise<Booking>;
  updateBookingPayment(id: string, paymentIntentId: string): Promise<Booking>;
  updateBookingCalendarEventId(id: string, calendarEventId: string): Promise<Booking>;
  getBookingsForTimeRange(startTime: Date, endTime: Date): Promise<Booking[]>;
  getBookingsNeedingReminders(): Promise<Booking[]>;
  markReminderSent(bookingId: string): Promise<void>;
  expireOldPendingBookings(timeoutMinutes: number): Promise<number>;
  
  // Password reset operations
  createPasswordResetToken(userId: string, token: string, expiresAt: Date): Promise<void>;
  getPasswordResetToken(token: string): Promise<{ userId: string; expiresAt: Date; used: boolean } | undefined>;
  markPasswordResetTokenUsed(token: string): Promise<void>;
  updateUserPassword(userId: string, passwordHash: string): Promise<void>;
  
  // Facility settings operations
  getFacilitySettings(): Promise<FacilitySettings>;
  updateFacilitySettings(settings: Partial<FacilitySettings>): Promise<FacilitySettings>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createLocalUser(userData: {
    email: string;
    firstName: string;
    lastName: string;
    passwordHash: string;
    authProvider: 'local';
    isEmailVerified: boolean;
  }): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .returning();
    return user;
  }

  async createUser(userData: {
    email: string;
    firstName: string;
    lastName: string;
    passwordHash: string | null;
    role?: string;
  }): Promise<User> {
    const [user] = await db
      .insert(users)
      .values({
        ...userData,
        role: userData.role || 'customer',
        authProvider: 'local',
        isEmailVerified: false,
      })
      .returning();
    return user;
  }

  async updateStripeCustomerId(userId: string, customerId: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ stripeCustomerId: customerId, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  // Space operations
  async getSpaces(): Promise<Space[]> {
    return await db.select().from(spaces).where(eq(spaces.isActive, true)).orderBy(asc(spaces.id));
  }

  async getSpace(id: string): Promise<Space | undefined> {
    const [space] = await db.select().from(spaces).where(eq(spaces.id, id));
    return space;
  }

  // Bundle operations
  async getBundles(): Promise<Bundle[]> {
    return await db.select().from(bundles).where(eq(bundles.isActive, true));
  }

  async getBundle(id: string): Promise<Bundle | undefined> {
    const [bundle] = await db.select().from(bundles).where(eq(bundles.id, id));
    return bundle;
  }

  // Booking operations
  async createBooking(booking: InsertBooking): Promise<Booking> {
    // Check for conflicting bookings before creating
    const conflictingBookings = await this.getBookingsForTimeRange(
      booking.startTime,
      booking.endTime
    );

    // Get bundle information if needed for conflict checking
    let newBookingBundle: Bundle | undefined;
    if (booking.bundleId) {
      newBookingBundle = await this.getBundle(booking.bundleId);
    }

    // Filter conflicts based on space/bundle overlap
    const hasConflict = await Promise.all(
      conflictingBookings.map(async existingBooking => {
        // Direct space conflict
        if (booking.spaceId && existingBooking.spaceId === booking.spaceId) {
          return true;
        }

        // Direct bundle conflict
        if (booking.bundleId && existingBooking.bundleId === booking.bundleId) {
          return true;
        }

        // Bundle-space conflicts: check if new booking's bundle includes an already booked space
        if (booking.bundleId && existingBooking.spaceId && newBookingBundle) {
          if (newBookingBundle.spaceIds.includes(existingBooking.spaceId)) {
            return true;
          }
        }

        // Space-bundle conflicts: check if new booking's space is included in an already booked bundle
        if (booking.spaceId && existingBooking.bundleId) {
          const existingBundle = await this.getBundle(existingBooking.bundleId);
          if (existingBundle && existingBundle.spaceIds.includes(booking.spaceId)) {
            return true;
          }
        }

        // Bundle-to-bundle conflicts: check if two different bundles share any spaces
        if (booking.bundleId && existingBooking.bundleId && booking.bundleId !== existingBooking.bundleId && newBookingBundle) {
          const existingBundle = await this.getBundle(existingBooking.bundleId);
          if (existingBundle) {
            // Check if any spaces overlap between the two bundles
            const hasOverlap = newBookingBundle.spaceIds.some(spaceId => 
              existingBundle.spaceIds.includes(spaceId)
            );
            if (hasOverlap) {
              return true;
            }
          }
        }

        return false;
      })
    );

    if (hasConflict.some(conflict => conflict)) {
      throw new Error('Time slot is already booked for the selected space or bundle');
    }

    const [newBooking] = await db.insert(bookings).values(booking).returning();
    return newBooking;
  }

  async getUserBookings(userId: string): Promise<Booking[]> {
    return await db
      .select()
      .from(bookings)
      .where(eq(bookings.userId, userId))
      .orderBy(desc(bookings.startTime));
  }

  async getAllBookings(): Promise<Booking[]> {
    return await db
      .select()
      .from(bookings)
      .orderBy(desc(bookings.startTime));
  }

  async getAllBookingsWithCustomerInfo(): Promise<(Booking & { customerName: string; customerEmail: string })[]> {
    const result = await db
      .select({
        id: bookings.id,
        userId: bookings.userId,
        spaceId: bookings.spaceId,
        bundleId: bookings.bundleId,
        startTime: bookings.startTime,
        endTime: bookings.endTime,
        totalAmount: bookings.totalAmount,
        status: bookings.status,
        paymentMethod: bookings.paymentMethod,
        stripePaymentIntentId: bookings.stripePaymentIntentId,
        calendarEventId: bookings.calendarEventId,
        reminderSent: bookings.reminderSent,
        createdAt: bookings.createdAt,
        updatedAt: bookings.updatedAt,
        customerName: users.firstName,
        customerEmail: users.email
      })
      .from(bookings)
      .innerJoin(users, eq(bookings.userId, users.id))
      .orderBy(desc(bookings.startTime));
    
    return result.map(row => ({
      ...row,
      customerName: row.customerName || 'Unknown',
    }));
  }

  async getBooking(id: string): Promise<Booking | undefined> {
    const [booking] = await db.select().from(bookings).where(eq(bookings.id, id));
    return booking;
  }

  async updateBookingStatus(id: string, status: string): Promise<Booking> {
    const [booking] = await db
      .update(bookings)
      .set({ status, updatedAt: new Date() })
      .where(eq(bookings.id, id))
      .returning();
    return booking;
  }

  async updateBookingPayment(id: string, paymentIntentId: string): Promise<Booking> {
    const [booking] = await db
      .update(bookings)
      .set({ stripePaymentIntentId: paymentIntentId, updatedAt: new Date() })
      .where(eq(bookings.id, id))
      .returning();
    return booking;
  }

  async updateBookingCalendarEventId(id: string, calendarEventId: string): Promise<Booking> {
    const [booking] = await db
      .update(bookings)
      .set({ calendarEventId, updatedAt: new Date() })
      .where(eq(bookings.id, id))
      .returning();
    return booking;
  }

  async getBookingsForTimeRange(startTime: Date, endTime: Date): Promise<Booking[]> {
    // Check for any overlapping bookings: booking_start < query_end AND booking_end > query_start
    return await db
      .select()
      .from(bookings)
      .where(
        and(
          eq(bookings.status, "confirmed"),
          // Booking starts before our query ends AND booking ends after our query starts
          // This catches all overlapping scenarios
          // Using < and > (not <= and >=) to allow adjacent bookings (one ends when another begins)
          lt(bookings.startTime, endTime),
          gt(bookings.endTime, startTime)
        )
      );
  }

  async getBookingsNeedingReminders(): Promise<Booking[]> {
    const twentyFourHoursFromNow = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const twentyThreeHoursFromNow = new Date(Date.now() + 23 * 60 * 60 * 1000);
    
    return await db
      .select()
      .from(bookings)
      .where(
        and(
          gte(bookings.startTime, twentyThreeHoursFromNow),
          lte(bookings.startTime, twentyFourHoursFromNow),
          eq(bookings.reminderSent, false),
          eq(bookings.status, "confirmed")
        )
      );
  }

  async markReminderSent(bookingId: string): Promise<void> {
    await db
      .update(bookings)
      .set({ reminderSent: true, updatedAt: new Date() })
      .where(eq(bookings.id, bookingId));
  }

  async expireOldPendingBookings(timeoutMinutes: number = 30): Promise<number> {
    const timeoutDate = new Date(Date.now() - timeoutMinutes * 60 * 1000);
    
    // Find and update pending bookings older than the timeout
    const expiredBookings = await db
      .update(bookings)
      .set({ status: 'expired', updatedAt: new Date() })
      .where(
        and(
          eq(bookings.status, 'pending'),
          lte(bookings.createdAt, timeoutDate)
        )
      )
      .returning();
    
    console.log(`Expired ${expiredBookings.length} pending bookings older than ${timeoutMinutes} minutes`);
    return expiredBookings.length;
  }

  // Password reset operations
  async createPasswordResetToken(userId: string, token: string, expiresAt: Date): Promise<void> {
    await db.insert(passwordResetTokens).values({
      userId,
      token,
      expiresAt,
      used: false,
    });
  }

  async getPasswordResetToken(token: string): Promise<{ userId: string; expiresAt: Date; used: boolean } | undefined> {
    const [resetToken] = await db
      .select({
        userId: passwordResetTokens.userId,
        expiresAt: passwordResetTokens.expiresAt,
        used: passwordResetTokens.used,
      })
      .from(passwordResetTokens)
      .where(eq(passwordResetTokens.token, token));
    return resetToken;
  }

  async markPasswordResetTokenUsed(token: string): Promise<void> {
    await db
      .update(passwordResetTokens)
      .set({ used: true })
      .where(eq(passwordResetTokens.token, token));
  }

  async updateUserPassword(userId: string, passwordHash: string): Promise<void> {
    await db
      .update(users)
      .set({ passwordHash })
      .where(eq(users.id, userId));
  }

  // Facility settings operations
  async getFacilitySettings(): Promise<FacilitySettings> {
    const [settings] = await db.select().from(facilitySettings).where(eq(facilitySettings.id, 'default'));
    
    // If no settings exist, create default settings
    if (!settings) {
      const [newSettings] = await db
        .insert(facilitySettings)
        .values({
          id: 'default',
          openingTime: 8,
          closingTime: 21,
          mondayOpen: true,
          tuesdayOpen: true,
          wednesdayOpen: true,
          thursdayOpen: true,
          fridayOpen: true,
          saturdayOpen: true,
          sundayOpen: true,
        })
        .returning();
      return newSettings;
    }
    
    return settings;
  }

  async updateFacilitySettings(settings: Partial<FacilitySettings>): Promise<FacilitySettings> {
    const [updated] = await db
      .update(facilitySettings)
      .set({ ...settings, updatedAt: new Date() })
      .where(eq(facilitySettings.id, 'default'))
      .returning();
    return updated;
  }
}

export const storage = new DatabaseStorage();
