import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Upload, FileText, Loader2, CheckCircle, AlertCircle, Clock } from "lucide-react";
import { useState, useRef } from "react";
import { toast } from "sonner";

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: typeof Clock }> = {
  uploaded: { label: "Uploaded", variant: "secondary", icon: Clock },
  processing: { label: "Processing", variant: "outline", icon: Loader2 },
  parsed: { label: "Parsed", variant: "default", icon: CheckCircle },
  analyzed: { label: "Analyzed", variant: "default", icon: CheckCircle },
  error: { label: "Error", variant: "destructive", icon: AlertCircle },
};

export default function Reports() {
  const [uploading, setUploading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const utils = trpc.useUtils();

  const { data: reports, isLoading } = trpc.reports.list.useQuery();
  const uploadMutation = trpc.reports.upload.useMutation({
    onSuccess: () => {
      utils.reports.list.invalidate();
      utils.dashboard.stats.invalidate();
      toast.success("Credit report uploaded successfully");
      setDialogOpen(false);
    },
    onError: (err) => {
      toast.error(`Upload failed: ${err.message}`);
    },
  });

  const parseMutation = trpc.reports.parse.useMutation({
    onSuccess: () => {
      utils.reports.list.invalidate();
      toast.success("Report parsed successfully");
    },
    onError: (err) => {
      toast.error(`Parse failed: ${err.message}`);
    },
  });

  const analyzeMutation = trpc.reports.analyze.useMutation({
    onSuccess: (data) => {
      utils.reports.list.invalidate();
      utils.candidates.list.invalidate();
      utils.dashboard.stats.invalidate();
      toast.success(`Analysis complete: ${data.candidatesFound} dispute candidates found`);
    },
    onError: (err) => {
      toast.error(`Analysis failed: ${err.message}`);
    },
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      toast.error("Please upload a PDF file");
      return;
    }

    if (file.size > 16 * 1024 * 1024) {
      toast.error("File size must be under 16MB");
      return;
    }

    setUploading(true);
    try {
      const buffer = await file.arrayBuffer();
      const base64 = btoa(
        new Uint8Array(buffer).reduce(
          (data, byte) => data + String.fromCharCode(byte),
          ""
        )
      );

      await uploadMutation.mutateAsync({
        fileName: file.name,
        fileData: base64,
        mimeType: file.type,
      });
    } catch {
      // Error handled by mutation
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Credit Reports</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Upload and manage your credit report PDFs
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Upload className="h-4 w-4 mr-2" />
              Upload Report
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Upload Credit Report</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div
                className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                {uploading ? (
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground">Uploading...</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <Upload className="h-8 w-8 text-muted-foreground" />
                    <p className="text-sm font-medium">Click to upload PDF</p>
                    <p className="text-xs text-muted-foreground">
                      PDF files up to 16MB
                    </p>
                  </div>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,application/pdf"
                className="hidden"
                onChange={handleFileUpload}
              />
              <p className="text-xs text-muted-foreground">
                Your credit report will be securely stored and analyzed for
                potential dispute candidates. We support reports from Equifax,
                Experian, and TransUnion.
              </p>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Your Reports</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : !reports || reports.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No credit reports uploaded yet</p>
              <p className="text-xs text-muted-foreground mt-1">
                Upload your first credit report to get started
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>File Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Bureaus</TableHead>
                  <TableHead>Uploaded</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reports.map((report) => {
                  const config = statusConfig[report.status] || statusConfig.uploaded;
                  const StatusIcon = config.icon;
                  return (
                    <TableRow key={report.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <span className="truncate max-w-[200px]">
                            {report.fileName}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={config.variant} className="gap-1">
                          <StatusIcon className={`h-3 w-3 ${report.status === "processing" ? "animate-spin" : ""}`} />
                          {config.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {report.bureausFound && (report.bureausFound as string[]).length > 0 ? (
                          <div className="flex gap-1 flex-wrap">
                            {(report.bureausFound as string[]).map((b) => (
                              <Badge key={b} variant="outline" className="text-xs">
                                {b}
                              </Badge>
                            ))}
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-xs">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(report.uploadedAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          {report.status === "uploaded" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => parseMutation.mutate({ id: report.id })}
                              disabled={parseMutation.isPending}
                            >
                              {parseMutation.isPending ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                "Parse"
                              )}
                            </Button>
                          )}
                          {report.status === "parsed" && (
                            <Button
                              size="sm"
                              onClick={() => analyzeMutation.mutate({ id: report.id })}
                              disabled={analyzeMutation.isPending}
                            >
                              {analyzeMutation.isPending ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                "Analyze"
                              )}
                            </Button>
                          )}
                          {report.status === "analyzed" && (
                            <Badge variant="outline" className="text-emerald-400 border-emerald-500/30">
                              Complete
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
