import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { format } from "date-fns";
import { Award, Loader2, Pencil, Plus } from "lucide-react";
import { RequirePermission } from "@/features/tenant/require-permission";
import { useTenant } from "@/features/tenant/tenant-context";
import { useMoney } from "@/features/tenant/use-money";
import { useAdjustPointsMutation, useCustomersQuery, useLoyaltySettingsQuery, useSaveCustomerMutation } from "@/features/people/api";
import { withToast } from "@/features/tenant/use-mutation-toast";
import { tierFor } from "@/services/people.service";
import { DataTable, td } from "@/components/common/confirm";
import { EmptyState, ErrorState, PageHeader } from "@/components/common/states";
import { Field, num } from "@/components/common/field";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import type { Customer, LoyaltyTier } from "@/types/domain";

export const Route = createFileRoute("/app/$tenantSlug/customers")({
  head: () => ({ meta: [{ title: "Customers & loyalty — Tablewise POS" }, { name: "description", content: "Guest profiles, visit history and loyalty points." }] }),
  component: () => (
    <RequirePermission perm="customers.manage">
      <Customers />
    </RequirePermission>
  ),
});

const TIER: Record<LoyaltyTier, { label: string; variant: "muted" | "info" | "warning" }> = {
  bronze: { label: "Bronze", variant: "muted" },
  silver: { label: "Silver", variant: "info" },
  gold: { label: "Gold", variant: "warning" },
};

