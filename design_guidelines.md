# Design Guidelines: The Barn MI Baseball Facility Booking System

## Design Approach

**Framework**: Reference-based approach inspired by premium sports facility booking platforms (Mindbody, TeamSnap, CourtReserve) combined with shadcn/ui's modern component architecture. Sports-themed design emphasizing professionalism, energy, and accessibility for athletes and coaches.

**Brand Colors**: barn-navy (#1e3a5f) primary, barn-red (#dc2626) accent/CTA, barn-green (#22c55e) success states

## Typography System

**Font Families**:
- Primary: Inter (Google Fonts) - Clean, professional sans-serif for UI and body text
- Display: Bebas Neue (Google Fonts) - Bold, athletic headlines and section headers

**Hierarchy**:
- Hero Headline: Bebas Neue, 56px mobile / 96px desktop, tracking-tight
- Section Headers: Bebas Neue, 36px mobile / 64px desktop
- Subheadings: Inter SemiBold, 20px mobile / 28px desktop
- Body Text: Inter Regular, 16px mobile / 18px desktop
- Button Text: Inter SemiBold, 16px
- Caption/Meta: Inter Medium, 14px

## Layout & Spacing System

**Container Strategy**:
- Full-width hero and major sections
- Content containers: max-w-7xl for main content, max-w-6xl for forms
- Mobile-first breakpoints: base (mobile), md (768px), lg (1024px), xl (1280px)

**Spacing Primitives**: Use Tailwind units of 2, 4, 6, 8, 12, 16, 20, 24
- Component internal padding: p-4 mobile, p-6 desktop
- Section vertical spacing: py-12 mobile, py-20 desktop
- Card gaps: gap-6 mobile, gap-8 desktop
- Element margins: mb-4, mb-6, mb-8 for vertical rhythm

**Grid Systems**:
- Booking cards: grid-cols-1 md:grid-cols-2 lg:grid-cols-3
- Feature sections: grid-cols-1 lg:grid-cols-2
- Facility amenities: grid-cols-2 md:grid-cols-4

## Component Library

### Navigation (Mobile-First)
**Mobile**: Hamburger menu icon (top-right), logo (top-left), slide-out drawer with full navigation
**Desktop**: Horizontal navigation bar with logo left, nav items center, "Book Now" CTA right
- Sticky header with backdrop blur on scroll
- Mobile menu: Full-height overlay with large touch targets (min-h-14)
- Icons: Heroicons (CDN)

### Hero Section
**Layout**: Full-viewport height (min-h-screen), asymmetric split
**Content**: Left-aligned text overlay (60% width on desktop), action buttons with blurred glass-morphism backgrounds
**Image**: Large hero image showing baseball training action - batting cages, pitching, or facility overview (use high-energy sports photography)
**Elements**: 
- Hero headline + compelling subheadline
- Two CTAs: Primary "Book Your Cage" (barn-red), Secondary "View Pricing" (outlined)
- Trust indicators: "500+ Athletes Trained" badge, star rating display
- Buttons feature backdrop-blur-md background with semi-transparent backgrounds

### Booking Interface Cards
**Design**: Elevated cards with subtle shadows, rounded corners (rounded-xl)
**Layout**: 
- Facility image top (aspect-ratio-video 16:9)
- Content section with facility name, availability badge (barn-green), pricing
- Calendar icon + time slots display
- Book button bottom (full-width on mobile, right-aligned desktop)
**States**: Hover lift effect (subtle transform), active facility highlighted with border accent

### Facility Features Section
**Layout**: 2-column grid (desktop), single column (mobile)
**Cards**: Icon left, content right, min-h-24
**Icons**: Baseball-themed from Heroicons - map for location, clock for hours, users for capacity, lightning for amenities
**Content**: Feature title (Inter SemiBold) + brief description

### Pricing Tiers
**Layout**: 3-column cards (desktop), stacked (mobile)
**Card Structure**:
- Tier name header with accent stripe
- Large price display (Bebas Neue)
- Feature list with checkmark icons (barn-green)
- CTA button (most popular tier uses barn-red, others outlined)
**Visual Hierarchy**: Elevate "Most Popular" tier with scale transform and accent border

### Testimonials Section
**Layout**: 2-column grid (desktop), single column (mobile)
**Card Design**: 
- Quote icon top-left
- Testimonial text (italic, larger body text)
- Author info: Photo (rounded-full, w-12 h-12) + name/role
- Star rating display

### Contact/Location Section
**Layout**: 2-column split - Contact form left (max-w-md), facility info/map right
**Form**: shadcn/ui form components
- Input fields with labels, proper spacing (space-y-4)
- Textarea for message (min-h-32)
- Submit button (barn-red, full-width mobile)
**Info Side**: 
- Address with map icon
- Phone/email with respective icons
- Hours of operation display
- Embedded map placeholder or directions link

### Footer
**Layout**: 3-column grid (desktop), stacked (mobile)
**Sections**:
- Column 1: Logo + brief mission statement
- Column 2: Quick links (Facilities, Pricing, About, Contact)
- Column 3: Social media icons + newsletter signup
**Bottom Bar**: Copyright, privacy policy, terms

## Images Section

### Required Images:

1. **Hero Image** (Large, Full-Width):
   - Scene: Dynamic action shot of baseball training - player in batting cage or pitcher in motion
   - Treatment: Slight darkening overlay for text contrast
   - Placement: Full hero section background
   - Size: 1920x1080px minimum

2. **Facility Cards** (Multiple):
   - Batting cages (indoor/outdoor)
   - Pitching tunnels
   - Training areas
   - Equipment/amenities
   - Size: 800x450px each, maintain 16:9 ratio

3. **Testimonial Photos**:
   - Athlete/coach headshots
   - Professional, circular crop
   - Size: 96x96px

4. **About/Team Section** (If included):
   - Facility exterior shot
   - Team/staff photo
   - Size: 1200x800px

## Interaction Patterns

**Booking Flow**:
1. Browse available facilities (card grid)
2. Click card → Modal/slide-in panel with detailed view
3. Calendar picker (shadcn/ui calendar component)
4. Time slot selection (button group)
5. Confirmation with summary

**Mobile Gestures**:
- Swipeable facility cards carousel
- Pull-to-refresh booking availability
- Bottom sheet for quick booking actions

**Loading States**: Skeleton loaders for booking cards, spinner for form submissions

## Responsive Behavior

**Mobile** (< 768px):
- Single column layouts throughout
- Stacked navigation in drawer
- Full-width CTAs and forms
- Larger touch targets (min 44px)
- Collapsed filters with slide-up panel

**Tablet** (768px - 1024px):
- 2-column grids
- Horizontal navigation with dropdown menus
- Side-by-side booking form + preview

**Desktop** (> 1024px):
- 3-column facility grid
- Fixed sidebar for filters/calendar
- Hover states and micro-interactions
- Expanded information displays

## Accessibility Standards

- Minimum contrast ratio 4.5:1 for all text
- Focus indicators on all interactive elements (ring-2 ring-barn-red)
- ARIA labels for icon buttons
- Keyboard navigation support
- Form validation with clear error states
- Screen reader friendly booking flow announcements