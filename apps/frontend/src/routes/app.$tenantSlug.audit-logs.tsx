import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { format } from "date-fns";
import { History, Search, Shield, Filter } from "lucide-react";
import { RequirePermission } from "@/features/tenant/require-permission";
import { useTenant } from "@/features/tenant/tenant-context";
import { useAuditLogsQuery } from "@/features/stage4/api";
import { PageHeader, EmptyState, SkeletonCard } from "@/components/common/states";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";

export const Route = createFileRoute("/app/$tenantSlug/audit-logs")({
  head: () => ({
    meta: [
      { title: "Audit Logs — Tablewise POS" },
      { name: "description", content: "Comprehensive security and operational event logs." },
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

function AuditLogsPage() {
  const { tenant } = useTenant();
  const [entityFilter, setEntityFilter] = useState("all");
  const [search, setSearch] = useState("");

  const { data: logs = [], isLoading } = useAuditLogsQuery({
    tenantId: tenant.id,
    entity: entityFilter === "all" ? undefined : entityFilter,
  });

  const filteredLogs = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return logs;
    return logs.filter(
      (l) =>
        l.summary.toLowerCase().includes(q) ||
        l.actorName.toLowerCase().includes(q) ||
        (l.details && l.details.toLowerCase().includes(q)),
    );
  }, [logs, search]);

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title="Audit Logs & Activity Trail"
        description="Immutable record of user actions, order cancellations, stock changes, and system settings modifications."
      />

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Search audit trail by summary, details, or actor..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter className="size-4 text-muted-foreground" />
              <Select value={entityFilter} onValueChange={setEntityFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Entity Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Entities</SelectItem>
                  <SelectItem value="order">Orders</SelectItem>
                  <SelectItem value="payment">Payments & Refunds</SelectItem>
                  <SelectItem value="inventory">Inventory & Stock</SelectItem>
                  <SelectItem value="table">Tables</SelectItem>
                  <SelectItem value="menu">Menu & Recipes</SelectItem>
                  <SelectItem value="staff">Staff & Roles</SelectItem>
                  <SelectItem value="settings">Settings & Branding</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="space-y-2">
          {[0, 1, 2, 3, 4].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : filteredLogs.length === 0 ? (
        <EmptyState
          icon={<History className="size-8" />}
          title="No audit events found"
          description={search ? "Try searching for a different keyword or reset filters." : "Activity will be logged as actions occur."}
        />
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[180px]">Timestamp</TableHead>
                <TableHead className="w-[160px]">Actor</TableHead>
                <TableHead className="w-[120px]">Action</TableHead>
                <TableHead className="w-[120px]">Target Entity</TableHead>
                <TableHead>Summary & Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="font-mono text-xs text-muted-foreground whitespace-nowrap">
                    {format(new Date(log.createdAt), "dd MMM yyyy, HH:mm:ss")}
                  </TableCell>
                  <TableCell className="font-medium text-sm flex items-center gap-2">
                    <Shield className="size-3 text-primary opacity-70" />
                    {log.actorName}
                  </TableCell>
                  <TableCell>
                    <Badge variant={ACTION_COLORS[log.action] ?? "outline"} className="capitalize font-mono text-[11px]">
                      {log.action.replace("_", " ")}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="capitalize text-[11px]">
                      {log.entity}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <p className="text-sm font-medium">{log.summary}</p>
                    {log.details && <p className="text-xs text-muted-foreground mt-0.5">{log.details}</p>}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
