import type { Discount, OrderLine, OrderType, Totals } from "@pos/types";

/**
 * Standard monetary 2-decimal rounding using Number.EPSILON to avoid floating point precision issues.
 */
export const round2 = (n: number): number =>
  Math.round((n + Number.EPSILON) * 100) / 100;

/**
 * Calculates the total cost for a single line item including all selected modifiers.
 */
export function lineTotal(
  line: Pick<OrderLine, "qty" | "unitPrice" | "modifiers">
): number {
  const mods = (line.modifiers || []).reduce((s, m) => s + (m.price || 0), 0);
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
 * Computes exact financial order totals for POS and Backend:
 * 1. Subtotal = sum of all line totals
 * 2. Discount = capped at subtotal
 * 3. Net = subtotal - discount
 * 4. Service Charge = dine-in only, applied to discounted net
 * 5. Tax = applied to (discounted net + service charge)
 * 6. Total = net + service charge + tax
 */
export function computeTotals(input: PricingInput): Totals {
  const subtotal = round2(
    (input.lines || []).reduce((s, l) => s + lineTotal(l), 0)
  );

  let discount = 0;
  if (input.discount && input.discount.value > 0) {
    discount =
      input.discount.kind === "percent"
        ? (subtotal * Math.min(input.discount.value, 100)) / 100
        : input.discount.value;
  }
  discount = round2(Math.min(discount, subtotal));
  const net = subtotal - discount;

  const isDineIn = input.orderType === "dine_in";
  const serviceCharge = isDineIn
    ? round2(net * (input.serviceChargeRate || 0))
    : 0;

  const tax = round2((net + serviceCharge) * (input.taxRate || 0));
  const total = round2(net + serviceCharge + tax);

  return { subtotal, discount, serviceCharge, tax, total };
}
