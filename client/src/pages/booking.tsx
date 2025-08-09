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
import type { Space, Bundle, Booking } from "@shared/schema";

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

  const [selectedSpaceId, setSelectedSpaceId] = useState<string>("");
  const [selectedBundleId, setSelectedBundleId] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [duration, setDuration] = useState<number>(1);

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

  const { data: spaces } = useQuery<Space[]>({
    queryKey: ["/api/spaces"],
    retry: false,
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

  const createBookingMutation = useMutation({
    mutationFn: async (bookingData: BookingData) => {
      const response = await apiRequest("POST", "/api/bookings", bookingData);
      return response.json();
    },
    onSuccess: (booking) => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
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
    const startTime = new Date(selectedDate);
    startTime.setHours(hours, minutes, 0, 0);
    
    const endTime = new Date(startTime);
    endTime.setHours(hours + duration, minutes, 0, 0);

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
    "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", 
    "15:00", "16:00", "17:00", "18:00", "19:00", "20:00"
  ];

  const isTimeSlotAvailable = (time: string) => {
    if (!availability) return true;
    
    const [hours, minutes] = time.split(':').map(Number);
    const slotStart = new Date(selectedDate);
    slotStart.setHours(hours, minutes, 0, 0);
    
    const slotEnd = new Date(slotStart);
    slotEnd.setHours(hours + duration, minutes, 0, 0);

    return !availability.some(booking => {
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
      return slotStart < bookingEnd && slotEnd > bookingStart;
    });
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
                          <div className="text-xs">Booked</div>
                        </div>
                      )}
                    </Button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Duration */}
          <Card>
            <CardContent className="p-4">
              <Label className="text-barn-navy font-semibold mb-3 block">Duration</Label>
              <div className="flex space-x-3">
                {[1, 2, 3].map((hours) => (
                  <Button
                    key={hours}
                    variant={duration === hours ? "default" : "outline"}
                    onClick={() => setDuration(hours)}
                    className={
                      duration === hours 
                        ? "bg-barn-green text-white" 
                        : "border-barn-green text-barn-green hover:bg-barn-green hover:text-white"
                    }
                    data-testid={`button-duration-${hours}`}
                  >
                    {hours} Hour{hours > 1 ? 's' : ''}
                  </Button>
                ))}
              </div>
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
