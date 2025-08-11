import { useStripe, Elements, PaymentElement, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { Booking, Space, Bundle } from "@shared/schema";

// Make sure to call `loadStripe` outside of a component's render to avoid
// recreating the `Stripe` object on every render.
const stripePromise = import.meta.env.VITE_STRIPE_PUBLIC_KEY ? 
  loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY) : null;

const CheckoutForm = ({ booking, spaceName }: { booking: Booking; spaceName: string }) => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: window.location.origin,
      },
    });

    if (error) {
      toast({
        title: "Payment Failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Payment Successful",
        description: "Your booking has been confirmed!",
      });
      setLocation("/dashboard");
    }
  };

  return (
    <div className="space-y-6">
      {/* Booking Summary */}
      <Card>
        <CardContent className="p-4">
          <h3 className="font-semibold text-barn-navy mb-3">Booking Details</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>{spaceName}</span>
            </div>
            <div className="flex justify-between">
              <span>{new Date(booking.startTime).toLocaleDateString()}</span>
              <span>
                {new Date(booking.startTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })} - 
                {new Date(booking.endTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
              </span>
            </div>
            <div className="flex justify-between font-bold text-lg border-t border-barn-red pt-2 mt-3">
              <span>Total</span>
              <span data-testid="text-payment-total">${booking.totalAmount}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Form */}
      <Card>
        <CardContent className="p-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <h4 className="font-semibold text-barn-navy mb-3">Payment Information</h4>
              <PaymentElement />
            </div>

            <div className="flex items-start space-x-3 text-xs text-barn-gray">
              <i className="fas fa-shield-alt text-barn-green mt-0.5"></i>
              <p>
                Your payment information is secure and encrypted. Full payment is due at booking. 
                Cancellations must be made 24 hours in advance.
              </p>
            </div>

            <Button 
              type="submit" 
              disabled={!stripe}
              className="w-full bg-barn-red hover:bg-barn-red/90 text-white py-4 text-lg font-semibold flex items-center justify-center space-x-2"
              data-testid="button-pay"
            >
              <i className="fas fa-lock"></i>
              <span>Pay ${booking.totalAmount}</span>
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default function Checkout() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [clientSecret, setClientSecret] = useState("");

  // Get booking ID from URL params
  const urlParams = new URLSearchParams(window.location.search);
  const bookingId = urlParams.get('bookingId');

  // Always call all hooks first before any conditional logic
  const { data: booking, isLoading: bookingLoading, error: bookingError } = useQuery<Booking>({
    queryKey: ["/api/bookings", bookingId],
    enabled: !!bookingId,
    retry: false,
  });

  const { data: spaces } = useQuery<Space[]>({
    queryKey: ["/api/spaces"],
    retry: false,
  });

  const { data: bundles } = useQuery<Bundle[]>({
    queryKey: ["/api/bundles"],
    retry: false,
  });

  // Create payment intent
  useEffect(() => {
    console.log("Payment intent effect:", { 
      booking: !!booking, 
      clientSecret: !!clientSecret, 
      stripePromise: !!stripePromise 
    });
    
    if (booking && !clientSecret) {
      console.log("Creating payment intent for booking:", booking.id, "amount:", booking.totalAmount);
      
      if (!stripePromise) {
        console.log("Stripe not configured, skipping payment intent creation");
        return;
      }
      
      apiRequest("POST", "/api/create-payment-intent", { 
        amount: parseFloat(booking.totalAmount),
        bookingId: booking.id 
      })
        .then((res) => res.json())
        .then((data) => {
          console.log("Payment intent created:", data);
          setClientSecret(data.clientSecret);
        })
        .catch((error) => {
          console.error('Payment intent error:', error);
        });
    }
  }, [booking, clientSecret]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
    }
  }, [isAuthenticated, isLoading, toast]);

  // Redirect if no booking ID
  useEffect(() => {
    if (!bookingId) {
      setLocation("/booking");
    }
  }, [bookingId, setLocation]);

  // Add a timeout to prevent infinite loading
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!booking && !bookingError && !isLoading) {
        console.log("Checkout timeout - redirecting to booking");
        toast({
          title: "Loading Timeout",
          description: "Taking too long to load. Please try again.",
          variant: "destructive",
        });
        setLocation("/booking");
      }
    }, 10000); // 10 second timeout
    
    return () => clearTimeout(timer);
  }, [booking, bookingError, isLoading, toast, setLocation]);

  // Add debug logging for loading states
  console.log("Checkout render state:", { 
    authLoading: isLoading, 
    bookingLoading,
    booking: !!booking, 
    bookingId,
    clientSecret: !!clientSecret,
    stripeConfigured: !!stripePromise,
    bookingError: !!bookingError
  });

  const spaceName = booking?.spaceId 
    ? spaces?.find(s => s.id === booking.spaceId)?.name || 'Unknown Space'
    : booking?.bundleId 
      ? bundles?.find(b => b.id === booking.bundleId)?.name || 'Unknown Bundle'
      : 'Unknown';

  // Determine what to render based on state
  let content;

  if (bookingError) {
    console.log("Booking error:", bookingError);
    content = (
      <div className="p-4 text-center">
        <i className="fas fa-exclamation-triangle text-barn-red text-3xl mb-3"></i>
        <h3 className="font-semibold text-barn-navy mb-2">Booking Not Found</h3>
        <p className="text-barn-gray mb-4">The booking could not be loaded. Please try again.</p>
        <Button onClick={() => setLocation("/booking")} className="bg-barn-navy hover:bg-barn-navy/90 text-white">
          Back to Booking
        </Button>
      </div>
    );
  } else if (isLoading || bookingLoading || !booking) {
    console.log("Showing loading screen - authLoading:", isLoading, "bookingLoading:", bookingLoading, "booking:", !!booking);
    content = (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-barn-navy border-t-transparent rounded-full" />
      </div>
    );
  } else if (!stripePromise) {
    // If Stripe is not configured, show a message
    content = (
      <div className="p-4 space-y-6">
        {/* Booking Summary */}
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold text-barn-navy mb-3">Booking Details</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>{spaceName}</span>
              </div>
              <div className="flex justify-between">
                <span>{new Date(booking.startTime).toLocaleDateString()}</span>
                <span>
                  {new Date(booking.startTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })} - 
                  {new Date(booking.endTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                </span>
              </div>
              <div className="flex justify-between font-bold text-lg border-t border-barn-red pt-2 mt-3">
                <span>Total</span>
                <span data-testid="text-payment-total">${booking.totalAmount}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment Not Available Message */}
        <Card>
          <CardContent className="p-4 text-center space-y-4">
            <div className="text-barn-gray">
              <i className="fas fa-info-circle text-3xl mb-3 text-barn-navy"></i>
              <h3 className="font-semibold text-barn-navy mb-2">Payment Processing Unavailable</h3>
              <p className="text-sm">
                Payment functionality is currently being set up. Your booking has been created and you can view it in your dashboard.
              </p>
            </div>
            <Button 
              onClick={() => setLocation("/dashboard")}
              className="w-full bg-barn-navy hover:bg-barn-navy/90 text-white"
              data-testid="button-view-dashboard"
            >
              View Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  } else if (!clientSecret) {
    content = (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-barn-navy border-t-transparent rounded-full" />
      </div>
    );
  } else {
    // Show Stripe payment interface
    content = (
      <Elements stripe={stripePromise} options={{ clientSecret }}>
        <div className="p-4">
          <CheckoutForm booking={booking} spaceName={spaceName || 'Unknown'} />
        </div>
      </Elements>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-sm mx-auto bg-white min-h-screen">
        <header className="bg-barn-navy text-white p-4 flex items-center">
          <Button
            variant="ghost"
            size="icon"
            className="mr-4 text-white hover:bg-barn-navy/80"
            onClick={() => setLocation("/booking")}
            data-testid="button-back"
          >
            <i className="fas fa-arrow-left text-xl"></i>
          </Button>
          <h2 className="text-lg font-bold">Payment</h2>
          {!bookingError && <i className="fas fa-lock ml-auto text-barn-green"></i>}
        </header>
        {content}
      </div>
    </div>
  );
}