# Overview

This is a React-based web application for "The Barn MI", a professional baseball training facility booking system. The application allows users to browse available practice spaces and team bundle packages, make bookings, and manage their reservations. It features a mobile-first design with authentication, payment processing via Stripe, and email notifications.

# User Preferences

Preferred communication style: Simple, everyday language.

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
- **Dual Authentication**: Both local email/password and Replit OpenID Connect
- **Local Auth**: Email/password registration with bcrypt password hashing
- **Replit Auth**: OpenID Connect integration for Replit users
- **Session Storage**: PostgreSQL-backed sessions using connect-pg-simple
- **Authorization**: Route-level protection with middleware supporting both auth types
- **User Management**: Automatic user creation/updates for both authentication methods

## Database Architecture
- **Database**: PostgreSQL with Neon serverless
- **Schema Management**: Drizzle Kit for migrations
- **Core Tables**:
  - Users (supports both local and Replit auth, includes password hashing, Stripe integration)
  - Spaces (facility rental areas)
  - Bundles (team package offerings)
  - Bookings (reservations with payment tracking)
  - Sessions (authentication sessions for both auth types)

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