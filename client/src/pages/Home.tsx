import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  FileText,
  Search,
  Mail,
  Calendar,
  ArrowRight,
  Shield,
  TrendingUp,
} from "lucide-react";
import { useLocation } from "wouter";

export default function Home() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { data: stats, isLoading } = trpc.dashboard.stats.useQuery();

  const statCards = [
    {
      title: "Credit Reports",
      value: stats?.reports ?? 0,
      icon: FileText,
      color: "text-blue-400",
      bgColor: "bg-blue-400/10",
      path: "/reports",
    },
    {
      title: "Dispute Candidates",
      value: stats?.candidates ?? 0,
      icon: Search,
      color: "text-amber-400",
      bgColor: "bg-amber-400/10",
      path: "/disputes",
    },
    {
      title: "Letters Generated",
      value: stats?.letters ?? 0,
      icon: FileText,
      color: "text-emerald-400",
      bgColor: "bg-emerald-400/10",
      path: "/letters",
    },
    {
      title: "Mail Packets",
      value: stats?.mailPackets ?? 0,
      icon: Mail,
      color: "text-purple-400",
      bgColor: "bg-purple-400/10",
      path: "/mail",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight">
          Welcome back, {user?.name?.split(" ")[0] || "User"}
        </h1>
        <p className="text-muted-foreground">
          Your credit dispute management overview
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <Card
            key={stat.title}
            className="cursor-pointer hover:border-primary/30 transition-colors"
            onClick={() => setLocation(stat.path)}
          >
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

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              variant="outline"
              className="w-full justify-between h-12"
              onClick={() => setLocation("/reports")}
            >
              <span className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Upload Credit Report
              </span>
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="w-full justify-between h-12"
              onClick={() => setLocation("/disputes")}
            >
              <span className="flex items-center gap-2">
                <Search className="h-4 w-4" />
                Review Dispute Candidates
              </span>
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="w-full justify-between h-12"
              onClick={() => setLocation("/calendar")}
            >
              <span className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                View Deadline Calendar
              </span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Compliance Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
              <span className="text-sm font-medium text-emerald-400">
                All disputes compliant
              </span>
              <Badge variant="outline" className="border-emerald-500/30 text-emerald-400">
                Active
              </Badge>
            </div>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>
                DisputeOS ensures all disputes are grounded in factual evidence
                from your credit reports. No fabricated or unsupported claims are
                ever generated.
              </p>
              <p>
                All letters comply with FCRA §611, §623 and FDCPA requirements.
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-primary"
              onClick={() => setLocation("/compliance")}
            >
              View Compliance Details
              <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
