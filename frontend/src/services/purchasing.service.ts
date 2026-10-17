import { ApiError, commit, latency, tenantDb, uid } from "@/mocks/db";
import { round2 } from "@/lib/pricing";
import { applyMovement } from "./stock.service";
import type { GoodsReceipt, PurchaseOrder, Supplier, SupplierReturn } from "@/types/domain";

// Suppliers, purchase orders, goods receiving and supplier returns.
// Future REST: /tenants/:tenantId/suppliers, /purchase-orders, /goods-receipts, /supplier-returns

// ---------- Suppliers ----------
export async function listSuppliers(tenantId: string): Promise<Supplier[]> {
  await latency();
  return tenantDb(tenantId).suppliers;
}

export type SupplierInput = Omit<Supplier, "id" | "tenantId"> & { id?: string | undefined };

export async function saveSupplier(tenantId: string, input: SupplierInput): Promise<Supplier> {
  await latency();
  const db = tenantDb(tenantId);
  const name = input.name.trim();
  if (!name) throw new ApiError(422, "Name is required.");
  if (db.suppliers.some((s) => s.name.toLowerCase() === name.toLowerCase() && s.id !== input.id)) throw new ApiError(409, "A supplier with this name already exists.");
  const { id: _id, ...rest } = input;
  void _id;
  const data = { ...rest, name, contact: input.contact.trim(), phone: input.phone.trim(), email: input.email.trim(), supplies: input.supplies.trim(), paymentTerms: input.paymentTerms.trim() };
  if (input.id) {
    const s = db.suppliers.find((x) => x.id === input.id);
    if (!s) throw new ApiError(404, "Supplier not found.");
    Object.assign(s, data);
    commit(tenantId);
    return s;
  }
  const s: Supplier = { id: uid("sup"), tenantId, ...data };
  db.suppliers.push(s);
  commit(tenantId);
  return s;
}

