// GTM Analytics Utility for The Barn MI
// Tracks bookings, transactions, and page views

// Define the gtag function globally
declare global {
  interface Window {
    dataLayer: any[];
    gtag: (...args: any[]) => void;
  }
}

// Initialize dataLayer if it doesn't exist
if (typeof window !== 'undefined') {
  window.dataLayer = window.dataLayer || [];
}

// Push events to dataLayer
export const gtmPush = (event: any) => {
  if (typeof window !== 'undefined' && window.dataLayer) {
    window.dataLayer.push(event);
    console.log('GTM Event:', event);
  }
};

// Track page views
export const trackPageView = (url: string, title?: string) => {
  gtmPush({
    event: 'page_view',
    page_location: window.location.href,
    page_path: url,
    page_title: title || document.title
  });
};

// Track booking completion
export const trackBookingCompleted = (bookingData: {
  bookingId: string;
  spaceName: string;
  spaceId: string;
  duration: number; // in hours
  totalAmount: number;
  startTime: string;
  userId?: string;
}) => {
  gtmPush({
    event: 'booking_completed',
    booking_id: bookingData.bookingId,
    space_name: bookingData.spaceName,
    space_id: bookingData.spaceId,
    booking_duration: bookingData.duration,
    booking_value: bookingData.totalAmount,
    booking_start_time: bookingData.startTime,
    user_id: bookingData.userId
  });
};

// Track transaction/payment completion
export const trackTransaction = (transactionData: {
  transactionId: string;
  bookingId: string;
  amount: number;
  paymentMethod?: string;
  spaceName: string;
  spaceId: string;
}) => {
  gtmPush({
    event: 'purchase',
    transaction_id: transactionData.transactionId,
    booking_id: transactionData.bookingId,
    value: transactionData.amount,
    currency: 'USD',
    payment_method: transactionData.paymentMethod || 'stripe',
    items: [{
      item_id: transactionData.spaceId,
      item_name: transactionData.spaceName,
      category: 'booking',
      price: transactionData.amount,
      quantity: 1
    }]
  });
};

// Track booking attempt (when user starts booking process)
export const trackBookingStarted = (spaceData: {
  spaceName: string;
  spaceId: string;
  pricePerHour: number;
}) => {
  gtmPush({
    event: 'booking_started',
    space_name: spaceData.spaceName,
    space_id: spaceData.spaceId,
    price_per_hour: spaceData.pricePerHour
  });
};

// Track space view
export const trackSpaceViewed = (spaceData: {
  spaceName: string;
  spaceId: string;
  pricePerHour: number;
}) => {
  gtmPush({
    event: 'space_viewed',
    space_name: spaceData.spaceName,
    space_id: spaceData.spaceId,
    price_per_hour: spaceData.pricePerHour
  });
};

// Track user registration
export const trackUserRegistration = (userId?: string) => {
  gtmPush({
    event: 'user_registration',
    user_id: userId
  });
};

// Track user login
export const trackUserLogin = (userId?: string) => {
  gtmPush({
    event: 'user_login',
    user_id: userId
  });
};