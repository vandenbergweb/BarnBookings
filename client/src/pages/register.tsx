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
import { registerSchema, type RegisterRequest } from "@shared/schema";
import baseballLogo from "@assets/baseball_1754937097015.png";

export default function Register() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<RegisterRequest>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
      firstName: "",
      lastName: "",
    },
  });

  const onSubmit = async (data: RegisterRequest) => {
    setIsLoading(true);
    try {
      const response = await apiRequest("POST", "/api/auth/register", data);
      const result = await response.json();
      
      if (response.ok) {
        // Show success message and auto-login user
        toast({
          title: "Account Created Successfully!",
          description: "Welcome to The Barn MI. You are now logged in.",
        });
        
        // Force a full page reload to ensure auth state is refreshed
        // Use a shorter delay for better UX
        setTimeout(() => {
          window.location.href = "/";
        }, 1000);
      } else {
        throw new Error(result.message || "Registration failed");
      }
    } catch (error: any) {
      console.error("Registration error:", error);
      toast({
        title: "Registration Failed",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

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
            <CardTitle className="text-center text-barn-navy">Create Your Account</CardTitle>
            <p className="text-center text-sm text-barn-gray">
              Join The Barn MI to book your practice sessions
            </p>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>First Name</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="John" 
                            {...field} 
                            data-testid="input-first-name"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Last Name</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Doe" 
                            {...field} 
                            data-testid="input-last-name"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address</FormLabel>
                      <FormControl>
                        <Input 
                          type="email" 
                          placeholder="john@example.com" 
                          {...field} 
                          data-testid="input-email"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input 
                          type="password" 
                          placeholder="At least 8 characters" 
                          {...field} 
                          data-testid="input-password"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm Password</FormLabel>
                      <FormControl>
                        <Input 
                          type="password" 
                          placeholder="Re-enter your password" 
                          {...field} 
                          data-testid="input-confirm-password"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button 
                  type="submit" 
                  className="w-full bg-barn-red hover:bg-barn-red/90 text-white" 
                  disabled={isLoading}
                  data-testid="button-register"
                >
                  {isLoading ? (
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                      <span>Creating Account...</span>
                    </div>
                  ) : (
                    "Create Account"
                  )}
                </Button>
              </form>
            </Form>

            <div className="mt-6 text-center">
              <p className="text-sm text-barn-gray mb-4">Already have an account?</p>
              <Button 
                variant="outline" 
                onClick={() => setLocation("/login")}
                className="w-full"
                data-testid="button-go-to-login"
              >
                Sign In Instead
              </Button>
            </div>


          </CardContent>
        </Card>
      </main>
    </div>
  );
}