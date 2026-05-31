import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Users,
  FileText,
  Search,
  Mail,
  Activity,
  Shield,
  ArrowRight,
} from "lucide-react";
import { useLocation } from "wouter";

export default function AdminDashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { data: stats, isLoading } = trpc.admin.stats.useQuery(undefined, {
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
              You need admin privileges to access this page.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const statCards = [
    { title: "Total Users", value: stats?.users ?? 0, icon: Users, color: "text-blue-400", bgColor: "bg-blue-400/10" },
    { title: "Credit Reports", value: stats?.reports ?? 0, icon: FileText, color: "text-emerald-400", bgColor: "bg-emerald-400/10" },
    { title: "Dispute Candidates", value: stats?.candidates ?? 0, icon: Search, color: "text-amber-400", bgColor: "bg-amber-400/10" },
    { title: "Letters Generated", value: stats?.letters ?? 0, icon: FileText, color: "text-purple-400", bgColor: "bg-purple-400/10" },
    { title: "Mail Packets", value: stats?.mailPackets ?? 0, icon: Mail, color: "text-cyan-400", bgColor: "bg-cyan-400/10" },
    { title: "Audit Entries", value: stats?.auditLogs ?? 0, icon: Activity, color: "text-rose-400", bgColor: "bg-rose-400/10" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">
            System overview and management
          </p>
        </div>
        <Badge variant="outline" className="text-primary border-primary/30">
          Admin
        </Badge>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    {stat.title}
                  </p>
                  {isLoading ? (
                    <Skeleton className="h-8 w-16" />
                  ) : (
                    <p className="text-2xl font-bold">{stat.value}</p>
                  )}
                </div>
                <div className={`h-10 w-10 rounded-lg ${stat.bgColor} flex items-center justify-center`}>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Management</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button
              variant="outline"
              className="w-full justify-between"
              onClick={() => setLocation("/admin/users")}
            >
              <span className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                User Management
              </span>
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="w-full justify-between"
              onClick={() => setLocation("/admin/audit")}
            >
              <span className="flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Audit Log
              </span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">System Health</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between p-2 rounded bg-muted/30">
              <span className="text-sm">Mail Provider</span>
              <Badge variant="outline" className="text-emerald-400 border-emerald-500/30">
                Mock (Active)
              </Badge>
            </div>
            <div className="flex items-center justify-between p-2 rounded bg-muted/30">
              <span className="text-sm">AI Engine</span>
              <Badge variant="outline" className="text-emerald-400 border-emerald-500/30">
                Online
              </Badge>
            </div>
            <div className="flex items-center justify-between p-2 rounded bg-muted/30">
              <span className="text-sm">Compliance</span>
              <Badge variant="outline" className="text-emerald-400 border-emerald-500/30">
                Enforced
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
