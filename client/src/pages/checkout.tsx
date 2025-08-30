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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
  const [step, setStep] = useState<'agreements' | 'payment'>('agreements');
  const [signatureName, setSignatureName] = useState('');
  const [agreementsAccepted, setAgreementsAccepted] = useState({
    cancellation: false,
    liability: false
  });
  const [showCancellationPolicy, setShowCancellationPolicy] = useState(false);
  const [showLiabilityWaiver, setShowLiabilityWaiver] = useState(false);

  const handleAgreementSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!agreementsAccepted.cancellation || !agreementsAccepted.liability || !signatureName.trim()) {
      toast({
        title: "Agreements Required",
        description: "Please read and accept all agreements and provide your digital signature.",
        variant: "destructive",
      });
      return;
    }
    
    setStep('payment');
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/payment-success?bookingId=${booking.id}`,
        },
      });

      if (error) {
        console.error('Stripe payment error:', error);
        toast({
          title: "Payment Failed",
          description: error.message,
          variant: "destructive",
        });
      } else {
        // This won't run for redirect-based payments, but keeping for non-redirect flows
        setLocation(`/payment-success?bookingId=${booking.id}`);
      }
    } catch (err) {
      console.error('Unhandled payment error:', err);
      toast({
        title: "Payment Error",
        description: "An unexpected error occurred during payment processing.",
        variant: "destructive",
      });
    }
  };

  if (step === 'agreements') {
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

        {/* Agreements Form */}
        <form onSubmit={handleAgreementSubmit}>
          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold text-barn-navy mb-4">Required Agreements</h3>
              
              {/* No Cancellation Policy */}
              <div className="mb-6">
                <label className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    checked={agreementsAccepted.cancellation}
                    onChange={(e) => setAgreementsAccepted(prev => ({ ...prev, cancellation: e.target.checked }))}
                    className="rounded border-barn-gray mt-0.5"
                    data-testid="checkbox-cancellation"
                  />
                  <div className="text-sm">
                    <span>I have read and agree to the </span>
                    <button
                      type="button"
                      onClick={() => setShowCancellationPolicy(true)}
                      className="text-barn-red underline hover:text-barn-red/80"
                      data-testid="link-cancellation-policy"
                    >
                      No Cancellation Policy
                    </button>
                  </div>
                </label>
              </div>

              {/* Liability Waiver */}
              <div className="mb-6">
                <label className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    checked={agreementsAccepted.liability}
                    onChange={(e) => setAgreementsAccepted(prev => ({ ...prev, liability: e.target.checked }))}
                    className="rounded border-barn-gray mt-0.5"
                    data-testid="checkbox-liability"
                  />
                  <div className="text-sm">
                    <span>I have read and agree to the </span>
                    <button
                      type="button"
                      onClick={() => setShowLiabilityWaiver(true)}
                      className="text-barn-red underline hover:text-barn-red/80"
                      data-testid="link-liability-waiver"
                    >
                      No Liability & Hold Harmless Agreement
                    </button>
                  </div>
                </label>
              </div>

              {/* Digital Signature */}
              <div className="mb-6">
                <h4 className="font-medium text-barn-navy mb-2">Digital Signature</h4>
                <p className="text-sm text-barn-gray mb-3">
                  By typing your full name below, you are providing your digital signature and agreeing to all terms and conditions above.
                </p>
                <input
                  type="text"
                  value={signatureName}
                  onChange={(e) => setSignatureName(e.target.value)}
                  placeholder="Type your full name here"
                  className="w-full p-3 border border-barn-gray rounded-lg"
                  data-testid="input-signature"
                />
                {signatureName && (
                  <div className="mt-2 p-2 bg-barn-navy/5 rounded border-t-2 border-barn-navy">
                    <p className="text-sm text-barn-gray">Digital signature:</p>
                    <p className="font-semibold italic text-barn-navy">{signatureName}</p>
                    <p className="text-xs text-barn-gray">Date: {new Date().toLocaleDateString()}</p>
                  </div>
                )}
              </div>

              <Button
                type="submit"
                className="w-full bg-barn-red hover:bg-barn-red/90 text-white"
                data-testid="button-continue-payment"
              >
                Continue to Payment
              </Button>
            </CardContent>
          </Card>
        </form>

        {/* Cancellation Policy Modal */}
        <Dialog open={showCancellationPolicy} onOpenChange={setShowCancellationPolicy}>
          <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-barn-navy">No Cancellation Policy</DialogTitle>
            </DialogHeader>
            <div className="text-sm space-y-3">
              <p>At The Barn MI, we value your commitment and trust in choosing our services/products. To ensure fairness and consistency for all customers, we maintain a strict No Cancellation Policy.</p>
              <div>
                <p className="font-semibold mb-1">All Sales Are Final:</p>
                <p>Once an order, booking, or purchase is confirmed, it cannot be canceled, modified, or refunded.</p>
              </div>
              <div>
                <p className="font-semibold mb-1">No Refunds or Credits:</p>
                <p>Payments made are non-refundable and non-transferable. This includes, but is not limited to, deposits, full payments, and service fees.</p>
              </div>
              <div>
                <p className="font-semibold mb-1">Rescheduling (If Applicable):</p>
                <p>If permitted under specific terms of service, rescheduling may be allowed at the sole discretion of The Barn MI, subject to availability and applicable fees. This does not constitute a cancellation.</p>
              </div>
              <div>
                <p className="font-semibold mb-1">Exceptions:</p>
                <p>The only exceptions to this policy are circumstances where The Barn MI is unable to fulfill the service or provide the product, in which case a refund or alternative arrangement will be offered.</p>
              </div>
              <p>By completing your purchase, booking, or order with The Barn MI, you acknowledge and agree to this No Cancellation Policy.</p>
            </div>
          </DialogContent>
        </Dialog>

        {/* Liability Waiver Modal */}
        <Dialog open={showLiabilityWaiver} onOpenChange={setShowLiabilityWaiver}>
          <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-barn-navy">No Liability & Hold Harmless Agreement</DialogTitle>
            </DialogHeader>
            <div className="text-sm space-y-3">
              <div>
                <p className="font-semibold mb-1">Assumption of Risk:</p>
                <p>By entering, renting, or otherwise utilizing the facilities, property, or services at The Barn MI ("Venue"), the undersigned individual and/or group representative ("User") acknowledges and agrees that participation in any activities, events, or use of the Venue carries inherent risks, including but not limited to accidents, injury, illness, property damage, or other loss. The User voluntarily assumes all such risks, whether foreseeable or unforeseeable.</p>
              </div>
              <div>
                <p className="font-semibold mb-1">Release of Liability:</p>
                <p>To the fullest extent permitted by law, the User, on behalf of themselves, their group, participants, guests, invitees, employees, vendors, and contractors, hereby releases, waives, discharges, and covenants not to sue The Barn MI and Mark Benaske, including their owners, officers, employees, representatives, agents, contractors, heirs, successors, and assigns (collectively, the "Released Parties"), from any and all liability, claims, demands, actions, or causes of action.</p>
              </div>
              <div>
                <p className="font-semibold mb-1">Indemnification / Hold Harmless:</p>
                <p>The User agrees to indemnify, defend, and hold harmless The Barn MI and Mark Benaske, as well as all other Released Parties, from and against any and all claims, damages, liabilities, judgments, costs, and expenses (including reasonable attorneys' fees) arising out of, relating to, or resulting from the User's use of the Venue.</p>
              </div>
              <div>
                <p className="font-semibold mb-1">Scope of Agreement:</p>
                <p>This Agreement applies to both individual Users and group Users, including any organization, club, company, or informal group represented by the undersigned. The undersigned affirms that they are authorized to sign on behalf of their group and to bind all participants to the terms of this Agreement.</p>
              </div>
              <div>
                <p className="font-semibold mb-1">Acknowledgment:</p>
                <p>The undersigned affirms that they are at least eighteen (18) years of age, are authorized (if signing on behalf of a group), and have read and understood this No Liability & Hold Harmless Agreement.</p>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

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

      {/* Signature Confirmation */}
      <Card>
        <CardContent className="p-4">
          <h3 className="font-semibold text-barn-navy mb-3">Agreements Signed</h3>
          <div className="space-y-2 text-sm">
            <div className="flex items-center space-x-2">
              <i className="fas fa-check text-barn-green"></i>
              <span>No Cancellation Policy - Accepted</span>
            </div>
            <div className="flex items-center space-x-2">
              <i className="fas fa-check text-barn-green"></i>
              <span>Liability Waiver - Accepted</span>
            </div>
            <div className="flex items-center space-x-2">
              <i className="fas fa-signature text-barn-navy"></i>
              <span>Digitally signed by: <strong>{signatureName}</strong></span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setStep('agreements')}
              className="text-barn-red border-barn-red hover:bg-barn-red hover:text-white mt-2"
            >
              Modify Agreements
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Payment Form */}
      <Card>
        <CardContent className="p-4">
          <form onSubmit={handlePaymentSubmit} className="space-y-4">
            <div>
              <h4 className="font-semibold text-barn-navy mb-3">Payment Information</h4>
              <PaymentElement />
            </div>

            <div className="flex items-start space-x-3 text-xs text-barn-gray">
              <i className="fas fa-shield-alt text-barn-green mt-0.5"></i>
              <p>
                Your payment information is secure and encrypted. Full payment is due at booking. 
                No cancellations or refunds allowed per our no-cancellation policy.
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
        window.location.href = "/login";
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