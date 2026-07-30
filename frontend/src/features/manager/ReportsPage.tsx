import * as React from "react";
import {
  FileText,
  Download,
  FileSpreadsheet,
  File,
  Calendar,
  Filter,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { format, parseISO, subDays, startOfDay, endOfDay } from "date-fns";

import { useAsync } from "@/hooks/use-async";
import { bookingApi } from "@/lib/api/bookingApi";
import { equipmentApi } from "@/lib/api/equipmentApi";

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
import * as XLSX from "xlsx";
import type { Booking, Equipment } from "@/types";

type ReportType = "bookings" | "equipment" | "utilization";

interface ReportData {
  bookings?: Booking[];
  equipment?: Equipment[];
}

export default function ReportsPage() {
  const [reportType, setReportType] = React.useState<ReportType>("bookings");
  const [dateRange, setDateRange] = React.useState<"7" | "30" | "90" | "all">("30");
  const [exporting, setExporting] = React.useState<"pdf" | "excel" | null>(null);

  // Fetch data based on report type
  const bookingsAsync = useAsync<Booking[]>(() => bookingApi.allBookings(), []);
  const equipmentAsync = useAsync<Equipment[]>(() => equipmentApi.getAllEquipment(), []);

  const bookings = bookingsAsync.data ?? [];
  const equipment = equipmentAsync.data ?? [];

  // Filter bookings by date range
  const filteredBookings = React.useMemo(() => {
    if (dateRange === "all") return bookings;
    
    const days = parseInt(dateRange, 10);
    const cutoff = subDays(new Date(), days);
    
    return bookings.filter((b) => new Date(b.startTime) >= cutoff);
  }, [bookings, dateRange]);

  const loading = bookingsAsync.loading || equipmentAsync.loading;

  // Export to PDF
  const exportToPDF = () => {
    setExporting("pdf");
    try {
      const doc = new jsPDF();
      
      // Title
      doc.setFontSize(18);
      doc.text(
        `${reportType === "bookings" ? "Booking" : "Equipment"} Report`,
        14,
        20
      );
      
      // Date range
      doc.setFontSize(10);
      doc.setTextColor(100);
      const dateText =
        dateRange === "all"
          ? "All time"
          : `Last ${dateRange} days`;
      doc.text(`Generated: ${format(new Date(), "PPP")} | ${dateText}`, 14, 30);
      
      // Table headers
      doc.setFontSize(10);
      doc.setTextColor(0);
      let y = 45;
      
      if (reportType === "bookings" && filteredBookings.length > 0) {
        doc.text("ID", 14, y);
        doc.text("Equipment", 30, y);
        doc.text("User", 90, y);
        doc.text("Start", 140, y);
        doc.text("End", 175, y);
        doc.text("Status", 210, y);
        y += 8;
        
        // Table rows
        filteredBookings.slice(0, 30).forEach((b) => {
          if (y > 270) {
            doc.addPage();
            y = 20;
          }
          doc.text(String(b.id), 14, y);
          doc.text((b.equipment?.equipmentName || "—").substring(0, 20), 30, y);
          doc.text((b.user?.username || "—").substring(0, 15), 90, y);
          doc.text(format(parseISO(b.startTime), "MMM dd"), 140, y);
          doc.text(format(parseISO(b.endTime), "MMM dd"), 175, y);
          doc.text(b.status, 210, y);
          y += 7;
        });
      } else if (reportType === "equipment" && equipment.length > 0) {
        doc.text("ID", 14, y);
        doc.text("Name", 30, y);
        doc.text("Serial", 90, y);
        doc.text("Category", 140, y);
        doc.text("Status", 175, y);
        y += 8;
        
        equipment.slice(0, 30).forEach((e) => {
          if (y > 270) {
            doc.addPage();
            y = 20;
          }
          doc.text(String(e.id), 14, y);
          doc.text(e.equipmentName.substring(0, 20), 30, y);
          doc.text(e.serial.substring(0, 15), 90, y);
          doc.text(e.category.substring(0, 15), 140, y);
          doc.text(e.status, 175, y);
          y += 7;
        });
      }
      
      // Footer
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(
        `Total records: ${reportType === "bookings" ? filteredBookings.length : equipment.length}`,
        14,
        285
      );
      
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
          Equipment: b.equipment?.equipmentName || "—",
          User: b.user?.username || "—",
          "Start Date": format(parseISO(b.startTime), "PPP"),
          "Start Time": format(parseISO(b.startTime), "HH:mm"),
          "End Date": format(parseISO(b.endTime), "PPP"),
          "End Time": format(parseISO(b.endTime), "HH:mm"),
          Status: b.status,
        }));
      } else {
        data = equipment.map((e) => ({
          ID: e.id,
          Name: e.equipmentName,
          Serial: e.serial,
          Category: e.category,
          Status: e.status,
          "Added By": e.addedBy,
          "Acquisition Date": format(parseISO(e.acquisitionDate), "PPP"),
        }));
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
              disabled={exporting !== null || (reportType === "bookings" && filteredBookings.length === 0) || (reportType === "equipment" && equipment.length === 0)}
            >
              <File className="mr-2 size-4" />
              {exporting === "pdf" ? "Exporting..." : "Export PDF"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={exportToExcel}
              disabled={exporting !== null || (reportType === "bookings" && filteredBookings.length === 0) || (reportType === "equipment" && equipment.length === 0)}
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
            description="No bookings found for the selected date range."
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
                      <TableCell>{b.equipment?.equipmentName || "—"}</TableCell>
                      <TableCell>{b.user?.username || "—"}</TableCell>
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
        equipment.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No equipment data"
            description="No equipment found."
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
                  {equipment.map((e) => (
                    <TableRow key={e.id}>
                      <TableCell className="font-medium">{e.id}</TableCell>
                      <TableCell>{e.equipmentName}</TableCell>
                      <TableCell>{e.serial}</TableCell>
                      <TableCell>{e.category}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{e.status}</Badge>
                      </TableCell>
                      <TableCell>{e.addedBy}</TableCell>
                      <TableCell>{format(parseISO(e.acquisitionDate), "PPP")}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="border-t border-border/60 p-4 text-sm text-muted-foreground">
              Showing {equipment.length} equipment item(s)
            </div>
          </Card>
        )
      ) : (
        <EmptyState
          icon={FileText}
          title="Utilization Report"
          description="Utilization reports coming soon."
        />
      )}
    </div>
  );
}
