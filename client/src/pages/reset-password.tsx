import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { passwordResetSchema, type PasswordReset } from "@shared/schema";
import baseballLogo from "@assets/thebarnmi_1761853940046.png";
import { z } from "zod";

const resetFormSchema = passwordResetSchema.extend({
  confirmPassword: z.string().min(1, "Please confirm your password"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type ResetFormData = z.infer<typeof resetFormSchema>;

export default function ResetPassword() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [token, setToken] = useState<string>("");

  // Get token from URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tokenParam = urlParams.get('token');
    if (tokenParam) {
      setToken(tokenParam);
    } else {
      toast({
        title: "Invalid Reset Link",
        description: "The password reset link is missing or invalid.",
        variant: "destructive",
      });
      setLocation("/login");
    }
  }, [toast, setLocation]);

  const form = useForm<ResetFormData>({
    resolver: zodResolver(resetFormSchema),
    defaultValues: {
      token: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  // Update form token when token is set
  useEffect(() => {
    if (token) {
      form.setValue("token", token);
    }
  }, [token, form]);

  const onSubmit = async (data: ResetFormData) => {
    setIsLoading(true);
    try {
      const response = await apiRequest("POST", "/api/auth/password-reset", {
        token: data.token,
        newPassword: data.newPassword,
      });
      const result = await response.json();
      
      if (response.ok) {
        setResetSuccess(true);
        toast({
          title: "Password Reset Successful",
          description: result.message,
        });
      } else {
        throw new Error(result.message || "Failed to reset password");
      }
    } catch (error: any) {
      console.error("Password reset error:", error);
      toast({
        title: "Reset Failed",
        description: error.message || "Unable to reset password. Please try again or request a new reset link.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (resetSuccess) {
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
              <CardTitle className="text-center text-barn-navy">Password Reset Complete</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <div className="text-barn-green text-6xl">
                <i className="fas fa-check-circle"></i>
              </div>
              <p className="text-barn-gray">
                Your password has been successfully reset. You can now log in with your new password.
              </p>
              <div className="pt-4">
                <Button
                  onClick={() => setLocation("/login")}
                  className="w-full bg-barn-red hover:bg-barn-red/90"
                  data-testid="button-login"
                >
                  Go to Login
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
            <CardTitle className="text-center text-barn-navy">Reset Your Password</CardTitle>
            <p className="text-center text-sm text-barn-gray">
              Enter your new password below.
            </p>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="newPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>New Password</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="password"
                          placeholder="Enter new password"
                          disabled={isLoading}
                          data-testid="input-new-password"
                        />
                      </FormControl>
                      <FormMessage />
                      <p className="text-xs text-barn-gray">
                        Password must be at least 8 characters long
                      </p>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm New Password</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="password"
                          placeholder="Confirm new password"
                          disabled={isLoading}
                          data-testid="input-confirm-password"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full bg-barn-red hover:bg-barn-red/90"
                  disabled={isLoading || !token}
                  data-testid="button-reset-password"
                >
                  {isLoading ? (
                    <>
                      <i className="fas fa-spinner fa-spin mr-2"></i>
                      Resetting...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-key mr-2"></i>
                      Reset Password
                    </>
                  )}
                </Button>

                <div className="text-center">
                  <Button
                    type="button"
                    variant="link"
                    onClick={() => setLocation("/login")}
                    className="text-barn-navy"
                    data-testid="button-cancel"
                  >
                    Cancel
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