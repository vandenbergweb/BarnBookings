import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-barn-navy text-white p-4 flex justify-center items-center">
        <div className="flex items-center space-x-2">
          <i className="fas fa-baseball-ball text-barn-red"></i>
          <h1 className="text-lg font-bold">The Barn MI</h1>
        </div>
      </header>

      <main className="max-w-sm mx-auto bg-white min-h-screen">
        {/* Hero Section */}
        <section className="relative">
          <div 
            className="h-48 bg-cover bg-center"
            style={{
              backgroundImage: "url('https://images.unsplash.com/photo-1566577739112-5180d4bf9390?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600')"
            }}
          >
            <div className="absolute inset-0 bg-black bg-opacity-40 flex items-end">
              <div className="p-4 text-white">
                <h2 className="text-2xl font-bold mb-2">Professional Baseball Training Facility</h2>
                <p className="text-sm opacity-90">Book your practice space today</p>
              </div>
            </div>
          </div>
        </section>

        {/* Welcome Content */}
        <section className="p-4 -mt-6 relative z-10">
          <Card className="shadow-lg">
            <CardContent className="p-6 text-center">
              <h3 className="text-xl font-bold text-barn-navy mb-4">Welcome to The Barn MI</h3>
              <p className="text-barn-gray mb-6">
                Michigan's premier indoor baseball practice facility with professional-grade equipment and flexible rental options for individuals and teams.
              </p>
              <Button 
                onClick={() => window.location.href = '/api/login'}
                className="w-full bg-barn-red hover:bg-barn-red/90 text-white py-3 text-lg"
                data-testid="button-login"
              >
                Sign In to Book Your Space
              </Button>
            </CardContent>
          </Card>
        </section>

        {/* Features */}
        <section className="p-4">
          <h3 className="text-xl font-bold text-barn-navy mb-4">What We Offer</h3>
          
          <div className="space-y-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-start space-x-3">
                  <div className="bg-barn-navy text-white p-2 rounded-full">
                    <i className="fas fa-baseball-ball"></i>
                  </div>
                  <div>
                    <h4 className="font-semibold text-barn-navy">Professional Equipment</h4>
                    <p className="text-sm text-barn-gray">Hack Attack pitching machines, Hit Tracks, and complete training setups</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-start space-x-3">
                  <div className="bg-barn-red text-white p-2 rounded-full">
                    <i className="fas fa-calendar-alt"></i>
                  </div>
                  <div>
                    <h4 className="font-semibold text-barn-navy">Flexible Booking</h4>
                    <p className="text-sm text-barn-gray">Book individual spaces or team bundles with easy online scheduling</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-start space-x-3">
                  <div className="bg-barn-green text-white p-2 rounded-full">
                    <i className="fas fa-credit-card"></i>
                  </div>
                  <div>
                    <h4 className="font-semibold text-barn-navy">Secure Payments</h4>
                    <p className="text-sm text-barn-gray">Safe and secure payment processing with automatic confirmations</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Pricing Preview */}
        <section className="p-4">
          <h3 className="text-xl font-bold text-barn-navy mb-4">Starting Rates</h3>
          <div className="grid grid-cols-2 gap-3">
            <Card>
              <CardContent className="p-3 text-center">
                <div className="text-barn-green font-bold text-lg">$25/hr</div>
                <div className="text-sm text-barn-gray">Batting Cage</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 text-center">
                <div className="text-barn-green font-bold text-lg">$75/hr</div>
                <div className="text-sm text-barn-gray">Practice Area</div>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>
    </div>
  );
}
