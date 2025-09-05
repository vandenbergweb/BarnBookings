import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import BookingCalendar from "@/components/booking-calendar";
import Navigation from "@/components/navigation";
import { apiRequest } from "@/lib/queryClient";
import type { Space, Bundle, Booking, BlockedDate } from "@shared/schema";

interface BookingData {
  spaceId?: string;
  bundleId?: string;
  startTime: Date;
  endTime: Date;
  totalAmount: number;
}

export default function BookingPage() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  // Get URL parameters for pre-selection
  const urlParams = new URLSearchParams(window.location.search);
  const preSelectedSpaceId = urlParams.get('spaceId') || "";
  const preSelectedBundleId = urlParams.get('bundleId') || "";

  const [selectedSpaceId, setSelectedSpaceId] = useState<string>(preSelectedSpaceId);
  const [selectedBundleId, setSelectedBundleId] = useState<string>(preSelectedBundleId);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [duration, setDuration] = useState<number>(1);

  // Redirect to login if not authenticated with debugging
  useEffect(() => {
    console.log('Booking page auth check:', {
      isLoading,
      isAuthenticated,
      timestamp: new Date().toISOString()
    });
    
    if (!isLoading && !isAuthenticated) {
      console.log('User not authenticated, redirecting to login');
      toast({
        title: "Authentication Required",
        description: "Please log in to make a booking",
        variant: "destructive",
      });
      
      // Use router navigation instead of window.location
      setTimeout(() => {
        setLocation("/login");
      }, 1000);
      return;
    }
  }, [isAuthenticated, isLoading, toast, setLocation]);



  // Scroll to top when page loads and ensure pre-selected items are handled
  useEffect(() => {
    window.scrollTo(0, 0);
    
    // If a bundle is pre-selected, clear any space selection
    if (preSelectedBundleId && selectedSpaceId) {
      setSelectedSpaceId("");
    }
    // If a space is pre-selected, clear any bundle selection
    if (preSelectedSpaceId && selectedBundleId) {
      setSelectedBundleId("");
    }
  }, [preSelectedSpaceId, preSelectedBundleId, selectedSpaceId, selectedBundleId]);

  const { data: spaces } = useQuery<Space[]>({
    queryKey: ["/api/spaces"],
    retry: false,
    staleTime: 0, // Always fetch fresh data
  });

  const { data: bundles } = useQuery<Bundle[]>({
    queryKey: ["/api/bundles"],
    retry: false,
  });

  const { data: availability } = useQuery<Booking[]>({
    queryKey: ["/api/bookings/availability", selectedDate.toISOString().split('T')[0]],
    enabled: !!selectedDate,
    retry: false,
  });

  const { data: blockedDates } = useQuery<BlockedDate[]>({
    queryKey: ["/api/blocked-dates"],
    retry: false,
  });

  // Helper function to check if a date is blocked
  const isDateBlocked = (date: Date) => {
    if (!blockedDates) return false;
    
    const dateString = date.toISOString().split('T')[0]; // YYYY-MM-DD format
    return blockedDates.some(blocked => blocked.date === dateString);
  };

  // Helper function to check if a time period overlaps with existing bookings
  const hasBookingConflict = (startTime: Date, endTime: Date) => {
    if (!availability) return false;

    return availability.some(booking => {
      const bookingStart = new Date(booking.startTime);
      const bookingEnd = new Date(booking.endTime);
      
      // Check if the space/bundle conflicts
      const spaceConflict = selectedSpaceId && booking.spaceId === selectedSpaceId;
      const bundleConflict = selectedBundleId && (
        booking.bundleId === selectedBundleId ||
        (selectedBundle && booking.spaceId && selectedBundle.spaceIds.includes(booking.spaceId))
      );
      
      if (!spaceConflict && !bundleConflict) return false;
      
      // Check time overlap
      return startTime < bookingEnd && endTime > bookingStart;
    });
  };

  // Check if a specific duration is available for the selected time
  const isDurationAvailable = (hours: number) => {
    if (!selectedTime || !availability) return true;
    
    const [timeHours, minutes] = selectedTime.split(':').map(Number);
    
    // Check if this duration would extend past 9PM
    const endHour = timeHours + hours;
    if (endHour > 21) return false;
    
    const startTime = new Date(selectedDate);
    startTime.setHours(timeHours, minutes, 0, 0);
    
    const endTime = new Date(startTime);
    endTime.setHours(timeHours + hours, minutes, 0, 0);

    return !hasBookingConflict(startTime, endTime);
  };

  const createBookingMutation = useMutation({
    mutationFn: async (bookingData: BookingData) => {
      const response = await apiRequest("POST", "/api/bookings", bookingData);
      return response.json();
    },
    onSuccess: (booking) => {
      // Invalidate both bookings and availability queries to refresh UI
      queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/bookings/availability"] });
      setLocation(`/checkout?bookingId=${booking.id}`);
    },
    onError: (error) => {
      toast({
        title: "Booking Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const selectedSpace = spaces?.find(s => s.id === selectedSpaceId);
  const selectedBundle = bundles?.find(b => b.id === selectedBundleId);
  const selectedItem = selectedSpace || selectedBundle;

  // Adjust duration when selected time changes to prevent going past 9PM or conflicts
  useEffect(() => {
    if (selectedTime) {
      // Find the maximum valid duration for the selected time
      let maxValidDuration = 0;
      for (let hours = 1; hours <= 3; hours++) {
        if (isDurationAvailable(hours)) {
          maxValidDuration = hours;
        }
      }
      
      // If current duration is invalid, set to the maximum valid duration or 1
      if (!isDurationAvailable(duration)) {
        setDuration(Math.max(1, maxValidDuration));
      }
    }
  }, [selectedTime, availability, selectedSpaceId, selectedBundleId]);

  const calculateTotal = () => {
    if (!selectedItem) return 0;
    return parseFloat(selectedItem.hourlyRate) * duration;
  };

  const handleBooking = () => {
    if (!selectedDate || !selectedTime || (!selectedSpaceId && !selectedBundleId)) {
      toast({
        title: "Missing Information",
        description: "Please select a space/bundle, date, and time.",
        variant: "destructive",
      });
      return;
    }

    const [hours, minutes] = selectedTime.split(':').map(Number);
    
    // Create date in local timezone without ANY UTC conversion
    // Use the Date object's local date components directly
    const startTime = new Date(
      selectedDate.getFullYear(),
      selectedDate.getMonth(),
      selectedDate.getDate(),
      hours, 
      minutes, 
      0, 
      0
    );
    
    const endTime = new Date(startTime);
    endTime.setHours(hours + duration, minutes, 0, 0);

    // Validate booking is not more than 4 months in the future
    const now = new Date();
    const fourMonthsFromNow = new Date(now);
    fourMonthsFromNow.setMonth(now.getMonth() + 4);
    
    if (startTime > fourMonthsFromNow) {
      toast({
        title: "Booking Too Far in Future",
        description: "Bookings can only be made up to 4 months in advance.",
        variant: "destructive",
      });
      return;
    }

    // Validate same-day booking is at least 1 hour from now
    const isToday = startTime.toDateString() === now.toDateString();
    const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);
    
    if (isToday && startTime < oneHourFromNow) {
      toast({
        title: "Same-Day Booking Restriction",
        description: "Same-day bookings must be at least 1 hour from now.",
        variant: "destructive",
      });
      return;
    }

    // Validate booking doesn't end after 9PM EST (21:00)
    if (endTime.getHours() > 21 || (endTime.getHours() === 21 && endTime.getMinutes() > 0)) {
      toast({
        title: "Booking Hours Restriction",
        description: "Bookings cannot extend past 9:00 PM EST.",
        variant: "destructive",
      });
      return;
    }

    // Check if the selected date is blocked
    if (isDateBlocked(selectedDate)) {
      const blockedDate = blockedDates?.find(blocked => blocked.date === selectedDate.toISOString().split('T')[0]);
      toast({
        title: "Date Unavailable",
        description: blockedDate ? `This date is unavailable: ${blockedDate.reason}` : "This date is not available for bookings.",
        variant: "destructive",
      });
      return;
    }

    // Final check for booking conflicts before proceeding to payment
    if (hasBookingConflict(startTime, endTime)) {
      toast({
        title: "Booking Conflict",
        description: "This time slot conflicts with an existing booking. Please select a different time or duration.",
        variant: "destructive",
      });
      return;
    }

    const bookingData: BookingData = {
      spaceId: selectedSpaceId || undefined,
      bundleId: selectedBundleId || undefined,
      startTime,
      endTime,
      totalAmount: calculateTotal(),
    };

    createBookingMutation.mutate(bookingData);
  };

  const timeSlots = [
    "08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", 
    "15:00", "16:00", "17:00", "18:00", "19:00", "20:00", "21:00"
  ];

  const isTimeSlotAvailable = (time: string) => {
    if (!availability) return true;
    
    // Check if the selected date is blocked
    if (isDateBlocked(selectedDate)) {
      return false;
    }
    
    const [hours, minutes] = time.split(':').map(Number);
    const slotStart = new Date(selectedDate);
    slotStart.setHours(hours, minutes, 0, 0);
    
    const slotEnd = new Date(slotStart);
    slotEnd.setHours(hours + duration, minutes, 0, 0);

    // Don't show time slots that would extend past 9PM EST
    if (slotEnd.getHours() > 21 || (slotEnd.getHours() === 21 && slotEnd.getMinutes() > 0)) {
      return false;
    }

    // Validate same-day booking is at least 1 hour from now
    const now = new Date();
    const isToday = slotStart.toDateString() === now.toDateString();
    const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);
    
    if (isToday && slotStart < oneHourFromNow) {
      return false;
    }

    return !hasBookingConflict(slotStart, slotEnd);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-barn-navy border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-sm mx-auto bg-white min-h-screen pb-20">
        {/* Header */}
        <header className="bg-barn-navy text-white p-4 flex items-center">
          <Button
            variant="ghost"
            size="icon"
            className="mr-4 text-white hover:bg-barn-navy/80"
            onClick={() => setLocation("/")}
            data-testid="button-back"
          >
            <i className="fas fa-arrow-left text-xl"></i>
          </Button>
          <h2 className="text-lg font-bold">Book Space</h2>
        </header>

        <div className="p-4 space-y-6">
          {/* Space/Bundle Selection */}
          <Card>
            <CardContent className="p-4 space-y-4">
              <div>
                <Label className="text-barn-navy font-semibold">Select Space</Label>
                <Select value={selectedSpaceId} onValueChange={(value) => {
                  setSelectedSpaceId(value);
                  setSelectedBundleId("");
                }}>
                  <SelectTrigger data-testid="select-space">
                    <SelectValue placeholder="Choose a space" />
                  </SelectTrigger>
                  <SelectContent>
                    {spaces?.map((space) => (
                      <SelectItem key={space.id} value={space.id}>
                        {space.name} - ${space.hourlyRate}/hr
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="text-center text-barn-gray">or</div>

              <div>
                <Label className="text-barn-navy font-semibold">Select Team Bundle</Label>
                <Select value={selectedBundleId} onValueChange={(value) => {
                  setSelectedBundleId(value);
                  setSelectedSpaceId("");
                }}>
                  <SelectTrigger data-testid="select-bundle">
                    <SelectValue placeholder="Choose a bundle" />
                  </SelectTrigger>
                  <SelectContent>
                    {bundles?.map((bundle) => (
                      <SelectItem key={bundle.id} value={bundle.id}>
                        {bundle.name} - ${bundle.hourlyRate}/hr
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedItem && (
                <div className="bg-barn-navy text-white rounded-lg p-4">
                  <h3 className="font-semibold mb-1">{selectedItem.name}</h3>
                  <p className="text-sm opacity-90 mb-2">{selectedItem.description}</p>
                  <p className="text-barn-red font-bold">${selectedItem.hourlyRate}/hour</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Calendar */}
          <Card>
            <CardContent className="p-4">
              <Label className="text-barn-navy font-semibold mb-3 block">Select Date</Label>
              <BookingCalendar
                selectedDate={selectedDate}
                onDateChange={setSelectedDate}
              />
            </CardContent>
          </Card>

          {/* Time Selection */}
          <Card>
            <CardContent className="p-4">
              <Label className="text-barn-navy font-semibold mb-3 block">Select Time</Label>
              {!availability ? (
                <div className="p-8">
                  <div className="flex items-center justify-center">
                    <div className="animate-spin w-6 h-6 border-4 border-barn-navy border-t-transparent rounded-full" />
                    <span className="ml-3 text-gray-600">Checking availability...</span>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {timeSlots.map((time) => {
                    const available = isTimeSlotAvailable(time);
                    const timeFormatted = new Date(`2000-01-01T${time}:00`).toLocaleTimeString('en-US', {
                      hour: 'numeric',
                      minute: '2-digit',
                    });
                    
                    return (
                      <Button
                        key={time}
                        variant={selectedTime === time ? "default" : "outline"}
                        disabled={!available}
                        onClick={() => setSelectedTime(time)}
                        className={`${
                          selectedTime === time 
                            ? "bg-barn-navy text-white" 
                            : available 
                              ? "border-barn-navy text-barn-navy hover:bg-barn-navy hover:text-white" 
                              : "bg-gray-200 text-gray-400 cursor-not-allowed"
                        }`}
                        data-testid={`button-time-${time}`}
                      >
                        {available ? timeFormatted : (
                          <div>
                            {timeFormatted}
                            <div className="text-xs">
                              {time === '21:00' ? 'Closed' : 'Booked'}
                            </div>
                          </div>
                        )}
                      </Button>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Duration */}
          <Card>
            <CardContent className="p-4">
              <Label className="text-barn-navy font-semibold mb-3 block">Duration</Label>
              <div className="flex space-x-3">
                {[1, 2, 3].map((hours) => {
                  const isValid = isDurationAvailable(hours);
                  
                  return (
                    <Button
                      key={hours}
                      variant={duration === hours ? "default" : "outline"}
                      disabled={!isValid}
                      onClick={() => setDuration(hours)}
                      className={
                        duration === hours 
                          ? "bg-barn-green text-white" 
                          : isValid
                            ? "border-barn-green text-barn-green hover:bg-barn-green hover:text-white"
                            : "bg-gray-200 text-gray-400 cursor-not-allowed"
                      }
                      data-testid={`button-duration-${hours}`}
                    >
                      {hours} Hour{hours > 1 ? 's' : ''}
                      {!isValid && selectedTime && (
                        <div className="text-xs ml-1">
                          {(() => {
                            const [timeHours] = selectedTime.split(':').map(Number);
                            const endHour = timeHours + hours;
                            if (endHour > 21) return "(past 9PM)";
                            return "(conflict)";
                          })()}
                        </div>
                      )}
                    </Button>
                  );
                })}
              </div>
              {selectedTime && (
                <div className="mt-2">
                  <p className="text-xs text-barn-gray">
                    Bookings must end by 9:00 PM EST
                  </p>
                  {[2, 3].some(hours => !isDurationAvailable(hours)) && (
                    <p className="text-xs text-barn-red mt-1">
                      Some durations unavailable due to existing bookings or time restrictions
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Summary */}
          {selectedItem && selectedTime && (
            <Card>
              <CardContent className="p-4">
                <h4 className="font-semibold text-barn-navy mb-3">Booking Summary</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>{selectedItem.name}</span>
                    <span>{selectedDate.toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>
                      {new Date(`2000-01-01T${selectedTime}:00`).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })} - 
                      {new Date(`2000-01-01T${selectedTime}:00`).getTime() + duration * 60 * 60 * 1000 > 0 && 
                        new Date(new Date(`2000-01-01T${selectedTime}:00`).getTime() + duration * 60 * 60 * 1000).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
                      }
                    </span>
                    <span>{duration} hour{duration > 1 ? 's' : ''}</span>
                  </div>
                  <div className="flex justify-between font-semibold text-barn-navy border-t pt-2">
                    <span>Total</span>
                    <span data-testid="text-total">${calculateTotal().toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Location Info */}
          <Card className="bg-barn-navy text-white">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="bg-white text-barn-navy p-2 rounded-full">
                  <i className="fas fa-map-marker-alt"></i>
                </div>
                <div>
                  <h4 className="font-semibold">Location</h4>
                  <p className="text-sm opacity-90">6090 W River Rd</p>
                  <p className="text-sm opacity-90">Weidman, MI 48893</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Book Button */}
          <Button
            onClick={handleBooking}
            disabled={!selectedItem || !selectedTime || createBookingMutation.isPending}
            className="w-full bg-barn-red hover:bg-barn-red/90 text-white py-4 text-lg font-semibold"
            data-testid="button-continue-payment"
          >
            {createBookingMutation.isPending ? "Creating Booking..." : "Continue to Payment"}
          </Button>
        </div>

        <Navigation currentPage="book" />
      </div>
    </div>
  );
}
