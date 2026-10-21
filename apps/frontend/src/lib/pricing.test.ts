import { describe, expect, it } from "vitest";
import { computeTotals } from "./pricing";

const lines = [
  { qty: 2, unitPrice: 10, modifiers: [{ groupId: "g", optionId: "o", name: "Cheese", price: 1.5 }] },
  { qty: 1, unitPrice: 7, modifiers: [] },
];

describe("computeTotals", () => {
  it("applies service charge only to dine-in orders", () => {
    const dine = computeTotals({ lines, discount: null, orderType: "dine_in", taxRate: 0.1, serviceChargeRate: 0.05 });
    const take = computeTotals({ lines, discount: null, orderType: "takeaway", taxRate: 0.1, serviceChargeRate: 0.05 });
    expect(dine.subtotal).toBe(30);
    expect(dine.serviceCharge).toBe(1.5);
    expect(dine.tax).toBe(3.15);
    expect(dine.total).toBe(34.65);
    expect(take.serviceCharge).toBe(0);
    expect(take.total).toBe(33);
  });

  it("applies percent discount before tax", () => {
    const t = computeTotals({ lines, discount: { kind: "percent", value: 10, reason: "" }, orderType: "takeaway", taxRate: 0.1, serviceChargeRate: 0 });
    expect(t.discount).toBe(3);
    expect(t.total).toBe(29.7);
  });

  it("caps amount discounts at the subtotal", () => {
    const t = computeTotals({ lines, discount: { kind: "amount", value: 999, reason: "" }, orderType: "takeaway", taxRate: 0.1, serviceChargeRate: 0 });
    expect(t.discount).toBe(30);
    expect(t.total).toBe(0);
  });
});
