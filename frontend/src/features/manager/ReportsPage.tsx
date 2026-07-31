import * as React from "react";
import {
  FileText,
  Download,
  FileSpreadsheet,
  File,
  Calendar,
  Filter,
  RefreshCw,
  Wrench,
  Activity,
} from "lucide-react";
import { toast } from "sonner";
import { format, parseISO, subDays, startOfDay, endOfDay } from "date-fns";

import { useAsync } from "@/hooks/use-async";
import { bookingApi, dashboardApi } from "@/lib/api/bookingApi";
import { equipmentApi } from "@/lib/api/equipmentApi";
import { maintenanceApi } from "@/lib/api/maintenanceApi";
import { toBackendDateTime } from "@/lib/constants";

import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { ListSkeleton } from "@/components/shared/Skeletons";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
import { Badge } from "@/components/ui/badge";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import type { Booking, Equipment, MaintenanceRequest, UtilizationReport, BookingAudit } from "@/types";

type ReportType = "bookings" | "equipment" | "utilization" | "maintenance" | "audit" | "calibration";

interface ReportData {
  bookings?: Booking[];
  equipment?: Equipment[];
  utilization?: UtilizationReport[];
  maintenance?: MaintenanceRequest[];
  audit?: BookingAudit[];
}

export default function ReportsPage() {
  const [reportType, setReportType] = React.useState<ReportType>("bookings");
  const [dateRange, setDateRange] = React.useState<"7" | "30" | "90" | "all">("30");
  const [exporting, setExporting] = React.useState<"pdf" | "excel" | null>(null);
  const [selectedEquipmentId, setSelectedEquipmentId] = React.useState<number | null>(null);

  // Helper functions for date conversion
  const toISOStart = (dateStr: string): string => {
    return toBackendDateTime(startOfDay(parseISO(dateStr)));
  };
  const toISOEnd = (dateStr: string): string => {
    return toBackendDateTime(endOfDay(parseISO(dateStr)));
  };
  const defaultStart = (): string => format(subDays(new Date(), 30), "yyyy-MM-dd");
  const defaultEnd = (): string => format(new Date(), "yyyy-MM-dd");
  const [startDate, setStartDate] = React.useState(defaultStart());
  const [endDate, setEndDate] = React.useState(defaultEnd());

  // Fetch equipment list for selector
  const equipmentAsync = useAsync<Equipment[]>(() => equipmentApi.getAllEquipment(), []);
  const equipment = equipmentAsync.data ?? [];

  // Fetch data based on report type
  const bookingsAsync = useAsync<Booking[]>(() => bookingApi.allBookings(), []);
  const maintenanceAsync = useAsync<MaintenanceRequest[]>(() => maintenanceApi.findAll(), []);
  
  // Fetch utilization data like the dashboard
  const utilizationAsync = useAsync<UtilizationReport[]>(async () => {
    if (equipment.length > 0) {
      const targetEquipment = selectedEquipmentId 
        ? equipment.filter(e => e.id === selectedEquipmentId)
        : equipment;
      const promises = targetEquipment.map((e) =>
        bookingApi
          .utilization({
            equipmentId: e.id,
            start: toISOStart(startDate),
            end: toISOEnd(endDate),
          })
          .catch(() => null)
      );
      const results = await Promise.all(promises);
      return results.filter((r): r is UtilizationReport => r !== null);
    }
    return [];
  }, [equipment, selectedEquipmentId, startDate, endDate]);

  // Fetch audit data for selected equipment
  const auditAsync = useAsync<BookingAudit[]>(async () => {
    if (selectedEquipmentId) {
      return bookingApi.equipmentAudit(selectedEquipmentId);
    }
    return [];
  }, [selectedEquipmentId]);

  const bookings = bookingsAsync.data ?? [];
  const maintenance = maintenanceAsync.data ?? [];
  const utilization = utilizationAsync.data ?? [];
  const audit = auditAsync.data ?? [];

  // Filter bookings by date range and equipment
  const filteredBookings = React.useMemo(() => {
    let filtered = bookings;
    
    if (dateRange !== "all") {
      const days = parseInt(dateRange, 10);
      const cutoff = subDays(new Date(), days);
      filtered = filtered.filter((b) => new Date(b.startTime) >= cutoff);
    }
    
    if (selectedEquipmentId) {
      filtered = filtered.filter((b) => b.equipmentId === selectedEquipmentId);
    }
    
    return filtered;
  }, [bookings, dateRange, selectedEquipmentId]);

  // Filter maintenance by equipment
  const filteredMaintenance = React.useMemo(() => {
    if (!selectedEquipmentId) return maintenance;
    return maintenance.filter((m) => m.equipmentId === selectedEquipmentId);
  }, [maintenance, selectedEquipmentId]);

  // Filter equipment by selection
  const filteredEquipment = React.useMemo(() => {
    if (!selectedEquipmentId) return equipment;
    return equipment.filter((e) => e.id === selectedEquipmentId);
  }, [equipment, selectedEquipmentId]);

  const loading = bookingsAsync.loading || equipmentAsync.loading || maintenanceAsync.loading || utilizationAsync.loading || auditAsync.loading;

  // Export to PDF with proper formatting
  const exportToPDF = () => {
    setExporting("pdf");
    try {
      const doc = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4"
      });
      
      // Title
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      const reportTitle = reportType.charAt(0).toUpperCase() + reportType.slice(1) + " Report";
      doc.text(reportTitle, 14, 15);
      
      // Date range and equipment info
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100);
      const dateText = dateRange === "all" ? "All time" : `Last ${dateRange} days`;
      const equipmentText = selectedEquipmentId 
        ? `Equipment: ${filteredEquipment[0]?.equipmentName || "Selected"}`
        : "All equipment";
      doc.text(`Generated: ${format(new Date(), "PPP")} | ${dateText} | ${equipmentText}`, 14, 22);
      
      let tableData: any[] = [];
      let columns: string[] = [];
      
      if (reportType === "bookings" && filteredBookings.length > 0) {
        columns = ["ID", "Equipment", "User", "Start Date", "Start Time", "End Date", "End Time", "Status"];
        tableData = filteredBookings.map((b) => [
          b.id,
          b.equipmentName || "—",
          b.username || "—",
          format(parseISO(b.startTime), "PPP"),
          format(parseISO(b.startTime), "HH:mm"),
          format(parseISO(b.endTime), "PPP"),
          format(parseISO(b.endTime), "HH:mm"),
          b.status
        ]);
      } else if (reportType === "equipment" && filteredEquipment.length > 0) {
        columns = ["ID", "Name", "Serial", "Category", "Status", "Added By", "Acquisition Date"];
        tableData = filteredEquipment.map((e) => [
          e.id,
          e.equipmentName,
          e.serial,
          e.category,
          e.status,
          e.addedByUsername || "—",
          format(parseISO(e.acquisitionDate), "PPP")
        ]);
      } else if (reportType === "utilization" && utilization.length > 0) {
        columns = ["Equipment ID", "Equipment Name", "Booked Hours", "Available Hours", "Utilization %"];
        tableData = utilization.map((u) => [
          u.equipmentId,
          u.equipmentName || "—",
          u.bookedHours.toFixed(2),
          u.availableHours.toFixed(2),
          u.utilizationPercentage.toFixed(1)
        ]);
      } else if (reportType === "maintenance" && filteredMaintenance.length > 0) {
        columns = ["ID", "Equipment", "Technician", "Status", "Priority", "Created", "Description"];
        tableData = filteredMaintenance.map((m) => [
          m.id,
          m.equipmentName || "—",
          m.assignedToUsername || "—",
          m.status,
          m.priority,
          format(parseISO(m.createdAt), "PPP"),
          m.description.substring(0, 50) + (m.description.length > 50 ? "..." : "")
        ]);
      } else if (reportType === "audit" && audit.length > 0) {
        columns = ["ID", "Booking ID", "Action", "Performed By", "Timestamp", "Notes"];
        tableData = audit.map((a) => [
          a.id,
          a.bookingId,
          a.action,
          a.performedByUsername,
          format(parseISO(a.createdAt), "PPP HH:mm"),
          a.notes?.substring(0, 50) || "—"
        ]);
      }
      
      if (tableData.length > 0) {
        autoTable(doc, {
          head: [columns],
          body: tableData,
          startY: 30,
          styles: {
            fontSize: 8,
            cellPadding: 2,
            overflow: "linebreak"
          },
          headStyles: {
            fillColor: [59, 130, 246],
            textColor: 255,
            fontStyle: "bold"
          },
          alternateRowStyles: {
            fillColor: [245, 245, 245]
          },
          margin: { top: 30, right: 10, bottom: 20, left: 10 },
          pageBreak: "auto"
        });
      }
      
      // Footer
      const pageCount = doc.getNumberOfPages();
      doc.setFontSize(8);
      doc.setTextColor(150);
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.text(
          `Page ${i} of ${pageCount} | Total records: ${tableData.length}`,
          10,
          doc.internal.pageSize.height - 10
        );
      }
      
      doc.save(`${reportType}-report-${format(new Date(), "yyyy-MM-dd")}.pdf`);
      toast.success("PDF exported successfully");
    } catch (error) {
      toast.error("Failed to export PDF");
      console.error(error);
    } finally {
      setExporting(null);
    }
  };

  // Export to Excel
  const exportToExcel = () => {
    setExporting("excel");
    try {
      let data: any[] = [];
      
      if (reportType === "bookings") {
        data = filteredBookings.map((b) => ({
          ID: b.id,
          Equipment: b.equipmentName || "—",
          User: b.username || "—",
          "Start Date": format(parseISO(b.startTime), "PPP"),
          "Start Time": format(parseISO(b.startTime), "HH:mm"),
          "End Date": format(parseISO(b.endTime), "PPP"),
          "End Time": format(parseISO(b.endTime), "HH:mm"),
          Status: b.status,
        }));
      } else if (reportType === "equipment") {
        data = filteredEquipment.map((e) => ({
          ID: e.id,
          Name: e.equipmentName,
          Serial: e.serial,
          Category: e.category,
          Status: e.status,
          "Added By": e.addedByUsername || "—",
          "Acquisition Date": format(parseISO(e.acquisitionDate), "PPP"),
        }));
      } else if (reportType === "utilization") {
        data = utilization.map((u) => ({
          "Equipment ID": u.equipmentId,
          "Equipment Name": u.equipmentName || "—",
          "Booked Hours": u.bookedHours.toFixed(2),
          "Available Hours": u.availableHours.toFixed(2),
          "Utilization %": u.utilizationPercentage.toFixed(1),
        }));
      } else if (reportType === "maintenance") {
        data = filteredMaintenance.map((m) => ({
          ID: m.id,
          Equipment: m.equipmentName || "—",
          Technician: m.assignedToUsername || "—",
          Status: m.status,
          Priority: m.priority,
          Created: format(parseISO(m.createdAt), "PPP"),
          Description: m.description,
        }));
      } else if (reportType === "audit") {
        data = audit.map((a) => ({
          ID: a.id,
          "Booking ID": a.bookingId,
          Action: a.action,
          "Performed By": a.performedByUsername,
          Timestamp: format(parseISO(a.createdAt), "PPP HH:mm"),
          Notes: a.notes || "—",
        }));
      } else if (reportType === "calibration") {
        // Fetch calibration data for selected equipment
        if (selectedEquipmentId) {
          equipmentApi.listCalibrations(selectedEquipmentId).then((calibrations) => {
            const calData = calibrations.map((c) => ({
              ID: c.id,
              "Record Type": c.recordType,
              "Performed Date": format(parseISO(c.performedDate), "PPP"),
              "Next Due Date": c.nextDueDate ? format(parseISO(c.nextDueDate), "PPP") : "—",
              "Performed By": c.performedBy || "—",
              Result: c.result || "—",
              "Certificate Ref": c.certificateRef || "—",
              Notes: c.notes || "—",
            }));
            const ws = XLSX.utils.json_to_sheet(calData);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Calibration Report");
            XLSX.writeFile(wb, `calibration-report-${format(new Date(), "yyyy-MM-dd")}.xlsx`);
            toast.success("Excel exported successfully");
            setExporting(null);
          }).catch((error) => {
            toast.error("Failed to export Excel");
            console.error(error);
            setExporting(null);
          });
          return;
        } else {
          toast.error("Please select an equipment for calibration report");
          setExporting(null);
          return;
        }
      }
      
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Report");
      
      XLSX.writeFile(wb, `${reportType}-report-${format(new Date(), "yyyy-MM-dd")}.xlsx`);
      toast.success("Excel exported successfully");
    } catch (error) {
      toast.error("Failed to export Excel");
      console.error(error);
    } finally {
      setExporting(null);
    }
  };

  const refetch = () => {
    bookingsAsync.refetch();
    equipmentAsync.refetch();
    maintenanceAsync.refetch();
    utilizationAsync.refetch();
    auditAsync.refetch();
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Reports"
        description="Generate and export reports for bookings, equipment, and utilization data."
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={refetch}
              disabled={loading}
            >
              <RefreshCw className={`mr-2 size-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        }
      />

      {/* Filters */}
      <Card className="border-border/60 p-4 shadow-soft">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="size-4 text-muted-foreground" />
            <span className="text-sm font-medium">Filters:</span>
          </div>
          
          <div className="flex items-center gap-2">
            <label className="text-sm text-muted-foreground">Report Type:</label>
            <Select value={reportType} onValueChange={(v: ReportType) => setReportType(v)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bookings">Bookings</SelectItem>
                <SelectItem value="equipment">Equipment</SelectItem>
                <SelectItem value="utilization">Utilization</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
                <SelectItem value="audit">Audit Trail</SelectItem>
                <SelectItem value="calibration">Calibration</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center gap-2">
            <label className="text-sm text-muted-foreground">Equipment:</label>
            <Select
              value={String(selectedEquipmentId ?? "")}
              onValueChange={(v) => setSelectedEquipmentId(v === "" ? null : Number(v))}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="All equipment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All equipment</SelectItem>
                {equipment.map((e) => (
                  <SelectItem key={e.id} value={String(e.id)}>
                    {e.equipmentName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center gap-2">
            <label className="text-sm text-muted-foreground">Date Range:</label>
            <Select value={dateRange} onValueChange={(v: "7" | "30" | "90" | "all") => setDateRange(v)}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 90 days</SelectItem>
                <SelectItem value="all">All time</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="ml-auto flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={exportToPDF}
              disabled={exporting !== null || (reportType === "bookings" && filteredBookings.length === 0) || (reportType === "equipment" && filteredEquipment.length === 0) || (reportType === "utilization" && utilization.length === 0) || (reportType === "maintenance" && filteredMaintenance.length === 0) || (reportType === "audit" && audit.length === 0)}
            >
              <File className="mr-2 size-4" />
              {exporting === "pdf" ? "Exporting..." : "Export PDF"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={exportToExcel}
              disabled={exporting !== null || (reportType === "bookings" && filteredBookings.length === 0) || (reportType === "equipment" && filteredEquipment.length === 0) || (reportType === "utilization" && utilization.length === 0) || (reportType === "maintenance" && filteredMaintenance.length === 0) || (reportType === "audit" && audit.length === 0)}
            >
              <FileSpreadsheet className="mr-2 size-4" />
              {exporting === "excel" ? "Exporting..." : "Export Excel"}
            </Button>
          </div>
        </div>
      </Card>

      {/* Report Content */}
      {loading ? (
        <ListSkeleton />
      ) : reportType === "bookings" ? (
        filteredBookings.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No booking data"
            description="No bookings found for the selected filters."
          />
        ) : (
          <Card className="border-border/60 shadow-soft">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Equipment</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Start Date</TableHead>
                    <TableHead>Start Time</TableHead>
                    <TableHead>End Date</TableHead>
                    <TableHead>End Time</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBookings.map((b) => (
                    <TableRow key={b.id}>
                      <TableCell className="font-medium">{b.id}</TableCell>
                      <TableCell>{b.equipmentName || "—"}</TableCell>
                      <TableCell>{b.username || "—"}</TableCell>
                      <TableCell>{format(parseISO(b.startTime), "PPP")}</TableCell>
                      <TableCell>{format(parseISO(b.startTime), "HH:mm")}</TableCell>
                      <TableCell>{format(parseISO(b.endTime), "PPP")}</TableCell>
                      <TableCell>{format(parseISO(b.endTime), "HH:mm")}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{b.status}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="border-t border-border/60 p-4 text-sm text-muted-foreground">
              Showing {filteredBookings.length} booking(s)
            </div>
          </Card>
        )
      ) : reportType === "equipment" ? (
        filteredEquipment.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No equipment data"
            description="No equipment found for the selected filters."
          />
        ) : (
          <Card className="border-border/60 shadow-soft">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Serial</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Added By</TableHead>
                    <TableHead>Acquisition Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEquipment.map((e) => (
                    <TableRow key={e.id}>
                      <TableCell className="font-medium">{e.id}</TableCell>
                      <TableCell>{e.equipmentName}</TableCell>
                      <TableCell>{e.serial}</TableCell>
                      <TableCell>{e.category}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{e.status}</Badge>
                      </TableCell>
                      <TableCell>{e.addedByUsername || "—"}</TableCell>
                      <TableCell>{format(parseISO(e.acquisitionDate), "PPP")}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="border-t border-border/60 p-4 text-sm text-muted-foreground">
              Showing {filteredEquipment.length} equipment item(s)
            </div>
          </Card>
        )
      ) : reportType === "utilization" ? (
        utilization.length === 0 ? (
          <EmptyState
            icon={Activity}
            title="No utilization data"
            description="No utilization data found for the selected date range and equipment."
          />
        ) : (
          <Card className="border-border/60 shadow-soft">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Equipment</TableHead>
                    <TableHead>Booked Hours</TableHead>
                    <TableHead>Available Hours</TableHead>
                    <TableHead>Utilization %</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {utilization.map((u, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-medium">{u.equipmentName || "—"}</TableCell>
                      <TableCell>{u.bookedHours.toFixed(2)}</TableCell>
                      <TableCell>{u.availableHours.toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge variant={u.utilizationPercentage >= 80 ? "default" : u.utilizationPercentage >= 50 ? "secondary" : "outline"}>
                          {u.utilizationPercentage.toFixed(1)}%
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="border-t border-border/60 p-4 text-sm text-muted-foreground">
              Showing {utilization.length} equipment utilization record(s)
            </div>
          </Card>
        )
      ) : reportType === "maintenance" ? (
        filteredMaintenance.length === 0 ? (
          <EmptyState
            icon={Wrench}
            title="No maintenance data"
            description="No maintenance records found for the selected equipment."
          />
        ) : (
          <Card className="border-border/60 shadow-soft">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Equipment</TableHead>
                    <TableHead>Technician</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Description</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMaintenance.map((m) => (
                    <TableRow key={m.id}>
                      <TableCell className="font-medium">{m.id}</TableCell>
                      <TableCell>{m.equipmentName || "—"}</TableCell>
                      <TableCell>{m.assignedToUsername || "—"}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{m.status}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={m.priority === "HIGH" || m.priority === "CRITICAL" ? "destructive" : "secondary"}>
                          {m.priority}
                        </Badge>
                      </TableCell>
                      <TableCell>{format(parseISO(m.createdAt), "PPP")}</TableCell>
                      <TableCell className="max-w-xs truncate">{m.description}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="border-t border-border/60 p-4 text-sm text-muted-foreground">
              Showing {filteredMaintenance.length} maintenance record(s)
            </div>
          </Card>
        )
      ) : reportType === "audit" ? (
        audit.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No audit data"
            description="Please select an equipment to view its audit trail."
          />
        ) : (
          <Card className="border-border/60 shadow-soft">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Booking ID</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Performed By</TableHead>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {audit.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell className="font-medium">{a.id}</TableCell>
                      <TableCell>{a.bookingId}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{a.action}</Badge>
                      </TableCell>
                      <TableCell>{a.performedByUsername}</TableCell>
                      <TableCell>{format(parseISO(a.createdAt), "PPP HH:mm")}</TableCell>
                      <TableCell className="max-w-xs truncate">{a.notes || "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="border-t border-border/60 p-4 text-sm text-muted-foreground">
              Showing {audit.length} audit record(s)
            </div>
          </Card>
        )
      ) : reportType === "calibration" ? (
        !selectedEquipmentId ? (
          <EmptyState
            icon={FileText}
            title="Select Equipment"
            description="Please select an equipment to view its calibration records."
          />
        ) : (
          <EmptyState
            icon={FileText}
            title="Calibration Report"
            description="Use the Export buttons to download calibration records for the selected equipment."
          />
        )
      ) : null}
    </div>
  );
}
