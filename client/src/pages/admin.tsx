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
import type { Space, Bundle, Booking } from "@shared/schema";
import baseballLogo from "@assets/baseball_1754937097015.png";
import { Link } from "wouter";
import { Users, Settings, Calendar } from "lucide-react";

export default function AdminPage() {
  const { user, isLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Form state for new booking
  const [formData, setFormData] = useState({
    customerEmail: '',
    customerName: '',
    spaceId: '',
    bundleId: '',
    startTime: '',
    endTime: '',
    totalAmount: '',
    paymentMethod: 'cash'
  });

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

  // Fetch data
  const { data: spaces } = useQuery<Space[]>({
    queryKey: ["/api/spaces"],
    retry: false,
  });

  const { data: bundles } = useQuery<Bundle[]>({
    queryKey: ["/api/bundles"],
    retry: false,
  });

  const { data: allBookings } = useQuery<Booking[]>({
    queryKey: ["/api/admin/bookings"],
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
        startTime: '',
        endTime: '',
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.customerEmail || !formData.startTime || !formData.endTime || !formData.totalAmount) {
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

    createBookingMutation.mutate({
      ...formData,
      customerName: formData.customerName || formData.customerEmail.split('@')[0],
      spaceId: formData.spaceId || undefined,
      bundleId: formData.bundleId || undefined,
    });
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
          
          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="p-4 flex items-center space-x-3">
              <Settings className="h-8 w-8 text-barn-navy" />
              <div>
                <h3 className="font-semibold">Settings</h3>
                <p className="text-sm text-gray-600">Configure spaces & bundles</p>
              </div>
            </CardContent>
          </Card>
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
                          {spaces?.map((space) => (
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
                          {bundles?.map((bundle) => (
                            <SelectItem key={bundle.id} value={bundle.id}>
                              {bundle.name} - ${bundle.hourlyRate}/hr
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="startTime">Start Time *</Label>
                      <Input
                        id="startTime"
                        type="datetime-local"
                        value={formData.startTime}
                        onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                        data-testid="input-start-time"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="endTime">End Time *</Label>
                      <Input
                        id="endTime"
                        type="datetime-local"
                        value={formData.endTime}
                        onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
                        data-testid="input-end-time"
                        required
                      />
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
            <Card>
              <CardHeader>
                <CardTitle>All Bookings ({allBookings?.length || 0})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {allBookings?.map((booking) => {
                    const startDate = new Date(booking.startTime);
                    const endDate = new Date(booking.endTime);
                    
                    return (
                      <div key={booking.id} className="border border-barn-gray/20 rounded-lg p-4">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          <div>
                            <p className="text-sm font-medium text-barn-navy">Customer</p>
                            <p className="text-sm text-barn-gray" data-testid={`text-customer-${booking.id}`}>
                              {(booking as any).customerName || 'Unknown'}
                            </p>
                            <p className="text-xs text-barn-gray/70">
                              {(booking as any).customerEmail}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-barn-navy">Date & Time</p>
                            <p className="text-sm text-barn-gray">
                              {startDate.toLocaleDateString()}<br/>
                              {startDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })} - 
                              {endDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-barn-navy">Payment</p>
                            <p className="text-sm text-barn-gray">
                              ${booking.totalAmount} ({booking.paymentMethod || 'stripe'})
                            </p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-barn-navy">Status</p>
                            <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                              booking.status === 'confirmed' 
                                ? 'bg-barn-green/20 text-barn-green' 
                                : 'bg-barn-red/20 text-barn-red'
                            }`}>
                              {booking.status}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {!allBookings?.length && (
                    <div className="text-center py-8 text-barn-gray">
                      No bookings found
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}