import type { Express } from "express";
import { createServer, type Server } from "http";
import Stripe from "stripe";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertBookingSchema } from "@shared/schema";
import { sendBookingReminder } from "./emailService";

const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-07-30.basil",
}) : null;

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Initialize spaces and bundles data
  await initializeData();

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      console.log("Fetching user with ID:", userId);
      const user = await storage.getUser(userId);
      console.log("User found:", user ? "Yes" : "No", user?.email);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Spaces routes
  app.get('/api/spaces', async (req, res) => {
    try {
      const spaces = await storage.getSpaces();
      res.json(spaces);
    } catch (error) {
      console.error("Error fetching spaces:", error);
      res.status(500).json({ message: "Failed to fetch spaces" });
    }
  });

  // Bundles routes
  app.get('/api/bundles', async (req, res) => {
    try {
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
      const userId = req.user.claims.sub;
      const bookings = await storage.getUserBookings(userId);
      res.json(bookings);
    } catch (error) {
      console.error("Error fetching bookings:", error);
      res.status(500).json({ message: "Failed to fetch bookings" });
    }
  });

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

  app.post('/api/bookings', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      console.log("Creating booking for user:", userId);
      console.log("Request body:", req.body);
      
      // Ensure the user exists in the database
      let user = await storage.getUser(userId);
      if (!user) {
        console.log("User not found, creating user record");
        const claims = req.user.claims;
        await storage.upsertUser({
          id: claims.sub,
          email: claims.email,
          firstName: claims.first_name,
          lastName: claims.last_name,
          profileImageUrl: claims.profile_image_url,
        });
        user = await storage.getUser(userId);
        console.log("User created:", user);
      }
      
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
      const userId = req.user.claims.sub;

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
      console.error("Payment intent error:", error);
      res.status(500).json({ message: "Error creating payment intent: " + error.message });
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
          equipment: "Includes batting tee, balls and L-screen",
          hourlyRate: "25.00",
        },
        {
          id: "C",
          name: "Space C", 
          description: "12' x 40' Batting Cage",
          dimensions: "12' x 40'",
          equipment: "Includes batting tee, balls, L-screen, and Hack Attack Jr Pitching Machine",
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
          id: "bundle1",
          name: "Bundle Option 1",
          description: "Space A Only - Perfect for team practices",
          spaceIds: ["A"],
          hourlyRate: "100.00",
        },
        {
          id: "bundle2", 
          name: "Bundle Option 2",
          description: "Spaces A, B & C - Practice + batting cages",
          spaceIds: ["A", "B", "C"],
          hourlyRate: "120.00",
        },
        {
          id: "bundle3",
          name: "Bundle Option 3", 
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