// ---------- Purchase orders ----------
export async function listPurchaseOrders(tenantId: string, branchId: string): Promise<PurchaseOrder[]> {
  await latency();
  return tenantDb(tenantId)
    .purchaseOrders.filter((p) => p.branchId === branchId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export interface PurchaseOrderInput {
  id?: string | undefined;
  branchId: string;
  supplierId: string;
  expectedDate: string;
  notes: string;
  lines: { ingredientId: string; qty: number; unitCost: number }[];
  createdBy: string;
}

export async function savePurchaseOrder(tenantId: string, input: PurchaseOrderInput): Promise<PurchaseOrder> {
  await latency();
  const db = tenantDb(tenantId);
  const sup = db.suppliers.find((s) => s.id === input.supplierId);
  if (!sup) throw new ApiError(422, "Choose a supplier.");
  if (!sup.active) throw new ApiError(422, "This supplier is inactive.");
  const lines = input.lines
    .filter((l) => l.qty > 0)
    .map((l) => {
      const ing = db.ingredients.find((i) => i.id === l.ingredientId && i.branchId === input.branchId);
      if (!ing) throw new ApiError(422, "Unknown ingredient on this order.");
      if (l.unitCost < 0) throw new ApiError(422, "Unit cost must be zero or more.");
      return { ingredientId: ing.id, name: ing.name, unit: ing.unit, qty: l.qty, unitCost: round2(l.unitCost), receivedQty: 0 };
    });
  if (!lines.length) throw new ApiError(422, "Add at least one line with a quantity.");
  if (new Set(lines.map((l) => l.ingredientId)).size !== lines.length) throw new ApiError(422, "Each ingredient can appear only once.");
  const total = round2(lines.reduce((s, l) => s + l.qty * l.unitCost, 0));
  if (input.id) {
    const po = db.purchaseOrders.find((p) => p.id === input.id);
    if (!po) throw new ApiError(404, "Purchase order not found.");
    if (po.status !== "draft") throw new ApiError(409, "Only draft orders can be edited.");
    Object.assign(po, { supplierId: sup.id, supplierName: sup.name, lines, total, expectedDate: input.expectedDate, notes: input.notes.trim() });
    commit(tenantId);
    return po;
  }
  db.docSeq += 1;
  const po: PurchaseOrder = {
    id: uid("po"),
    tenantId,
    branchId: input.branchId,
    number: `PO-${db.docSeq}`,
    supplierId: sup.id,
    supplierName: sup.name,
    status: "draft",
    lines,
    notes: input.notes.trim(),
    expectedDate: input.expectedDate,
    total,
    createdBy: input.createdBy,
    createdAt: new Date().toISOString(),
    sentAt: null,
  };
  db.purchaseOrders.push(po);
  commit(tenantId);
  return po;
}

export async function setPurchaseOrderStatus(tenantId: string, id: string, status: "sent" | "cancelled"): Promise<PurchaseOrder> {
  await latency();
  const po = tenantDb(tenantId).purchaseOrders.find((p) => p.id === id);
  if (!po) throw new ApiError(404, "Purchase order not found.");
  if (status === "sent" && po.status !== "draft") throw new ApiError(409, "Only drafts can be sent.");
  if (status === "cancelled" && !["draft", "sent"].includes(po.status)) throw new ApiError(409, "Orders with received goods can't be cancelled.");
  po.status = status;
  if (status === "sent") po.sentAt = new Date().toISOString();
  commit(tenantId);
  return po;
}

// ---------- Receiving ----------
export async function listReceipts(tenantId: string, branchId: string): Promise<GoodsReceipt[]> {
  await latency();
  return tenantDb(tenantId).receipts.filter((r) => r.branchId === branchId);
}

export async function receiveGoods(
  tenantId: string,
  input: { poId: string; lines: { ingredientId: string; qty: number; unitCost: number }[]; receivedBy: string },
): Promise<GoodsReceipt> {
  await latency(300, 600);
  const db = tenantDb(tenantId);
  const po = db.purchaseOrders.find((p) => p.id === input.poId);
  if (!po) throw new ApiError(404, "Purchase order not found.");
  if (!["sent", "partial"].includes(po.status)) throw new ApiError(409, "Only sent orders can be received.");
  const lines = input.lines.filter((l) => l.qty > 0);
  if (!lines.length) throw new ApiError(422, "Enter a received quantity for at least one line.");
  db.docSeq += 1;
  const number = `GRN-${db.docSeq}`;
  const received = lines.map((l) => {
    const pl = po.lines.find((x) => x.ingredientId === l.ingredientId);
    if (!pl) throw new ApiError(422, "Line isn't on this purchase order.");
    const remaining = pl.qty - pl.receivedQty;
    if (l.qty > remaining + 1e-9) throw new ApiError(422, `${pl.name}: only ${remaining} ${pl.unit} left to receive.`);
    const ing = db.ingredients.find((i) => i.id === l.ingredientId && i.branchId === po.branchId);
    if (!ing) throw new ApiError(422, `${pl.name} no longer exists at this branch.`);
    pl.receivedQty = Math.round((pl.receivedQty + l.qty) * 1000) / 1000;
    ing.unitCost = round2(l.unitCost);
    applyMovement(db, ing, l.qty, "purchase", `${number} / ${po.number}`);
    return { ingredientId: ing.id, name: ing.name, unit: ing.unit, qty: l.qty, unitCost: round2(l.unitCost) };
  });
  po.status = po.lines.every((l) => l.receivedQty >= l.qty) ? "received" : "partial";
  const grn: GoodsReceipt = { id: uid("grn"), tenantId, branchId: po.branchId, number, poId: po.id, poNumber: po.number, supplierName: po.supplierName, lines: received, receivedBy: input.receivedBy, receivedAt: new Date().toISOString() };
  db.receipts.unshift(grn);
  commit(tenantId);
  return grn;
}

// ---------- Supplier returns ----------
export async function listSupplierReturns(tenantId: string, branchId: string): Promise<SupplierReturn[]> {
  await latency();
  return tenantDb(tenantId).supplierReturns.filter((r) => r.branchId === branchId);
}

export async function createSupplierReturn(
  tenantId: string,
  input: { branchId: string; supplierId: string; reason: string; lines: { ingredientId: string; qty: number }[]; createdBy: string },
): Promise<SupplierReturn> {
  await latency(300, 600);
  const db = tenantDb(tenantId);
  const sup = db.suppliers.find((s) => s.id === input.supplierId);
  if (!sup) throw new ApiError(422, "Choose a supplier.");
  if (!input.reason.trim()) throw new ApiError(422, "Give a reason for the return.");
  const lines = input.lines.filter((l) => l.qty > 0);
  if (!lines.length) throw new ApiError(422, "Add at least one item to return.");
  // Validate everything before changing stock.
  const ings = lines.map((l) => {
    const ing = db.ingredients.find((i) => i.id === l.ingredientId && i.branchId === input.branchId);
    if (!ing) throw new ApiError(422, "Unknown ingredient.");
    if (l.qty > ing.stock) throw new ApiError(422, `${ing.name}: only ${ing.stock} ${ing.unit} on hand.`);
    return { ing, qty: l.qty };
  });
  db.docSeq += 1;
  const number = `RTN-${db.docSeq}`;
  const out = ings.map(({ ing, qty }) => {
    applyMovement(db, ing, -qty, "return", `${number} → ${sup.name}`);
    return { ingredientId: ing.id, name: ing.name, unit: ing.unit, qty, unitCost: ing.unitCost };
  });
  const rtn: SupplierReturn = {
    id: uid("rtn"),
    tenantId,
    branchId: input.branchId,
    number,
    supplierId: sup.id,
    supplierName: sup.name,
    lines: out,
    reason: input.reason.trim(),
    credit: round2(out.reduce((s, l) => s + l.qty * l.unitCost, 0)),
    createdBy: input.createdBy,
    createdAt: new Date().toISOString(),
  };
  db.supplierReturns.unshift(rtn);
  commit(tenantId);
  return rtn;
}
