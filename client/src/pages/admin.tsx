import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import type { Space, Bundle, Booking, BlockedDate } from "@shared/schema";
import baseballLogo from "@assets/Baseball Barn MI_1756584401549.png";
import { Link } from "wouter";
import { Users, Settings, Calendar } from "lucide-react";

function AdminContent() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Time slots (matching customer interface)
  const timeSlots = [
    "08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", 
    "15:00", "16:00", "17:00", "18:00", "19:00", "20:00", "21:00"
  ];
  
  // Form state for new booking
  const [formData, setFormData] = useState({
    customerEmail: '',
    customerName: '',
    spaceId: '',
    bundleId: '',
    selectedDate: '',
    selectedTime: '',
    duration: 1,
    totalAmount: '',
    paymentMethod: 'cash'
  });

  // Fetch data
  const { data: spaces } = useQuery<Space[]>({
    queryKey: ["/api/spaces"],
    retry: false,
    staleTime: 0, // Always fetch fresh data
  });

  const { data: bundles } = useQuery<Bundle[]>({
    queryKey: ["/api/bundles"],
    retry: false,
    staleTime: 0, // Always fetch fresh data
  });

  const { data: allBookings } = useQuery<Booking[]>({
    queryKey: ["/api/admin/bookings"],
    retry: false,
  });

  const { data: blockedDates } = useQuery<BlockedDate[]>({
    queryKey: ["/api/blocked-dates"],
    retry: false,
  });

  // Create booking mutation
  const createBookingMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/admin/bookings", data),
    onSuccess: () => {
      toast({
        title: "Booking Created",
        description: "Cash booking has been created successfully!",
      });
      setFormData({
        customerEmail: '',
        customerName: '',
        spaceId: '',
        bundleId: '',
        selectedDate: '',
        selectedTime: '',
        duration: 1,
        totalAmount: '',
        paymentMethod: 'cash'
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/bookings"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create booking",
        variant: "destructive",
      });
    },
  });

  // Cancel booking mutation (admin only)
  const cancelBookingMutation = useMutation({
    mutationFn: (bookingId: string) => apiRequest("DELETE", `/api/admin/bookings/${bookingId}`),
    onSuccess: () => {
      toast({
        title: "Booking Cancelled",
        description: "The booking has been successfully cancelled.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/bookings"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to cancel booking",
        variant: "destructive",
      });
    },
  });

  // Helper function to check if a date is blocked
  const isDateBlocked = (date: Date) => {
    if (!blockedDates) return false;
    
    const dateString = date.toISOString().split('T')[0]; // YYYY-MM-DD format
    return blockedDates.some(blocked => blocked.date === dateString);
  };

  // Helper functions for consistent Eastern Time formatting
  const formatDateEST = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'long',
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      timeZone: 'America/New_York'
    });
  };

  const formatTimeEST = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      timeZone: 'America/New_York',
      timeZoneName: 'short'
    });
  };

  const formatShortDateEST = (date: Date) => {
    // Force the date to display in Eastern Time without timezone shifting
    return date.toLocaleDateString('en-US', {
      timeZone: 'America/New_York',
      year: 'numeric',
      month: 'numeric', 
      day: 'numeric'
    });
  };

  const formatShortTimeEST = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric', 
      minute: '2-digit',
      timeZone: 'America/New_York'
    });
  };

  const handleCancelBooking = (booking: any) => {
    if (window.confirm(`Are you sure you want to cancel this booking for ${booking.customerName || booking.customerEmail}?\n\nDate: ${formatDateEST(new Date(booking.startTime))}\nTime: ${formatTimeEST(new Date(booking.startTime))}\n\nThis action cannot be undone.`)) {
      cancelBookingMutation.mutate(booking.id);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.customerEmail || !formData.selectedDate || !formData.selectedTime || !formData.totalAmount) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    if (!formData.spaceId && !formData.bundleId) {
      toast({
        title: "Missing Selection",
        description: "Please select either a space or bundle",
        variant: "destructive",
      });
      return;
    }

    // Check if selected date is blocked
    // Use date string directly to avoid timezone conversion issues
    const dateString = formData.selectedDate; // Already in YYYY-MM-DD format
    const isBlocked = blockedDates?.some(blocked => blocked.date === dateString);
    if (isBlocked) {
      const blockedDate = blockedDates?.find(blocked => blocked.date === dateString);
      toast({
        title: "Date Unavailable",
        description: blockedDate ? `This date is unavailable: ${blockedDate.reason}` : "This date is not available for bookings.",
        variant: "destructive",
      });
      return;
    }

    // Construct start and end times from date + time + duration
    const [hours, minutes] = formData.selectedTime.split(':').map(Number);
    
    // Create date in local timezone to avoid UTC conversion issues
    // Parse the date string (YYYY-MM-DD) and construct date in local timezone
    const dateStr = formData.selectedDate; // "YYYY-MM-DD" format from date input
    const [year, month, day] = dateStr.split('-').map(Number);
    const startTime = new Date(year, month - 1, day, hours, minutes, 0, 0);
    
    const endTime = new Date(startTime);
    endTime.setHours(hours + formData.duration, minutes, 0, 0);

    const bookingData: any = {
      customerEmail: formData.customerEmail,
      customerName: formData.customerName || formData.customerEmail.split('@')[0],
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      totalAmount: formData.totalAmount,
      paymentMethod: formData.paymentMethod,
    };

    // Only include spaceId OR bundleId, never both or empty strings
    if (formData.spaceId) {
      bookingData.spaceId = formData.spaceId;
    } else if (formData.bundleId) {
      bookingData.bundleId = formData.bundleId;
    }

    createBookingMutation.mutate(bookingData);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-barn-navy text-white p-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <img src={baseballLogo} alt="The Barn MI" className="w-6 h-6" />
            <h1 className="text-lg font-bold">The Barn MI - Admin Panel</h1>
          </div>
          <div className="text-right text-xs opacity-90">
            <div>6090 W River Rd</div>
            <div>Weidman, MI 48893</div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4">
        {/* Quick Navigation */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Link href="/admin/users">
            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="p-4 flex items-center space-x-3">
                <Users className="h-8 w-8 text-barn-navy" />
                <div>
                  <h3 className="font-semibold">User Management</h3>
                  <p className="text-sm text-gray-600">Promote users to admin</p>
                </div>
              </CardContent>
            </Card>
          </Link>
          
          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="p-4 flex items-center space-x-3">
              <Calendar className="h-8 w-8 text-barn-navy" />
              <div>
                <h3 className="font-semibold">Booking Management</h3>
                <p className="text-sm text-gray-600">Create and view bookings</p>
              </div>
            </CardContent>
          </Card>
          
          <Link href="/admin/settings">
            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="p-4 flex items-center space-x-3">
                <Settings className="h-8 w-8 text-barn-navy" />
                <div>
                  <h3 className="font-semibold">Settings</h3>
                  <p className="text-sm text-gray-600">Configure spaces & bundles</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        <Tabs defaultValue="create-booking" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="create-booking" data-testid="tab-create-booking">Create Booking</TabsTrigger>
            <TabsTrigger value="view-bookings" data-testid="tab-view-bookings">All Bookings</TabsTrigger>
          </TabsList>

          <TabsContent value="create-booking" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Create Cash/Comp Booking</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="customerEmail">Customer Email *</Label>
                      <Input
                        id="customerEmail"
                        type="email"
                        value={formData.customerEmail}
                        onChange={(e) => setFormData(prev => ({ ...prev, customerEmail: e.target.value }))}
                        placeholder="customer@email.com"
                        data-testid="input-customer-email"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="customerName">Customer Name</Label>
                      <Input
                        id="customerName"
                        value={formData.customerName}
                        onChange={(e) => setFormData(prev => ({ ...prev, customerName: e.target.value }))}
                        placeholder="John Smith"
                        data-testid="input-customer-name"
                      />
                    </div>

                    <div>
                      <Label htmlFor="space">Space</Label>
                      <Select 
                        value={formData.spaceId} 
                        onValueChange={(value) => setFormData(prev => ({ ...prev, spaceId: value, bundleId: '' }))}
                      >
                        <SelectTrigger data-testid="select-space">
                          <SelectValue placeholder="Select space" />
                        </SelectTrigger>
                        <SelectContent>
                          {spaces?.map((space: any) => (
                            <SelectItem key={space.id} value={space.id}>
                              {space.name} - ${space.hourlyRate}/hr
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="bundle">Or Bundle</Label>
                      <Select 
                        value={formData.bundleId} 
                        onValueChange={(value) => setFormData(prev => ({ ...prev, bundleId: value, spaceId: '' }))}
                      >
                        <SelectTrigger data-testid="select-bundle">
                          <SelectValue placeholder="Select bundle" />
                        </SelectTrigger>
                        <SelectContent>
                          {bundles?.map((bundle: any) => (
                            <SelectItem key={bundle.id} value={bundle.id}>
                              {bundle.name} - ${bundle.hourlyRate}/hr
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="selectedDate">Date *</Label>
                      <Input
                        id="selectedDate"
                        type="date"
                        value={formData.selectedDate}
                        onChange={(e) => setFormData(prev => ({ ...prev, selectedDate: e.target.value }))}
                        data-testid="input-selected-date"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="selectedTime">Start Time *</Label>
                      <Select 
                        value={formData.selectedTime} 
                        onValueChange={(value) => setFormData(prev => ({ ...prev, selectedTime: value }))}
                      >
                        <SelectTrigger data-testid="select-start-time">
                          <SelectValue placeholder="Select time" />
                        </SelectTrigger>
                        <SelectContent>
                          {timeSlots.map((time) => (
                            <SelectItem key={time} value={time}>
                              {time === "12:00" ? "12:00 PM" : 
                               parseInt(time.split(':')[0]) > 12 ? 
                               `${parseInt(time.split(':')[0]) - 12}:00 PM` : 
                               `${parseInt(time.split(':')[0])}:00 AM`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="duration">Duration *</Label>
                      <Select 
                        value={formData.duration.toString()} 
                        onValueChange={(value) => setFormData(prev => ({ ...prev, duration: parseInt(value) }))}
                      >
                        <SelectTrigger data-testid="select-duration">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1 hour</SelectItem>
                          <SelectItem value="2">2 hours</SelectItem>
                          <SelectItem value="3">3 hours</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="totalAmount">Total Amount ($) *</Label>
                      <Input
                        id="totalAmount"
                        type="number"
                        step="0.01"
                        value={formData.totalAmount}
                        onChange={(e) => setFormData(prev => ({ ...prev, totalAmount: e.target.value }))}
                        placeholder="75.00"
                        data-testid="input-total-amount"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="paymentMethod">Payment Method</Label>
                      <Select 
                        value={formData.paymentMethod} 
                        onValueChange={(value) => setFormData(prev => ({ ...prev, paymentMethod: value }))}
                      >
                        <SelectTrigger data-testid="select-payment-method">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cash">Cash</SelectItem>
                          <SelectItem value="check">Check</SelectItem>
                          <SelectItem value="comp">Complimentary</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full bg-barn-green hover:bg-barn-green/90"
                    disabled={createBookingMutation.isPending}
                    data-testid="button-create-booking"
                  >
                    {createBookingMutation.isPending ? "Creating..." : "Create Booking"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="view-bookings" className="space-y-4">
            {(() => {
              const now = new Date();
              const bookings = (allBookings as any) || [];
              
              // Separate bookings into past and current/future
              const pastBookings = bookings.filter((booking: any) => new Date(booking.endTime) < now)
                .sort((a: any, b: any) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()); // Most recent first
              
              const currentFutureBookings = bookings.filter((booking: any) => new Date(booking.endTime) >= now)
                .sort((a: any, b: any) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()); // Earliest first

              const BookingCard = ({ booking }: { booking: any }) => {
                const startDate = new Date(booking.startTime);
                const endDate = new Date(booking.endTime);
                const isPast = endDate < now;
                
                // Find the space or bundle name
                const getReservationInfo = () => {
                  if (booking.spaceId && spaces) {
                    const space = spaces.find(s => s.id === booking.spaceId);
                    return space ? space.name : 'Unknown Space';
                  } else if (booking.bundleId && bundles) {
                    const bundle = bundles.find(b => b.id === booking.bundleId);
                    return bundle ? bundle.name : 'Unknown Bundle';
                  }
                  return 'Unknown';
                };
                
                return (
                  <div key={booking.id} className={`border rounded-lg p-4 ${isPast ? 'border-gray-300 bg-gray-50' : 'border-barn-gray/20 bg-white'}`}>
                    <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                      <div>
                        <p className="text-sm font-medium text-barn-navy">Customer</p>
                        <p className={`text-sm ${isPast ? 'text-gray-600' : 'text-barn-gray'}`} data-testid={`text-customer-${booking.id}`}>
                          {booking.customerName || 'Unknown'}
                        </p>
                        <p className={`text-xs ${isPast ? 'text-gray-500' : 'text-barn-gray/70'}`}>
                          {booking.customerEmail}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-barn-navy">Date & Time</p>
                        <p className={`text-sm ${isPast ? 'text-gray-600' : 'text-barn-gray'}`}>
                          {formatShortDateEST(startDate)}<br/>
                          {formatShortTimeEST(startDate)} - {formatShortTimeEST(endDate)} EST
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-barn-navy">Reserved</p>
                        <p className={`text-sm ${isPast ? 'text-gray-600' : 'text-barn-gray'}`} data-testid={`text-reservation-${booking.id}`}>
                          {getReservationInfo()}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-barn-navy">Payment</p>
                        <p className={`text-sm ${isPast ? 'text-gray-600' : 'text-barn-gray'}`}>
                          ${booking.totalAmount} ({booking.paymentMethod || 'stripe'})
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-barn-navy">Status</p>
                        <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                          booking.status === 'confirmed' 
                            ? isPast ? 'bg-gray-200 text-gray-600' : 'bg-barn-green/20 text-barn-green'
                            : 'bg-barn-red/20 text-barn-red'
                        }`}>
                          {booking.status}
                        </span>
                      </div>
                      {!isPast && (
                        <div>
                          <p className="text-sm font-medium text-barn-navy">Actions</p>
                          <Button 
                            variant="destructive"
                            size="sm"
                            onClick={() => handleCancelBooking(booking)}
                            disabled={cancelBookingMutation.isPending}
                            data-testid={`button-cancel-booking-${booking.id}`}
                            className="text-xs"
                          >
                            {cancelBookingMutation.isPending ? "Cancelling..." : "Cancel"}
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              };

              return (
                <>
                  {/* Current & Future Bookings */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Current & Future Bookings ({currentFutureBookings.length})</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {currentFutureBookings.map((booking: any) => (
                          <BookingCard key={booking.id} booking={booking} />
                        ))}

                        {currentFutureBookings.length === 0 && (
                          <div className="text-center py-8 text-barn-gray">
                            No current or future bookings
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Past Bookings */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Past Bookings ({pastBookings.length})</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {pastBookings.map((booking: any) => (
                          <BookingCard key={booking.id} booking={booking} />
                        ))}

                        {pastBookings.length === 0 && (
                          <div className="text-center py-8 text-gray-500">
                            No past bookings
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </>
              );
            })()}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

export default function AdminPage() {
  const { user, isLoading } = useAuth();

  // Check if user is admin
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-barn-navy border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user || (user as any).role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-bold text-barn-navy mb-2">Access Denied</h2>
            <p className="text-barn-gray">You need admin privileges to access this page.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <AdminContent />;
}