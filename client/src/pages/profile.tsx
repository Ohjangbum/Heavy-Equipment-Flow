import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient, getQueryFn } from "@/lib/queryClient";
import { UserCircle } from "lucide-react";
import type { User } from "@shared/models/auth";

export default function ProfilePage() {
  const { toast } = useToast();
  const { user: authUser } = useAuth();
  const userId = (authUser as any)?.id;

  const { data: userData } = useQuery<any>({
    queryKey: ["/api/auth/user"],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  const [displayName, setDisplayName] = useState("");

  useEffect(() => {
    if (userData?.displayName) {
      setDisplayName(userData.displayName);
    } else if (userData?.firstName) {
      setDisplayName([userData.firstName, userData.lastName].filter(Boolean).join(" "));
    }
  }, [userData]);

  const updateNameMut = useMutation({
    mutationFn: async (name: string) => {
      const res = await apiRequest("PATCH", "/api/users/me/display-name", { displayName: name });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({ title: "Display name updated" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to update name", description: error.message, variant: "destructive" });
    },
  });

  return (
    <div className="p-6 space-y-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold" data-testid="text-profile-title">My Profile</h1>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCircle className="w-5 h-5" />
            Profile Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-muted-foreground text-xs">Employee ID</Label>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className="text-lg px-3 py-1 font-mono" data-testid="text-employee-id">
                {userData?.employeeId || "..."}
              </Badge>
              <span className="text-xs text-muted-foreground">Auto-generated, cannot be changed</span>
            </div>
          </div>

          <div>
            <Label className="text-muted-foreground text-xs">Email</Label>
            <p className="font-medium mt-1" data-testid="text-email">{userData?.email || (authUser as any)?.email || "-"}</p>
          </div>

          <div>
            <Label className="text-muted-foreground text-xs">Role</Label>
            <p className="font-medium mt-1 capitalize" data-testid="text-role">{userData?.role || (authUser as any)?.role || "technician"}</p>
          </div>

          <div className="pt-2 border-t">
            <Label htmlFor="displayName">Display Name</Label>
            <div className="flex gap-2 mt-1">
              <Input
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Enter your display name"
                data-testid="input-display-name"
              />
              <Button
                onClick={() => updateNameMut.mutate(displayName)}
                disabled={updateNameMut.isPending || !displayName.trim()}
                data-testid="button-save-name"
              >
                {updateNameMut.isPending ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
