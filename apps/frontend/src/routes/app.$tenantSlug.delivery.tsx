import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Bike, MapPin, Plus } from "lucide-react";
import { RequirePermission } from "@/features/tenant/require-permission";
import { useTenant } from "@/features/tenant/tenant-context";
import { useMoney } from "@/features/tenant/use-money";
import { useDeliveriesQuery, useRidersQuery, useSaveRiderMutation, useUpdateDeliveryMutation } from "@/features/people/api";
import { withToast } from "@/features/tenant/use-mutation-toast";
import { EmptyState, ErrorState, PageHeader } from "@/components/common/states";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { DeliveryStatus, Order } from "@/types/domain";

export const Route = createFileRoute("/app/$tenantSlug/delivery")({
  head: () => ({ meta: [{ title: "Delivery — Tablewise POS" }, { name: "description", content: "Assign riders and track delivery orders." }] }),
  component: () => (
    <RequirePermission perm="delivery.manage">
      <Delivery />
    </RequirePermission>
  ),
});

const COLUMNS: { status: DeliveryStatus; label: string }[] = [
  { status: "pending", label: "Awaiting rider" },
  { status: "assigned", label: "Rider assigned" },
  { status: "out", label: "Out for delivery" },
  { status: "delivered", label: "Delivered" },
];

function Delivery() {
  const { tenant, branch } = useTenant();
  const list = useDeliveriesQuery({ tenantId: tenant.id, branchId: branch.id }, { pollingInterval: 15000 });
  const riders = useRidersQuery({ tenantId: tenant.id, branchId: branch.id });
  return (
    <div>
      <PageHeader title="Delivery" description="Delivery orders are created from the POS terminal." actions={<AddRider />} />
      {list.isLoading && <Skeleton className="h-64" />}
      {list.isError && <ErrorState message="Couldn't load deliveries." onRetry={list.refetch} />}
      {list.data && list.data.length === 0 && <EmptyState icon={<Bike className="size-8" />} title="No delivery orders yet" body="Choose “Delivery” on the POS and enter an address." />}
      {list.data && list.data.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {COLUMNS.map((col) => {
            const items = (list.data ?? []).filter((o) => o.delivery?.status === col.status);
            return (
              <section key={col.status} aria-label={col.label} className="rounded-lg border bg-muted/30 p-3">
                <h2 className="mb-3 flex items-center justify-between text-sm font-semibold">{col.label} <Badge variant="muted">{items.length}</Badge></h2>
                <div className="space-y-2">
                  {items.map((o) => <DeliveryCard key={o.id} o={o} riders={riders.data ?? []} />)}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}

function DeliveryCard({ o, riders }: { o: Order; riders: { id: string; name: string }[] }) {
  const { tenant } = useTenant();
  const money = useMoney();
  const [update, { isLoading }] = useUpdateDeliveryMutation();
  const [rider, setRider] = useState("");
  const d = o.delivery!;
  const ready = o.kitchenStatus === "ready" || o.kitchenStatus === "bumped";
  const go = (status: DeliveryStatus, msg: string, riderId?: string) => withToast(update({ tenantId: tenant.id, orderId: o.id, status, riderId }), msg);
  return (
    <article className="rounded-md border bg-card p-3 text-sm shadow-sm">
      <div className="flex items-center justify-between">
        <Link to="/app/$tenantSlug/orders/$orderId" params={{ tenantSlug: tenant.slug, orderId: o.id }} className="font-semibold hover:underline">{o.number}</Link>
        <span className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(o.createdAt), { addSuffix: true })}</span>
      </div>
      <p className="mt-1">{o.customerName || "Guest"} · {o.customerPhone}</p>
      <p className="mt-1 flex gap-1 text-muted-foreground"><MapPin className="mt-0.5 size-3.5 shrink-0" aria-hidden />{d.address}</p>
      <div className="mt-2 flex flex-wrap gap-1">
        <Badge variant={ready ? "success" : "warning"}>{ready ? "Food ready" : "In kitchen"}</Badge>
        <Badge variant={o.paid >= o.totals.total ? "success" : "danger"}>{o.paid >= o.totals.total ? "Paid" : `Due ${money(o.totals.total - o.paid)}`}</Badge>
        {d.riderName && <Badge variant="info">{d.riderName}</Badge>}
      </div>
      <div className="mt-3">
        {d.status === "pending" && (
          <div className="flex gap-2">
            <Select value={rider} onValueChange={setRider}>
              <SelectTrigger aria-label={`Rider for ${o.number}`} className="h-8"><SelectValue placeholder="Choose rider" /></SelectTrigger>
              <SelectContent>{riders.map((r) => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}</SelectContent>
            </Select>
            <Button size="sm" disabled={!rider || isLoading} onClick={() => go("assigned", "Rider assigned", rider)}>Assign</Button>
          </div>
        )}
        {d.status === "assigned" && <Button size="sm" className="w-full" disabled={isLoading} onClick={() => go("out", "Out for delivery")}>Dispatch</Button>}
        {d.status === "out" && <Button size="sm" className="w-full" disabled={isLoading} onClick={() => go("delivered", "Marked delivered")}>Mark delivered</Button>}
      </div>
    </article>
  );
}

function AddRider() {
  const { tenant, branch } = useTenant();
  const [save, { isLoading }] = useSaveRiderMutation();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  return (
    <Popover>
      <PopoverTrigger asChild><Button variant="outline"><Plus className="size-4" /> Add rider</Button></PopoverTrigger>
      <PopoverContent align="end" className="w-64">
        <form
          className="space-y-2"
          onSubmit={async (e) => {
            e.preventDefault();
            if (await withToast(save({ tenantId: tenant.id, branchId: branch.id, name, phone }), "Rider added")) { setName(""); setPhone(""); }
          }}
        >
          <Input aria-label="Rider name" placeholder="Name" value={name} maxLength={40} onChange={(e) => setName(e.target.value)} />
          <Input aria-label="Rider phone" placeholder="Phone" value={phone} maxLength={20} onChange={(e) => setPhone(e.target.value)} />
          <Button type="submit" size="sm" className="w-full" disabled={isLoading}>Save rider</Button>
        </form>
      </PopoverContent>
    </Popover>
  );
}
