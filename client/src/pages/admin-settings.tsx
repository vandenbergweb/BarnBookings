import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from "wouter";
import { ArrowLeft, Edit2, Save, X, Calendar, Trash2, Plus, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import type { Space, Bundle, BlockedDate, FacilitySettings } from "@shared/schema";
import baseballLogo from "@assets/thebarnmi_1761853940046.png";

function AdminSettingsContent() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [editingSpace, setEditingSpace] = useState<string | null>(null);
  const [editingBundle, setEditingBundle] = useState<string | null>(null);
  const [newBlockedDate, setNewBlockedDate] = useState({
    date: '',
    reason: ''
  });

  // Fetch data with fresh loading
  const { data: spaces, isLoading: spacesLoading } = useQuery<Space[]>({
    queryKey: ["/api/spaces"],
    staleTime: 0, // Always get fresh data
  });

  const { data: bundles, isLoading: bundlesLoading } = useQuery<Bundle[]>({
    queryKey: ["/api/bundles"],
    staleTime: 0, // Always get fresh data
  });

  const { data: blockedDates, isLoading: blockedDatesLoading } = useQuery<BlockedDate[]>({
    queryKey: ["/api/blocked-dates"],
    staleTime: 0, // Always get fresh data
  });

  const { data: facilitySettings, isLoading: facilitySettingsLoading } = useQuery<FacilitySettings>({
    queryKey: ["/api/facility-settings"],
    staleTime: 0, // Always get fresh data
  });

  // Update facility settings mutation
  const updateFacilitySettingsMutation = useMutation({
    mutationFn: (updates: Partial<FacilitySettings>) => 
      apiRequest("PUT", "/api/admin/facility-settings", updates),
    onSuccess: () => {
      toast({
        title: "Settings Updated",
        description: "Facility hours have been updated successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/facility-settings"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update facility settings",
        variant: "destructive",
      });
    },
  });

  // Update space mutation
  const updateSpaceMutation = useMutation({
    mutationFn: (data: { id: string; updates: Partial<Space> }) => 
      apiRequest("PUT", `/api/admin/spaces/${data.id}`, data.updates),
    onSuccess: () => {
      toast({
        title: "Space Updated",
        description: "Space details have been updated successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/spaces"] });
      setEditingSpace(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update space",
        variant: "destructive",
      });
    },
  });

  // Update bundle mutation
  const updateBundleMutation = useMutation({
    mutationFn: (data: { id: string; updates: Partial<Bundle> }) => 
      apiRequest("PUT", `/api/admin/bundles/${data.id}`, data.updates),
    onSuccess: () => {
      toast({
        title: "Bundle Updated", 
        description: "Bundle details have been updated successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/bundles"] });
      setEditingBundle(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update bundle",
        variant: "destructive",
      });
    },
  });

  // Add blocked date mutation
  const addBlockedDateMutation = useMutation({
    mutationFn: (data: { date: string; reason: string }) => 
      apiRequest("POST", "/api/admin/blocked-dates", data),
    onSuccess: () => {
      toast({
        title: "Date Blocked", 
        description: "Date has been marked as unavailable successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/blocked-dates"] });
      setNewBlockedDate({ date: '', reason: '' });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to block date",
        variant: "destructive",
      });
    },
  });

  // Remove blocked date mutation
  const removeBlockedDateMutation = useMutation({
    mutationFn: (id: string) => 
      apiRequest("DELETE", `/api/admin/blocked-dates/${id}`),
    onSuccess: () => {
      toast({
        title: "Date Unblocked", 
        description: "Date is now available for booking!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/blocked-dates"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to remove blocked date",
        variant: "destructive",
      });
    },
  });

  // Helper function to handle adding blocked date
  const handleAddBlockedDate = () => {
    if (!newBlockedDate.date || !newBlockedDate.reason.trim()) {
      toast({
        title: "Validation Error",
        description: "Please fill in both date and reason fields",
        variant: "destructive",
      });
      return;
    }

    addBlockedDateMutation.mutate({
      date: newBlockedDate.date,
      reason: newBlockedDate.reason.trim()
    });
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    // Parse the date as local time to avoid timezone shifting
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day); // month is 0-indexed
    
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const SpaceEditForm = ({ space }: { space: Space }) => {
    const [formData, setFormData] = useState({
      name: space.name,
      description: space.description,
      hourlyRate: space.hourlyRate.toString(),
      equipment: space.equipment,
      isActive: space.isActive ?? true
    });

    const handleSave = () => {
      updateSpaceMutation.mutate({
        id: space.id,
        updates: {
          ...formData,
          hourlyRate: formData.hourlyRate
        }
      });
    };

    return (
      <div className="space-y-4 p-4 bg-barn-navy/5 rounded-lg">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor={`space-name-${space.id}`}>Name</Label>
            <Input
              id={`space-name-${space.id}`}
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              data-testid={`input-space-name-${space.id}`}
            />
          </div>
          <div>
            <Label htmlFor={`space-rate-${space.id}`}>Hourly Rate ($)</Label>
            <Input
              id={`space-rate-${space.id}`}
              type="number"
              step="0.01"
              value={formData.hourlyRate}
              onChange={(e) => setFormData(prev => ({ ...prev, hourlyRate: e.target.value }))}
              data-testid={`input-space-rate-${space.id}`}
            />
          </div>
        </div>

        <div>
          <Label htmlFor={`space-description-${space.id}`}>Description</Label>
          <Textarea
            id={`space-description-${space.id}`}
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            data-testid={`textarea-space-description-${space.id}`}
          />
        </div>

        <div>
          <Label htmlFor={`space-equipment-${space.id}`}>Equipment</Label>
          <Textarea
            id={`space-equipment-${space.id}`}
            value={formData.equipment}
            onChange={(e) => setFormData(prev => ({ ...prev, equipment: e.target.value }))}
            data-testid={`textarea-space-equipment-${space.id}`}
          />
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id={`space-active-${space.id}`}
            checked={formData.isActive}
            onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
            data-testid={`switch-space-active-${space.id}`}
          />
          <Label htmlFor={`space-active-${space.id}`}>Active (visible to customers)</Label>
        </div>

        <div className="flex space-x-2">
          <Button 
            onClick={handleSave}
            disabled={updateSpaceMutation.isPending}
            data-testid={`button-save-space-${space.id}`}
          >
            <Save className="w-4 h-4 mr-2" />
            {updateSpaceMutation.isPending ? "Saving..." : "Save Changes"}
          </Button>
          <Button 
            variant="outline" 
            onClick={() => setEditingSpace(null)}
            data-testid={`button-cancel-space-${space.id}`}
          >
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
        </div>
      </div>
    );
  };

  const BundleEditForm = ({ bundle }: { bundle: Bundle }) => {
    const [formData, setFormData] = useState({
      name: bundle.name,
      description: bundle.description,
      hourlyRate: bundle.hourlyRate.toString(),
      isActive: bundle.isActive ?? true
    });

    const handleSave = () => {
      updateBundleMutation.mutate({
        id: bundle.id,
        updates: {
          ...formData,
          hourlyRate: formData.hourlyRate
        }
      });
    };

    return (
      <div className="space-y-4 p-4 bg-barn-green/5 rounded-lg">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor={`bundle-name-${bundle.id}`}>Name</Label>
            <Input
              id={`bundle-name-${bundle.id}`}
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              data-testid={`input-bundle-name-${bundle.id}`}
            />
          </div>
          <div>
            <Label htmlFor={`bundle-rate-${bundle.id}`}>Hourly Rate ($)</Label>
            <Input
              id={`bundle-rate-${bundle.id}`}
              type="number"
              step="0.01"
              value={formData.hourlyRate}
              onChange={(e) => setFormData(prev => ({ ...prev, hourlyRate: e.target.value }))}
              data-testid={`input-bundle-rate-${bundle.id}`}
            />
          </div>
        </div>

        <div>
          <Label htmlFor={`bundle-description-${bundle.id}`}>Description</Label>
          <Textarea
            id={`bundle-description-${bundle.id}`}
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            data-testid={`textarea-bundle-description-${bundle.id}`}
          />
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id={`bundle-active-${bundle.id}`}
            checked={formData.isActive}
            onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
            data-testid={`switch-bundle-active-${bundle.id}`}
          />
          <Label htmlFor={`bundle-active-${bundle.id}`}>Active (visible to customers)</Label>
        </div>

        <div className="flex space-x-2">
          <Button 
            onClick={handleSave}
            disabled={updateBundleMutation.isPending}
            data-testid={`button-save-bundle-${bundle.id}`}
          >
            <Save className="w-4 h-4 mr-2" />
            {updateBundleMutation.isPending ? "Saving..." : "Save Changes"}
          </Button>
          <Button 
            variant="outline" 
            onClick={() => setEditingBundle(null)}
            data-testid={`button-cancel-bundle-${bundle.id}`}
          >
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-barn-navy text-white p-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Link href="/admin">
              <Button variant="ghost" size="sm" className="text-white hover:bg-white/20">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Admin
              </Button>
            </Link>
            <div className="flex items-center space-x-2">
              <img src={baseballLogo} alt="The Barn MI" className="w-6 h-6" />
              <h1 className="text-lg font-bold">Settings - Configure Spaces & Bundles</h1>
            </div>
          </div>
          <div className="text-right text-xs opacity-90">
            <div>6090 W River Rd</div>
            <div>Weidman, MI 48893</div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4 space-y-6">
        {/* Spaces Section */}
        <Card>
          <CardHeader>
            <CardTitle>Practice Spaces</CardTitle>
            <p className="text-sm text-barn-gray">Manage individual practice spaces and their pricing</p>
          </CardHeader>
          <CardContent>
            {spacesLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin w-8 h-8 border-4 border-barn-navy border-t-transparent rounded-full" />
              </div>
            ) : (
              <div className="space-y-4">
                {spaces?.map((space: Space) => (
                  <div key={space.id} className="border rounded-lg">
                    {editingSpace === space.id ? (
                      <SpaceEditForm space={space} />
                    ) : (
                      <div className="p-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3">
                              <h3 className="text-lg font-semibold" data-testid={`text-space-name-${space.id}`}>
                                {space.name}
                              </h3>
                              <span className={`px-2 py-1 text-xs rounded-full ${
                                space.isActive 
                                  ? 'bg-barn-green/20 text-barn-green' 
                                  : 'bg-barn-red/20 text-barn-red'
                              }`}>
                                {space.isActive ? 'Active' : 'Inactive'}
                              </span>
                              <span className="text-lg font-bold text-barn-navy" data-testid={`text-space-rate-${space.id}`}>
                                ${space.hourlyRate}/hr
                              </span>
                            </div>
                            <p className="text-sm text-barn-gray mt-1" data-testid={`text-space-description-${space.id}`}>
                              {space.description}
                            </p>
                            <p className="text-xs text-barn-gray/70 mt-1" data-testid={`text-space-equipment-${space.id}`}>
                              Equipment: {space.equipment}
                            </p>
                          </div>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setEditingSpace(space.id)}
                            data-testid={`button-edit-space-${space.id}`}
                          >
                            <Edit2 className="w-4 h-4 mr-2" />
                            Edit
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Bundles Section */}
        <Card>
          <CardHeader>
            <CardTitle>Team Bundles</CardTitle>
            <p className="text-sm text-barn-gray">Manage team package offerings and pricing</p>
          </CardHeader>
          <CardContent>
            {bundlesLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin w-8 h-8 border-4 border-barn-navy border-t-transparent rounded-full" />
              </div>
            ) : (
              <div className="space-y-4">
                {bundles?.map((bundle: Bundle) => (
                  <div key={bundle.id} className="border rounded-lg">
                    {editingBundle === bundle.id ? (
                      <BundleEditForm bundle={bundle} />
                    ) : (
                      <div className="p-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3">
                              <h3 className="text-lg font-semibold" data-testid={`text-bundle-name-${bundle.id}`}>
                                {bundle.name}
                              </h3>
                              <span className={`px-2 py-1 text-xs rounded-full ${
                                bundle.isActive 
                                  ? 'bg-barn-green/20 text-barn-green' 
                                  : 'bg-barn-red/20 text-barn-red'
                              }`}>
                                {bundle.isActive ? 'Active' : 'Inactive'}
                              </span>
                              <span className="text-lg font-bold text-barn-navy" data-testid={`text-bundle-rate-${bundle.id}`}>
                                ${bundle.hourlyRate}/hr
                              </span>
                            </div>
                            <p className="text-sm text-barn-gray mt-1" data-testid={`text-bundle-description-${bundle.id}`}>
                              {bundle.description}
                            </p>
                          </div>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setEditingBundle(bundle.id)}
                            data-testid={`button-edit-bundle-${bundle.id}`}
                          >
                            <Edit2 className="w-4 h-4 mr-2" />
                            Edit
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Facility Hours Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="w-5 h-5 mr-2" />
              Facility Hours
            </CardTitle>
            <p className="text-sm text-barn-gray">Set operating hours and available days of the week</p>
          </CardHeader>
          <CardContent>
            {facilitySettingsLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin w-8 h-8 border-4 border-barn-navy border-t-transparent rounded-full" />
              </div>
            ) : facilitySettings ? (
              <div className="space-y-6">
                {/* Operating Hours */}
                <div className="bg-barn-navy/5 p-4 rounded-lg">
                  <h3 className="font-semibold text-barn-navy mb-4">Operating Hours</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="opening-time">Opening Time</Label>
                      <Select
                        value={String(facilitySettings.openingTime)}
                        onValueChange={(value) => {
                          updateFacilitySettingsMutation.mutate({ openingTime: parseInt(value) });
                        }}
                      >
                        <SelectTrigger data-testid="select-opening-time">
                          <SelectValue placeholder="Select opening time" />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 16 }, (_, i) => i + 5).map((hour) => (
                            <SelectItem key={hour} value={String(hour)}>
                              {hour === 0 ? '12:00 AM' : hour < 12 ? `${hour}:00 AM` : hour === 12 ? '12:00 PM' : `${hour - 12}:00 PM`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="closing-time">Closing Time</Label>
                      <Select
                        value={String(facilitySettings.closingTime)}
                        onValueChange={(value) => {
                          updateFacilitySettingsMutation.mutate({ closingTime: parseInt(value) });
                        }}
                      >
                        <SelectTrigger data-testid="select-closing-time">
                          <SelectValue placeholder="Select closing time" />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 16 }, (_, i) => i + 9).map((hour) => (
                            <SelectItem key={hour} value={String(hour)}>
                              {hour === 12 ? '12:00 PM' : hour < 12 ? `${hour}:00 AM` : hour > 12 && hour < 24 ? `${hour - 12}:00 PM` : '12:00 AM'}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <p className="text-xs text-barn-gray mt-2">
                    Current hours: {facilitySettings.openingTime < 12 ? `${facilitySettings.openingTime}:00 AM` : facilitySettings.openingTime === 12 ? '12:00 PM' : `${facilitySettings.openingTime - 12}:00 PM`} - {facilitySettings.closingTime < 12 ? `${facilitySettings.closingTime}:00 AM` : facilitySettings.closingTime === 12 ? '12:00 PM' : `${facilitySettings.closingTime - 12}:00 PM`}
                  </p>
                </div>

                {/* Days of Week */}
                <div className="bg-barn-green/5 p-4 rounded-lg">
                  <h3 className="font-semibold text-barn-green mb-4">Available Days</h3>
                  <p className="text-sm text-barn-gray mb-4">Toggle which days the facility is open for bookings</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      { key: 'mondayOpen', label: 'Monday' },
                      { key: 'tuesdayOpen', label: 'Tuesday' },
                      { key: 'wednesdayOpen', label: 'Wednesday' },
                      { key: 'thursdayOpen', label: 'Thursday' },
                      { key: 'fridayOpen', label: 'Friday' },
                      { key: 'saturdayOpen', label: 'Saturday' },
                      { key: 'sundayOpen', label: 'Sunday' },
                    ].map(({ key, label }) => (
                      <div key={key} className="flex items-center space-x-2 bg-white p-3 rounded-lg border">
                        <Switch
                          id={key}
                          checked={facilitySettings[key as keyof FacilitySettings] as boolean}
                          onCheckedChange={(checked) => {
                            updateFacilitySettingsMutation.mutate({ [key]: checked });
                          }}
                          data-testid={`switch-${key}`}
                        />
                        <Label htmlFor={key} className="cursor-pointer">{label}</Label>
                      </div>
                    ))}
                  </div>
                </div>

                {updateFacilitySettingsMutation.isPending && (
                  <div className="text-center text-barn-gray text-sm">
                    Saving changes...
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-barn-gray">
                Failed to load facility settings
              </div>
            )}
          </CardContent>
        </Card>

        {/* Blocked Dates Section */}
        <Card>
          <CardHeader>
            <CardTitle>Blocked Dates</CardTitle>
            <p className="text-sm text-barn-gray">Mark specific dates as unavailable for bookings (holidays, maintenance, etc.)</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Add Blocked Date Form */}
              <div className="bg-barn-red/5 p-4 rounded-lg">
                <h3 className="font-semibold text-barn-red mb-3 flex items-center">
                  <Calendar className="w-4 h-4 mr-2" />
                  Block a New Date
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="blocked-date">Date</Label>
                    <Input
                      id="blocked-date"
                      type="date"
                      value={newBlockedDate.date}
                      onChange={(e) => setNewBlockedDate(prev => ({ ...prev, date: e.target.value }))}
                      data-testid="input-blocked-date"
                    />
                  </div>
                  <div>
                    <Label htmlFor="blocked-reason">Reason</Label>
                    <Input
                      id="blocked-reason"
                      placeholder="e.g., Holiday, Maintenance, Event"
                      value={newBlockedDate.reason}
                      onChange={(e) => setNewBlockedDate(prev => ({ ...prev, reason: e.target.value }))}
                      data-testid="input-blocked-reason"
                    />
                  </div>
                </div>
                <Button 
                  onClick={handleAddBlockedDate}
                  disabled={addBlockedDateMutation.isPending || !newBlockedDate.date || !newBlockedDate.reason.trim()}
                  className="mt-3"
                  data-testid="button-add-blocked-date"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  {addBlockedDateMutation.isPending ? "Adding..." : "Block Date"}
                </Button>
              </div>

              {/* Blocked Dates List */}
              <div>
                <h3 className="font-semibold text-barn-navy mb-3">Currently Blocked Dates</h3>
                {blockedDatesLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin w-8 h-8 border-4 border-barn-navy border-t-transparent rounded-full" />
                  </div>
                ) : blockedDates && blockedDates.length > 0 ? (
                  <div className="space-y-2">
                    {blockedDates
                      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                      .map((blockedDate) => (
                        <div
                          key={blockedDate.id}
                          className="flex items-center justify-between p-3 border rounded-lg bg-white"
                          data-testid={`blocked-date-item-${blockedDate.id}`}
                        >
                          <div className="flex-1">
                            <div className="font-medium text-barn-navy" data-testid={`text-blocked-date-${blockedDate.id}`}>
                              {formatDate(blockedDate.date)}
                            </div>
                            <div className="text-sm text-barn-gray" data-testid={`text-blocked-reason-${blockedDate.id}`}>
                              {blockedDate.reason}
                            </div>
                            <div className="text-xs text-barn-gray/70">
                              Added {new Date(blockedDate.createdAt!).toLocaleDateString()}
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => removeBlockedDateMutation.mutate(blockedDate.id!)}
                            disabled={removeBlockedDateMutation.isPending}
                            className="text-barn-red border-barn-red hover:bg-barn-red hover:text-white"
                            data-testid={`button-remove-blocked-date-${blockedDate.id}`}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            {removeBlockedDateMutation.isPending ? "Removing..." : "Remove"}
                          </Button>
                        </div>
                      ))
                    }
                  </div>
                ) : (
                  <div className="text-center py-8 text-barn-gray">
                    <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No dates are currently blocked</p>
                    <p className="text-sm">Add a blocked date above to mark days unavailable for booking</p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

export default function AdminSettingsPage() {
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
            <Link href="/admin">
              <Button className="mt-4">Back to Admin</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <AdminSettingsContent />;
}