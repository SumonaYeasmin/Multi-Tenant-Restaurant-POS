import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { format, formatDistanceToNow } from "date-fns";
import {
  History,
  Search,
  Shield,
  Filter,
  RefreshCw,
  PlusCircle,
  Download,
  AlertTriangle,
  Activity,
  Layers,
  Calendar,
  Eye,
  CheckCircle2,
  Lock,
  Globe,
  Terminal,
  X,
  FileText,
  User,
  Radio,
} from "lucide-react";
import { toast } from "sonner";
import { RequirePermission } from "@/features/tenant/require-permission";
import { useTenant } from "@/features/tenant/tenant-context";
import {
  useAuditLogsQuery,
  useAuditLogStatsQuery,
  useRecordAuditLogMutation,
} from "@/features/stage4/api";
import { PageHeader, EmptyState, SkeletonCard } from "@/components/common/states";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import type { AuditLog } from "@/types/domain";

export const Route = createFileRoute("/app/$tenantSlug/audit-logs")({
  head: () => ({
    meta: [
      { title: "Audit Logs & Security Trail — Tablewise POS" },
      { name: "description", content: "Comprehensive immutable security and operational event logs." },
    ],
  }),
  component: () => (
    <RequirePermission perm="audit.view">
      <AuditLogsPage />
    </RequirePermission>
  ),
});

const ACTION_COLORS: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  create: "default",
  update: "secondary",
  delete: "destructive",
  void: "destructive",
  refund: "destructive",
  stock_adjust: "outline",
  status_change: "secondary",
  payment: "default",
};

const ENTITY_ICONS: Record<string, string> = {
  order: "📦",
  payment: "💳",
  inventory: "📊",
  table: "🍽️",
  menu: "📋",
  staff: "👥",
  settings: "⚙️",
  branch: "🏢",
};

