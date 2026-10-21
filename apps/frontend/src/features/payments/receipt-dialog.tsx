import { format } from "date-fns";
import { Printer } from "lucide-react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useTenant } from "@/features/tenant/tenant-context";
import { useMoney } from "@/features/tenant/use-money";
import { lineTotal } from "@/lib/pricing";
import { ORDER_TYPE_LABELS, PAYMENT_LABELS } from "@/features/orders/order-labels";
import type { Order } from "@/types/domain";

export function ReceiptDialog({ order, open, onOpenChange }: { order: Order; open: boolean; onOpenChange: (o: boolean) => void }) {
  const { tenant, branch } = useTenant();
  const money = useMoney();
  const change = order.payments.reduce((s, p) => s + p.change, 0);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Receipt</DialogTitle>
        </DialogHeader>
        <div className="receipt-print mx-auto w-full max-w-[300px] rounded-md border bg-card p-4 font-mono text-xs text-card-foreground">
          <div className="text-center">
            <p className="font-display text-base font-bold">{tenant.name}</p>
            <p>{branch.name} · {branch.address}</p>
            <p>{branch.phone}</p>
          </div>
          <div className="my-3 border-t border-dashed" />
          <div className="flex justify-between"><span>{order.number}</span><span>{format(new Date(order.createdAt), "dd MMM yyyy HH:mm")}</span></div>
          <p>{ORDER_TYPE_LABELS[order.type]}{order.tableName ? ` · ${order.tableName}` : ""}{order.customerName ? ` · ${order.customerName}` : ""}</p>
          <div className="my-3 border-t border-dashed" />
          {order.lines.map((l) => (
            <div key={l.id} className="mb-1">
              <div className="flex justify-between gap-2"><span>{l.qty}× {l.name}{l.variantName ? ` (${l.variantName})` : ""}</span><span>{money(lineTotal(l))}</span></div>
              {l.modifiers.length > 0 && <p className="pl-3 opacity-70">+ {l.modifiers.map((m) => m.name).join(", ")}</p>}
            </div>
          ))}
          <div className="my-3 border-t border-dashed" />
          <R k="Subtotal" v={money(order.totals.subtotal)} />
          {order.totals.discount > 0 && <R k="Discount" v={`-${money(order.totals.discount)}`} />}
          {order.totals.serviceCharge > 0 && <R k="Service charge" v={money(order.totals.serviceCharge)} />}
          <R k="Tax" v={money(order.totals.tax)} />
          <div className="mt-1 flex justify-between text-sm font-bold"><span>TOTAL</span><span>{money(order.totals.total)}</span></div>
          <div className="my-3 border-t border-dashed" />
          {order.payments.map((p) => <R key={p.id} k={PAYMENT_LABELS[p.method]} v={money(p.method === "cash" ? p.tendered : p.amount)} />)}
          {change > 0 && <R k="Change" v={money(change)} />}
          {order.paid < order.totals.total && <R k="Balance due" v={money(order.totals.total - order.paid)} />}
          <div className="my-3 border-t border-dashed" />
          <p className="text-center">{tenant.receiptFooter}</p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
          <Button onClick={() => window.print()}><Printer className="size-4" /> Print</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function R({ k, v }: { k: string; v: string }) {
  return <div className="flex justify-between"><span>{k}</span><span>{v}</span></div>;
}
