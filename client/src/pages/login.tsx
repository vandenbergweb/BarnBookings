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
import { loginSchema, type LoginRequest } from "@shared/schema";
import baseballLogo from "@assets/baseball_1754937097015.png";

export default function Login() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<LoginRequest>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginRequest) => {
    setIsLoading(true);
    try {
      const response = await apiRequest("POST", "/api/auth/login", data);
      const result = await response.json();
      
      if (response.ok) {
        toast({
          title: "Welcome Back!",
          description: "You're now logged in.",
        });
        setLocation("/");
      } else {
        throw new Error(result.message || "Login failed");
      }
    } catch (error: any) {
      console.error("Login error:", error);
      toast({
        title: "Login Failed",
        description: error.message || "Please check your credentials and try again.",
        variant: "destructive",
      });
    } finally {
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
            <CardTitle className="text-center text-barn-navy">Welcome Back</CardTitle>
            <p className="text-center text-sm text-barn-gray">
              Sign in to book your practice sessions
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
                          placeholder="Enter your password" 
                          {...field} 
                          data-testid="input-password"
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
                  data-testid="button-login"
                >
                  {isLoading ? (
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                      <span>Signing In...</span>
                    </div>
                  ) : (
                    "Sign In"
                  )}
                </Button>
              </form>
            </Form>

            <div className="mt-6 text-center">
              <p className="text-sm text-barn-gray mb-4">Don't have an account?</p>
              <Button 
                variant="outline" 
                onClick={() => setLocation("/register")}
                className="w-full"
                data-testid="button-go-to-register"
              >
                Create Account
              </Button>
            </div>

            <div className="mt-4 text-center">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-barn-gray/20" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-barn-gray">Or continue with</span>
                </div>
              </div>
              
              <Button 
                variant="outline" 
                onClick={() => window.location.href = '/api/login'}
                className="w-full mt-4 text-barn-navy border-barn-navy"
                data-testid="button-replit-auth"
              >
                <i className="fas fa-code mr-2"></i>
                Sign in with Replit
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}