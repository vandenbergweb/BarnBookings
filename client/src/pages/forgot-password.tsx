import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { passwordResetRequestSchema, type PasswordResetRequest } from "@shared/schema";
import baseballLogo from "@assets/Baseball Barn MI_1756584401549.png";

export default function ForgotPassword() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const form = useForm<PasswordResetRequest>({
    resolver: zodResolver(passwordResetRequestSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (data: PasswordResetRequest) => {
    setIsLoading(true);
    try {
      const response = await apiRequest("POST", "/api/auth/password-reset-request", data);
      const result = await response.json();
      
      if (response.ok) {
        setEmailSent(true);
        toast({
          title: "Reset Link Sent",
          description: result.message,
        });
      } else {
        throw new Error(result.message || "Failed to send reset email");
      }
    } catch (error: any) {
      console.error("Password reset request error:", error);
      toast({
        title: "Request Failed",
        description: error.message || "Unable to send reset email. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (emailSent) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-barn-navy text-white p-4 flex justify-center items-center">
          <div className="flex items-center space-x-2">
            <img src={baseballLogo} alt="The Barn MI" className="w-6 h-6" />
            <h1 className="text-lg font-bold">The Barn MI</h1>
          </div>
        </header>

        <main className="max-w-sm mx-auto bg-white min-h-screen p-4">
          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="text-center text-barn-navy">Check Your Email</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <div className="text-barn-green text-6xl">
                <i className="fas fa-envelope-circle-check"></i>
              </div>
              <p className="text-barn-gray">
                If an account with that email exists, we've sent you a password reset link.
              </p>
              <p className="text-sm text-barn-gray">
                The link will expire in 1 hour. Check your spam folder if you don't see it.
              </p>
              <div className="pt-4">
                <Button
                  onClick={() => setLocation("/login")}
                  variant="outline"
                  className="w-full"
                  data-testid="button-back-login"
                >
                  Back to Login
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-barn-navy text-white p-4 flex justify-center items-center">
        <div className="flex items-center space-x-2">
          <img src={baseballLogo} alt="The Barn MI" className="w-6 h-6" />
          <h1 className="text-lg font-bold">The Barn MI</h1>
        </div>
      </header>

      <main className="max-w-sm mx-auto bg-white min-h-screen p-4">
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="text-center text-barn-navy">Forgot Password?</CardTitle>
            <p className="text-center text-sm text-barn-gray">
              Enter your email address and we'll send you a link to reset your password.
            </p>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="email"
                          placeholder="Enter your email"
                          disabled={isLoading}
                          data-testid="input-email"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full bg-barn-red hover:bg-barn-red/90"
                  disabled={isLoading}
                  data-testid="button-send-reset"
                >
                  {isLoading ? (
                    <>
                      <i className="fas fa-spinner fa-spin mr-2"></i>
                      Sending...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-paper-plane mr-2"></i>
                      Send Reset Link
                    </>
                  )}
                </Button>

                <div className="text-center">
                  <Button
                    type="button"
                    variant="link"
                    onClick={() => setLocation("/login")}
                    className="text-barn-navy"
                    data-testid="button-back-login"
                  >
                    Back to Login
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}