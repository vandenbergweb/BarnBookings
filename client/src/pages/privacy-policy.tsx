import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import baseballLogo from "@assets/thebarnmi_1761853940046.png";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-barn-navy text-white p-4">
        <div className="flex items-center justify-between">
          <Link href="/">
            <img src={baseballLogo} alt="The Barn MI" className="h-12 w-auto" />
          </Link>
          <Link href="/">
            <Button variant="ghost" className="text-white hover:bg-barn-navy/80">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto p-4 py-8">
        <Card>
          <CardContent className="p-6 md:p-8">
            <h1 className="text-2xl font-bold text-barn-navy mb-2">Privacy Policy</h1>
            <p className="text-sm text-barn-gray mb-6">Effective Date: January 19, 2026</p>

            <div className="space-y-6 text-barn-gray">
              <section>
                <h2 className="text-lg font-semibold text-barn-navy mb-2">1. Introduction</h2>
                <p>
                  Welcome to The Barn MI. We operate the web application located at https://thebarnmi.com. 
                  We are committed to protecting your privacy. This policy explains what information we collect, 
                  how we use it, and how we keep it safe.
                </p>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-barn-navy mb-2">2. Information We Collect</h2>
                <p className="mb-2">
                  We only collect information that is necessary for you to use our services. 
                  When you create an account or reserve a space, we may ask for:
                </p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li><strong>Personal Information:</strong> Name and email address.</li>
                  <li><strong>Booking Details:</strong> The dates and times you reserve for practice.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-barn-navy mb-2">3. How We Use Your Information</h2>
                <p className="mb-2">We use your information strictly for the following purposes:</p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>To manage your account and facilitate your reservations.</li>
                  <li>To send you email reminders regarding your upcoming bookings.</li>
                  <li>To improve the functionality of our scheduling system.</li>
                </ul>
                <p className="mt-2">We do not sell, trade, or rent your personal information to third parties.</p>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-barn-navy mb-2">4. Payment Processing</h2>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>We use Stripe, a third-party payment processor, to handle all payment transactions securely.</li>
                  <li>We do not store your credit card or financial information on our servers.</li>
                  <li>All payment data is encrypted and processed directly by Stripe.</li>
                  <li>
                    You can review{" "}
                    <a 
                      href="https://stripe.com/privacy" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-barn-green underline hover:text-barn-navy"
                    >
                      Stripe's privacy policy here
                    </a>{" "}
                    for more information on how they handle your data.
                  </li>
                </ul>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-barn-navy mb-2">5. Data Sharing</h2>
                <p>
                  We do not share your personal information with anyone, except as required by law or to protect our rights. 
                  Your data is used solely to allow you to see and reserve spots at our facility.
                </p>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-barn-navy mb-2">6. Security</h2>
                <p>
                  We take reasonable measures to protect your personal information from unauthorized access, use, or disclosure. 
                  However, no internet transmission is completely secure, and we cannot guarantee absolute security.
                </p>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-barn-navy mb-2">7. Changes to This Policy</h2>
                <p>
                  We may update this Privacy Policy from time to time. Any changes will be posted on this page.
                </p>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-barn-navy mb-2">8. Contact Us</h2>
                <p>
                  If you have any questions about this Privacy Policy, please contact us at:{" "}
                  <a 
                    href="mailto:info@thebarnmi.com" 
                    className="text-barn-green underline hover:text-barn-navy"
                  >
                    info@thebarnmi.com
                  </a>
                </p>
              </section>
            </div>
          </CardContent>
        </Card>
      </main>

      <footer className="bg-barn-navy text-white py-6 px-4 text-center">
        <p className="text-sm">
          © {new Date().getFullYear()} The Barn MI. All rights reserved.
        </p>
        <p className="text-xs text-gray-400 mt-1">
          6090 W River Rd, Weidman, MI 48893 | (517) 204-4747
        </p>
        <p className="text-xs text-gray-400 mt-2">
          Design by <a href="https://rebeccavandenberg.com/" target="_blank" rel="noopener noreferrer" className="underline hover:text-white">VanDenBerg Web + Creative</a>
        </p>
      </footer>
    </div>
  );
}
