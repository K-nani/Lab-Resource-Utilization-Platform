
import * as React from "react";
import {
  RefreshCw,
  Search,
  CalendarX2,
  Microscope,
  User,
  Clock,
  CalendarRange,
  History,
  Repeat,
  Link2,
} from "lucide-react";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";

import { useAuthStore } from "@/store/authStore";
import { useRouter } from "@/store/router";
import { useAsync } from "@/hooks/use-async";
import { bookingApi } from "@/lib/api/bookingApi";
import {
  BOOKING_STATUS_CONFIG,
  ACTION_SUCCESS,
  bookingStatusConfig,
} from "@/lib/status";
import { cn } from "@/lib/utils";

import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { ListSkeleton } from "@/components/shared/Skeletons";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { ActionButtonGroup } from "@/components/shared/ActionButtonGroup";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import type { Booking, BookingAction, BookingAudit } from "@/types";
import { BOOKING_STATUSES } from "@/types";

// ---------------------------------------------------------------------------

const STATUS_ALL = "ALL";
const EQUIP_ALL = "ALL";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function fmtDate(iso: string, withTime = false): string {
  try {
    const d = parseISO(iso);
    return withTime
      ? format(d, "EEE, dd MMM yyyy · HH:mm")
      : format(d, "EEE, dd MMM yyyy");
  } catch {
    return iso;
  }
}

function errMsg(e: unknown): string {
  if (e && typeof e === "object" && "message" in e) {
    return String((e as { message?: unknown }).message);
  }
  return "Something went wrong";
}

function recurrenceLabel(pattern: string): string {
  switch (pattern) {
    case "DAILY":
      return "Daily";
    case "WEEKLY":
      return "Weekly";
    case "MONTHLY":
      return "Monthly";
    default:
      return pattern;
  }
}

// ---------------------------------------------------------------------------
// Recurrence / series badges
// ---------------------------------------------------------------------------

