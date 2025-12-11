import { sql } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  integer,
  decimal,
  boolean,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table (required for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table (supports both local and Replit auth)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique().notNull(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  stripeCustomerId: varchar("stripe_customer_id"),
  // Local auth fields
  passwordHash: varchar("password_hash"), // Only set for local accounts
  isEmailVerified: boolean("is_email_verified").default(false),
  authProvider: varchar("auth_provider").default("local"), // "local" or "replit"
  role: varchar("role").default("customer"), // "customer" or "admin"
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Password reset tokens
export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  token: varchar("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  used: boolean("used").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Facility spaces
export const spaces = pgTable("spaces", {
  id: varchar("id").primaryKey(),
  name: varchar("name").notNull(),
  description: text("description").notNull(),
  dimensions: varchar("dimensions").notNull(),
  equipment: text("equipment").notNull(),
  hourlyRate: decimal("hourly_rate", { precision: 10, scale: 2 }).notNull(),
  isActive: boolean("is_active").default(true),
});

// Team bundles
export const bundles = pgTable("bundles", {
  id: varchar("id").primaryKey(),
  name: varchar("name").notNull(),
  description: text("description").notNull(),
  spaceIds: text("space_ids").array().notNull(),
  hourlyRate: decimal("hourly_rate", { precision: 10, scale: 2 }).notNull(),
  isActive: boolean("is_active").default(true),
});

// Bookings
export const bookings = pgTable("bookings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  spaceId: varchar("space_id").references(() => spaces.id),
  bundleId: varchar("bundle_id").references(() => bundles.id),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  status: varchar("status").notNull().default("pending"), // pending, confirmed, cancelled, completed, payment_failed, expired
  paymentMethod: varchar("payment_method").default("stripe"), // "stripe" or "cash" or "other"
  stripePaymentIntentId: varchar("stripe_payment_intent_id"),
  reminderSent: boolean("reminder_sent").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Blocked dates (admin can mark days unavailable)
export const blockedDates = pgTable("blocked_dates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  date: varchar("date").notNull().unique(), // YYYY-MM-DD format
  reason: text("reason").notNull(), // Holiday, Maintenance, etc.
  createdBy: varchar("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Facility settings (operating hours and available days)
export const facilitySettings = pgTable("facility_settings", {
  id: varchar("id").primaryKey().default("default"), // Single row for settings
  openingTime: integer("opening_time").notNull().default(8), // 8 = 8:00 AM (24-hour format)
  closingTime: integer("closing_time").notNull().default(21), // 21 = 9:00 PM (24-hour format)
  mondayOpen: boolean("monday_open").default(true),
  tuesdayOpen: boolean("tuesday_open").default(true),
  wednesdayOpen: boolean("wednesday_open").default(true),
  thursdayOpen: boolean("thursday_open").default(true),
  fridayOpen: boolean("friday_open").default(true),
  saturdayOpen: boolean("saturday_open").default(true),
  sundayOpen: boolean("sunday_open").default(true),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type Space = typeof spaces.$inferSelect;
export type Bundle = typeof bundles.$inferSelect;
export type Booking = typeof bookings.$inferSelect;
export type InsertBooking = typeof bookings.$inferInsert;
export type BlockedDate = typeof blockedDates.$inferSelect;
export type InsertBlockedDate = typeof blockedDates.$inferInsert;
export type FacilitySettings = typeof facilitySettings.$inferSelect;

export const insertBookingSchema = createInsertSchema(bookings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  // Transform string dates to Date objects
  startTime: z.union([z.date(), z.string().transform((str) => new Date(str))]),
  endTime: z.union([z.date(), z.string().transform((str) => new Date(str))]),
  // Transform number to string for decimal handling
  totalAmount: z.union([z.string(), z.number().transform((num) => num.toString())]),
}).refine((data) => {
  // Either spaceId or bundleId must be provided, but not both
  return (data.spaceId && !data.bundleId) || (!data.spaceId && data.bundleId);
}, {
  message: "Either spaceId or bundleId must be provided, but not both",
});

export const insertUserSchema = createInsertSchema(users).pick({
  email: true,
  firstName: true,
  lastName: true,
});

export const insertBlockedDateSchema = createInsertSchema(blockedDates).omit({
  id: true,
  createdAt: true,
  createdBy: true,
});

export type InsertBlockedDateRequest = z.infer<typeof insertBlockedDateSchema>;

// Local authentication schemas
export const registerSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export type RegisterRequest = z.infer<typeof registerSchema>;
export type LoginRequest = z.infer<typeof loginSchema>;

// Password reset schemas
export const passwordResetRequestSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

export const passwordResetSchema = z.object({
  token: z.string().min(1, "Reset token is required"),
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
});

export type PasswordResetRequest = z.infer<typeof passwordResetRequestSchema>;
export type PasswordReset = z.infer<typeof passwordResetSchema>;
