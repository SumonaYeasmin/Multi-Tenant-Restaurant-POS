import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Users } from "lucide-react";
import { RequirePermission } from "@/features/tenant/require-permission";
import { useTenant } from "@/features/tenant/tenant-context";
import { useMoney } from "@/features/tenant/use-money";
import { useOrdersQuery, useSetTableStatusMutation, useTablesQuery } from "@/app/api";
import { errorMessage } from "@/app/base-api";
import { useAppDispatch } from "@/app/hooks";
import { cartActions } from "@/features/pos/cart.slice";
import { ORDER_STATUS } from "@/features/orders/order-labels";
import { PageHeader, ErrorState } from "@/components/common/states";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import type { DiningTable, TableStatus } from "@/types/domain";

export const Route = createFileRoute("/app/$tenantSlug/tables")({
  head: () => ({ meta: [{ title: "Tables — Tablewise POS" }, { name: "description", content: "Live floor plan and table status." }] }),
  component: () => (
    <RequirePermission perm="tables.view">
      <TablesPage />
    </RequirePermission>
  ),
});

const STATUS_STYLE: Record<TableStatus, string> = {
  available: "border-success/50 bg-success/10",
  occupied: "border-primary bg-primary-soft",
  reserved: "border-info/50 bg-info/10",
  cleaning: "border-warning/60 bg-warning/15",
};
const STATUS_LABEL: Record<TableStatus, string> = { available: "Available", occupied: "Occupied", reserved: "Reserved", cleaning: "Needs cleaning" };

function TablesPage() {
  const { tenant, branch, can } = useTenant();
  const money = useMoney();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const tables = useTablesQuery({ tenantId: tenant.id, branchId: branch.id }, { pollingInterval: 10000 });
  const orders = useOrdersQuery({ tenantId: tenant.id, branchId: branch.id, status: "active" });
  const [setStatus, { isLoading }] = useSetTableStatusMutation();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<TableStatus | "all">("all");
  const selected = tables.data?.find((t) => t.id === selectedId) ?? null;
  const areas = useMemo(() => [...new Set((tables.data ?? []).map((t) => t.area))], [tables.data]);
  const orderFor = (t: DiningTable) => orders.data?.find((o) => o.id === t.currentOrderId);
  const counts = (tables.data ?? []).reduce<Record<string, number>>((a, t) => ({ ...a, [t.status]: (a[t.status] ?? 0) + 1 }), {});

  const change = (status: TableStatus) =>
    selected &&
    setStatus({ tenantId: tenant.id, tableId: selected.id, status })
      .unwrap()
      .then(() => toast.success(`${selected.name} is now ${STATUS_LABEL[status].toLowerCase()}`))
      .catch((e) => toast.error(errorMessage(e)));

  return (
    <div>
      <PageHeader title="Tables" description={`${branch.name} floor plan`} />
      <div className="mb-5 flex flex-wrap gap-2">
        {(["all", "available", "occupied", "reserved", "cleaning"] as const).map((s) => (
          <button key={s} onClick={() => setFilter(s)} aria-pressed={filter === s} className={cn("rounded-full border px-3 py-1 text-sm", filter === s ? "border-foreground bg-foreground text-background" : "hover:bg-accent")}>
            {s === "all" ? "All" : STATUS_LABEL[s]} <span className="tabular opacity-70">{s === "all" ? tables.data?.length ?? 0 : counts[s] ?? 0}</span>
          </button>
        ))}
      </div>
      {tables.isLoading && <Skeleton className="h-80" />}
      {tables.isError && <ErrorState message="Couldn't load tables." onRetry={tables.refetch} />}
      <div className="space-y-6">
        {areas.map((area) => (
          <section key={area} aria-label={area}>
            <h2 className="mb-3 text-sm font-semibold text-muted-foreground">{area}</h2>
            <div className="grid grid-cols-2 gap-4 rounded-xl border border-dashed bg-card/50 p-4 sm:grid-cols-3 lg:grid-cols-5">
              {(tables.data ?? [])
                .filter((t) => t.area === area && (filter === "all" || t.status === filter))
                .map((t) => {
                  const o = orderFor(t);
                  return (
                    <button
                      key={t.id}
                      onClick={() => setSelectedId(t.id)}
                      className={cn(
                        "flex aspect-square flex-col items-center justify-center border-2 p-2 text-center transition-transform hover:scale-[1.03]",
                        t.shape === "round" ? "rounded-full" : "rounded-xl",
                        t.shape === "long" && "aspect-[2/1] sm:col-span-2",
                        STATUS_STYLE[t.status],
                      )}
                    >
                      <span className="font-display text-lg font-bold">{t.name}</span>
                      <span className="flex items-center gap-1 text-xs text-muted-foreground"><Users className="size-3" aria-hidden />{t.seats}</span>
                      <span className="mt-1 text-[11px] font-medium">{o ? `${o.number} · ${money(o.totals.total)}` : STATUS_LABEL[t.status]}</span>
                    </button>
                  );
                })}
            </div>
          </section>
        ))}
      </div>

      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelectedId(null)}>
        <SheetContent>
          {selected && (
            <>
              <SheetHeader>
                <SheetTitle>Table {selected.name}</SheetTitle>
                <SheetDescription>{selected.seats} seats · {selected.area} · {STATUS_LABEL[selected.status]}</SheetDescription>
              </SheetHeader>
              <div className="mt-6 space-y-3 px-4">
                {selected.status === "occupied" && orderFor(selected) ? (
                  <>
                    <div className="rounded-lg border p-3 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="tabular font-semibold">{orderFor(selected)!.number}</span>
                        <Badge variant={ORDER_STATUS[orderFor(selected)!.status].variant}>{ORDER_STATUS[orderFor(selected)!.status].label}</Badge>
                      </div>
                      <p className="mt-1 text-muted-foreground">{orderFor(selected)!.lines.reduce((s, l) => s + l.qty, 0)} items · {money(orderFor(selected)!.totals.total)}</p>
                    </div>
                    <Button className="w-full" onClick={() => navigate({ to: "/app/$tenantSlug/orders/$orderId", params: { tenantSlug: tenant.slug, orderId: selected.currentOrderId! } })}>Open order</Button>
                  </>
                ) : (
                  can("pos.use") && (
                    <Button
                      className="w-full"
                      onClick={() => {
                        dispatch(cartActions.setTable(selected.id));
                        navigate({ to: "/app/$tenantSlug/pos", params: { tenantSlug: tenant.slug } });
                      }}
                    >
                      Start order at {selected.name}
                    </Button>
                  )
                )}
                {can("tables.manage") && selected.status !== "occupied" && (
                  <div className="grid grid-cols-3 gap-2 pt-2">
                    {(["available", "reserved", "cleaning"] as const).map((s) => (
                      <Button key={s} size="sm" variant={selected.status === s ? "secondary" : "outline"} disabled={isLoading || selected.status === s} onClick={() => change(s)}>
                        {s === "cleaning" ? "Cleaning" : STATUS_LABEL[s]}
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
