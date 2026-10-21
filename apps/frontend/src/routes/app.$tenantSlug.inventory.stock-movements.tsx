import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { format } from "date-fns";
import { useTenant } from "@/features/tenant/tenant-context";
import { useMovementsQuery } from "@/app/api";
import { DataTable, td } from "@/components/common/confirm";
import { EmptyState, ErrorState } from "@/components/common/states";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { MovementReason } from "@/types/domain";

export const Route = createFileRoute("/app/$tenantSlug/inventory/stock-movements")({
  head: () => ({ meta: [{ title: "Stock movements — Tablewise POS" }, { name: "description", content: "Every stock change with its reason." }] }),
  component: Movements,
});

const REASONS: MovementReason[] = ["sale", "purchase", "adjustment", "waste", "count", "return"];
const VARIANT: Record<MovementReason, "info" | "success" | "muted" | "danger" | "warning" | "soft"> = {
  sale: "info", purchase: "success", adjustment: "muted", waste: "danger", count: "warning", return: "soft",
};
const PAGE = 20;

function Movements() {
  const { tenant, branch } = useTenant();
  const mv = useMovementsQuery({ tenantId: tenant.id, branchId: branch.id });
  const [reason, setReason] = useState<MovementReason | "all">("all");
  const [page, setPage] = useState(1);
  const rows = (mv.data ?? []).filter((m) => reason === "all" || m.reason === reason);
  const pages = Math.max(1, Math.ceil(rows.length / PAGE));
  const view = rows.slice((page - 1) * PAGE, page * PAGE);

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-1">
        {(["all", ...REASONS] as const).map((r) => (
          <button key={r} aria-pressed={reason === r} onClick={() => { setReason(r); setPage(1); }} className={cn("rounded-full border px-3 py-1 text-sm capitalize", reason === r ? "border-foreground bg-foreground text-background" : "hover:bg-accent")}>
            {r}
          </button>
        ))}
      </div>
      {mv.isLoading && <Skeleton className="h-64" />}
      {mv.isError && <ErrorState message="Couldn't load movements." onRetry={mv.refetch} />}
      {mv.data && rows.length === 0 && <EmptyState title="No movements yet" body="Sales, deliveries, adjustments and counts appear here." />}
      {view.length > 0 && (
        <DataTable head={["Time", "Ingredient", "Reason", "Reference", "Change"]}>
          {view.map((m) => (
            <tr key={m.id}>
              <td className={`${td} text-muted-foreground`}>{format(new Date(m.createdAt), "MMM d, HH:mm")}</td>
              <td className={td}>{m.ingredientName}</td>
              <td className={td}><Badge variant={VARIANT[m.reason]} className="capitalize">{m.reason}</Badge></td>
              <td className={`${td} tabular`}>{m.reference}</td>
              <td className={cn(td, "tabular text-right", m.qty < 0 ? "text-destructive" : "text-success")}>{m.qty > 0 ? "+" : ""}{m.qty} {m.unit}</td>
            </tr>
          ))}
        </DataTable>
      )}
      {pages > 1 && (
        <div className="mt-4 flex items-center justify-end gap-2 text-sm">
          <span className="text-muted-foreground">Page {page} of {pages}</span>
          <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</Button>
          <Button size="sm" variant="outline" disabled={page >= pages} onClick={() => setPage(page + 1)}>Next</Button>
        </div>
      )}
    </div>
  );
}
