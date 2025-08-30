import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import Navigation from "@/components/navigation";
import baseballLogo from "@assets/Baseball Barn MI_1756584401549.png";

export default function Profile() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-barn-navy border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    setLocation("/login");
    return null;
  }

  const handleLogout = () => {
    window.location.href = '/api/logout';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-sm mx-auto bg-white min-h-screen pb-20">
        {/* Header */}
        <header className="bg-barn-navy text-white p-4 flex justify-center items-center">
          <div className="flex items-center space-x-2">
            <img src={baseballLogo} alt="The Barn MI" className="w-6 h-6" />
            <h1 className="text-lg font-bold">My Profile</h1>
          </div>
        </header>

        <div className="p-4 space-y-6">
          {/* Profile Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-barn-navy">Account Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-barn-gray">Email</label>
                <p className="text-barn-navy font-medium" data-testid="text-user-email">
                  {user.email}
                </p>
              </div>
              
              {user.firstName && (
                <div>
                  <label className="text-sm font-medium text-barn-gray">Name</label>
                  <p className="text-barn-navy font-medium" data-testid="text-user-name">
                    {user.firstName} {user.lastName || ''}
                  </p>
                </div>
              )}

              {(user as any)?.role === 'admin' && (
                <div>
                  <label className="text-sm font-medium text-barn-gray">Role</label>
                  <span className="inline-block px-2 py-1 text-xs rounded-full bg-barn-green/20 text-barn-green font-medium">
                    Administrator
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-barn-navy">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                onClick={() => setLocation("/booking")}
                className="w-full bg-barn-red hover:bg-barn-red/90"
                data-testid="button-book-session"
              >
                <i className="fas fa-calendar-plus mr-2"></i>
                Book a Session
              </Button>
              
              <Button 
                onClick={() => setLocation("/dashboard")}
                variant="outline"
                className="w-full border-barn-navy text-barn-navy hover:bg-barn-navy/10"
                data-testid="button-view-bookings"
              >
                <i className="fas fa-clipboard-list mr-2"></i>
                View My Bookings
              </Button>

              {(user as any)?.role === 'admin' && (
                <Button 
                  onClick={() => setLocation("/admin")}
                  variant="outline"
                  className="w-full border-barn-green text-barn-green hover:bg-barn-green/10"
                  data-testid="button-admin-panel"
                >
                  <i className="fas fa-user-shield mr-2"></i>
                  Admin Panel
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Support Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-barn-navy">Need Help?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-sm text-barn-gray space-y-2">
                <div className="flex items-center">
                  <i className="fas fa-envelope mr-3 w-4 text-barn-red"></i>
                  <span>info@thebarnmi.com</span>
                </div>
                <div className="flex items-center">
                  <i className="fas fa-phone mr-3 w-4 text-barn-red"></i>
                  <span>(517) 204-4747</span>
                </div>
                <div className="flex items-center">
                  <i className="fas fa-clock mr-3 w-4 text-barn-red"></i>
                  <span>Daily: 8am-9pm EST</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Logout */}
          <Card>
            <CardContent className="p-4">
              <Button 
                onClick={handleLogout}
                variant="outline"
                className="w-full border-barn-red text-barn-red hover:bg-barn-red hover:text-white"
                data-testid="button-logout"
              >
                <i className="fas fa-sign-out-alt mr-2"></i>
                Sign Out
              </Button>
            </CardContent>
          </Card>
        </div>

        <Navigation currentPage="profile" />
      </div>
    </div>
  );
}