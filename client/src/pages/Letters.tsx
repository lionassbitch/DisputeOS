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
import { FileText, CheckCircle, Edit, Loader2, Mail, Eye } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Streamdown } from "streamdown";

const letterStatusConfig: Record<string, { label: string; color: string }> = {
  draft: { label: "Draft", color: "text-muted-foreground border-muted" },
  pending_review: { label: "Pending Review", color: "text-amber-400 border-amber-500/30" },
  approved: { label: "Approved", color: "text-emerald-400 border-emerald-500/30" },
  sent: { label: "Sent", color: "text-blue-400 border-blue-500/30" },
  delivered: { label: "Delivered", color: "text-purple-400 border-purple-500/30" },
  responded: { label: "Responded", color: "text-emerald-400 border-emerald-500/30" },
};

export default function Letters() {
  const [previewLetter, setPreviewLetter] = useState<number | null>(null);
  const [editLetter, setEditLetter] = useState<number | null>(null);
  const [editContent, setEditContent] = useState("");
  const utils = trpc.useUtils();

  const { data: letters, isLoading } = trpc.letters.list.useQuery();

  const updateMutation = trpc.letters.update.useMutation({
    onSuccess: () => {
      utils.letters.list.invalidate();
      toast.success("Letter updated");
      setEditLetter(null);
    },
    onError: (err) => toast.error(err.message),
  });

  const approveMutation = trpc.letters.approve.useMutation({
    onSuccess: () => {
      utils.letters.list.invalidate();
      toast.success("Letter approved and ready to send");
    },
    onError: (err) => toast.error(err.message),
  });

  const currentPreview = letters?.find((l) => l.id === previewLetter);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dispute Letters</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Preview, edit, and approve dispute letters before sending
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : !letters || letters.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No dispute letters generated yet</p>
            <p className="text-xs text-muted-foreground mt-1">
              Approve dispute candidates to generate letters
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {letters.map((letter) => {
            const config = letterStatusConfig[letter.status] || letterStatusConfig.draft;
            return (
              <Card key={letter.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">{letter.furnisher}</h3>
                        <Badge variant="outline" className={config.color}>
                          {config.label}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {letter.bureau} • Round {letter.disputeRound} •{" "}
                        {new Date(letter.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setPreviewLetter(letter.id)}
                        className="gap-1"
                      >
                        <Eye className="h-3 w-3" />
                        Preview
                      </Button>
                      {(letter.status === "draft" || letter.status === "pending_review") && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditLetter(letter.id);
                              setEditContent(letter.letterContent);
                            }}
                            className="gap-1"
                          >
                            <Edit className="h-3 w-3" />
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => approveMutation.mutate({ id: letter.id })}
                            disabled={approveMutation.isPending}
                            className="gap-1"
                          >
                            {approveMutation.isPending ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <CheckCircle className="h-3 w-3" />
                            )}
                            Approve
                          </Button>
                        </>
                      )}
                      {letter.status === "approved" && (
                        <SendToMailButton letterId={letter.id} bureau={letter.bureau} />
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Preview Dialog */}
      <Dialog open={previewLetter !== null} onOpenChange={() => setPreviewLetter(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Letter Preview
            </DialogTitle>
          </DialogHeader>
          {currentPreview && (
            <div className="prose prose-invert prose-sm max-w-none py-4 px-2 bg-card rounded-lg border">
              <Streamdown>{currentPreview.letterContent}</Streamdown>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editLetter !== null} onOpenChange={() => setEditLetter(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Edit Letter</DialogTitle>
          </DialogHeader>
          <Textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            className="min-h-[400px] font-mono text-sm"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditLetter(null)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (editLetter) {
                  updateMutation.mutate({ id: editLetter, letterContent: editContent });
                }
              }}
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SendToMailButton({ letterId, bureau }: { letterId: number; bureau: string }) {
  const [open, setOpen] = useState(false);
  const [recipientName, setRecipientName] = useState(bureau);
  const [recipientAddress, setRecipientAddress] = useState("");
  const utils = trpc.useUtils();

  const sendMutation = trpc.mail.send.useMutation({
    onSuccess: (data) => {
      utils.mail.list.invalidate();
      utils.letters.list.invalidate();
      utils.dashboard.stats.invalidate();
      toast.success(`Mail queued. Tracking: ${data.trackingNumber}`);
      setOpen(false);
    },
    onError: (err) => toast.error(err.message),
  });

  return (
    <>
      <Button size="sm" variant="outline" onClick={() => setOpen(true)} className="gap-1">
        <Mail className="h-3 w-3" />
        Send
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send via Certified Mail</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium">Recipient Name</label>
              <input
                className="mt-1 w-full rounded-md border bg-input px-3 py-2 text-sm"
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Recipient Address</label>
              <Textarea
                className="mt-1"
                value={recipientAddress}
                onChange={(e) => setRecipientAddress(e.target.value)}
                placeholder="Full mailing address..."
                rows={3}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              This will queue the letter for certified mail delivery with return receipt.
              A 30-day FCRA response deadline will be automatically tracked.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() =>
                sendMutation.mutate({ letterId, recipientName, recipientAddress })
              }
              disabled={sendMutation.isPending || !recipientName || !recipientAddress}
            >
              {sendMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Queue for Delivery
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