function Customers() {
  const { tenant } = useTenant();
  const money = useMoney();
  const list = useCustomersQuery(tenant.id);
  const loyalty = useLoyaltySettingsQuery(tenant.id);
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<Customer | "new" | null>(null);
  const [viewId, setViewId] = useState<string | null>(null);
  const rows = (list.data ?? []).filter((c) => `${c.name} ${c.phone} ${c.email}`.toLowerCase().includes(q.trim().toLowerCase()));
  const viewing = list.data?.find((c) => c.id === viewId) ?? null;
  return (
    <div>
      <PageHeader
        title="Customers & loyalty"
        description={loyalty.data ? `Guests earn 1 point per ${money(loyalty.data.spendPerPoint)} spent when their phone is on the order.` : "Guest profiles and loyalty points."}
        actions={<Button onClick={() => setEditing("new")}><Plus className="size-4" /> New customer</Button>}
      />
      <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, phone or email" className="mb-4 max-w-xs" aria-label="Search customers" />
      {list.isLoading && <Skeleton className="h-48" />}
      {list.isError && <ErrorState message="Couldn't load customers." onRetry={list.refetch} />}
      {list.data && rows.length === 0 && <EmptyState title="No customers found" />}
      {rows.length > 0 && (
        <DataTable head={["Customer", "Phone", "Visits", "Total spent", "Points", "Tier", ""]}>
          {rows.map((c) => {
            const tier = TIER[tierFor(c.lifetimePoints)];
            return (
              <tr key={c.id} className="cursor-pointer hover:bg-muted/40" onClick={() => setViewId(c.id)}>
                <td className={`${td} font-medium`}>{c.name}<p className="text-xs text-muted-foreground">{c.email || "—"}</p></td>
                <td className={td}>{c.phone}</td>
                <td className={td}>{c.visits}</td>
                <td className={td}>{money(c.totalSpent)}</td>
                <td className={`${td} font-semibold tabular-nums`}>{c.points}</td>
                <td className={td}><Badge variant={tier.variant}>{tier.label}</Badge></td>
                <td className={`${td} text-right`}>
                  <Button size="icon" variant="ghost" aria-label={`Edit ${c.name}`} onClick={(e) => { e.stopPropagation(); setEditing(c); }}><Pencil className="size-4" /></Button>
                </td>
              </tr>
            );
          })}
        </DataTable>
      )}
      {editing && <CustomerDialog customer={editing === "new" ? null : editing} onClose={() => setEditing(null)} />}
      <Sheet open={!!viewing} onOpenChange={(o) => !o && setViewId(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-md">{viewing && <CustomerDetail c={viewing} pointValue={loyalty.data?.pointValue ?? 0} />}</SheetContent>
      </Sheet>
    </div>
  );
}

function CustomerDetail({ c, pointValue }: { c: Customer; pointValue: number }) {
  const { tenant } = useTenant();
  const money = useMoney();
  const [adjust, { isLoading }] = useAdjustPointsMutation();
  const [pts, setPts] = useState("");
  const [reason, setReason] = useState("");
  const submit = async (sign: 1 | -1) => {
    const n = num(pts);
    if (!Number.isInteger(n) || n <= 0) return;
    if (await withToast(adjust({ tenantId: tenant.id, customerId: c.id, points: sign * n, reason: reason || (sign < 0 ? "Reward redeemed" : "Bonus") }), sign < 0 ? "Points redeemed" : "Points added")) {
      setPts("");
      setReason("");
    }
  };
  return (
    <>
      <SheetHeader><SheetTitle>{c.name}</SheetTitle></SheetHeader>
      <div className="mt-4 grid grid-cols-3 gap-2 text-center">
        <div className="rounded-md border p-3"><p className="text-xs text-muted-foreground">Points</p><p className="text-xl font-bold">{c.points}</p></div>
        <div className="rounded-md border p-3"><p className="text-xs text-muted-foreground">Worth</p><p className="text-xl font-bold">{money(c.points * pointValue)}</p></div>
        <div className="rounded-md border p-3"><p className="text-xs text-muted-foreground">Lifetime</p><p className="text-xl font-bold">{c.lifetimePoints}</p></div>
      </div>
      <p className="mt-3 text-sm text-muted-foreground">{c.phone}{c.lastVisitAt ? ` · last visit ${format(new Date(c.lastVisitAt), "d MMM")}` : ""}</p>
      {c.notes && <p className="mt-2 rounded-md bg-muted p-2 text-sm">{c.notes}</p>}
      <div className="mt-5 space-y-2 rounded-md border p-3">
        <p className="flex items-center gap-2 text-sm font-semibold"><Award className="size-4" /> Adjust or redeem points</p>
        <div className="grid grid-cols-2 gap-2">
          <Input inputMode="numeric" aria-label="Points" placeholder="Points" value={pts} onChange={(e) => setPts(e.target.value)} />
          <Input aria-label="Reason" placeholder="Reason" value={reason} maxLength={60} onChange={(e) => setReason(e.target.value)} />
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="secondary" disabled={isLoading} onClick={() => submit(-1)}>Redeem</Button>
          <Button size="sm" variant="outline" disabled={isLoading} onClick={() => submit(1)}>Add bonus</Button>
        </div>
      </div>
      <h3 className="mt-5 text-sm font-semibold">Points history</h3>
      <ul className="mt-2 divide-y rounded-md border text-sm">
        {c.ledger.length === 0 && <li className="p-3 text-muted-foreground">No activity yet.</li>}
        {c.ledger.map((l) => (
          <li key={l.id} className="flex items-center justify-between p-2.5">
            <span>{l.reason}{l.reference && ` ${l.reference}`}<span className="block text-xs text-muted-foreground">{format(new Date(l.at), "d MMM yyyy, HH:mm")}</span></span>
            <span className={l.points < 0 ? "font-semibold text-destructive" : "font-semibold text-success"}>{l.points > 0 ? "+" : ""}{l.points}</span>
          </li>
        ))}
      </ul>
    </>
  );
}

function CustomerDialog({ customer, onClose }: { customer: Customer | null; onClose: () => void }) {
  const { tenant } = useTenant();
  const [save, { isLoading }] = useSaveCustomerMutation();
  const [v, setV] = useState({ name: customer?.name ?? "", phone: customer?.phone ?? "", email: customer?.email ?? "", notes: customer?.notes ?? "" });
  const set = (k: keyof typeof v) => (e: { target: { value: string } }) => setV({ ...v, [k]: e.target.value });
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>{customer ? `Edit ${customer.name}` : "New customer"}</DialogTitle></DialogHeader>
        <form
          className="grid gap-3"
          onSubmit={async (e) => {
            e.preventDefault();
            if (await withToast(save({ tenantId: tenant.id, id: customer?.id, ...v }), "Customer saved")) onClose();
          }}
        >
          <Field label="Name">{(id) => <Input id={id} value={v.name} maxLength={60} onChange={set("name")} required />}</Field>
          <Field label="Phone">{(id) => <Input id={id} type="tel" value={v.phone} maxLength={20} onChange={set("phone")} required />}</Field>
          <Field label="Email">{(id) => <Input id={id} type="email" value={v.email} maxLength={80} onChange={set("email")} />}</Field>
          <Field label="Notes">{(id) => <Textarea id={id} value={v.notes} maxLength={200} onChange={set("notes")} placeholder="Allergies, preferences" />}</Field>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={isLoading}>{isLoading && <Loader2 className="size-4 animate-spin" />} Save</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
