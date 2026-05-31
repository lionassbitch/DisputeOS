import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Mail, Package, Truck, CheckCircle, XCircle, Clock, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const deliveryStatusConfig: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  pending: { label: "Pending", color: "text-muted-foreground", icon: Clock },
  in_transit: { label: "In Transit", color: "text-blue-400", icon: Truck },
  delivered: { label: "Delivered", color: "text-emerald-400", icon: CheckCircle },
  returned: { label: "Returned", color: "text-amber-400", icon: Package },
  failed: { label: "Failed", color: "text-red-400", icon: XCircle },
};

const packetStatusConfig: Record<string, { label: string; color: string }> = {
  queued: { label: "Queued", color: "text-amber-400 border-amber-500/30" },
  processing: { label: "Processing", color: "text-blue-400 border-blue-500/30" },
  sent: { label: "Sent", color: "text-blue-400 border-blue-500/30" },
  delivered: { label: "Delivered", color: "text-emerald-400 border-emerald-500/30" },
  failed: { label: "Failed", color: "text-red-400 border-red-500/30" },
  cancelled: { label: "Cancelled", color: "text-muted-foreground border-muted" },
};

export default function MailQueue() {
  const { data: mailPackets, isLoading } = trpc.mail.list.useQuery();
  const utils = trpc.useUtils();

  const updateTrackingMutation = trpc.mail.updateTracking.useMutation({
    onSuccess: () => {
      utils.mail.list.invalidate();
      toast.success("Tracking updated");
    },
    onError: (err) => toast.error(err.message),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Mail Queue</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Track certified mail delivery and response deadlines
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : !mailPackets || mailPackets.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Mail className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No mail packets yet</p>
            <p className="text-xs text-muted-foreground mt-1">
              Approve and send dispute letters to create mail packets
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Recipient</TableHead>
                  <TableHead>Tracking</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Delivery</TableHead>
                  <TableHead>Deadline</TableHead>
                  <TableHead>Response</TableHead>
                  <TableHead className="text-right">Update</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mailPackets.map((packet) => {
                  const statusConf = packetStatusConfig[packet.status] || packetStatusConfig.queued;
                  const deliveryConf = deliveryStatusConfig[packet.deliveryResult] || deliveryStatusConfig.pending;
                  const DeliveryIcon = deliveryConf.icon;
                  const isOverdue = packet.deadline && new Date(packet.deadline) < new Date() && !packet.responseReceived;

                  return (
                    <TableRow key={packet.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium text-sm">{packet.recipientName}</p>
                          <p className="text-xs text-muted-foreground truncate max-w-[150px]">
                            {packet.recipientAddress}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                          {packet.trackingNumber || "—"}
                        </code>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={statusConf.color}>
                          {statusConf.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <DeliveryIcon className={`h-3 w-3 ${deliveryConf.color}`} />
                          <span className={`text-xs ${deliveryConf.color}`}>
                            {deliveryConf.label}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {packet.deadline ? (
                          <div className="flex items-center gap-1">
                            <span className={`text-xs ${isOverdue ? "text-red-400 font-medium" : "text-muted-foreground"}`}>
                              {new Date(packet.deadline).toLocaleDateString()}
                            </span>
                            {isOverdue && (
                              <Badge variant="outline" className="text-[10px] text-red-400 border-red-500/30 px-1">
                                Overdue
                              </Badge>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {packet.responseReceived ? (
                          <Badge variant="outline" className="text-emerald-400 border-emerald-500/30">
                            Received
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">Awaiting</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Select
                          value={packet.deliveryResult}
                          onValueChange={(val) =>
                            updateTrackingMutation.mutate({
                              id: packet.id,
                              deliveryResult: val as any,
                            })
                          }
                        >
                          <SelectTrigger className="w-[120px] h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="in_transit">In Transit</SelectItem>
                            <SelectItem value="delivered">Delivered</SelectItem>
                            <SelectItem value="returned">Returned</SelectItem>
                            <SelectItem value="failed">Failed</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Provider Info */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Package className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium">Mail Provider: Mock (Development)</p>
              <p className="text-xs text-muted-foreground">
                Ready for Click2Mail, PostGrid, Lob, or Postalytics integration
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
