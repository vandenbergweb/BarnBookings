# Performance Guidelines - The Barn MI

## Expected Loading Times

Based on current system performance, users should expect these loading times:

### Authentication Operations
- **Login**: 2-3 seconds (password hashing for security)
- **Registration**: 2-3 seconds (password hashing for security)
- **Auto-login check**: 400-600ms

### Booking Operations
- **Availability check**: 1-4 seconds (depends on date and existing bookings)
- **Creating booking**: 2+ seconds (includes conflict validation)
- **Loading spaces/bundles**: 400-600ms

### Page Navigation
- **Dashboard loading**: 400-600ms (fetching user bookings)
- **Home page loading**: 400-600ms (fetching spaces and bundles)
- **Admin panel**: 1-2 seconds (fetching all bookings)

### Payment Processing
- **Payment intent creation**: 800ms-1.2 seconds (Stripe API)
- **Payment confirmation**: 1-3 seconds (Stripe processing)

## Loading States Implemented

### User Feedback
- All forms show spinner and "Loading..." text during submission
- Time slot availability shows "Checking availability..." during queries
- Disabled buttons prevent double-submissions
- Full-page spinners for major page loads

### Performance Optimizations
- React Query caching reduces redundant API calls
- Cache invalidation ensures fresh data after mutations
- Loading states prevent user confusion during longer operations

## When to Add Loading Indicators

Add loading indicators for operations taking longer than:
- **200ms**: For instant feedback expectations
- **500ms**: For any user-initiated actions
- **1 second**: For all API calls and page navigation

## Mobile Performance

The app is optimized for mobile-first usage with:
- Minimal data fetching on page loads
- Efficient caching to reduce repeat requests
- Progressive loading for better perceived performance