"use client";

import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Plus, Wrench, Loader2, Search } from "lucide-react";
import { format, parseISO } from "date-fns";

import { maintenanceApi } from "@/lib/api/maintenanceApi";
import { useAsync } from "@/hooks/use-async";
import { useAuthStore } from "@/store/authStore";
import type {
  MaintenanceRequest,
  MaintenanceRequestStatus,
  MaintenanceAction,
  User,
} from "@/types";
import { MAINTENANCE_STATUSES } from "@/types";
import {
  maintenanceStatusConfig,
  maintenancePriorityConfig,
} from "@/lib/status";

import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { MaintenanceRequestCard } from "@/components/shared/MaintenanceRequestCard";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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

export default function MaintenanceRequestsListPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user) as User | null;

  // ─── Fetch all maintenance requests ───
  const {
    data: requests,
    loading,
    refetch,
  } = useAsync<MaintenanceRequest[]>(() => maintenanceApi.findAll(), []);

  // ─── Filters ───
  const [statusFilter, setStatusFilter] = useState<
    MaintenanceRequestStatus | "ALL"
  >("ALL");
  const [search, setSearch] = useState("");

  // ─── Pending action (for card button spinners) ───
  const [pendingAction, setPendingAction] = useState<{
    id: number;
    action: MaintenanceAction;
  } | null>(null);

  // ─── Cancel dialog ───
  const [cancelTarget, setCancelTarget] =
    useState<MaintenanceRequest | null>(null);

  // ─── Filtered list ───
  const filtered = useMemo(() => {
    if (!requests) return [];
    return requests.filter((r) => {
      if (statusFilter !== "ALL" && r.status !== statusFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        const matches =
          r.equipmentName.toLowerCase().includes(q) ||
          r.equipmentSerial.toLowerCase().includes(q) ||
          r.assignedToUsername.toLowerCase().includes(q) ||
          r.description.toLowerCase().includes(q);
        if (!matches) return false;
      }
      return true;
    });
  }, [requests, statusFilter, search]);

  // ─── Stats ───
  const stats = useMemo(() => {
    if (!requests)
      return { total: 0, requested: 0, inProgress: 0, completed: 0 };
    return {
      total: requests.length,
      requested: requests.filter((r) => r.status === "REQUESTED").length,
      inProgress: requests.filter((r) => r.status === "IN_PROGRESS").length,
      completed: requests.filter((r) => r.status === "COMPLETED").length,
    };
  }, [requests]);

  async function handleAction(
    action: MaintenanceAction,
    request: MaintenanceRequest,
  ) {
    if (action === "cancel") {
      setCancelTarget(request);
      return;
    }
    setPendingAction({ id: request.id, action });
    try {
      if (action === "start") {
        await maintenanceApi.start(request.id);
        toast.success(`Maintenance #${request.id} started`);
      } else if (action === "complete") {
        toast.info("Only the assigned technician can complete maintenance.");
        return;
      }
      await refetch();
    } catch (err) {
      const apiErr = err as { message?: string };
      toast.error(apiErr?.message ?? `Failed to ${action} maintenance`);
    } finally {
      setPendingAction(null);
    }
  }

  async function handleCancel() {
    if (!cancelTarget) return;
    setPendingAction({ id: cancelTarget.id, action: "cancel" });
    try {
      await maintenanceApi.cancel(cancelTarget.id);
      toast.success(`Maintenance #${cancelTarget.id} cancelled`);
      setCancelTarget(null);
      await refetch();
    } catch (err) {
      const apiErr = err as { message?: string };
      toast.error(apiErr?.message ?? "Failed to cancel maintenance");
    } finally {
      setPendingAction(null);
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 md:p-6">
      <PageHeader
        title="Maintenance Requests"
        description="Raise, track, and manage equipment maintenance requests assigned to lab technicians."
        actions={
          <Button onClick={() => navigate("/manager/maintenance/new")}>
            <Plus className="mr-2 h-4 w-4" />
            New Request
          </Button>
        }
      />

      {/* ─── Stats ─── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <Wrench className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Requested</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
              {stats.requested}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-cyan-600 dark:text-cyan-400">
              {stats.inProgress}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {stats.completed}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ─── Filters ─── */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[200px] flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by equipment, serial, technician, or description…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
        <Select
          value={statusFilter}
          onValueChange={(v) =>
            setStatusFilter(v as MaintenanceRequestStatus | "ALL")
          }
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All statuses</SelectItem>
            {MAINTENANCE_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {maintenanceStatusConfig(s).label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* ─── List ─── */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Wrench}
          title="No maintenance requests"
          description={
            requests?.length === 0
              ? "Create your first maintenance request to assign work to a technician."
              : "No requests match your filters."
          }
          action={
            requests?.length === 0 ? (
              <Button onClick={() => navigate("/manager/maintenance/new")}>
                <Plus className="mr-2 h-4 w-4" />
                New Request
              </Button>
            ) : undefined
          }
        />
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden overflow-hidden rounded-md border md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">#</TableHead>
                  <TableHead>Equipment</TableHead>
                  <TableHead>Technician</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((r) => {
                  const statusCfg = maintenanceStatusConfig(r.status);
                  const priorityCfg = maintenancePriorityConfig(r.priority);
                  return (
                    <TableRow key={r.id}>
                      <TableCell className="font-mono">#{r.id}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{r.equipmentName}</p>
                          <p className="text-xs text-muted-foreground">
                            {r.equipmentSerial}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>{r.assignedToUsername}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={priorityCfg.chip}>
                          {priorityCfg.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={statusCfg.chip}>
                          <span
                            className={`mr-1.5 h-1.5 w-1.5 rounded-full ${statusCfg.dot}`}
                          />
                          {statusCfg.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(parseISO(r.createdAt), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {r.status === "REQUESTED" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleAction("cancel", r)}
                              disabled={pendingAction?.id === r.id && pendingAction?.action === "cancel"}
                            >
                              {pendingAction?.id === r.id && pendingAction?.action === "cancel" ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                "Cancel"
                              )}
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/equipment/${r.equipmentId}`)}
                          >
                            View Equipment
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* Mobile cards */}
          <div className="space-y-3 md:hidden">
            {filtered.map((r) => (
              <MaintenanceRequestCard
                key={r.id}
                request={r}
                currentUser={user}
                onAction={handleAction}
                onViewEquipment={(id) => navigate(`/equipment/${id}`)}
                pendingAction={
                  pendingAction?.id === r.id ? pendingAction.action : null
                }
              />
            ))}
          </div>
        </>
      )}

      {/* ─── Cancel confirm ─── */}
      <ConfirmDialog
        open={!!cancelTarget}
        onOpenChange={(open) => !open && setCancelTarget(null)}
        title={`Cancel maintenance #${cancelTarget?.id}?`}
        description="This will cancel the maintenance request and restore the equipment to its prior status. The assigned technician will be notified."
        confirmLabel="Cancel Request"
        destructive
        onConfirm={handleCancel}
      />
    </div>
  );
}
