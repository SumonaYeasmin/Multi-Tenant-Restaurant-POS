import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { format } from "date-fns";
import { Loader2, Pencil, Plus } from "lucide-react";
import { RequirePermission } from "@/features/tenant/require-permission";
import { useTenant } from "@/features/tenant/tenant-context";
import { useMoney } from "@/features/tenant/use-money";
import { usePromotionsQuery, useSavePromotionMutation } from "@/features/people/api";
import { withToast } from "@/features/tenant/use-mutation-toast";
import { todayIso } from "@/services/people.service";
import { DataTable, td } from "@/components/common/confirm";
import { EmptyState, ErrorState, PageHeader } from "@/components/common/states";
import { Field, num } from "@/components/common/field";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { Promotion } from "@/types/domain";

export const Route = createFileRoute("/app/$tenantSlug/promotions")({
  head: () => ({ meta: [{ title: "Promotions — Tablewise POS" }, { name: "description", content: "Promo codes cashiers can apply at the POS." }] }),
  component: () => (
    <RequirePermission perm="promotions.manage">
      <Promotions />
    </RequirePermission>
  ),
});

function statusOf(p: Promotion) {
  const today = todayIso();
  if (!p.active) return { label: "Paused", variant: "muted" as const };
  if (today < p.startsAt) return { label: "Scheduled", variant: "info" as const };
  if (today > p.endsAt) return { label: "Ended", variant: "muted" as const };
  if (p.maxUses !== null && p.uses >= p.maxUses) return { label: "Used up", variant: "warning" as const };
  return { label: "Live", variant: "success" as const };
}

function Promotions() {
  const { tenant } = useTenant();
  const money = useMoney();
  const list = usePromotionsQuery(tenant.id);
  const [editing, setEditing] = useState<Promotion | "new" | null>(null);
  return (
    <div>
      <PageHeader title="Promotions" description="Codes apply to every branch. Cashiers enter them from “Add discount” on the POS." actions={<Button onClick={() => setEditing("new")}><Plus className="size-4" /> New promotion</Button>} />
      {list.isLoading && <Skeleton className="h-48" />}
      {list.isError && <ErrorState message="Couldn't load promotions." onRetry={list.refetch} />}
      {list.data && list.data.length === 0 && <EmptyState title="No promotions yet" />}
      {list.data && list.data.length > 0 && (
        <DataTable head={["Promotion", "Code", "Discount", "Min spend", "Runs", "Uses", "Status", ""]}>
          {list.data.map((p) => {
            const st = statusOf(p);
            return (
              <tr key={p.id}>
                <td className={`${td} font-medium`}>{p.name}</td>
                <td className={`${td} font-mono`}>{p.code}</td>
                <td className={td}>{p.kind === "percent" ? `${p.value}%` : money(p.value)}</td>
                <td className={td}>{p.minSpend > 0 ? money(p.minSpend) : "—"}</td>
                <td className={`${td} whitespace-nowrap`}>{format(new Date(p.startsAt), "d MMM")} – {format(new Date(p.endsAt), "d MMM")}</td>
                <td className={td}>{p.uses}{p.maxUses !== null && ` / ${p.maxUses}`}</td>
                <td className={td}><Badge variant={st.variant}>{st.label}</Badge></td>
                <td className={`${td} text-right`}><Button size="icon" variant="ghost" aria-label={`Edit ${p.name}`} onClick={() => setEditing(p)}><Pencil className="size-4" /></Button></td>
              </tr>
            );
          })}
        </DataTable>
      )}
      {editing && <PromoDialog promo={editing === "new" ? null : editing} onClose={() => setEditing(null)} />}
    </div>
  );
}

function PromoDialog({ promo, onClose }: { promo: Promotion | null; onClose: () => void }) {
  const { tenant } = useTenant();
  const [save, { isLoading }] = useSavePromotionMutation();
  const today = todayIso();
  const [v, setV] = useState({
    name: promo?.name ?? "",
    code: promo?.code ?? "",
    kind: promo?.kind ?? ("percent" as "percent" | "amount"),
    value: String(promo?.value ?? ""),
    minSpend: String(promo?.minSpend ?? 0),
    startsAt: promo?.startsAt ?? today,
    endsAt: promo?.endsAt ?? today,
    maxUses: promo?.maxUses == null ? "" : String(promo.maxUses),
    active: promo?.active ?? true,
  });
  const set = (k: keyof typeof v) => (e: { target: { value: string } }) => setV({ ...v, [k]: e.target.value });
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>{promo ? `Edit ${promo.name}` : "New promotion"}</DialogTitle></DialogHeader>
        <form
          className="grid grid-cols-2 gap-3"
          onSubmit={async (e) => {
            e.preventDefault();
            const maxUses = v.maxUses.trim() ? num(v.maxUses) : null;
            const input = { tenantId: tenant.id, id: promo?.id, name: v.name, code: v.code, kind: v.kind, value: num(v.value), minSpend: num(v.minSpend) || 0, startsAt: v.startsAt, endsAt: v.endsAt, maxUses, active: v.active };
            if (await withToast(save(input), "Promotion saved")) onClose();
          }}
        >
          <Field label="Name" className="col-span-2">{(id) => <Input id={id} value={v.name} maxLength={60} onChange={set("name")} required />}</Field>
          <Field label="Code">{(id) => <Input id={id} value={v.code} maxLength={16} className="uppercase" onChange={set("code")} required />}</Field>
          <Field label="Type">
            {(id) => (
              <select id={id} className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={v.kind} onChange={(e) => setV({ ...v, kind: e.target.value as "percent" | "amount" })}>
                <option value="percent">Percent off</option>
                <option value="amount">Amount off</option>
              </select>
            )}
          </Field>
          <Field label={v.kind === "percent" ? "Percent" : "Amount"}>{(id) => <Input id={id} inputMode="decimal" value={v.value} onChange={set("value")} required />}</Field>
          <Field label="Minimum spend">{(id) => <Input id={id} inputMode="decimal" value={v.minSpend} onChange={set("minSpend")} />}</Field>
          <Field label="Starts">{(id) => <Input id={id} type="date" value={v.startsAt} onChange={set("startsAt")} />}</Field>
          <Field label="Ends">{(id) => <Input id={id} type="date" value={v.endsAt} onChange={set("endsAt")} />}</Field>
          <Field label="Max uses" hint="Leave blank for unlimited">{(id) => <Input id={id} inputMode="numeric" value={v.maxUses} onChange={set("maxUses")} />}</Field>
          <label className="col-span-2 flex items-center gap-2 text-sm"><Switch checked={v.active} onCheckedChange={(a) => setV({ ...v, active: a })} /> Active</label>
          <DialogFooter className="col-span-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={isLoading}>{isLoading && <Loader2 className="size-4 animate-spin" />} Save</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
