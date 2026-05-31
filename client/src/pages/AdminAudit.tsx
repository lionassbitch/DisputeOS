import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Activity, Shield, ChevronLeft, ChevronRight } from "lucide-react";
import { useState, useMemo } from "react";

const actionColors: Record<string, string> = {
  report_uploaded: "text-blue-400 border-blue-500/30",
  report_parsed: "text-cyan-400 border-cyan-500/30",
  report_analyzed: "text-emerald-400 border-emerald-500/30",
  candidate_approved: "text-emerald-400 border-emerald-500/30",
  candidate_rejected: "text-red-400 border-red-500/30",
  candidate_edited: "text-amber-400 border-amber-500/30",
  letter_generated: "text-purple-400 border-purple-500/30",
  letter_edited: "text-amber-400 border-amber-500/30",
  letter_approved: "text-emerald-400 border-emerald-500/30",
  mail_sent: "text-blue-400 border-blue-500/30",
  tracking_updated: "text-cyan-400 border-cyan-500/30",
};

export default function AdminAudit() {
  const { user } = useAuth();
  const [page, setPage] = useState(0);
  const limit = 25;

  const { data, isLoading } = trpc.admin.auditLogs.useQuery(
    { limit, offset: page * limit },
    { enabled: user?.role === "admin" }
  );

  const totalPages = useMemo(() => {
    if (!data?.total) return 0;
    return Math.ceil(data.total / limit);
  }, [data?.total]);

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Audit Log</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Complete audit trail of all system actions
          </p>
        </div>
        {data?.total !== undefined && (
          <Badge variant="outline" className="text-muted-foreground">
            {data.total} entries
          </Badge>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Activity Log
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : !data?.logs || data.logs.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No audit entries yet</p>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Entity</TableHead>
                    <TableHead>User ID</TableHead>
                    <TableHead>Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(log.createdAt).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`text-xs ${actionColors[log.action] || "text-muted-foreground"}`}
                        >
                          {log.action.replace(/_/g, " ")}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        <span className="text-muted-foreground">{log.entityType}</span>
                        {log.entityId && (
                          <span className="text-xs text-muted-foreground ml-1">
                            #{log.entityId}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {log.userId || "System"}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">
                        {log.details ? JSON.stringify(log.details).slice(0, 80) : "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <p className="text-xs text-muted-foreground">
                    Page {page + 1} of {totalPages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setPage((p) => Math.max(0, p - 1))}
                      disabled={page === 0}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                      disabled={page >= totalPages - 1}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
