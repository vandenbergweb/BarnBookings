import type { Express } from "express";
import { createServer, type Server } from "http";
import Stripe from "stripe";
import passport from "passport";
import { storage } from "./storage";
import { registerSchema, loginSchema, type RegisterRequest, type LoginRequest } from "@shared/schema";
import { setupAuth, isAuthenticated } from "./localAuth";
import { isAdmin } from "./adminAuth";
import { insertBookingSchema } from "@shared/schema";
import { sendBookingConfirmation, sendBookingReminder } from "./email";

const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-07-30.basil",
}) : null;

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

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
      const validatedData = loginSchema.parse(req.body);
      
      passport.authenticate('local-login', (err: any, user: any, info: any) => {
        if (err) {
          console.error('Login error:', err);
          return res.status(500).json({ message: 'Internal server error' });
        }
        
        if (!user) {
          return res.status(401).json({ message: info?.message || 'Invalid credentials' });
        }
        
        req.logIn(user, (loginErr) => {
          if (loginErr) {
            console.error('Login session error:', loginErr);
            return res.status(500).json({ message: 'Login failed' });
          }
          
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

  app.post('/api/auth/logout', (req, res) => {
    req.logout((err) => {
      if (err) {
        console.error('Logout error:', err);
        return res.status(500).json({ message: 'Logout failed' });
      }
      res.json({ message: 'Logged out successfully' });
    });
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

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      
      console.log("User found:", user ? "Yes" : "No", user?.email);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Return user without sensitive information
      const { passwordHash, authProvider, ...safeUser } = user;
      res.json(safeUser);
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
      console.error("Payment intent error:", error);
      res.status(500).json({ message: "Error creating payment intent: " + error.message });
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
