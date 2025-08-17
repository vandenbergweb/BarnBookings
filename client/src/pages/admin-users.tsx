import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Crown, UserPlus, UserMinus, Shield } from "lucide-react";

interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: string;
  isEmailVerified: boolean;
  authProvider: string;
  createdAt: string;
}

export default function AdminUsers() {
  const [promoteEmail, setPromoteEmail] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: users, isLoading } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
  });

  const promoteUserMutation = useMutation({
    mutationFn: async (email: string) => {
      const response = await apiRequest("POST", "/api/promote-to-admin", { email });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "Success",
        description: "User promoted to admin successfully",
      });
      setPromoteEmail("");
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Promote User",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    },
  });

  const removeAdminMutation = useMutation({
    mutationFn: async (email: string) => {
      const response = await apiRequest("POST", "/api/remove-admin", { email });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "Success",
        description: "Admin privileges removed successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Remove Admin",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    },
  });

  const handlePromoteUser = () => {
    if (!promoteEmail.trim()) {
      toast({
        title: "Email Required",
        description: "Please enter an email address",
        variant: "destructive",
      });
      return;
    }
    promoteUserMutation.mutate(promoteEmail.trim());
  };

  const handleRemoveAdmin = (email: string) => {
    if (confirm(`Are you sure you want to remove admin privileges from ${email}?`)) {
      removeAdminMutation.mutate(email);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">Loading users...</div>
      </div>
    );
  }

  const adminUsers = users?.filter(user => user.role === 'admin') || [];
  const regularUsers = users?.filter(user => user.role === 'customer') || [];

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center space-x-2">
        <Shield className="h-6 w-6 text-barn-navy" />
        <h1 className="text-2xl font-bold text-barn-navy">User Management</h1>
      </div>

      {/* Promote User Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <UserPlus className="h-5 w-5" />
            <span>Promote User to Admin</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-2">
            <Input
              placeholder="Enter user email"
              value={promoteEmail}
              onChange={(e) => setPromoteEmail(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handlePromoteUser()}
              data-testid="input-promote-email"
            />
            <Button 
              onClick={handlePromoteUser}
              disabled={promoteUserMutation.isPending}
              data-testid="button-promote-user"
            >
              {promoteUserMutation.isPending ? "Promoting..." : "Promote to Admin"}
            </Button>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            Enter the email of an existing user to grant them admin privileges.
          </p>
        </CardContent>
      </Card>

      {/* Admin Users */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Crown className="h-5 w-5 text-yellow-600" />
            <span>Admin Users ({adminUsers.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {adminUsers.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No admin users found</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {adminUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      {user.firstName && user.lastName 
                        ? `${user.firstName} ${user.lastName}`
                        : 'No name provided'
                      }
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <span>{user.email}</span>
                        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                          Admin
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      {new Date(user.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRemoveAdmin(user.email)}
                        disabled={removeAdminMutation.isPending}
                        className="text-red-600 hover:text-red-700"
                        data-testid={`button-remove-admin-${user.email}`}
                      >
                        <UserMinus className="h-4 w-4 mr-1" />
                        Remove Admin
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Regular Users */}
      <Card>
        <CardHeader>
          <CardTitle>Regular Users ({regularUsers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {regularUsers.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No regular users found</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Verified</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {regularUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      {user.firstName && user.lastName 
                        ? `${user.firstName} ${user.lastName}`
                        : 'No name provided'
                      }
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge variant={user.isEmailVerified ? "default" : "secondary"}>
                        {user.isEmailVerified ? "Verified" : "Unverified"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(user.createdAt).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}