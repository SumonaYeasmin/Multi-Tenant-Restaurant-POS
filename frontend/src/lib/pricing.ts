import type { Discount, OrderLine, OrderType, Totals } from "@/types/domain";

export const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

export function lineTotal(line: Pick<OrderLine, "qty" | "unitPrice" | "modifiers">): number {
  const mods = line.modifiers.reduce((s, m) => s + m.price, 0);
  return round2((line.unitPrice + mods) * line.qty);
}

export interface PricingInput {
  lines: Pick<OrderLine, "qty" | "unitPrice" | "modifiers">[];
  discount: Discount | null;
  orderType: OrderType;
  taxRate: number;
  serviceChargeRate: number;
}

/**
 * Order totals:
 * subtotal - discount (capped at subtotal)
 * + service charge (dine-in only, on discounted subtotal)
 * + tax on (discounted subtotal + service charge).
 */
export function computeTotals(input: PricingInput): Totals {
  const subtotal = round2(input.lines.reduce((s, l) => s + lineTotal(l), 0));
  let discount = 0;
  if (input.discount && input.discount.value > 0) {
    discount =
      input.discount.kind === "percent"
        ? (subtotal * Math.min(input.discount.value, 100)) / 100
        : input.discount.value;
  }
  discount = round2(Math.min(discount, subtotal));
  const net = subtotal - discount;
  const serviceCharge = input.orderType === "dine_in" ? round2(net * input.serviceChargeRate) : 0;
  const tax = round2((net + serviceCharge) * input.taxRate);
  const total = round2(net + serviceCharge + tax);
  return { subtotal, discount, serviceCharge, tax, total };
}

export function formatMoney(amount: number, currency: string, locale = "en-US"): string {
  return new Intl.NumberFormat(locale, { style: "currency", currency }).format(amount);
}
