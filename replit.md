# Overview

This is a React-based web application for "The Barn MI", a professional baseball training facility booking system located at 6090 W River Rd, Weidman MI 48893. The application allows users to browse available practice spaces and team bundle packages, make bookings, and manage their reservations. It features a mobile-first design with authentication, payment processing via Stripe, and email notifications with facility location information.

## Recent Changes (October 2025)
- **NEW: Brand Update (October 30, 2025)**: Replaced logo and favicon throughout application with new "The Barn MI" branding (thebarnmi_1761853940046.png - barn with "32" and baseball with "MI"). Updated all pages including landing, home, login, register, admin, profile, settings, password reset, and payment success. Also updated favicon and Apple touch icon in index.html.
- **NEW: Facility Video Tour (October 30, 2025)**: Added Vimeo-hosted facility tour video to landing page (https://vimeo.com/1132272565). Video appears between "Starting Rates" and "Location" sections with responsive 16:9 aspect ratio player, rounded corners, and professional styling.
- Updated phone number throughout system to (517) 204-4747
- Removed all booking cancellation functionality per new no-cancellation policy
- Updated booking hours to 8AM-9PM EST with validation to prevent bookings past 9PM
- Added 4-month advance booking limit and 1-hour same-day booking restriction
- Updated Space B pricing to $30/hour (database and frontend displays) and added Blast Technology to Spaces B & C
- Updated Space B equipment: "Includes batting tee, balls, Blast Technology, and L-screen"
- Updated Space C equipment: "Includes batting tee, balls, L-screen, Blast Technology, and Hack Attack Jr Pitching Machine"
- Removed Bundle Option 1 from team offerings (deactivated in database)
- Renamed Bundle Option 2 → "Team Bundle 1 - Spaces A, B & C - Practice + batting cages"  
- Renamed Bundle Option 3 → "Team Bundle 2 - Entire Facility - Spaces A, B, C & D"
- Updated facility rules: "Arrive on time. No gum, sunflower seeds or collared drinks. Only use the space that you rented or you will be billed for the other space that was used."
- Improved admin panel: separated past bookings from current/future bookings with distinct visual styling and sorting
- All timezone handling set to EST including email confirmations and reminders
- Integrated cancellation policy and liability waiver documents into checkout with digital signature requirement
- **RESOLVED: Payment Processing Issues (August 30, 2025)**: Fixed critical payment processing errors caused by React Hooks violations and iframe redirect security issues. Payment system now fully operational with enhanced error handling and proper Stripe Elements configuration.
- **RESOLVED: Pricing Cache Issues (August 30, 2025)**: Fixed deployed app showing stale pricing (Space B $25 vs correct $30) by implementing ultra-aggressive cache-busting solution: server-side no-cache headers with ETag/Last-Modified, client-side staleTime: 0 with triple-parameter URL cache-breaking (timestamp + random + version), and HTTP cache: "no-cache" for all pricing endpoints. Redeployment required for full effect.
- **NEW: Admin Settings Management Interface (August 31, 2025)**: Created comprehensive settings page at /admin/settings allowing administrators to easily manage facility configuration without code changes. Features include: space pricing and details editing, bundle name and pricing updates, equipment list management, activate/deactivate spaces and bundles, real-time database updates with proper validation and audit logging. Eliminates need for direct database modifications or temporary API endpoints when facility requirements change.
- **RESOLVED: Booking Overlap Prevention (September 3, 2025)**: Fixed critical booking overlap issue where users could select conflicting time slots. Implemented dynamic duration validation that disables 2 or 3 hour options when they would conflict with existing bookings. Added comprehensive time slot validation and prevents users from proceeding to payment with overlapping bookings. Enhanced user experience with clear error messages explaining why durations are unavailable.
- **RESOLVED: Duplicate Confirmation Emails (September 3, 2025)**: Fixed issue where users received 2 confirmation emails per booking. Problem was caused by both Stripe webhook and payment success page triggering emails. Removed manual email trigger from payment success page since Stripe webhook already handles this automatically and reliably. Now users receive exactly one confirmation email per booking.
- **RESOLVED: HitTrax Spelling Correction (September 3, 2025)**: Fixed spelling error from "Hit Tracks" to "HitTrax" in both the landing page Professional Equipment section and Space D equipment description in the database. Ensures consistent branding across the application.
- **RESOLVED: Timezone Inconsistency (September 4, 2025)**: Fixed timezone discrepancy between admin booking interface and email confirmations. Admin interface was displaying times in browser's local timezone while emails correctly showed Eastern Time. Added consistent Eastern Time formatting functions to admin interface, ensuring all times display in EST/EDT consistently across the application.
- **RESOLVED: Bundle-to-Bundle Conflict Detection (October 15, 2025)**: Fixed critical bug in admin booking system where different bundles with overlapping spaces (e.g., Team Bundle 1 and Team Bundle 2) could be booked at the same time. Added comprehensive bundle-to-bundle conflict checking in server/storage.ts that validates whether two different bundles share any common spaces and properly rejects conflicting bookings with clear error messages. This ensures Team Bundle 1 (Spaces A,B,C) and Team Bundle 2 (Spaces A,B,C,D) cannot be double-booked.
- **RESOLVED: Adjacent Bookings Conflict Issue (October 15, 2025)**: Fixed critical bug where bookings ending at one time (e.g., 1 PM) were incorrectly flagged as conflicting with bookings starting at that same time (e.g., 1 PM). Changed overlap detection logic in server/storage.ts from using `<=` and `>=` operators to `<` and `>` operators, properly allowing back-to-back bookings without false conflicts. This fix ensures that a booking from 11 AM-1 PM no longer blocks a booking from 1 PM-4 PM.
- **NEW: Pending Booking Status System (October 22, 2025)**: Implemented comprehensive pending booking system to prevent "ghost reservations" from abandoned payment sessions. New workflow: bookings start as "pending" status when user clicks "Continue to Payment" → automatically upgraded to "confirmed" upon successful Stripe payment → marked as "expired" if payment session is abandoned for 45+ minutes. Conflict detection only considers "confirmed" bookings, preventing pending bookings from blocking time slots. Background cleanup job runs every 10 minutes to expire old pending bookings. Admin bookings bypass pending status and go directly to "confirmed" for immediate reservation without payment processing. Race condition handling: if payment completes after expiration, webhook automatically recovers the booking to "confirmed" status with warning log.
- **NEW: Configurable Facility Hours & Availability (December 11, 2025)**: Added admin settings section to configure facility operating hours (8AM-9PM range) and available days of the week. Settings stored in `facility_settings` table. Admin can toggle which days the facility is open (Monday-Sunday) via toggle switches. Booking page dynamically respects these settings - closed days are disabled in the calendar and time slots are generated based on the configured opening/closing times. Message displays below calendar showing which days facility is open.

# User Preferences

- **Preferred communication style**: Simple, everyday language
- **Authentication**: Local email/password only (no Replit OAuth integration required)

# System Architecture

## Frontend Architecture
- **Framework**: React with TypeScript using Vite as the build tool
- **UI Library**: Radix UI components with shadcn/ui design system
- **Styling**: Tailwind CSS with custom color scheme (barn-navy, barn-red, barn-green)
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack Query for server state management
- **Forms**: React Hook Form with Zod validation
- **Mobile-First Design**: Responsive design optimized for mobile devices with bottom navigation

## Backend Architecture
- **Framework**: Express.js with TypeScript
- **Database ORM**: Drizzle ORM for type-safe database operations
- **Authentication**: Replit Auth with OpenID Connect integration
- **Session Management**: Express sessions with PostgreSQL storage
- **API Design**: RESTful endpoints with JSON responses
- **Build System**: ESBuild for production bundling

## Authentication System
- **Local Authentication**: Email/password registration and login only (no Replit OAuth)
- **Password Security**: bcrypt hashing with 12 salt rounds
- **Session Storage**: PostgreSQL-backed sessions using connect-pg-simple with optimized production settings
- **Authorization**: Route-level protection with passport middleware
- **User Management**: Local user creation with proper validation
- **Auto-Login**: Users are automatically logged in after successful registration
- **Session Configuration**: sameSite: 'lax' and secure: false for Replit production compatibility
- **Multiple Admin System**: Role-based admin promotion system supporting unlimited admin users
- **First Admin Setup**: When only environment admin exists, first real user can be promoted without authentication
- **Admin Management**: Web interface at /admin/users for promoting/demoting users
- **Current Admins**: admin@thebarnmi.com (environment), rebeccavdb@live.com (promoted user)
- **Production Ready**: Authentication system fully operational in both development and production environments
- **Admin Credentials**: admin@thebarnmi.com / yellow123 (confirmed working in production)
- **Environment Setup**: Production configured with ADMIN_PASSWORD=yellow123 secret
- **Authentication Fixes Applied**: NODE_ENV configuration, enhanced session management, improved passport deserialization, session validation middleware, client-side retry logic
- **Debug Interface**: Added admin debug page at /admin for troubleshooting user roles and permissions

## Database Architecture
- **Database**: PostgreSQL with Neon serverless
- **Schema Management**: Drizzle Kit for migrations
- **Core Tables**:
  - Users (local authentication with password hashing, Stripe integration)
  - Spaces (facility rental areas)
  - Bundles (team package offerings)
  - Bookings (reservations with payment tracking)
  - Sessions (authentication sessions)
  - Facility Settings (operating hours, available days of the week)

## Payment Processing
- **Provider**: Stripe with React Stripe.js integration
- **Flow**: Payment intents for secure checkout
- **Integration**: Customer creation and payment tracking in database
- **UI**: Embedded Stripe payment elements

# External Dependencies

## Database Services
- **Neon Database**: Serverless PostgreSQL hosting
- **Connection**: WebSocket-based connection pooling

## Payment Services
- **Stripe**: Payment processing and customer management
- **APIs**: Payment intents, customer creation, and webhook handling

## Email Services
- **SendGrid**: Transactional email delivery
- **Use Cases**: Booking confirmations and reminder notifications

## Authentication Services
- **Replit Auth**: OpenID Connect authentication provider
- **Session Management**: Secure session handling with PostgreSQL storage

## Development Tools
- **Vite**: Frontend build tool and development server
- **Drizzle Kit**: Database schema management and migrations
- **TypeScript**: Type safety across the entire application stack

## UI/UX Libraries
- **Radix UI**: Accessible component primitives
- **Tailwind CSS**: Utility-first styling framework
- **Lucide React**: Icon library
- **React Day Picker**: Calendar component for date selection