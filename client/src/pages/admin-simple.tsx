import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "wouter";
import { Users, ArrowLeft, Calendar } from "lucide-react";
import baseballLogo from "@assets/thebarnmi_1761853940046.png";

export default function AdminSimplePage() {
  const { user, isLoading } = useAuth();

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
            <Link href="/">
              <button className="mt-4 px-4 py-2 bg-barn-navy text-white rounded hover:bg-barn-navy/90">
                Go Home
              </button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

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

      <main className="p-4 max-w-6xl mx-auto">
        <div className="flex items-center space-x-2 mb-6">
          <Link href="/">
            <button className="flex items-center space-x-1 text-barn-navy hover:text-barn-navy/80">
              <ArrowLeft size={16} />
              <span>Back to Home</span>
            </button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="w-5 h-5" />
                <span>User Management</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-barn-gray mb-4">Manage admin users and promote customers to admin roles.</p>
              <Link href="/admin/users">
                <button className="w-full bg-barn-navy text-white py-2 rounded hover:bg-barn-navy/90">
                  Manage Users
                </button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="w-5 h-5" />
                <span>Booking Management</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-barn-gray mb-4">Create cash/comp bookings and view all customer bookings.</p>
              <Link href="/admin/bookings">
                <button className="w-full bg-barn-navy text-white py-2 rounded hover:bg-barn-navy/90">
                  Manage Bookings
                </button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Current User Debug</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-xs">
                <p className="text-barn-gray">Email: {(user as any).email}</p>
                <p className="text-barn-gray">Role: {(user as any).role || 'undefined'}</p>
                <p className="text-barn-gray">ID: {(user as any).id}</p>
                <p className="text-barn-gray">First Name: {(user as any).firstName}</p>
                <p className="text-barn-gray">Admin Check: {(user as any)?.role === 'admin' ? '✓ YES' : '✗ NO'}</p>
                <details className="mt-2">
                  <summary className="cursor-pointer text-barn-navy">Full User Object</summary>
                  <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto">
                    {JSON.stringify(user, null, 2)}
                  </pre>
                </details>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Multiple Admin System</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-sm text-green-600">✓ Multiple admin users supported</p>
                <p className="text-sm text-green-600">✓ Role-based promotion system active</p>
                <p className="text-sm text-barn-gray">Known admins: admin@thebarnmi.com, rebeccavdb@live.com</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}