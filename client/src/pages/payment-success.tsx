import { useEffect } from "react";
import { useQuery } from '@tanstack/react-query';
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import type { Booking, Space, Bundle } from "@shared/schema";
import baseballLogo from "@assets/baseball_1754937097015.png";

export default function PaymentSuccess() {
  const { isAuthenticated, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  // Get booking ID from URL params
  const urlParams = new URLSearchParams(window.location.search);
  const bookingId = urlParams.get('bookingId');

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      setLocation("/login");
      return;
    }
  }, [isAuthenticated, isLoading, setLocation]);

  const { data: booking, isLoading: bookingLoading } = useQuery<Booking>({
    queryKey: ["/api/bookings", bookingId],
    enabled: !!bookingId && isAuthenticated,
    retry: false,
  });

  // Send confirmation email when page loads
  useEffect(() => {
    if (bookingId && isAuthenticated && booking) {
      // Trigger confirmation email
      apiRequest("POST", "/api/send-confirmation-email", { bookingId })
        .catch((error: any) => {
          console.error("Error sending confirmation email:", error);
        });
    }
  }, [bookingId, isAuthenticated, booking]);

  const { data: spaces } = useQuery<Space[]>({
    queryKey: ["/api/spaces"],
    enabled: isAuthenticated,
    retry: false,
  });

  const { data: bundles } = useQuery<Bundle[]>({
    queryKey: ["/api/bundles"],
    enabled: isAuthenticated,
    retry: false,
  });

  if (isLoading || bookingLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-barn-navy border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-barn-navy text-white p-4 flex justify-center items-center">
          <div className="flex items-center space-x-2">
            <img src={baseballLogo} alt="The Barn MI" className="w-6 h-6" />
            <h1 className="text-lg font-bold">The Barn MI</h1>
          </div>
        </header>

        <main className="max-w-sm mx-auto bg-white min-h-screen p-4">
          <Card className="mt-8">
            <CardContent className="p-6 text-center">
              <div className="mb-4">
                <i className="fas fa-exclamation-triangle text-barn-red text-3xl"></i>
              </div>
              <h2 className="text-xl font-bold text-barn-navy mb-2">Booking Not Found</h2>
              <p className="text-barn-gray mb-6">
                We couldn't find your booking details. Your payment may still be processing.
              </p>
              <Button 
                onClick={() => setLocation("/dashboard")}
                className="w-full bg-barn-navy hover:bg-barn-navy/90"
                data-testid="button-view-bookings"
              >
                View My Bookings
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  // Get space or bundle name
  let itemName = "Unknown";
  if (booking.spaceId && spaces) {
    const space = spaces.find(s => s.id === booking.spaceId);
    itemName = space?.name || "Unknown Space";
  } else if (booking.bundleId && bundles) {
    const bundle = bundles.find(b => b.id === booking.bundleId);
    itemName = bundle?.name || "Unknown Bundle";
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-barn-navy text-white p-4 flex justify-center items-center">
        <div className="flex items-center space-x-2">
          <img src={baseballLogo} alt="The Barn MI" className="w-6 h-6" />
          <h1 className="text-lg font-bold">The Barn MI</h1>
        </div>
      </header>

      <main className="max-w-sm mx-auto bg-white min-h-screen p-4">
        <Card className="mt-8">
          <CardHeader className="text-center">
            <div className="mb-4">
              <i className="fas fa-check-circle text-barn-green text-4xl"></i>
            </div>
            <CardTitle className="text-barn-navy">Payment Successful!</CardTitle>
            <p className="text-barn-gray">Your booking has been confirmed</p>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <div className="bg-barn-navy/5 rounded-lg p-4">
              <h3 className="font-semibold text-barn-navy mb-3">Booking Details</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-barn-gray">Facility:</span>
                  <span className="font-medium">{itemName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-barn-gray">Date:</span>
                  <span className="font-medium">
                    {new Date(booking.startTime).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-barn-gray">Time:</span>
                  <span className="font-medium">
                    {new Date(booking.startTime).toLocaleTimeString('en-US', { 
                      hour: 'numeric', 
                      minute: '2-digit' 
                    })} - {new Date(booking.endTime).toLocaleTimeString('en-US', { 
                      hour: 'numeric', 
                      minute: '2-digit' 
                    })}
                  </span>
                </div>
                <div className="flex justify-between pt-2 border-t border-barn-gray/20">
                  <span className="text-barn-gray">Total Paid:</span>
                  <span className="font-bold text-barn-green">${booking.totalAmount}</span>
                </div>
              </div>
            </div>

            <div className="bg-barn-green/10 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <i className="fas fa-info-circle text-barn-green mt-0.5"></i>
                <div className="text-sm">
                  <p className="font-medium text-barn-navy">What's Next?</p>
                  <p className="text-barn-gray">
                    You'll receive a confirmation email shortly. Please arrive 10 minutes early 
                    to check in and get set up.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <Button 
                onClick={() => setLocation("/dashboard")}
                className="w-full bg-barn-navy hover:bg-barn-navy/90"
                data-testid="button-view-all-bookings"
              >
                View All My Bookings
              </Button>
              
              <Button 
                variant="outline"
                onClick={() => setLocation("/")}
                className="w-full border-barn-red text-barn-red hover:bg-barn-red/10"
                data-testid="button-book-another"
              >
                Book Another Session
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}