function AuditLogsPage() {
  const { tenant, user, role, branches } = useTenant();

  // Filters state
  const [entityFilter, setEntityFilter] = useState("all");
  const [actionFilter, setActionFilter] = useState("all");
  const [branchFilter, setBranchFilter] = useState("all");
  const [dateRange, setDateRange] = useState("all");
  const [search, setSearch] = useState("");

  // Inspect Modal State
  const [inspectLog, setInspectLog] = useState<AuditLog | null>(null);

  // Manual Audit Log Entry Modal State
  const [createOpen, setCreateOpen] = useState(false);
  const [recordLogMutation, { isLoading: isRecording }] = useRecordAuditLogMutation();
  const [newLog, setNewLog] = useState({
    action: "update",
    entity: "settings",
    entityId: "",
    summary: "",
    details: "",
    branchId: "all",
  });

  // Calculate start date ISO for backend query
  const startDate = useMemo(() => {
    if (dateRange === "today") {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      return d.toISOString();
    }
    if (dateRange === "7d") {
      const d = new Date();
      d.setDate(d.getDate() - 7);
      return d.toISOString();
    }
    if (dateRange === "30d") {
      const d = new Date();
      d.setDate(d.getDate() - 30);
      return d.toISOString();
    }
    return undefined;
  }, [dateRange]);

  // Live Query from Backend with polling
  const {
    data: logs = [],
    isLoading,
    isFetching,
    refetch,
  } = useAuditLogsQuery(
    {
      tenantId: tenant.id,
      entity: entityFilter === "all" ? undefined : entityFilter,
      action: actionFilter === "all" ? undefined : actionFilter,
      branchId: branchFilter === "all" ? undefined : branchFilter,
      search: search.trim() ? search.trim() : undefined,
      startDate,
    },
    {
      pollingInterval: 15000,
      refetchOnFocus: true,
    },
  );

  // Backend Audit Stats Query
  const { data: stats } = useAuditLogStatsQuery(tenant.id, {
    pollingInterval: 30000,
  });

  // Client-side quick search over details or actor
  const filteredLogs = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return logs;
    return logs.filter(
      (l) =>
        l.summary.toLowerCase().includes(q) ||
        l.actorName.toLowerCase().includes(q) ||
        (l.details && l.details.toLowerCase().includes(q)) ||
        (l.entityId && l.entityId.toLowerCase().includes(q)) ||
        (l.ipAddress && l.ipAddress.toLowerCase().includes(q)),
    );
  }, [logs, search]);

  // Export to CSV
  const handleExportCSV = () => {
    if (!filteredLogs.length) {
      toast.error("No audit logs to export");
      return;
    }
    const headers = [
      "Timestamp",
      "Actor Name",
      "Actor Role",
      "Action",
      "Entity",
      "Entity ID",
      "Summary",
      "Details",
      "IP Address",
    ];
    const rows = filteredLogs.map((log) => [
      `"${new Date(log.createdAt).toISOString()}"`,
      `"${log.actorName || ""}"`,
      `"${log.actorRole || ""}"`,
      `"${log.action || ""}"`,
      `"${log.entity || ""}"`,
      `"${log.entityId || ""}"`,
      `"${(log.summary || "").replace(/"/g, '""')}"`,
      `"${(log.details || "").replace(/"/g, '""')}"`,
      `"${log.ipAddress || ""}"`,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `audit-trail-${tenant.slug}-${format(new Date(), "yyyy-MM-dd")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Audit log trail exported to CSV");
  };

  // Submit manual audit note
  const handleCreateAuditLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLog.summary.trim()) {
      toast.error("Summary is required");
      return;
    }

    try {
      await recordLogMutation({
        tenantId: tenant.id,
        actorId: user.id,
        actorName: user.name || "Administrator",
        actorRole: user.role || role || "OWNER",
        action: newLog.action,
        entity: newLog.entity,
        entityId: newLog.entityId.trim() || undefined,
        summary: newLog.summary.trim(),
        details: newLog.details.trim() || undefined,
        branchId: newLog.branchId === "all" ? undefined : newLog.branchId,
      }).unwrap();

      toast.success("Audit entry recorded to immutable audit trail");
      setCreateOpen(false);
      setNewLog({
        action: "update",
        entity: "settings",
        entityId: "",
        summary: "",
        details: "",
        branchId: "all",
      });
      refetch();
    } catch (err: any) {
      toast.error(err?.message || "Failed to record audit log");
    }
  };

  const hasActiveFilters =
    entityFilter !== "all" ||
    actionFilter !== "all" ||
    branchFilter !== "all" ||
    dateRange !== "all" ||
    search.trim() !== "";

  const resetFilters = () => {
    setEntityFilter("all");
    setActionFilter("all");
    setBranchFilter("all");
    setDateRange("all");
    setSearch("");
  };

  return (
    <div className="space-y-6 p-6">
      {/* Top Header with live status & action buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight">Audit Logs & Security Trail</h1>
            <Badge variant="outline" className="gap-1.5 py-0.5 px-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-xs">
              <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live Backend API
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Tamper-evident operational audit trail tracking order voids, inventory changes, role updates, and system events.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            className="gap-2"
          >
            <RefreshCw className={`size-3.5 ${isFetching ? "animate-spin" : ""}`} />
            Refresh
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            disabled={filteredLogs.length === 0}
            className="gap-2"
          >
            <Download className="size-3.5" />
            Export CSV
          </Button>

          <Button
            size="sm"
            onClick={() => setCreateOpen(true)}
            className="gap-2 shadow-sm"
          >
            <PlusCircle className="size-3.5" />
            Record Audit Note
          </Button>
        </div>
      </div>

      {/* Analytics & Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Total Trail Events
            </CardTitle>
            <History className="size-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total ?? logs.length}</div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <CheckCircle2 className="size-3 text-emerald-500" />
              Immutable database records
            </p>
          </CardContent>
        </Card>

        <Card className="border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Logged Today
            </CardTitle>
            <Calendar className="size-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.today ?? 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Actions since 00:00:00 today
            </p>
          </CardContent>
        </Card>

        <Card className="border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Sensitive Actions
            </CardTitle>
            <AlertTriangle className="size-4 text-rose-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-rose-600 dark:text-rose-400">
              {stats?.criticalCount ?? 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Order voids, refunds & deletions
            </p>
          </CardContent>
        </Card>

        <Card className="border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Active Filters Match
            </CardTitle>
            <Layers className="size-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredLogs.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {hasActiveFilters ? "Filtered results currently viewed" : "All records currently displayed"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <Card className="border shadow-sm">
        <CardContent className="p-4 space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[260px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Search audit trail by summary, details, actor, or ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>

            {/* Entity Filter */}
            <div className="w-[160px]">
              <Select value={entityFilter} onValueChange={setEntityFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Entities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Entities</SelectItem>
                  <SelectItem value="order">📦 Orders</SelectItem>
                  <SelectItem value="payment">💳 Payments & Refunds</SelectItem>
                  <SelectItem value="inventory">📊 Inventory & Stock</SelectItem>
                  <SelectItem value="table">🍽️ Dining Tables</SelectItem>
                  <SelectItem value="menu">📋 Menu & Recipes</SelectItem>
                  <SelectItem value="staff">👥 Staff & Roles</SelectItem>
                  <SelectItem value="settings">⚙️ Settings & Branding</SelectItem>
                  <SelectItem value="branch">🏢 Branches</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Action Filter */}
            <div className="w-[150px]">
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Actions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  <SelectItem value="create">Create</SelectItem>
                  <SelectItem value="update">Update</SelectItem>
                  <SelectItem value="delete">Delete</SelectItem>
                  <SelectItem value="void">Void</SelectItem>
                  <SelectItem value="refund">Refund</SelectItem>
                  <SelectItem value="stock_adjust">Stock Adjust</SelectItem>
                  <SelectItem value="payment">Payment</SelectItem>
                  <SelectItem value="status_change">Status Change</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Branch Filter if multi-branch */}
            {branches && branches.length > 0 && (
              <div className="w-[160px]">
                <Select value={branchFilter} onValueChange={setBranchFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Branches" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Branches</SelectItem>
                    {branches.map((b) => (
                      <SelectItem key={b.id} value={b.id}>
                        {b.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Date Range Filter */}
            <div className="w-[140px]">
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger>
                  <SelectValue placeholder="Date Range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="7d">Last 7 Days</SelectItem>
                  <SelectItem value="30d">Last 30 Days</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Reset Filter Button */}
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={resetFilters}
                className="gap-1.5 text-xs text-muted-foreground hover:text-foreground h-9"
              >
                <X className="size-3.5" />
                Reset Filters
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Main Audit Trail List */}
      {isLoading ? (
        <div className="space-y-3">
          {[0, 1, 2, 3, 4].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : filteredLogs.length === 0 ? (
        <EmptyState
          icon={<History className="size-9 text-muted-foreground" />}
          title="No audit events found"
          description={
            hasActiveFilters
              ? "No events match your current filter and search criteria. Try adjusting or resetting filters."
              : "Security and operational activities will appear here in real time as actions occur."
          }
          action={
            hasActiveFilters ? (
              <Button variant="outline" size="sm" onClick={resetFilters}>
                Reset All Filters
              </Button>
            ) : undefined
          }
        />
      ) : (
        <Card className="border shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead className="w-[170px]">Timestamp</TableHead>
                  <TableHead className="w-[170px]">Actor</TableHead>
                  <TableHead className="w-[120px]">Action</TableHead>
                  <TableHead className="w-[130px]">Target Entity</TableHead>
                  <TableHead>Summary & Context</TableHead>
                  <TableHead className="w-[130px] hidden md:table-cell">Client Info</TableHead>
                  <TableHead className="w-[80px] text-right">Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.map((log) => {
                  const dateObj = new Date(log.createdAt);
                  return (
                    <TableRow
                      key={log.id}
                      className="hover:bg-muted/30 transition-colors cursor-pointer"
                      onClick={() => setInspectLog(log)}
                    >
                      {/* Timestamp */}
                      <TableCell className="whitespace-nowrap">
                        <div className="font-mono text-xs font-medium">
                          {format(dateObj, "dd MMM yyyy")}
                        </div>
                        <div className="text-[11px] text-muted-foreground font-mono">
                          {format(dateObj, "HH:mm:ss")} ({formatDistanceToNow(dateObj, { addSuffix: true })})
                        </div>
                      </TableCell>

                      {/* Actor */}
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="size-6 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-semibold">
                            {log.actorName ? log.actorName.charAt(0).toUpperCase() : "S"}
                          </div>
                          <div>
                            <p className="text-xs font-semibold leading-none">{log.actorName}</p>
                            {log.actorRole && (
                              <span className="text-[10px] text-muted-foreground uppercase font-mono tracking-tight">
                                {log.actorRole}
                              </span>
                            )}
                          </div>
                        </div>
                      </TableCell>

                      {/* Action */}
                      <TableCell>
                        <Badge
                          variant={ACTION_COLORS[log.action] ?? "outline"}
                          className="capitalize font-mono text-[11px] tracking-wide"
                        >
                          {log.action.replace("_", " ")}
                        </Badge>
                      </TableCell>

                      {/* Target Entity */}
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs">{ENTITY_ICONS[log.entity] || "📌"}</span>
                          <span className="capitalize text-xs font-medium">{log.entity}</span>
                        </div>
                        {log.entityId && (
                          <div className="font-mono text-[10px] text-muted-foreground truncate max-w-[110px]">
                            {log.entityId}
                          </div>
                        )}
                      </TableCell>

                      {/* Summary & Details */}
                      <TableCell>
                        <p className="text-sm font-medium text-foreground">{log.summary}</p>
                        {log.details && (
                          <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                            {log.details}
                          </p>
                        )}
                      </TableCell>

                      {/* Client Info */}
                      <TableCell className="hidden md:table-cell text-xs text-muted-foreground font-mono">
                        {log.ipAddress ? (
                          <div className="flex items-center gap-1">
                            <Globe className="size-3 opacity-60" />
                            <span>{log.ipAddress}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground/50">—</span>
                        )}
                      </TableCell>

                      {/* Inspect Button */}
                      <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-7"
                          onClick={() => setInspectLog(log)}
                        >
                          <Eye className="size-3.5 text-muted-foreground hover:text-foreground" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      {/* Inspect Detail Dialog */}
      <Dialog open={!!inspectLog} onOpenChange={(open) => !open && setInspectLog(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          {inspectLog && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-2">
                  <Badge variant={ACTION_COLORS[inspectLog.action] ?? "outline"} className="capitalize font-mono">
                    {inspectLog.action.replace("_", " ")}
                  </Badge>
                  <DialogTitle className="text-lg">Audit Event Details</DialogTitle>
                </div>
                <DialogDescription>
                  Immutable security record stored in Tablewise backend audit engine.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-2 text-sm">
                {/* Event Summary */}
                <div className="p-3 rounded-lg bg-muted/50 border">
                  <p className="font-medium text-foreground">{inspectLog.summary}</p>
                  {inspectLog.details && (
                    <p className="text-xs text-muted-foreground mt-1.5 whitespace-pre-wrap">
                      {inspectLog.details}
                    </p>
                  )}
                </div>

                {/* Metadata Grid */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-2.5 rounded border bg-card space-y-1">
                    <span className="text-muted-foreground flex items-center gap-1.5 font-medium">
                      <User className="size-3.5" /> Actor
                    </span>
                    <p className="font-semibold text-foreground">{inspectLog.actorName}</p>
                    <p className="text-muted-foreground font-mono text-[11px]">
                      Role: {inspectLog.actorRole || "N/A"}
                    </p>
                    {inspectLog.actorId && (
                      <p className="text-muted-foreground font-mono text-[10px] truncate">
                        ID: {inspectLog.actorId}
                      </p>
                    )}
                  </div>

                  <div className="p-2.5 rounded border bg-card space-y-1">
                    <span className="text-muted-foreground flex items-center gap-1.5 font-medium">
                      <Layers className="size-3.5" /> Target Entity
                    </span>
                    <p className="font-semibold text-foreground capitalize flex items-center gap-1">
                      <span>{ENTITY_ICONS[inspectLog.entity] || "📌"}</span>
                      {inspectLog.entity}
                    </p>
                    {inspectLog.entityId && (
                      <p className="text-muted-foreground font-mono text-[11px] truncate">
                        ID: {inspectLog.entityId}
                      </p>
                    )}
                  </div>

                  <div className="p-2.5 rounded border bg-card space-y-1">
                    <span className="text-muted-foreground flex items-center gap-1.5 font-medium">
                      <Calendar className="size-3.5" /> Timestamp
                    </span>
                    <p className="font-semibold text-foreground">
                      {format(new Date(inspectLog.createdAt), "dd MMM yyyy, HH:mm:ss")}
                    </p>
                    <p className="text-muted-foreground font-mono text-[10px]">
                      {new Date(inspectLog.createdAt).toISOString()}
                    </p>
                  </div>

                  <div className="p-2.5 rounded border bg-card space-y-1">
                    <span className="text-muted-foreground flex items-center gap-1.5 font-medium">
                      <Globe className="size-3.5" /> Client Network
                    </span>
                    <p className="font-semibold text-foreground font-mono">
                      IP: {inspectLog.ipAddress || "Internal Server"}
                    </p>
                    <p className="text-muted-foreground font-mono text-[10px] truncate">
                      UA: {inspectLog.userAgent || "Direct API"}
                    </p>
                  </div>
                </div>

                {/* Audit Record ID */}
                <div className="flex items-center justify-between text-xs p-2 rounded bg-muted/40 font-mono text-muted-foreground">
                  <span>Record UUID:</span>
                  <span className="font-semibold select-all">{inspectLog.id}</span>
                </div>

                {/* Metadata JSON Box */}
                {inspectLog.metadata && Object.keys(inspectLog.metadata).length > 0 && (
                  <div className="space-y-1.5">
                    <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                      <Terminal className="size-3.5" /> Event Payload Metadata
                    </span>
                    <pre className="p-3 rounded-lg bg-zinc-950 text-emerald-400 font-mono text-xs overflow-x-auto max-h-48 border border-zinc-800">
                      {JSON.stringify(inspectLog.metadata, null, 2)}
                    </pre>
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button variant="outline" size="sm" onClick={() => setInspectLog(null)}>
                  Close
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Record Manual Audit Entry Modal */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PlusCircle className="size-5 text-primary" />
              Record Manual Audit Entry
            </DialogTitle>
            <DialogDescription>
              Record an operational note, manager override, or security inspection in the audit trail.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateAuditLog} className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">Action Type</label>
                <Select
                  value={newLog.action}
                  onValueChange={(val) => setNewLog({ ...newLog, action: val })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="update">Update</SelectItem>
                    <SelectItem value="create">Create</SelectItem>
                    <SelectItem value="delete">Delete</SelectItem>
                    <SelectItem value="void">Void</SelectItem>
                    <SelectItem value="refund">Refund</SelectItem>
                    <SelectItem value="stock_adjust">Stock Adjust</SelectItem>
                    <SelectItem value="status_change">Status Change</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">Entity</label>
                <Select
                  value={newLog.entity}
                  onValueChange={(val) => setNewLog({ ...newLog, entity: val })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="order">Order</SelectItem>
                    <SelectItem value="payment">Payment</SelectItem>
                    <SelectItem value="inventory">Inventory</SelectItem>
                    <SelectItem value="table">Table</SelectItem>
                    <SelectItem value="menu">Menu</SelectItem>
                    <SelectItem value="staff">Staff</SelectItem>
                    <SelectItem value="settings">Settings</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">Target Entity ID (Optional)</label>
              <Input
                placeholder="e.g. ord-1042 or ing-beef"
                value={newLog.entityId}
                onChange={(e) => setNewLog({ ...newLog, entityId: e.target.value })}
              />
            </div>

            {branches && branches.length > 0 && (
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">Branch (Optional)</label>
                <Select
                  value={newLog.branchId}
                  onValueChange={(val) => setNewLog({ ...newLog, branchId: val })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Branches</SelectItem>
                    {branches.map((b) => (
                      <SelectItem key={b.id} value={b.id}>
                        {b.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">
                Summary <span className="text-destructive">*</span>
              </label>
              <Input
                placeholder="Brief summary of event or action..."
                value={newLog.summary}
                onChange={(e) => setNewLog({ ...newLog, summary: e.target.value })}
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">Details & Notes (Optional)</label>
              <Textarea
                placeholder="Detailed rationale, supervisor notes, or inspection observation..."
                rows={3}
                value={newLog.details}
                onChange={(e) => setNewLog({ ...newLog, details: e.target.value })}
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setCreateOpen(false)}
                disabled={isRecording}
              >
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={isRecording}>
                {isRecording ? "Recording..." : "Record to Trail"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
