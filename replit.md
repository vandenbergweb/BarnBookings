# Overview

This is a React-based web application for "The Barn MI", a professional baseball training facility booking system located at 6090 W River Rd, Weidman MI 48893. The application allows users to browse available practice spaces and team bundle packages, make bookings, and manage their reservations. It features a mobile-first design with authentication, payment processing via Stripe, and email notifications with facility location information.

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
- **Role-Based Admin**: Any user can be promoted to admin through API or web interface
- **First Admin Setup**: When no admins exist, promotion endpoint allows first admin creation
- **Admin Management**: Web interface at /admin/users for promoting/demoting users
- **Production Ready**: Fixed authentication issues between development and production environments

## Database Architecture
- **Database**: PostgreSQL with Neon serverless
- **Schema Management**: Drizzle Kit for migrations
- **Core Tables**:
  - Users (local authentication with password hashing, Stripe integration)
  - Spaces (facility rental areas)
  - Bundles (team package offerings)
  - Bookings (reservations with payment tracking)
  - Sessions (authentication sessions)

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