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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Shield, Mail, FileText } from "lucide-react";

const riskColors: Record<string, string> = {
  low: "text-emerald-400 border-emerald-500/30",
  medium: "text-amber-400 border-amber-500/30",
  high: "text-red-400 border-red-500/30",
};

const statusColors: Record<string, string> = {
  pending_review: "text-amber-400 border-amber-500/30",
  approved: "text-emerald-400 border-emerald-500/30",
  rejected: "text-red-400 border-red-500/30",
  edited: "text-blue-400 border-blue-500/30",
};

export default function AdminPipeline() {
  const { user } = useAuth();
  const { data: candidates, isLoading: candidatesLoading } = trpc.admin.allCandidates.useQuery(undefined, { enabled: user?.role === "admin" });
  const { data: letters, isLoading: lettersLoading } = trpc.admin.allLetters.useQuery(undefined, { enabled: user?.role === "admin" });
  const { data: mailPackets, isLoading: mailLoading } = trpc.admin.allMailPackets.useQuery(undefined, { enabled: user?.role === "admin" });

  if (user?.role !== "admin") {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md">
          <CardContent className="p-8 text-center">
            <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-lg font-semibold mb-2">Access Denied</h2>
            <p className="text-sm text-muted-foreground">Admin privileges required.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dispute Pipeline Overview</h1>
        <p className="text-muted-foreground text-sm mt-1">
          All users' disputes, letters, and mail packets
        </p>
      </div>

      <Tabs defaultValue="candidates">
        <TabsList>
          <TabsTrigger value="candidates" className="gap-1">
            <Search className="h-3 w-3" />
            Candidates
          </TabsTrigger>
          <TabsTrigger value="letters" className="gap-1">
            <FileText className="h-3 w-3" />
            Letters
          </TabsTrigger>
          <TabsTrigger value="mail" className="gap-1">
            <Mail className="h-3 w-3" />
            Mail Queue
          </TabsTrigger>
        </TabsList>

        <TabsContent value="candidates" className="mt-4">
          <Card>
            <CardContent className="p-0">
              {candidatesLoading ? (
                <div className="p-4 space-y-3">
                  {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
                </div>
              ) : !candidates || candidates.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No candidates</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Bureau</TableHead>
                      <TableHead>Furnisher</TableHead>
                      <TableHead>Issue</TableHead>
                      <TableHead>Confidence</TableHead>
                      <TableHead>Risk</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {candidates.slice(0, 50).map((c) => (
                      <TableRow key={c.id}>
                        <TableCell className="text-xs">#{c.userId}</TableCell>
                        <TableCell className="text-sm">{c.bureau}</TableCell>
                        <TableCell className="text-sm">{c.furnisher}</TableCell>
                        <TableCell className="text-sm">{c.issueType}</TableCell>
                        <TableCell className="text-sm">{Number(c.confidenceScore).toFixed(0)}%</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`text-xs ${riskColors[c.riskFlag]}`}>{c.riskFlag}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`text-xs ${statusColors[c.userStatus]}`}>{c.userStatus.replace("_", " ")}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="letters" className="mt-4">
          <Card>
            <CardContent className="p-0">
              {lettersLoading ? (
                <div className="p-4 space-y-3">
                  {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
                </div>
              ) : !letters || letters.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No letters</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Bureau</TableHead>
                      <TableHead>Furnisher</TableHead>
                      <TableHead>Round</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {letters.slice(0, 50).map((l) => (
                      <TableRow key={l.id}>
                        <TableCell className="text-xs">#{l.userId}</TableCell>
                        <TableCell className="text-sm">{l.bureau}</TableCell>
                        <TableCell className="text-sm">{l.furnisher}</TableCell>
                        <TableCell className="text-sm">Round {l.disputeRound}</TableCell>
                        <TableCell><Badge variant="outline" className="text-xs">{l.status}</Badge></TableCell>
                        <TableCell className="text-xs text-muted-foreground">{new Date(l.createdAt).toLocaleDateString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="mail" className="mt-4">
          <Card>
            <CardContent className="p-0">
              {mailLoading ? (
                <div className="p-4 space-y-3">
                  {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
                </div>
              ) : !mailPackets || mailPackets.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No mail packets</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Recipient</TableHead>
                      <TableHead>Tracking</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Delivery</TableHead>
                      <TableHead>Deadline</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mailPackets.slice(0, 50).map((p) => (
                      <TableRow key={p.id}>
                        <TableCell className="text-xs">#{p.userId}</TableCell>
                        <TableCell className="text-sm">{p.recipientName}</TableCell>
                        <TableCell><code className="text-xs bg-muted px-1 py-0.5 rounded">{p.trackingNumber || "—"}</code></TableCell>
                        <TableCell><Badge variant="outline" className="text-xs">{p.status}</Badge></TableCell>
                        <TableCell className="text-xs">{p.deliveryResult}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{p.deadline ? new Date(p.deadline).toLocaleDateString() : "—"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
