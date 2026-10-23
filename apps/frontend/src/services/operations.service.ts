import { ApiError, commit, latency, tenantDb, uid } from "@/mocks/db";
import { TENANTS } from "@/mocks/platform";
import { computeTotals, round2 } from "@/lib/pricing";
import { awardLoyalty, checkPromotion } from "./people.service";
import { backendFetch } from "./api-client";
import type {
  Category,
  Combo,
  DiningTable,
  Discount,
  Ingredient,
  KitchenStatus,
  MenuItem,
  ModifierGroup,
  Notification,
  Order,
  OrderLine,
  OrderType,
  PaymentMethod,
  StockMovement,
  TableStatus,
} from "@/types/domain";

// Every function takes tenantId first and reads only that tenant's store.
// Shapes mirror future REST endpoints under /tenants/:tenantId/...

const tenantOf = (tenantId: string) => {
  const t = TENANTS.find((x) => x.id === tenantId);
  if (!t) throw new ApiError(404, "Restaurant not found.");
  return t;
};

const findOrder = (tenantId: string, orderId: string) => {
  const o = tenantDb(tenantId).orders.find((x) => x.id === orderId);
  if (!o) throw new ApiError(404, "Order not found.");
  return o;
};

// ---------- Menu ----------
export interface MenuBundle {
  categories: Category[];
  items: MenuItem[];
  modifierGroups: ModifierGroup[];
  combos: Combo[];
}

export async function getMenu(tenantId: string): Promise<MenuBundle> {
  try {
    const backendCategories = await backendFetch<Category[]>(`/tenants/${tenantId}/categories?activeOnly=true`);
    if (Array.isArray(backendCategories)) {
      const db = tenantDb(tenantId);
      db.categories = backendCategories.map((c, idx) => ({
        id: c.id,
        tenantId: c.tenantId || tenantId,
        name: c.name,
        sort: c.sort ?? idx,
      }));
      commit(tenantId);
    }
  } catch (err) {
    if (!(err instanceof ApiError && err.status === 503)) {
      console.warn("Could not fetch categories from backend, using local store:", err);
    }
  }

  try {
    const backendGroups = await backendFetch<any[]>(`/tenants/${tenantId}/modifier-groups`);
    if (Array.isArray(backendGroups)) {
      const db = tenantDb(tenantId);
      db.modifierGroups = backendGroups.map((g) => ({
        id: g.id,
        tenantId: g.tenantId || tenantId,
        name: g.name,
        min: g.min ?? 0,
        max: g.max ?? 1,
        options: (g.options || []).map((o: any) => ({
          id: o.id,
          name: o.name,
          price: Number(o.price) || 0,
        })),
      }));
      commit(tenantId);
    }
  } catch (err) {
    if (!(err instanceof ApiError && err.status === 503)) {
      console.warn("Could not fetch modifier groups from backend, using local store:", err);
    }
  }

  try {
    const backendCombos = await backendFetch<any[]>(`/tenants/${tenantId}/combos`);
    if (Array.isArray(backendCombos)) {
      const db = tenantDb(tenantId);
      db.combos = backendCombos.map((c) => ({
        id: c.id,
        tenantId: c.tenantId || tenantId,
        name: c.name,
        description: c.description ?? "",
        price: Number(c.price) || 0,
        available: c.available ?? true,
        components: (c.components || c.items || []).map((x: any) => ({
          itemId: x.itemId || x.menuItemId,
          qty: x.qty ?? x.quantity ?? 1,
        })),
      }));
      commit(tenantId);
    }
  } catch (err) {
    if (!(err instanceof ApiError && err.status === 503)) {
      console.warn("Could not fetch combos from backend, using local store:", err);
    }
  }

  try {
    const backendItems = await backendFetch<any[]>(`/tenants/${tenantId}/menu-items`);
    if (Array.isArray(backendItems)) {
      const db = tenantDb(tenantId);
      db.menuItems = backendItems.map((item) => ({
        id: item.id,
        tenantId: item.tenantId || tenantId,
        categoryId: item.categoryId,
        name: item.name,
        description: item.description ?? "",
        price: Number(item.effectivePrice ?? item.price) || 0,
        available: item.effectiveAvailable ?? item.available ?? true,
        tags: item.tags ?? [],
        modifierGroupIds: item.modifierGroupIds ?? [],
        variants: (item.variants || []).map((v: any) => ({
          id: v.id,
          name: v.name,
          priceDelta: Number(v.priceDelta) || 0,
        })),
        recipe: [],
      }));
      commit(tenantId);
    }
  } catch (err) {
    if (!(err instanceof ApiError && err.status === 503)) {
      console.warn("Could not fetch menu items from backend, using local store:", err);
    }
  }

  await latency();
  const db = tenantDb(tenantId);
  return { categories: [...db.categories].sort((a, b) => a.sort - b.sort), items: db.menuItems, modifierGroups: db.modifierGroups, combos: db.combos };
}

