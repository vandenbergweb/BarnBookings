import {
  users,
  spaces,
  bundles,
  bookings,
  type User,
  type UpsertUser,
  type Space,
  type Bundle,
  type Booking,
  type InsertBooking,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, gte, lte, desc } from "drizzle-orm";

export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
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
  getBooking(id: string): Promise<Booking | undefined>;
  updateBookingStatus(id: string, status: string): Promise<Booking>;
  updateBookingPayment(id: string, paymentIntentId: string): Promise<Booking>;
  getBookingsForTimeRange(startTime: Date, endTime: Date): Promise<Booking[]>;
  getBookingsNeedingReminders(): Promise<Booking[]>;
  markReminderSent(bookingId: string): Promise<void>;
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
    return await db.select().from(spaces).where(eq(spaces.isActive, true));
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

  async getBookingsForTimeRange(startTime: Date, endTime: Date): Promise<Booking[]> {
    return await db
      .select()
      .from(bookings)
      .where(
        and(
          gte(bookings.startTime, startTime),
          lte(bookings.endTime, endTime),
          eq(bookings.status, "confirmed")
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
}

export const storage = new DatabaseStorage();
