import { createFileRoute, Link } from "@tanstack/react-router";
import { format } from "date-fns";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { RequirePermission } from "@/features/tenant/require-permission";
import { useTenant } from "@/features/tenant/tenant-context";
import { useMoney } from "@/features/tenant/use-money";
import { useDashboardQuery } from "@/app/api";
import { ORDER_STATUS } from "@/features/orders/order-labels";
import { PageHeader, ErrorState } from "@/components/common/states";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/app/$tenantSlug/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — Tablewise POS" }, { name: "description", content: "Today's sales, orders and kitchen at a glance." }] }),
  component: () => (
    <RequirePermission perm="dashboard.view">
      <Dashboard />
    </RequirePermission>
  ),
});

function Dashboard() {
  const { tenant, branch, user } = useTenant();
  const money = useMoney();
  const q = useDashboardQuery({ tenantId: tenant.id, branchId: branch.id }, { pollingInterval: 15000 });

  if (q.isError) return <ErrorState message="Couldn't load the dashboard." onRetry={q.refetch} />;
  const d = q.data;
  return (
    <div>
      <PageHeader title={`Good ${new Date().getHours() < 12 ? "morning" : new Date().getHours() < 18 ? "afternoon" : "evening"}, ${user.name.split(" ")[0]}`} description={`${tenant.name} · ${branch.name} · ${format(new Date(), "EEEE, MMM d")}`} />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label="Sales today" value={d ? money(d.todaySales) : null} />
        <Kpi label="Paid orders today" value={d ? String(d.todayOrders) : null} />
        <Kpi label="Average ticket" value={d ? money(d.avgTicket) : null} />
        <Kpi label="Tables occupied" value={d ? `${d.occupiedTables} / ${d.totalTables}` : null} sub={d ? `${d.activeOrders} active orders · ${d.kitchenQueue} in kitchen` : undefined} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[2fr_1fr]">
        <section className="rounded-lg border bg-card p-4" aria-label="Sales last 7 days">
          <h2 className="mb-4 text-sm font-semibold">Sales · last 7 days</h2>
          {!d ? <Skeleton className="h-64" /> : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={d.salesByDay.map((x) => ({ ...x, day: format(new Date(x.date), "EEE") }))}>
                  <CartesianGrid vertical={false} stroke="var(--border)" />
                  <XAxis dataKey="day" tickLine={false} axisLine={false} fontSize={12} stroke="var(--muted-foreground)" />
                  <YAxis tickLine={false} axisLine={false} fontSize={12} width={60} stroke="var(--muted-foreground)" tickFormatter={(v: number) => new Intl.NumberFormat(tenant.locale, { notation: "compact" }).format(v)} />
                  <Tooltip cursor={{ fill: "var(--accent)" }} contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} formatter={(v: number) => money(v)} />
                  <Bar dataKey="sales" name="Sales" fill="var(--primary)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </section>
        <section className="rounded-lg border bg-card p-4" aria-label="Top items">
          <h2 className="mb-3 text-sm font-semibold">Top items · 7 days</h2>
          {!d ? <Skeleton className="h-56" /> : (
            <ol className="space-y-2.5">
              {d.topItems.map((i, idx) => (
                <li key={i.name} className="flex items-center gap-3 text-sm">
                  <span className="tabular w-4 text-muted-foreground">{idx + 1}</span>
                  <span className="flex-1 truncate">{i.name}</span>
                  <span className="tabular text-muted-foreground">{i.qty} sold</span>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="rounded-lg border bg-card" aria-label="Recent orders">
          <h2 className="border-b px-4 py-3 text-sm font-semibold">Recent orders</h2>
          {!d ? <Skeleton className="m-4 h-40" /> : (
            <ul className="divide-y">
              {d.recentOrders.map((o) => (
                <li key={o.id}>
                  <Link to="/app/$tenantSlug/orders/$orderId" params={{ tenantSlug: tenant.slug, orderId: o.id }} className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-accent/50">
                    <span className="tabular font-semibold">{o.number}</span>
                    <span className="text-muted-foreground">{format(new Date(o.createdAt), "MMM d, HH:mm")}</span>
                    <Badge variant={ORDER_STATUS[o.status].variant} className="ml-auto">{ORDER_STATUS[o.status].label}</Badge>
                    <span className="tabular w-24 text-right">{money(o.totals.total)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
        <section className="rounded-lg border bg-card" aria-label="Low stock">
          <div className="flex items-center justify-between border-b px-4 py-3">
            <h2 className="text-sm font-semibold">Low stock</h2>
            <Link to="/app/$tenantSlug/inventory" params={{ tenantSlug: tenant.slug }} className="text-xs text-muted-foreground hover:underline">View inventory</Link>
          </div>
          {!d ? <Skeleton className="m-4 h-40" /> : d.lowStock.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground">All ingredients are above reorder level.</p>
          ) : (
            <ul className="divide-y">
              {d.lowStock.map((i) => (
                <li key={i.id} className="flex items-center justify-between px-4 py-2.5 text-sm">
                  <span>{i.name}</span>
                  <span className="tabular text-destructive">{i.stock} {i.unit} <span className="text-muted-foreground">/ min {i.reorderLevel}</span></span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

function Kpi({ label, value, sub }: { label: string; value: string | null; sub?: string | undefined }) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      {value === null ? <Skeleton className="mt-2 h-7 w-24" /> : <p className="tabular mt-1 text-2xl font-semibold">{value}</p>}
      {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}
