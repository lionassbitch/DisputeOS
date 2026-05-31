import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Users, Shield } from "lucide-react";

export default function AdminUsers() {
  const { user } = useAuth();
  const { data: users, isLoading } = trpc.admin.users.useQuery(undefined, {
    enabled: user?.role === "admin",
  });

  if (user?.role !== "admin") {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md">
          <CardContent className="p-8 text-center">
            <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-lg font-semibold mb-2">Access Denied</h2>
            <p className="text-sm text-muted-foreground">
              Admin privileges required.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">User Management</h1>
        <p className="text-muted-foreground text-sm mt-1">
          View and manage registered users
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-4 w-4" />
            All Users
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : !users || users.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No users found</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Login Method</TableHead>
                  <TableHead>Last Sign In</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">{u.name || "—"}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {u.email || "—"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          u.role === "admin"
                            ? "text-primary border-primary/30"
                            : "text-muted-foreground"
                        }
                      >
                        {u.role}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {u.loginMethod || "—"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(u.lastSignedIn).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(u.createdAt).toLocaleDateString()}
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