function RecurrenceBadges({ booking }: { booking: Booking }) {
  if (!booking.recurrencePattern) return null;
  return (
    <div className="mt-1 flex flex-wrap items-center gap-1">
      <Badge
        variant="outline"
        className="gap-1 border-purple-500/30 bg-purple-500/10 text-purple-700 dark:text-purple-300"
      >
        <Repeat className="size-3" />
        {recurrenceLabel(booking.recurrencePattern)}
      </Badge>
      {booking.parentBookingId !== null && (
        <Badge
          variant="outline"
          className="gap-1 border-cyan-500/30 bg-cyan-500/10 text-cyan-700 dark:text-cyan-300"
        >
          <Link2 className="size-3" />
          Series #{booking.parentBookingId}
        </Badge>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Audit dialog
// ---------------------------------------------------------------------------

function AuditDialog({
  bookingId,
  onClose,
}: {
  bookingId: number | null;
  onClose: () => void;
}) {
  const open = bookingId !== null;
  const {
    data: audit,
    loading,
    error,
    refetch,
  } = useAsync<BookingAudit[]>(
    () =>
      bookingId !== null
        ? bookingApi.bookingAudit(bookingId)
        : Promise.resolve([] as BookingAudit[]),
    [bookingId],
  );

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="size-4 text-primary" />
            Booking audit trail
            {bookingId !== null && (
              <span className="text-sm font-normal text-muted-foreground">
                · #{bookingId}
              </span>
            )}
          </DialogTitle>
          <DialogDescription>
            Chronological history of every status transition for this booking.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[60vh] overflow-y-auto scroll-thin">
          {loading && !audit && !error ? (
            <div className="flex items-center justify-center py-10 text-sm text-muted-foreground">
              <RefreshCw className="mr-2 size-4 animate-spin" />
              Loading audit trail…
            </div>
          ) : error ? (
            <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border/70 bg-muted/30 px-6 py-8 text-center">
              <p className="text-sm font-medium text-foreground">
                Couldn’t load audit trail.
              </p>
              <p className="max-w-sm text-sm text-muted-foreground">{error}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={refetch}
                className="gap-1.5"
              >
                <RefreshCw className="size-3.5" />
                Retry
              </Button>
            </div>
          ) : !audit || audit.length === 0 ? (
            <EmptyState
              icon={History}
              title="No audit entries"
              description="This booking has no recorded status transitions yet."
              className="border-0 bg-transparent py-6"
            />
          ) : (
            <ol className="relative space-y-3 border-l border-border/60 pl-4">
              {audit.map((entry) => {
                const fromCfg = entry.fromStatus
                  ? bookingStatusConfig(entry.fromStatus)
                  : null;
                const toCfg = bookingStatusConfig(entry.toStatus);
                return (
                  <li key={entry.id} className="relative">
                    <span
                      className="absolute -left-[21px] top-1.5 size-2.5 rounded-full ring-2 ring-background"
                      style={{ backgroundColor: toCfg.color }}
                    />
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="secondary" className="font-mono text-[10px]">
                        {entry.action}
                      </Badge>
                      <span className="flex items-center gap-1.5 text-xs">
                        {fromCfg ? (
                          <>
                            <span
                              className={cn(
                                "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium",
                                fromCfg.chip,
                              )}
                            >
                              {fromCfg.label}
                            </span>
                            <span className="text-muted-foreground">→</span>
                          </>
                        ) : null}
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium",
                            toCfg.chip,
                          )}
                        >
                          {toCfg.label}
                        </span>
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      by{" "}
                      <span className="font-medium text-foreground/90">
                        {entry.performedByUsername}
                      </span>{" "}
                      · {fmtDate(entry.createdAt, true)}
                    </p>
                    {entry.notes && (
                      <p className="mt-1 rounded-md bg-muted/40 px-2 py-1 text-xs text-foreground/80">
                        {entry.notes}
                      </p>
                    )}
                  </li>
                );
              })}
            </ol>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Mobile card (inline, uses FLATTENED booking shape)
// ---------------------------------------------------------------------------

function MobileBookingCard({
  booking,
  currentUser,
  onAction,
  onViewEquipment,
  onViewAudit,
}: {
  booking: Booking;
  currentUser: ReturnType<typeof useAuthStore.getState>["user"];
  onAction: (action: BookingAction, booking: Booking) => void;
  onViewEquipment: (id: number) => void;
  onViewAudit: (id: number) => void;
}) {
  const start = parseISO(booking.startTime);
  const end = parseISO(booking.endTime);
  const sameDay = format(start, "yyyy-MM-dd") === format(end, "yyyy-MM-dd");
  return (
    <Card className="gap-3 rounded-2xl border-border/60 p-4 shadow-soft">
      <div className="flex items-start justify-between gap-3">
        <button
          className="flex min-w-0 items-center gap-3 text-left"
          onClick={() => onViewEquipment(booking.equipmentId)}
        >
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 text-primary ring-1 ring-primary/10">
            <Microscope className="size-4" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground">
              {booking.equipmentName}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              ID #{booking.equipmentId}
            </p>
          </div>
        </button>
        <StatusBadge status={booking.status} />
      </div>

      <RecurrenceBadges booking={booking} />

      <div className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
        <div className="flex items-center gap-2 text-muted-foreground">
          <CalendarRange className="size-4 shrink-0 text-primary/70" />
          <span className="text-foreground">
            {format(start, "EEE, dd MMM yyyy")}
          </span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Clock className="size-4 shrink-0 text-primary/70" />
          <span className="text-foreground">
            {format(start, "HH:mm")} –{" "}
            {format(end, sameDay ? "HH:mm" : "dd MMM HH:mm")}
          </span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground sm:col-span-2">
          <User className="size-4 shrink-0 text-primary/70" />
          <span className="text-foreground">
            {booking.username}
            <span className="text-muted-foreground">
              {" · "}
              User ID #{booking.userId}
            </span>
          </span>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
        <ActionButtonGroup
          booking={booking}
          currentUser={currentUser}
          onAction={(a) => onAction(a, booking)}
          size="sm"
        />
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onViewAudit(booking.id)}
          className="gap-1.5 text-xs"
        >
          <History className="size-3.5" />
          Audit
        </Button>
      </div>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function ManagerBookingsPage() {
  const user = useAuthStore((s) => s.user);
  const { navigate } = useRouter();

  // All bookings system-wide via GET /api/bookings/all (LAB_MANAGER only).
  const { data, loading, error, refetch } = useAsync(
    () => bookingApi.allBookings(),
    [],
  );

  // --- filter state ---
  const [statusFilter, setStatusFilter] = React.useState<string>(STATUS_ALL);
  const [equipFilter, setEquipFilter] = React.useState<string>(EQUIP_ALL);
  const [search, setSearch] = React.useState<string>("");
  const [recurringOnly, setRecurringOnly] = React.useState<boolean>(false);

  // --- audit dialog state ---
  const [auditBookingId, setAuditBookingId] = React.useState<number | null>(
    null,
  );

  // --- distinct equipment options for the filter dropdown (id + name) ---
  const equipmentOptions = React.useMemo(() => {
    const map = new Map<number, string>();
    for (const b of data ?? []) {
      if (!map.has(b.equipmentId)) {
        map.set(b.equipmentId, b.equipmentName);
      }
    }
    return Array.from(map.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [data]);

  // --- client-side filtering (FLATTENED Booking shape) ---
  const filtered = React.useMemo(() => {
    const all = data ?? [];
    const q = search.trim().toLowerCase();
    return all
      .filter((b) =>
        statusFilter === STATUS_ALL ? true : b.status === statusFilter,
      )
      .filter((b) =>
        equipFilter === EQUIP_ALL
          ? true
          : b.equipmentId === Number(equipFilter),
      )
      .filter((b) => (recurringOnly ? b.recurrencePattern !== null : true))
      .filter((b) => {
        if (!q) return true;
        const name = b.username?.toLowerCase() ?? "";
        const equip = b.equipmentName?.toLowerCase() ?? "";
        return name.includes(q) || equip.includes(q);
      })
      .sort((a, b) => {
        // newest start first
        return parseISO(b.startTime).getTime() - parseISO(a.startTime).getTime();
      });
  }, [data, statusFilter, equipFilter, search, recurringOnly]);

  const totalCount = data?.length ?? 0;

  const [cancelTarget, setCancelTarget] = React.useState<Booking | null>(null);
  const [cancelling, setCancelling] = React.useState(false);

  // --- lifecycle action (accept/reject/start/cancel/complete/noShow) ---
  const handleAction = async (action: BookingAction, booking: Booking) => {
    // For cancel action, show confirmation dialog
    if (action === "cancel") {
      setCancelTarget(booking);
      return;
    }

    try {
      if (action === "accept") await bookingApi.accept(booking.id);
      else if (action === "reject") await bookingApi.reject(booking.id);
      else if (action === "start") await bookingApi.start(booking.id);
      else if (action === "complete") await bookingApi.complete(booking.id);
      else if (action === "noShow") await bookingApi.noShow(booking.id);
      else return;
      toast.success(ACTION_SUCCESS[action]);
      refetch();
    } catch (e) {
      toast.error(errMsg(e));
    }
  };

  const handleCancelConfirm = async () => {
    if (!cancelTarget) return;
    setCancelling(true);
    try {
      await bookingApi.cancel(cancelTarget.id);
      toast.success(ACTION_SUCCESS.cancel);
      setCancelTarget(null);
      refetch();
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setCancelling(false);
    }
  };

  const clearFilters = () => {
    setStatusFilter(STATUS_ALL);
    setEquipFilter(EQUIP_ALL);
    setSearch("");
    setRecurringOnly(false);
  };

  const hasFilters =
    statusFilter !== STATUS_ALL ||
    equipFilter !== EQUIP_ALL ||
    search.trim() !== "" ||
    recurringOnly;

  // --------------------------------------------------------------------------
  // Render
  // --------------------------------------------------------------------------

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Bookings"
        description="All booking requests across equipment — review, approve, and manage."
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={refetch}
            className="gap-1.5"
          >
            <RefreshCw className={cn("size-3.5", loading && "animate-spin")} />
            Refresh
          </Button>
        }
      />

      {/* Filters bar */}
      <Card className="glass rounded-2xl border-border/60 p-4 shadow-soft">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              Status
            </label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={STATUS_ALL}>All statuses</SelectItem>
                {BOOKING_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {BOOKING_STATUS_CONFIG[s].label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              Equipment
            </label>
            <Select value={equipFilter} onValueChange={setEquipFilter}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="All equipment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={EQUIP_ALL}>All equipment</SelectItem>
                {equipmentOptions.map((opt) => (
                  <SelectItem key={opt.id} value={String(opt.id)}>
                    {opt.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <label className="text-xs font-medium text-muted-foreground">
              Search requester
            </label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Username or equipment…"
                className="pl-9"
              />
            </div>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-border/40 pt-3 text-xs text-muted-foreground">
          <label className="flex cursor-pointer items-center gap-2 select-none">
            <Checkbox
              checked={recurringOnly}
              onCheckedChange={(v) => setRecurringOnly(v === true)}
            />
            <span className="inline-flex items-center gap-1">
              <Repeat className="size-3.5 text-purple-600 dark:text-purple-300" />
              Show recurring only
            </span>
          </label>
          <span>
            {filtered.length} of {totalCount} booking
            {totalCount === 1 ? "" : "s"}
          </span>
          {hasFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="h-7 gap-1.5 text-xs"
            >
              Clear filters
            </Button>
          )}
        </div>
      </Card>

      {/* Loading */}
      {loading ? (
        <ListSkeleton count={5} />
      ) : error ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border/70 bg-muted/30 px-6 py-12 text-center">
          <p className="text-sm font-medium text-foreground">
            Couldn’t load bookings.
          </p>
          <p className="max-w-sm text-sm text-muted-foreground">{error}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={refetch}
            className="gap-1.5"
          >
            <RefreshCw className="size-3.5" />
            Retry
          </Button>
        </div>
      ) : totalCount === 0 ? (
        <EmptyState
          icon={CalendarX2}
          title="No bookings yet"
          description="Booking requests from researchers will show up here for you to review and approve."
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Search}
          title="No matches"
          description="Try adjusting your filters or search to find what you’re looking for."
          action={
            <Button variant="outline" size="sm" onClick={clearFilters}>
              Clear filters
            </Button>
          }
        />
      ) : (
        <>
          {/* Desktop / tablet: responsive table */}
          <div className="hidden sm:block">
            <div className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-soft">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead className="pl-4">Equipment</TableHead>
                    <TableHead>Requester</TableHead>
                    <TableHead>Start</TableHead>
                    <TableHead>End</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="pr-4 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((b) => (
                    <TableRow key={b.id} className="align-top">
                      <TableCell className="pl-4">
                        <button
                          onClick={() =>
                            navigate(`/equipment/${b.equipmentId}`)
                          }
                          className="group flex items-center gap-2.5 text-left"
                        >
                          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 text-primary ring-1 ring-primary/10">
                            <Microscope className="size-4" />
                          </span>
                          <span className="min-w-0">
                            <span className="block truncate text-sm font-medium text-foreground group-hover:text-primary">
                              {b.equipmentName}
                            </span>
                            <span className="block truncate text-xs text-muted-foreground">
                              ID #{b.equipmentId}
                            </span>
                            <RecurrenceBadges booking={b} />
                          </span>
                        </button>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="size-3.5 shrink-0 text-muted-foreground" />
                          <div className="min-w-0">
                            <p className="truncate text-sm text-foreground">
                              {b.username}
                            </p>
                            <p className="truncate text-xs text-muted-foreground">
                              User ID #{b.userId}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-sm text-foreground">
                          <CalendarRange className="size-3.5 text-muted-foreground" />
                          {fmtDate(b.startTime)}
                        </div>
                        <div className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Clock className="size-3" />
                          {fmtDate(b.startTime, true).split("· ")[1] ?? ""}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-sm text-foreground">
                          <CalendarRange className="size-3.5 text-muted-foreground" />
                          {fmtDate(b.endTime)}
                        </div>
                        <div className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Clock className="size-3" />
                          {fmtDate(b.endTime, true).split("· ")[1] ?? ""}
                        </div>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={b.status} />
                      </TableCell>
                      <TableCell className="pr-4">
                        <div className="flex flex-col items-end gap-1.5">
                          <ActionButtonGroup
                            booking={b}
                            currentUser={user}
                            onAction={(a) => handleAction(a, b)}
                            size="sm"
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setAuditBookingId(b.id)}
                            className="h-7 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                          >
                            <History className="size-3" />
                            View Audit
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Mobile: stacked cards (inline — uses FLATTENED booking shape) */}
          <div className="flex flex-col gap-3 sm:hidden">
            {filtered.map((b) => (
              <MobileBookingCard
                key={b.id}
                booking={b}
                currentUser={user}
                onAction={(action, booking) => handleAction(action, booking)}
                onViewEquipment={(id) => navigate(`/equipment/${id}`)}
                onViewAudit={(id) => setAuditBookingId(id)}
              />
            ))}
          </div>
        </>
      )}

      <AuditDialog
        bookingId={auditBookingId}
        onClose={() => setAuditBookingId(null)}
      />

      <ConfirmDialog
        open={cancelTarget !== null}
        onOpenChange={(v) => {
          if (!cancelling) setCancelTarget(v ? cancelTarget : null);
        }}
        title="Cancel booking?"
        description={
          cancelTarget ? (
            <>
              This will cancel the booking for{" "}
              <span className="font-semibold text-foreground">
                {cancelTarget.equipment?.equipmentName || "this equipment"}
              </span>{" "}
              on{" "}
              <span className="font-semibold text-foreground">
                {fmtDate(cancelTarget.startTime)}
              </span>
              .
            </>
          ) : undefined
        }
        confirmLabel="Cancel Booking"
        destructive
        onConfirm={handleCancelConfirm}
      />
    </div>
  );
}
