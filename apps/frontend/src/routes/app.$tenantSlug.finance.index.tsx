import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { format } from "date-fns";
import { useTenant } from "@/features/tenant/tenant-context";
import { useMoney } from "@/features/tenant/use-money";
import { useLedgerQuery } from "@/features/people/api";
import { PAYMENT_LABELS } from "@/features/orders/order-labels";
import { DataTable, td } from "@/components/common/confirm";
import { EmptyState, ErrorState } from "@/components/common/states";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app/$tenantSlug/finance/")({
  head: () => ({ meta: [{ title: "Payments ledger — Tablewise POS" }, { name: "description", content: "Every payment and refund for the branch." }] }),
  component: Ledger,
});

function Ledger() {
  const { tenant, branch } = useTenant();
  const money = useMoney();
  const list = useLedgerQuery({ tenantId: tenant.id, branchId: branch.id });
  const [kind, setKind] = useState<"all" | "payment" | "refund">("all");
  const all = list.data ?? [];
  const rows = all.filter((r) => kind === "all" || r.kind === kind).slice(0, 200);
  const today = new Date().toDateString();
  const todays = all.filter((r) => new Date(r.at).toDateString() === today);
  const sum = (f: (r: (typeof all)[number]) => boolean) => todays.filter(f).reduce((s, r) => s + r.amount, 0);
  return (
    <div>
      <div className="mb-4 grid gap-3 sm:grid-cols-4">
        {[
          ["Taken today", sum((r) => r.kind === "payment")],
          ["Cash", sum((r) => r.kind === "payment" && r.method === "cash")],
          ["Card & mobile", sum((r) => r.kind === "payment" && r.method !== "cash")],
          ["Refunded today", -sum((r) => r.kind === "refund")],
        ].map(([l, v]) => (
          <div key={l as string} className="rounded-lg border bg-card p-3"><p className="text-xs text-muted-foreground">{l}</p><p className="text-lg font-bold">{money(v as number)}</p></div>
        ))}
      </div>
      <div className="mb-3 flex gap-1" role="radiogroup" aria-label="Filter">
        {(["all", "payment", "refund"] as const).map((k) => (
          <button key={k} role="radio" aria-checked={kind === k} onClick={() => setKind(k)} className={cn("rounded-md border px-3 py-1 text-sm", kind === k && "border-primary bg-primary/10 font-semibold")}>
            {k === "all" ? "All" : k === "payment" ? "Payments" : "Refunds"}
          </button>
        ))}
      </div>
      <p className="mb-3 text-sm text-muted-foreground">To refund, open the order and choose “Refund”.</p>
      {list.isLoading && <Skeleton className="h-48" />}
      {list.isError && <ErrorState message="Couldn't load payments." onRetry={list.refetch} />}
      {list.data && rows.length === 0 && <EmptyState title="Nothing here yet" />}
      {rows.length > 0 && (
        <DataTable head={["Time", "Order", "Type", "Method", "Note", "Amount"]}>
          {rows.map((r) => (
            <tr key={r.id}>
              <td className={`${td} whitespace-nowrap`}>{format(new Date(r.at), "d MMM, HH:mm")}</td>
              <td className={td}><Link to="/app/$tenantSlug/orders/$orderId" params={{ tenantSlug: tenant.slug, orderId: r.orderId }} className="font-medium hover:underline">{r.orderNumber}</Link></td>
              <td className={td}><Badge variant={r.kind === "refund" ? "danger" : "success"}>{r.kind === "refund" ? "Refund" : "Payment"}</Badge></td>
              <td className={td}>{PAYMENT_LABELS[r.method]}</td>
              <td className={`${td} text-muted-foreground`}>{r.reference || "—"}</td>
              <td className={cn(td, "text-right font-semibold tabular-nums", r.amount < 0 && "text-destructive")}>{money(r.amount)}</td>
            </tr>
          ))}
        </DataTable>
      )}
    </div>
  );
}
