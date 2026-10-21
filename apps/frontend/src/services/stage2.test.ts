import { beforeEach, describe, expect, it } from "vitest";
import { resetTenantDb, tenantDb } from "@/mocks/db";
import { receiveGoods, createSupplierReturn, listPurchaseOrders } from "./purchasing.service";
import { adjustStock, submitStockCount } from "./stock.service";
import { addPayment, advanceKitchen, createOrder, markServed } from "./operations.service";
import { costRecipe } from "./catalog.service";

const T = "t_saffron";
const B = "b_se_gulshan";
const ing = (key: string) => tenantDb(T).ingredients.find((i) => i.branchId === B && i.key === key)!;

beforeEach(() => resetTenantDb(T));

describe("stage 2 stock rules", () => {
  it("receiving a PO adds stock and marks partial, then received", async () => {
    const po = (await listPurchaseOrders(T, B)).find((p) => p.status === "sent")!;
    const line = po.lines[0]!;
    const before = tenantDb(T).ingredients.find((i) => i.id === line.ingredientId)!.stock;
    await receiveGoods(T, { poId: po.id, receivedBy: "t", lines: [{ ingredientId: line.ingredientId, qty: 1, unitCost: line.unitCost }] });
    expect(tenantDb(T).ingredients.find((i) => i.id === line.ingredientId)!.stock).toBe(before + 1);
    expect(tenantDb(T).purchaseOrders.find((p) => p.id === po.id)!.status).toBe("partial");
    await receiveGoods(T, { poId: po.id, receivedBy: "t", lines: po.lines.map((l) => ({ ingredientId: l.ingredientId, qty: l.qty - (l.ingredientId === line.ingredientId ? 1 : 0), unitCost: l.unitCost })) });
    expect(tenantDb(T).purchaseOrders.find((p) => p.id === po.id)!.status).toBe("received");
  });

  it("rejects receiving more than was ordered", async () => {
    const po = (await listPurchaseOrders(T, B)).find((p) => p.status === "sent")!;
    const l = po.lines[0]!;
    await expect(receiveGoods(T, { poId: po.id, receivedBy: "t", lines: [{ ingredientId: l.ingredientId, qty: l.qty + 1, unitCost: 1 }] })).rejects.toThrow(/left to receive/);
  });

  it("supplier return can't exceed stock on hand", async () => {
    const sup = tenantDb(T).suppliers[0]!;
    const rice = ing("rice");
    await expect(createSupplierReturn(T, { branchId: B, supplierId: sup.id, reason: "x", createdBy: "t", lines: [{ ingredientId: rice.id, qty: rice.stock + 1 }] })).rejects.toThrow(/on hand/);
  });

  it("waste can't push stock below zero", async () => {
    const m = ing("mango");
    await expect(adjustStock(T, { branchId: B, ingredientId: m.id, direction: "remove", reason: "waste", qty: m.stock + 1, note: "" })).rejects.toThrow(/on hand/);
  });

  it("stock count posts the variance and sets stock to the counted value", async () => {
    const r = ing("rice");
    const count = await submitStockCount(T, { branchId: B, notes: "", createdBy: "t", counts: [{ ingredientId: r.id, counted: 35 }] });
    expect(count.lines[0]!.variance).toBe(35 - 40);
    expect(ing("rice").stock).toBe(35);
  });

  it("paying a combo deducts every component's recipe", async () => {
    const combo = tenantDb(T).combos[0]!; // Tikka Thali: tikka, naan, rice, lassi
    const flourBefore = ing("flour").stock;
    const chickenBefore = ing("chicken").stock;
    const o = await createOrder(T, {
      branchId: B, type: "takeaway", tableId: null, customerName: "", customerPhone: "", discount: null, notes: "", createdBy: "t",
      lines: [{ id: "l1", itemId: combo.id, name: combo.name, variantId: null, variantName: null, modifiers: [], qty: 1, unitPrice: combo.price, notes: "" }],
    });
    await advanceKitchen(T, o.id);
    await advanceKitchen(T, o.id);
    await markServed(T, o.id);
    await addPayment(T, o.id, { method: "card", amount: o.totals.total, tendered: o.totals.total, reference: "" });
    expect(ing("flour").stock).toBeCloseTo(flourBefore - 0.12, 3);
    expect(ing("chicken").stock).toBeCloseTo(chickenBefore - 0.25, 3);
  });

  it("recipe cost is the sum of qty × unit cost", () => {
    const { cost } = costRecipe([{ ingredientKey: "chicken", qty: 0.25 }, { ingredientKey: "yogurt", qty: 0.05 }], tenantDb(T).ingredients.filter((i) => i.branchId === B));
    expect(cost).toBe(0.25 * 420 + 0.05 * 180);
  });
});
