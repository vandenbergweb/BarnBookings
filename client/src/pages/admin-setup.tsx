import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Crown, UserPlus } from "lucide-react";

export default function AdminSetup() {
  const [email, setEmail] = useState("");
  const { toast } = useToast();

  const promoteUserMutation = useMutation({
    mutationFn: async (email: string) => {
      const response = await apiRequest("POST", "/api/promote-to-admin", { email });
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Success!",
        description: "User promoted to admin successfully. You can now access the admin panel.",
      });
      // Redirect to admin panel after success
      setTimeout(() => {
        window.location.href = "/admin";
      }, 2000);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Promote User",
        description: error.message || "Please make sure the email address has an existing account.",
        variant: "destructive",
      });
    },
  });

  const handlePromote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast({
        title: "Email Required",
        description: "Please enter your email address",
        variant: "destructive",
      });
      return;
    }
    promoteUserMutation.mutate(email.trim());
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Crown className="h-12 w-12 text-yellow-600" />
          </div>
          <CardTitle className="text-2xl">Admin Setup</CardTitle>
          <p className="text-gray-600">
            Promote your account to admin to access the admin panel
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePromote} className="space-y-4">
            <div>
              <Label htmlFor="email">Your Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your registered email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                data-testid="input-admin-email"
                required
              />
              <p className="text-sm text-gray-500 mt-1">
                Make sure you've already created an account with this email
              </p>
            </div>
            
            <Button 
              type="submit"
              className="w-full"
              disabled={promoteUserMutation.isPending}
              data-testid="button-promote-admin"
            >
              {promoteUserMutation.isPending ? (
                "Promoting..."
              ) : (
                <>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Promote to Admin
                </>
              )}
            </Button>
          </form>
          
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-medium text-blue-900 mb-2">Instructions:</h3>
            <ol className="text-sm text-blue-800 space-y-1">
              <li>1. First, create a regular user account if you haven't already</li>
              <li>2. Enter that email address above</li>
              <li>3. Click "Promote to Admin"</li>
              <li>4. You'll be redirected to the admin panel</li>
            </ol>
          </div>
          
          <div className="mt-4 text-center">
            <a 
              href="/register" 
              className="text-sm text-blue-600 hover:underline"
            >
              Don't have an account? Register here
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}