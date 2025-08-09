import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Navigation from "@/components/navigation";
import SpaceCard from "@/components/space-card";
import BundleCard from "@/components/bundle-card";
import type { Space, Bundle } from "@shared/schema";

export default function Home() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();

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

  const { data: spaces, isLoading: spacesLoading } = useQuery<Space[]>({
    queryKey: ["/api/spaces"],
    retry: false,
  });

  const { data: bundles, isLoading: bundlesLoading } = useQuery<Bundle[]>({
    queryKey: ["/api/bundles"],
    retry: false,
  });

  if (isLoading || spacesLoading || bundlesLoading) {
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
        <header className="bg-barn-navy text-white p-4 flex justify-between items-center sticky top-0 z-50">
          <div className="flex items-center space-x-2">
            <i className="fas fa-baseball-ball text-barn-red"></i>
            <h1 className="text-lg font-bold">The Barn MI</h1>
          </div>
          <div className="flex space-x-4">
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-barn-navy/80"
              data-testid="button-logout"
              onClick={() => window.location.href = '/api/logout'}
            >
              <i className="fas fa-sign-out-alt text-xl"></i>
            </Button>
          </div>
        </header>

        <main>
          {/* Hero Section */}
          <section className="relative">
            <div 
              className="h-48 bg-cover bg-center"
              style={{
                backgroundImage: "url('https://images.unsplash.com/photo-1566577739112-5180d4bf9390?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80')"
              }}
            >
              <div className="absolute inset-0 bg-black bg-opacity-40 flex items-end">
                <div className="p-4 text-white">
                  <h2 className="text-2xl font-bold mb-2">Book Your Practice Space</h2>
                  <p className="text-sm opacity-90">Professional baseball training facility</p>
                </div>
              </div>
            </div>
          </section>

          {/* Quick Actions */}
          <section className="p-4 -mt-6 relative z-10">
            <div className="bg-white rounded-xl shadow-lg p-4 grid grid-cols-2 gap-3">
              <Link href="/booking">
                <Button 
                  className="bg-barn-red hover:bg-barn-red/90 text-white p-4 rounded-lg text-center font-medium flex flex-col items-center space-y-2 h-auto w-full"
                  data-testid="button-book-now"
                >
                  <i className="fas fa-calendar-alt text-xl"></i>
                  <span>Book Now</span>
                </Button>
              </Link>
              <Link href="/dashboard">
                <Button 
                  className="bg-barn-navy hover:bg-barn-navy/90 text-white p-4 rounded-lg text-center font-medium flex flex-col items-center space-y-2 h-auto w-full"
                  data-testid="button-my-bookings"
                >
                  <i className="fas fa-clipboard-list text-xl"></i>
                  <span>My Bookings</span>
                </Button>
              </Link>
            </div>
          </section>

          {/* Available Spaces */}
          <section className="p-4">
            <h3 className="text-xl font-bold text-barn-navy mb-4">Available Spaces</h3>
            
            <div className="space-y-4">
              {spaces?.map((space) => (
                <SpaceCard key={space.id} space={space} />
              ))}
            </div>
          </section>

          {/* Team Bundles */}
          <section className="p-4">
            <h3 className="text-xl font-bold text-barn-navy mb-4">Team Space Bundles</h3>
            
            <div className="space-y-4">
              {bundles?.map((bundle) => (
                <BundleCard key={bundle.id} bundle={bundle} />
              ))}
            </div>
          </section>
        </main>

        <Navigation currentPage="home" />
      </div>
    </div>
  );
}