// ---------- Orders ----------
export interface OrderFilters {
  branchId: string;
  status?: Order["status"] | "active" | "all";
  search?: string;
}

const ACTIVE: Order["status"][] = ["in_kitchen", "ready", "served"];

export async function listOrders(tenantId: string, f: OrderFilters): Promise<Order[]> {
  await latency();
  const q = f.search?.trim().toLowerCase();
  return tenantDb(tenantId)
    .orders.filter((o) => o.branchId === f.branchId)
    .filter((o) =>
      !f.status || f.status === "all" ? true : f.status === "active" ? ACTIVE.includes(o.status) : o.status === f.status,
    )
    .filter((o) => !q || o.number.toLowerCase().includes(q) || o.customerName.toLowerCase().includes(q) || (o.tableName ?? "").toLowerCase().includes(q))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getOrder(tenantId: string, orderId: string): Promise<Order> {
  await latency(80, 200);
  return findOrder(tenantId, orderId);
}

export interface CreateOrderInput {
  branchId: string;
  type: OrderType;
  tableId: string | null;
  customerName: string;
  customerPhone: string;
  lines: OrderLine[];
  discount: Discount | null;
  notes: string;
  createdBy: string;
  deliveryAddress?: string | undefined;
}

export async function createOrder(tenantId: string, input: CreateOrderInput): Promise<Order> {
  await latency(250, 500);
  const tenant = tenantOf(tenantId);
  const db = tenantDb(tenantId);
  if (input.lines.length === 0) throw new ApiError(422, "Add at least one item.");
  let tableName: string | null = null;
  if (input.type === "dine_in") {
    const table = db.tables.find((t) => t.id === input.tableId && t.branchId === input.branchId);
    if (!table) throw new ApiError(422, "Select a table for dine-in orders.");
    if (table.status === "occupied") throw new ApiError(409, `${table.name} already has an open order.`);
    tableName = table.name;
  }
  if (input.type === "delivery" && !(input.deliveryAddress ?? "").trim()) throw new ApiError(422, "Enter a delivery address.");
  if (input.discount?.promoCode) {
    // Re-validate promo codes server-side; the client value is never trusted.
    const subtotal = computeTotals({ lines: input.lines, discount: null, orderType: input.type, taxRate: tenant.taxRate, serviceChargeRate: tenant.serviceChargeRate }).subtotal;
    const promo = checkPromotion(db, input.discount.promoCode, subtotal);
    input = { ...input, discount: { kind: promo.kind, value: promo.value, reason: `Promo ${promo.code}`, promoCode: promo.code } };
    promo.uses += 1;
  }
  db.orderSeq += 1;
  const now = new Date().toISOString();
  const order: Order = {
    id: uid("ord"),
    tenantId,
    branchId: input.branchId,
    number: `#${db.orderSeq}`,
    type: input.type,
    tableId: input.type === "dine_in" ? input.tableId : null,
    tableName,
    customerName: input.customerName,
    customerPhone: input.customerPhone,
    lines: structuredClone(input.lines),
    discount: input.discount ? { ...input.discount } : null,
    notes: input.notes,
    totals: computeTotals({ lines: input.lines, discount: input.discount, orderType: input.type, taxRate: tenant.taxRate, serviceChargeRate: tenant.serviceChargeRate }),
    status: "in_kitchen",
    kitchenStatus: "new",
    payments: [],
    paid: 0,
    refunds: [],
    refunded: 0,
    delivery: input.type === "delivery" ? { address: (input.deliveryAddress ?? "").trim(), riderId: null, riderName: null, status: "pending", dispatchedAt: null, deliveredAt: null } : null,
    inventoryDeducted: false,
    createdBy: input.createdBy,
    createdAt: now,
    sentToKitchenAt: now,
    readyAt: null,
    completedAt: null,
  };
  db.orders.push(order);
  if (order.tableId) {
    const t = db.tables.find((x) => x.id === order.tableId)!;
    t.status = "occupied";
    t.currentOrderId = order.id;
  }
  commit(tenantId);
  return order;
}

export async function addOrderLines(tenantId: string, orderId: string, lines: OrderLine[]): Promise<Order> {
  await latency(200, 400);
  const tenant = tenantOf(tenantId);
  const db = tenantDb(tenantId);
  const order = findOrder(tenantId, orderId);
  if (order.status === "completed" || order.status === "cancelled") {
    throw new ApiError(400, "Cannot add items to a completed or cancelled order.");
  }
  order.lines.push(...structuredClone(lines));
  order.totals = computeTotals({
    lines: order.lines,
    discount: order.discount,
    orderType: order.type,
    taxRate: tenant.taxRate,
    serviceChargeRate: tenant.serviceChargeRate,
  });
  order.sentToKitchenAt = new Date().toISOString();
  order.kitchenStatus = "new";
  commit(tenantId);
  return order;
}

function maybeComplete(tenantId: string, order: Order) {
  const db = tenantDb(tenantId);
  if (order.status === "served" && order.paid >= order.totals.total) {
    order.status = "completed";
    order.completedAt = new Date().toISOString();
    if (order.tableId) {
      const t = db.tables.find((x) => x.id === order.tableId);
      if (t && t.currentOrderId === order.id) {
        t.status = "cleaning";
        t.currentOrderId = null;
      }
    }
  }
}

function deductInventory(tenantId: string, order: Order) {
  if (order.inventoryDeducted) return;
  const db = tenantDb(tenantId);
  // Expand combos into their component items so each recipe is deducted.
  const units: { itemId: string; qty: number }[] = order.lines.flatMap((line) => {
    const combo = db.combos.find((c) => c.id === line.itemId);
    return combo ? combo.components.map((c) => ({ itemId: c.itemId, qty: c.qty * line.qty })) : [{ itemId: line.itemId, qty: line.qty }];
  });
  for (const line of units) {
    const item = db.menuItems.find((m) => m.id === line.itemId);
    if (!item) continue;
    for (const r of item.recipe) {
      const ing = db.ingredients.find((i) => i.branchId === order.branchId && i.key === r.ingredientKey);
      if (!ing) continue;
      const qty = round2(r.qty * line.qty * 1000) / 1000;
      ing.stock = Math.round((ing.stock - qty) * 1000) / 1000;
      const mv: StockMovement = {
        id: uid("mv"),
        tenantId,
        branchId: order.branchId,
        ingredientId: ing.id,
        ingredientName: ing.name,
        qty: -qty,
        unit: ing.unit,
        reason: "sale",
        reference: order.number,
        createdAt: new Date().toISOString(),
      };
      db.movements.unshift(mv);
    }
  }
  order.inventoryDeducted = true;
  const low = db.ingredients.filter((i) => i.branchId === order.branchId && i.stock <= i.reorderLevel);
  if (low.length) {
    db.notifications.unshift({
      id: uid("n"),
      tenantId,
      title: "Low stock",
      body: `${low.map((l) => l.name).slice(0, 3).join(", ")} at or below reorder level.`,
      createdAt: new Date().toISOString(),
      read: false,
    });
  }
}

const KITCHEN_FLOW: Record<KitchenStatus, KitchenStatus | null> = { new: "preparing", preparing: "ready", ready: "bumped", bumped: null };

export async function advanceKitchen(tenantId: string, orderId: string): Promise<Order> {
  await latency(100, 250);
  const order = findOrder(tenantId, orderId);
  if (order.status === "cancelled") throw new ApiError(409, "Order was cancelled.");
  const next = KITCHEN_FLOW[order.kitchenStatus];
  if (!next) throw new ApiError(409, "Ticket already bumped.");
  order.kitchenStatus = next;
  if (next === "ready") {
    order.readyAt = new Date().toISOString();
    if (order.status === "in_kitchen") order.status = "ready";
  }
  commit(tenantId);
  return order;
}

export async function markServed(tenantId: string, orderId: string): Promise<Order> {
  await latency(100, 250);
  const order = findOrder(tenantId, orderId);
  if (order.status !== "ready") throw new ApiError(409, "Only ready orders can be served.");
  order.status = "served";
  if (order.kitchenStatus === "ready") order.kitchenStatus = "bumped";
  maybeComplete(tenantId, order);
  commit(tenantId);
  return order;
}

export interface PaymentInput {
  method: PaymentMethod;
  amount: number;
  tendered: number;
  reference: string;
}

export async function addPayment(tenantId: string, orderId: string, input: PaymentInput): Promise<Order> {
  await latency(400, 800);
  const order = findOrder(tenantId, orderId);
  if (order.status === "cancelled") throw new ApiError(409, "Cannot pay a cancelled order.");
  const due = round2(order.totals.total - order.paid);
  if (due <= 0) throw new ApiError(409, "Order is already paid.");
  const amount = round2(Math.min(input.amount, due));
  if (amount <= 0) throw new ApiError(422, "Enter an amount greater than zero.");
  if (input.method === "cash" && input.tendered < amount) throw new ApiError(422, "Cash tendered is less than the amount.");
  order.payments.push({
    id: uid("pay"),
    method: input.method,
    amount,
    tendered: input.method === "cash" ? input.tendered : amount,
    change: input.method === "cash" ? round2(input.tendered - amount) : 0,
    reference: input.reference,
    at: new Date().toISOString(),
  });
  order.paid = round2(order.paid + amount);
  if (order.paid >= order.totals.total) {
    deductInventory(tenantId, order);
    awardLoyalty(tenantDb(tenantId), order);
  }
  maybeComplete(tenantId, order);
  commit(tenantId);
  return order;
}

export async function cancelOrder(tenantId: string, orderId: string, reason: string): Promise<Order> {
  await latency();
  const order = findOrder(tenantId, orderId);
  if (order.status === "completed") throw new ApiError(409, "Completed orders cannot be voided.");
  if (round2(order.paid - order.refunded) > 0) throw new ApiError(409, "Refund all payments before voiding.");
  order.status = "cancelled";
  order.notes = [order.notes, `Voided: ${reason}`].filter(Boolean).join("\n");
  const db = tenantDb(tenantId);
  if (order.tableId) {
    const t = db.tables.find((x) => x.id === order.tableId);
    if (t && t.currentOrderId === order.id) {
      t.status = "available";
      t.currentOrderId = null;
    }
  }
  commit(tenantId);
  return order;
}

// ---------- Tables ----------
export async function listTables(tenantId: string, branchId: string): Promise<DiningTable[]> {
  await latency(80, 200);
  return tenantDb(tenantId).tables.filter((t) => t.branchId === branchId);
}

export async function setTableStatus(tenantId: string, tableId: string, status: TableStatus): Promise<DiningTable> {
  await latency(80, 200);
  const t = tenantDb(tenantId).tables.find((x) => x.id === tableId);
  if (!t) throw new ApiError(404, "Table not found.");
  if (t.status === "occupied") throw new ApiError(409, "Close the open order before changing this table.");
  if (status === "occupied") throw new ApiError(422, "Tables become occupied when an order is opened.");
  t.status = status;
  commit(tenantId);
  return t;
}

export interface CreateTableInput {
  branchId: string;
  name: string;
  seats: number;
  area: string;
  shape: "square" | "round" | "long";
}

export async function createTable(tenantId: string, input: CreateTableInput): Promise<DiningTable> {
  await latency(120, 250);
  const db = tenantDb(tenantId);
  const trimmedName = input.name.trim();
  const exists = db.tables.find(
    (t) => t.branchId === input.branchId && t.name.toLowerCase() === trimmedName.toLowerCase(),
  );
  if (exists) {
    throw new ApiError(409, `Table "${trimmedName}" already exists in this branch.`);
  }
  const table: DiningTable = {
    id: `${input.branchId}_tbl_${uid("tbl")}`,
    tenantId,
    branchId: input.branchId,
    name: trimmedName,
    seats: input.seats || 4,
    area: input.area.trim() || "Main hall",
    status: "available",
    currentOrderId: null,
    x: 0,
    y: 0,
    shape: input.shape || "square",
  };
  db.tables.push(table);
  commit(tenantId);
  return table;
}

// ---------- Inventory ----------
export async function listIngredients(tenantId: string, branchId: string): Promise<Ingredient[]> {
  try {
    const qs = branchId ? `?branchId=${encodeURIComponent(branchId)}` : "";
    const backendIngs = await backendFetch<any[]>(`/tenants/${tenantId}/inventory/ingredients${qs}`);
    if (Array.isArray(backendIngs)) {
      const db = tenantDb(tenantId);
      const mapped: Ingredient[] = backendIngs.map((ing) => ({
        id: ing.id,
        tenantId: ing.tenantId || tenantId,
        branchId: ing.branchId || branchId,
        key: ing.key || ing.id,
        name: ing.name,
        unit: ing.unit,
        stock: Number(ing.stock) || 0,
        reorderLevel: Number(ing.reorderLevel) || 0,
        unitCost: Number(ing.unitCost) || 0,
      }));
      db.ingredients = [
        ...db.ingredients.filter((x) => x.branchId !== branchId),
        ...mapped,
      ];
      commit(tenantId);
      return mapped;
    }
  } catch (err) {
    if (!(err instanceof ApiError && err.status === 503)) {
      console.warn("Could not fetch ingredients from backend, using local store:", err);
    }
  }

  await latency();
  return tenantDb(tenantId).ingredients.filter((i) => i.branchId === branchId);
}

export async function listMovements(tenantId: string, branchId: string): Promise<StockMovement[]> {
  await latency();
  return tenantDb(tenantId).movements.filter((m) => m.branchId === branchId).slice(0, 100);
}

// ---------- Notifications ----------
export async function listNotifications(tenantId: string): Promise<Notification[]> {
  await latency(60, 150);
  return tenantDb(tenantId).notifications.slice(0, 20);
}

export async function markNotificationsRead(tenantId: string): Promise<{ ok: true }> {
  await latency(60, 120);
  tenantDb(tenantId).notifications.forEach((n) => (n.read = true));
  commit(tenantId);
  return { ok: true };
}

// ---------- Dashboard ----------
export interface DashboardSummary {
  todaySales: number;
  todayOrders: number;
  avgTicket: number;
  activeOrders: number;
  kitchenQueue: number;
  occupiedTables: number;
  totalTables: number;
  salesByDay: { date: string; sales: number; orders: number }[];
  topItems: { name: string; qty: number; revenue: number }[];
  lowStock: Ingredient[];
  recentOrders: Order[];
}

export async function getDashboard(tenantId: string, branchId: string): Promise<DashboardSummary> {
  await latency(200, 400);
  const db = tenantDb(tenantId);
  const orders = db.orders.filter((o) => o.branchId === branchId && o.status !== "cancelled");
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const paidToday = orders.filter((o) => o.paid > 0 && o.createdAt >= startOfDay.toISOString());
  const todaySales = round2(paidToday.reduce((s, o) => s + o.paid, 0));
  const days: DashboardSummary["salesByDay"] = [];
  for (let d = 6; d >= 0; d--) {
    const start = new Date(startOfDay.getTime() - d * 86400000);
    const end = new Date(start.getTime() + 86400000);
    const inDay = orders.filter((o) => o.createdAt >= start.toISOString() && o.createdAt < end.toISOString());
    days.push({ date: start.toISOString(), sales: round2(inDay.reduce((s, o) => s + o.paid, 0)), orders: inDay.length });
  }
  const itemMap = new Map<string, { name: string; qty: number; revenue: number }>();
  for (const o of orders) for (const l of o.lines) {
    const e = itemMap.get(l.itemId) ?? { name: l.name, qty: 0, revenue: 0 };
    e.qty += l.qty;
    e.revenue = round2(e.revenue + l.unitPrice * l.qty);
    itemMap.set(l.itemId, e);
  }
  const tables = db.tables.filter((t) => t.branchId === branchId);
  return {
    todaySales,
    todayOrders: paidToday.length,
    avgTicket: paidToday.length ? round2(todaySales / paidToday.length) : 0,
    activeOrders: orders.filter((o) => ACTIVE.includes(o.status)).length,
    kitchenQueue: orders.filter((o) => o.kitchenStatus === "new" || o.kitchenStatus === "preparing").length,
    occupiedTables: tables.filter((t) => t.status === "occupied").length,
    totalTables: tables.length,
    salesByDay: days,
    topItems: [...itemMap.values()].sort((a, b) => b.qty - a.qty).slice(0, 5),
    lowStock: db.ingredients.filter((i) => i.branchId === branchId && i.stock <= i.reorderLevel),
    recentOrders: [...orders].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 6),
  };
}
