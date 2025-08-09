import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Navigation from "@/components/navigation";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import type { Booking, Space, Bundle } from "@shared/schema";

export default function Dashboard() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const queryClient = useQueryClient();

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
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  const { data: bookings, isLoading: bookingsLoading } = useQuery<Booking[]>({
    queryKey: ["/api/bookings"],
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

  const cancelBookingMutation = useMutation({
    mutationFn: async (bookingId: string) => {
      const response = await apiRequest("PATCH", `/api/bookings/${bookingId}/status`, {
        status: "cancelled"
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
      toast({
        title: "Booking Cancelled",
        description: "Your booking has been cancelled successfully.",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Cancellation Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (isLoading || bookingsLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-barn-navy border-t-transparent rounded-full" />
      </div>
    );
  }

  const now = new Date();
  const upcomingBookings = bookings?.filter(booking => 
    new Date(booking.startTime) > now && booking.status === "confirmed"
  ) || [];
  
  const pastBookings = bookings?.filter(booking => 
    new Date(booking.startTime) <= now || booking.status !== "confirmed"
  ) || [];

  const getSpaceName = (booking: Booking) => {
    if (booking.spaceId) {
      return spaces?.find(s => s.id === booking.spaceId)?.name || 'Unknown Space';
    }
    if (booking.bundleId) {
      return bundles?.find(b => b.id === booking.bundleId)?.name || 'Unknown Bundle';
    }
    return 'Unknown';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "confirmed":
        return <Badge className="bg-barn-green text-white">Confirmed</Badge>;
      case "cancelled":
        return <Badge variant="destructive">Cancelled</Badge>;
      case "completed":
        return <Badge variant="secondary">Completed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const canCancelBooking = (booking: Booking) => {
    const bookingTime = new Date(booking.startTime);
    const twentyFourHoursFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    return bookingTime > twentyFourHoursFromNow && booking.status === "confirmed";
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-sm mx-auto bg-white min-h-screen pb-20">
        {/* Header */}
        <header className="bg-barn-navy text-white p-4 flex items-center">
          <h2 className="text-lg font-bold">My Bookings</h2>
        </header>

        <div className="p-4">
          {/* Upcoming Reservations */}
          <section className="mb-6">
            <h3 className="text-lg font-semibold text-barn-navy mb-4 flex items-center">
              <i className="fas fa-clock text-barn-red mr-2"></i>
              Upcoming Reservations
            </h3>
            
            {upcomingBookings.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center text-barn-gray">
                  <i className="fas fa-calendar-alt text-4xl mb-4 opacity-50"></i>
                  <p>No upcoming bookings</p>
                  <Link href="/booking">
                    <Button className="mt-4 bg-barn-red hover:bg-barn-red/90">
                      Book Now
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {upcomingBookings.map((booking) => (
                  <Card key={booking.id} className="border border-gray-200 shadow-sm">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-semibold text-barn-navy" data-testid={`text-space-${booking.id}`}>
                          {getSpaceName(booking)}
                        </h4>
                        {getStatusBadge(booking.status)}
                      </div>
                      
                      <div className="text-sm text-barn-gray space-y-1">
                        <div className="flex items-center">
                          <i className="fas fa-calendar-alt mr-2 w-4"></i>
                          <span data-testid={`text-date-${booking.id}`}>
                            {new Date(booking.startTime).toLocaleDateString('en-US', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </span>
                        </div>
                        <div className="flex items-center">
                          <i className="fas fa-clock mr-2 w-4"></i>
                          <span data-testid={`text-time-${booking.id}`}>
                            {new Date(booking.startTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })} - 
                            {new Date(booking.endTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                          </span>
                        </div>
                        <div className="flex items-center">
                          <i className="fas fa-dollar-sign mr-2 w-4"></i>
                          <span data-testid={`text-amount-${booking.id}`}>${booking.totalAmount}</span>
                        </div>
                      </div>

                      {canCancelBooking(booking) && (
                        <div className="flex space-x-3 mt-3">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => cancelBookingMutation.mutate(booking.id)}
                            disabled={cancelBookingMutation.isPending}
                            className="text-barn-red border-barn-red hover:bg-barn-red hover:text-white"
                            data-testid={`button-cancel-${booking.id}`}
                          >
                            <i className="fas fa-times mr-1"></i>
                            {cancelBookingMutation.isPending ? "Cancelling..." : "Cancel"}
                          </Button>
                        </div>
                      )}
                      
                      {/* Reminder Notice */}
                      <div className="bg-yellow-50 border border-yellow-200 rounded p-2 mt-3">
                        <div className="flex items-center text-yellow-800 text-xs">
                          <i className="fas fa-bell mr-2"></i>
                          <span>Reminder will be sent 24 hours before your booking</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </section>

          {/* Past Reservations */}
          <section>
            <h3 className="text-lg font-semibold text-barn-navy mb-4 flex items-center">
              <i className="fas fa-history text-barn-gray mr-2"></i>
              Past Reservations
            </h3>
            
            {pastBookings.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center text-barn-gray">
                  <i className="fas fa-history text-4xl mb-4 opacity-50"></i>
                  <p>No past bookings</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {pastBookings.slice(0, 10).map((booking) => (
                  <Card key={booking.id} className="bg-gray-50 border border-gray-100">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-semibold text-barn-gray" data-testid={`text-past-space-${booking.id}`}>
                          {getSpaceName(booking)}
                        </h4>
                        {getStatusBadge(booking.status)}
                      </div>
                      
                      <div className="text-sm text-barn-gray space-y-1">
                        <div className="flex items-center">
                          <i className="fas fa-calendar-alt mr-2 w-4"></i>
                          <span data-testid={`text-past-date-${booking.id}`}>
                            {new Date(booking.startTime).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </span>
                        </div>
                        <div className="flex items-center">
                          <i className="fas fa-clock mr-2 w-4"></i>
                          <span data-testid={`text-past-time-${booking.id}`}>
                            {new Date(booking.startTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })} - 
                            {new Date(booking.endTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                          </span>
                        </div>
                        <div className="flex items-center">
                          <i className="fas fa-dollar-sign mr-2 w-4"></i>
                          <span data-testid={`text-past-amount-${booking.id}`}>${booking.totalAmount}</span>
                        </div>
                      </div>

                      {booking.status === "completed" && (
                        <Link href="/booking">
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-barn-navy border-barn-navy hover:bg-barn-navy hover:text-white mt-3"
                            data-testid={`button-book-again-${booking.id}`}
                          >
                            <i className="fas fa-redo mr-1"></i>
                            Book Again
                          </Button>
                        </Link>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </section>
        </div>

        <Navigation currentPage="bookings" />
      </div>
    </div>
  );
}
