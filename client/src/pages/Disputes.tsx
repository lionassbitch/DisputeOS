import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  CheckCircle,
  XCircle,
  Edit,
  Shield,
  AlertTriangle,
  FileText,
  Loader2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const riskColors: Record<string, string> = {
  low: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10",
  medium: "text-amber-400 border-amber-500/30 bg-amber-500/10",
  high: "text-red-400 border-red-500/30 bg-red-500/10",
};

const statusColors: Record<string, string> = {
  pending_review: "text-amber-400 border-amber-500/30",
  approved: "text-emerald-400 border-emerald-500/30",
  rejected: "text-red-400 border-red-500/30",
  edited: "text-blue-400 border-blue-500/30",
};

export default function Disputes() {
  const [filter, setFilter] = useState<string>("all");
  const [selectedCandidate, setSelectedCandidate] = useState<number | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editReason, setEditReason] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [detailCandidate, setDetailCandidate] = useState<number | null>(null);
  const utils = trpc.useUtils();

  const { data: candidates, isLoading } = trpc.candidates.list.useQuery();

  const approveMutation = trpc.candidates.approve.useMutation({
    onSuccess: () => {
      utils.candidates.list.invalidate();
      toast.success("Dispute candidate approved");
    },
    onError: (err) => toast.error(err.message),
  });

  const rejectMutation = trpc.candidates.reject.useMutation({
    onSuccess: () => {
      utils.candidates.list.invalidate();
      toast.success("Dispute candidate rejected");
    },
    onError: (err) => toast.error(err.message),
  });

  const editMutation = trpc.candidates.edit.useMutation({
    onSuccess: () => {
      utils.candidates.list.invalidate();
      toast.success("Dispute candidate updated");
      setEditDialogOpen(false);
    },
    onError: (err) => toast.error(err.message),
  });

  const filtered = candidates?.filter((c) => {
    if (filter === "all") return true;
    return c.userStatus === filter;
  });

  const openEditDialog = (candidate: NonNullable<typeof candidates>[number]) => {
    setSelectedCandidate(candidate.id);
    setEditReason(candidate.disputeReason);
    setEditNotes(candidate.userNotes || "");
    setEditDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dispute Pipeline</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Review and manage dispute candidates identified from your reports
          </p>
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Candidates</SelectItem>
            <SelectItem value="pending_review">Pending Review</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="edited">Edited</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      ) : !filtered || filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No dispute candidates found</p>
            <p className="text-xs text-muted-foreground mt-1">
              Upload and analyze a credit report to identify disputes
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filtered.map((candidate) => (
            <Card key={candidate.id} className="hover:border-primary/20 transition-colors">
              <CardContent className="p-5">
                <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                  {/* Main Info */}
                  <div className="flex-1 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold">{candidate.accountName}</h3>
                          <Badge variant="outline" className={statusColors[candidate.userStatus]}>
                            {candidate.userStatus.replace("_", " ")}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {candidate.furnisher} • {candidate.bureau}
                          <button className="ml-2 text-primary text-xs underline" onClick={() => setDetailCandidate(candidate.id)}>View Details</button>
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {candidate.complianceFlag ? (
                          <Badge variant="outline" className="text-emerald-400 border-emerald-500/30 gap-1">
                            <Shield className="h-3 w-3" />
                            Compliant
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-red-400 border-red-500/30 gap-1">
                            <AlertTriangle className="h-3 w-3" />
                            Non-Compliant
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                      <div>
                        <p className="text-xs text-muted-foreground">Issue Type</p>
                        <p className="font-medium">{candidate.issueType}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Confidence</p>
                        <p className="font-medium">{Number(candidate.confidenceScore).toFixed(0)}%</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Risk</p>
                        <Badge variant="outline" className={`text-xs ${riskColors[candidate.riskFlag]}`}>
                          {candidate.riskFlag}
                        </Badge>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Round</p>
                        <p className="font-medium">Round {candidate.recommendedRound}</p>
                      </div>
                    </div>

                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Dispute Reason</p>
                      <p className="text-sm">{candidate.disputeReason}</p>
                    </div>

                    {candidate.evidenceChecklist && (candidate.evidenceChecklist as string[]).length > 0 && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Evidence</p>
                        <div className="flex flex-wrap gap-1">
                          {(candidate.evidenceChecklist as string[]).slice(0, 3).map((e, i) => (
                            <Badge key={i} variant="secondary" className="text-xs font-normal">
                              {e.length > 50 ? e.slice(0, 50) + "..." : e}
                            </Badge>
                          ))}
                          {(candidate.evidenceChecklist as string[]).length > 3 && (
                            <Badge variant="secondary" className="text-xs">
                              +{(candidate.evidenceChecklist as string[]).length - 3} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  {candidate.userStatus === "pending_review" && (
                    <div className="flex lg:flex-col gap-2 shrink-0">
                      <Button
                        size="sm"
                        onClick={() => approveMutation.mutate({ id: candidate.id })}
                        disabled={approveMutation.isPending || !candidate.complianceFlag}
                        className="gap-1"
                      >
                        {approveMutation.isPending ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <CheckCircle className="h-3 w-3" />
                        )}
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openEditDialog(candidate)}
                        className="gap-1"
                      >
                        <Edit className="h-3 w-3" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => rejectMutation.mutate({ id: candidate.id })}
                        disabled={rejectMutation.isPending}
                        className="gap-1 text-destructive hover:text-destructive"
                      >
                        {rejectMutation.isPending ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <XCircle className="h-3 w-3" />
                        )}
                        Reject
                      </Button>
                    </div>
                  )}
                  {(candidate.userStatus === "approved" || candidate.userStatus === "edited") && (
                    <div className="shrink-0">
                      <GenerateLetterButton candidateId={candidate.id} />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Detail Dialog */}
      <Dialog open={detailCandidate !== null} onOpenChange={() => setDetailCandidate(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Dispute Candidate Details</DialogTitle>
          </DialogHeader>
          {detailCandidate && (() => {
            const c = candidates?.find(x => x.id === detailCandidate);
            if (!c) return null;
            return (
              <div className="space-y-4 py-2">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><p className="text-xs text-muted-foreground">Bureau</p><p className="font-medium">{c.bureau}</p></div>
                  <div><p className="text-xs text-muted-foreground">Furnisher</p><p className="font-medium">{c.furnisher}</p></div>
                  <div><p className="text-xs text-muted-foreground">Account Name</p><p className="font-medium">{c.accountName}</p></div>
                  <div><p className="text-xs text-muted-foreground">Account Number</p><p className="font-medium">{c.accountNumber || "N/A"}</p></div>
                  <div><p className="text-xs text-muted-foreground">Issue Type</p><p className="font-medium">{c.issueType}</p></div>
                  <div><p className="text-xs text-muted-foreground">Confidence Score</p><p className="font-medium">{Number(c.confidenceScore).toFixed(1)}%</p></div>
                  <div><p className="text-xs text-muted-foreground">Risk Flag</p><Badge variant="outline" className={riskColors[c.riskFlag]}>{c.riskFlag}</Badge></div>
                  <div><p className="text-xs text-muted-foreground">Compliance</p><Badge variant="outline" className={c.complianceFlag ? "text-emerald-400 border-emerald-500/30" : "text-red-400 border-red-500/30"}>{c.complianceFlag ? "Compliant" : "Non-Compliant"}</Badge></div>
                  <div><p className="text-xs text-muted-foreground">Recommended Round</p><p className="font-medium">Round {c.recommendedRound}</p></div>
                  <div><p className="text-xs text-muted-foreground">Deadline Status</p><Badge variant="outline">{c.deadlineStatus}</Badge></div>
                  <div><p className="text-xs text-muted-foreground">User Status</p><Badge variant="outline" className={statusColors[c.userStatus]}>{c.userStatus.replace("_", " ")}</Badge></div>
                  <div><p className="text-xs text-muted-foreground">Suggested Strategy</p><Badge variant="outline" className="text-primary border-primary/30">{((c as any).suggestedStrategy || "standard").replace("_", " ")}</Badge></div>
                  <div><p className="text-xs text-muted-foreground">Created</p><p className="font-medium">{new Date(c.createdAt).toLocaleString()}</p></div>
                </div>
                <div><p className="text-xs text-muted-foreground mb-1">Dispute Reason</p><p className="text-sm bg-muted/30 p-3 rounded-lg">{c.disputeReason}</p></div>
                {c.evidenceChecklist && (c.evidenceChecklist as string[]).length > 0 && (
                  <div><p className="text-xs text-muted-foreground mb-1">Evidence Checklist</p><ul className="text-sm space-y-1">{(c.evidenceChecklist as string[]).map((e, i) => (<li key={i} className="flex items-start gap-2"><span className="text-primary">•</span>{e}</li>))}</ul></div>
                )}
                {c.userNotes && <div><p className="text-xs text-muted-foreground mb-1">User Notes</p><p className="text-sm bg-muted/30 p-3 rounded-lg">{c.userNotes}</p></div>}
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Dispute Candidate</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium">Dispute Reason</label>
              <Textarea
                value={editReason}
                onChange={(e) => setEditReason(e.target.value)}
                className="mt-1"
                rows={4}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Notes</label>
              <Textarea
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                className="mt-1"
                rows={2}
                placeholder="Optional notes..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (selectedCandidate) {
                  editMutation.mutate({
                    id: selectedCandidate,
                    disputeReason: editReason,
                    notes: editNotes,
                  });
                }
              }}
              disabled={editMutation.isPending}
            >
              {editMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function GenerateLetterButton({ candidateId }: { candidateId: number }) {
  const [open, setOpen] = useState(false);
  const [strategy, setStrategy] = useState<string>("standard");
  const [subStrategy, setSubStrategy] = useState<string>("");
  const utils = trpc.useUtils();

  const { data: strategies } = trpc.strategies.list.useQuery();
  const { data: subStrategies } = trpc.strategies.subStrategies.useQuery();

  const generateMutation = trpc.letters.generate.useMutation({
    onSuccess: () => {
      utils.letters.list.invalidate();
      utils.dashboard.stats.invalidate();
      toast.success("Dispute letter generated with " + strategy + " strategy");
      setOpen(false);
    },
    onError: (err) => toast.error(err.message),
  });

  return (
    <>
      <Button
        size="sm"
        variant="outline"
        onClick={() => setOpen(true)}
        className="gap-1"
      >
        <FileText className="h-3 w-3" />
        Generate Letter
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Select Dispute Strategy</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium">Strategy</label>
              <Select value={strategy} onValueChange={setStrategy}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Choose strategy" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="standard">Standard Factual Dispute</SelectItem>
                  <SelectItem value="metro2_compliance">Metro 2 Compliance Attack</SelectItem>
                  <SelectItem value="procedural_violation">Procedural Violation</SelectItem>
                  <SelectItem value="verification_demand">Verification Demand (FCRA §611)</SelectItem>
                  <SelectItem value="validation_demand">Validation Demand (FDCPA §809)</SelectItem>
                  <SelectItem value="advanced_legal">Advanced Legal Theory</SelectItem>
                </SelectContent>
              </Select>
              {strategies && (
                <p className="text-xs text-muted-foreground mt-1">
                  {strategies.find(s => s.id === strategy)?.description}
                </p>
              )}
            </div>
            {strategy === "advanced_legal" && subStrategies && (
              <div>
                <label className="text-sm font-medium">Sub-Strategy</label>
                <Select value={subStrategy} onValueChange={setSubStrategy}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Choose legal theory" />
                  </SelectTrigger>
                  <SelectContent>
                    {subStrategies.map(s => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {subStrategy && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {subStrategies.find(s => s.id === subStrategy)?.description}
                  </p>
                )}
              </div>
            )}
            {strategies && (
              <div className="p-3 rounded-lg bg-muted/30 border">
                <p className="text-xs font-medium mb-1">Legal Basis</p>
                <div className="flex flex-wrap gap-1">
                  {strategies.find(s => s.id === strategy)?.legalBasis.map((l, i) => (
                    <Badge key={i} variant="outline" className="text-[10px]">{l}</Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button
              onClick={() => generateMutation.mutate({
                candidateId,
                strategy: strategy as any,
                subStrategy: subStrategy || undefined,
              })}
              disabled={generateMutation.isPending}
            >
              {generateMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Generate Letter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
