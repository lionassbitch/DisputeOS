import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar } from "@/components/ui/calendar";
import { Calendar as CalendarIcon, Clock, AlertTriangle, CheckCircle } from "lucide-react";
import { useState, useMemo } from "react";

export default function DeadlineCalendar() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const { data: mailPackets, isLoading: mailLoading } = trpc.mail.list.useQuery();
  const { data: followUps, isLoading: followUpLoading } = trpc.followUps.list.useQuery();

  const isLoading = mailLoading || followUpLoading;

  // Collect all deadline dates
  const deadlineDates = useMemo(() => {
    const dates: { date: Date; type: string; label: string; overdue: boolean }[] = [];

    mailPackets?.forEach((packet) => {
      if (packet.deadline) {
        const d = new Date(packet.deadline);
        const isOverdue = d < new Date() && !packet.responseReceived;
        dates.push({
          date: d,
          type: "response_deadline",
          label: `Response deadline: ${packet.recipientName}`,
          overdue: isOverdue,
        });
      }
    });

    followUps?.forEach((round) => {
      const d = new Date(round.scheduledDate);
      dates.push({
        date: d,
        type: "follow_up",
        label: `Follow-up Round ${round.roundNumber}`,
        overdue: d < new Date() && round.status === "scheduled",
      });
    });

    return dates;
  }, [mailPackets, followUps]);

  // Get events for selected date
  const selectedDateEvents = useMemo(() => {
    if (!selectedDate) return [];
    return deadlineDates.filter(
      (d) => d.date.toDateString() === selectedDate.toDateString()
    );
  }, [selectedDate, deadlineDates]);

  // Dates with events for calendar highlighting
  const eventDays = useMemo(() => {
    return deadlineDates.map((d) => d.date);
  }, [deadlineDates]);

  // Upcoming deadlines (next 30 days)
  const upcoming = useMemo(() => {
    const now = new Date();
    const thirtyDays = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    return deadlineDates
      .filter((d) => d.date >= now && d.date <= thirtyDays)
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [deadlineDates]);

  const overdue = useMemo(() => {
    return deadlineDates.filter((d) => d.overdue);
  }, [deadlineDates]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Deadline Calendar</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Track FCRA response deadlines and follow-up rounds
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-blue-400/10 flex items-center justify-center">
                <Clock className="h-4 w-4 text-blue-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Upcoming (30d)</p>
                <p className="text-xl font-bold">{upcoming.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-red-400/10 flex items-center justify-center">
                <AlertTriangle className="h-4 w-4 text-red-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Overdue</p>
                <p className="text-xl font-bold">{overdue.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-emerald-400/10 flex items-center justify-center">
                <CheckCircle className="h-4 w-4 text-emerald-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Tracked</p>
                <p className="text-xl font-bold">{deadlineDates.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <CalendarIcon className="h-4 w-4" />
              Calendar
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : (
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                modifiers={{
                  hasEvent: eventDays,
                }}
                modifiersClassNames={{
                  hasEvent: "bg-primary/20 font-bold text-primary",
                }}
                className="rounded-md"
              />
            )}

            {/* Selected Date Events */}
            {selectedDate && selectedDateEvents.length > 0 && (
              <div className="mt-4 space-y-2 border-t pt-4">
                <p className="text-sm font-medium">
                  Events on {selectedDate.toLocaleDateString()}
                </p>
                {selectedDateEvents.map((event, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 p-2 rounded-lg bg-muted/50"
                  >
                    {event.overdue ? (
                      <AlertTriangle className="h-3 w-3 text-red-400 shrink-0" />
                    ) : (
                      <Clock className="h-3 w-3 text-blue-400 shrink-0" />
                    )}
                    <span className="text-sm">{event.label}</span>
                    <Badge
                      variant="outline"
                      className={`text-[10px] ml-auto ${
                        event.overdue
                          ? "text-red-400 border-red-500/30"
                          : "text-blue-400 border-blue-500/30"
                      }`}
                    >
                      {event.type.replace("_", " ")}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming List */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Upcoming Deadlines</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : upcoming.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No upcoming deadlines
              </p>
            ) : (
              <div className="space-y-2">
                {upcoming.slice(0, 10).map((event, i) => {
                  const daysUntil = Math.ceil(
                    (event.date.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
                  );
                  return (
                    <div
                      key={i}
                      className="flex items-center justify-between p-2 rounded-lg bg-muted/30"
                    >
                      <div className="space-y-0.5">
                        <p className="text-xs font-medium">{event.label}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {event.date.toLocaleDateString()}
                        </p>
                      </div>
                      <Badge
                        variant="outline"
                        className={`text-[10px] ${
                          daysUntil <= 7
                            ? "text-amber-400 border-amber-500/30"
                            : "text-muted-foreground"
                        }`}
                      >
                        {daysUntil}d
                      </Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
