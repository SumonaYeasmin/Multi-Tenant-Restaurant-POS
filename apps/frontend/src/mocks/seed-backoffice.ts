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

export function buildBackoffice(
  tenantId: string,
  menuItems: MenuItem[],
  ingredients: Ingredient[],
  branchIds: string[],
): BackofficeData {
  const tenantPrefix = tenantId.replace(/^t_/, "").slice(0, 3);

  const suppliers: Supplier[] = (SUPPLIERS[tenantId] ?? []).map(
    ([supplierName, contactPerson, phone, email, supplyKeys], supplierIndex) => ({
      id: `${tenantPrefix}_sup_${supplierIndex}`,
      tenantId,
      name: supplierName,
      contact: contactPerson,
      phone,
      email,
      supplies: supplyKeys.join(","),
      paymentTerms: supplierIndex === 0 ? "Net 7" : "Net 14",
      active: true,
    }),
  );

  const combos: Combo[] = (COMBOS[tenantId] ?? []).map(([comboName, description, components, price], comboIndex) => ({
    id: `${tenantPrefix}_combo_${comboIndex}`,
    tenantId,
    name: comboName,
    description,
    price,
    components: components
      .filter(([menuItemIndex]) => menuItems[menuItemIndex])
      .map(([menuItemIndex, quantity]) => ({ itemId: menuItems[menuItemIndex]!.id, qty: quantity })),
    available: true,
  }));

  // One open (sent) PO per branch so receiving has something to do.
  let documentSequence = 500;
  const purchaseOrders: PurchaseOrder[] = [];
  const currentTimestamp = Date.now();

  for (const branchId of branchIds) {
    const primarySupplier = suppliers[0];
    if (!primarySupplier) continue;

    const supplierItemKeys = primarySupplier.supplies.split(",");
    const purchaseLines = ingredients
      .filter((ingredient) => ingredient.branchId === branchId && supplierItemKeys.includes(ingredient.key))
      .map((ingredient) => ({
        ingredientId: ingredient.id,
        name: ingredient.name,
        unit: ingredient.unit,
        qty: Math.max(5, ingredient.reorderLevel * 2),
        unitCost: ingredient.unitCost,
        receivedQty: 0,
      }));

    documentSequence++;
    purchaseOrders.push({
      id: `${tenantPrefix}_po_${documentSequence}`,
      tenantId,
      branchId,
      number: `PO-${documentSequence}`,
      supplierId: primarySupplier.id,
      supplierName: primarySupplier.name,
      status: "sent",
      lines: purchaseLines,
      notes: "Weekly restock",
      expectedDate: new Date(currentTimestamp + 86400000).toISOString().slice(0, 10),
      total: round2(purchaseLines.reduce((sum, line) => sum + line.qty * line.unitCost, 0)),
      createdBy: "Seed",
      createdAt: new Date(currentTimestamp - 86400000).toISOString(),
      sentAt: new Date(currentTimestamp - 86000000).toISOString(),
    });
  }

  return {
    combos,
    suppliers,
    purchaseOrders,
    receipts: [],
    supplierReturns: [],
    stockCounts: [],
    docSeq: documentSequence,
  };
}
