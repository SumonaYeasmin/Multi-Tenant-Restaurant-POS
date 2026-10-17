import type { Combo, GoodsReceipt, Ingredient, MenuItem, PurchaseOrder, StockCount, Supplier, SupplierReturn } from "@/types/domain";
import { round2 } from "@/lib/pricing";

export interface BackofficeData {
  combos: Combo[];
  suppliers: Supplier[];
  purchaseOrders: PurchaseOrder[];
  receipts: GoodsReceipt[];
  supplierReturns: SupplierReturn[];
  stockCounts: StockCount[];
  docSeq: number;
}

const SUPPLIERS: Record<string, [string, string, string, string, string[]][]> = {
  t_saffron: [
    ["Karwan Bazar Meats", "Habib Mia", "+880 1811-200300", "orders@kbmeats.bd", ["chicken", "lamb"]],
    ["Golden Grain Traders", "Shirin Akter", "+880 1911-400500", "sales@goldengrain.bd", ["rice", "flour", "spices"]],
    ["Fresh Dairy Co.", "Tanvir Hasan", "+880 1711-600700", "hello@freshdairy.bd", ["yogurt", "paneer", "mango"]],
  ],
  t_harbor: [
    ["Bay Noodle Works", "Amy Chen", "+1 415-555-0201", "amy@baynoodle.com", ["noodles", "bao"]],
    ["Pacific Provisions", "Luis Ortega", "+1 415-555-0244", "orders@pacprov.com", ["pork", "broth", "egg", "tofu"]],
    ["Boba Supply SF", "Kim Tran", "+1 415-555-0290", "kim@bobasupply.com", ["tea"]],
  ],
  t_lumen: [
    ["Rösterei Nord", "Jonas Weber", "+49 30 555 0201", "jonas@roesterei-nord.de", ["beans"]],
    ["Molkerei Havel", "Anna Schulz", "+49 30 555 0244", "bestellung@molkerei-havel.de", ["milk", "butter"]],
    ["Mühle Brandenburg", "Paul Becker", "+49 30 555 0288", "info@muehle-bb.de", ["flour"]],
  ],
};

const COMBOS: Record<string, [string, string, [number, number][], number][]> = {
  t_saffron: [
    ["Tikka Thali", "Chicken tikka, naan, jeera rice, lassi", [[0, 1], [7, 1], [8, 1], [9, 1]], 990],
    ["Biryani Feast", "Kacchi biryani with masala chai", [[6, 1], [10, 1]], 720],
  ],
  t_harbor: [
    ["Ramen + Bao Set", "Harbor ramen, pork belly bao, yuzu soda", [[0, 1], [3, 1], [7, 1]], 24],
  ],
  t_lumen: [["Morning Duo", "Flat white + butter croissant", [[0, 1], [2, 1]], 6.2]],
};

export function buildBackoffice(tenantId: string, menuItems: MenuItem[], ingredients: Ingredient[], branchIds: string[]): BackofficeData {
  const p = tenantId.slice(2, 5);
  const suppliers: Supplier[] = (SUPPLIERS[tenantId] ?? []).map(([name, contact, phone, email, keys], i) => ({
    id: `${p}_sup_${i}`,
    tenantId,
    name,
    contact,
    phone,
    email,
    supplies: keys.join(","),
    paymentTerms: i === 0 ? "Net 7" : "Net 14",
    active: true,
  }));
  const combos: Combo[] = (COMBOS[tenantId] ?? []).map(([name, description, comps, price], i) => ({
    id: `${p}_combo_${i}`,
    tenantId,
    name,
    description,
    price,
    components: comps.filter(([idx]) => menuItems[idx]).map(([idx, qty]) => ({ itemId: menuItems[idx]!.id, qty })),
    available: true,
  }));

  // One open (sent) PO per branch so receiving has something to do.
  let docSeq = 500;
  const purchaseOrders: PurchaseOrder[] = [];
  const now = Date.now();
  for (const branchId of branchIds) {
    const sup = suppliers[0];
    if (!sup) continue;
    const keys = sup.supplies.split(",");
    const lines = ingredients
      .filter((ing) => ing.branchId === branchId && keys.includes(ing.key))
      .map((ing) => ({ ingredientId: ing.id, name: ing.name, unit: ing.unit, qty: Math.max(5, ing.reorderLevel * 2), unitCost: ing.unitCost, receivedQty: 0 }));
    docSeq++;
    purchaseOrders.push({
      id: `${p}_po_${docSeq}`,
      tenantId,
      branchId,
      number: `PO-${docSeq}`,
      supplierId: sup.id,
      supplierName: sup.name,
      status: "sent",
      lines,
      notes: "Weekly restock",
      expectedDate: new Date(now + 86400000).toISOString().slice(0, 10),
      total: round2(lines.reduce((s, l) => s + l.qty * l.unitCost, 0)),
      createdBy: "Seed",
      createdAt: new Date(now - 86400000).toISOString(),
      sentAt: new Date(now - 86000000).toISOString(),
    });
  }
  return { combos, suppliers, purchaseOrders, receipts: [], supplierReturns: [], stockCounts: [], docSeq };
}
