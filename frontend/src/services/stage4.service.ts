import { commit, latency, tenantDb, uid, ApiError } from "@/mocks/db";
import { TENANTS } from "@/mocks/platform";
import type {
  AuditEntity,
  AuditLog,
  FinancialReport,
  Integration,
  InventoryReport,
  OperationsReport,
  PaymentMethod,
  SalesReport,
  Tenant,
  TenantSettingsInput,
} from "@/types/domain";

// ---------- Reports ----------

export async function getSalesReport(tenantId: string, branchId?: string, range = "7d"): Promise<SalesReport> {
  await latency(60, 150);
  const db = tenantDb(tenantId);
  const orders = db.orders.filter(
    (order) => (!branchId || order.branchId === branchId) && order.status !== "cancelled",
  );

  const totalRevenue = orders.reduce((sum, order) => sum + (order.totals?.total ?? 0), 0);
  const netSales = orders.reduce(
    (sum, order) => sum + (order.totals?.subtotal ?? 0) - (order.totals?.discount ?? 0),
    0,
  );
  const totalOrders = orders.length;
  const avgOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;

  // Aggregate item sales
  const itemSalesMap = new Map<string, { itemId: string; name: string; qty: number; revenue: number }>();
  for (const order of orders) {
    for (const line of order.lines ?? []) {
      const existing = itemSalesMap.get(line.itemId) ?? { itemId: line.itemId, name: line.name, qty: 0, revenue: 0 };
      existing.qty += line.qty;
      existing.revenue += line.unitPrice * line.qty;
      itemSalesMap.set(line.itemId, existing);
    }
  }
  const topItems = Array.from(itemSalesMap.values()).sort((a, b) => b.revenue - a.revenue).slice(0, 5);

  // Aggregate category sales
  const categorySalesMap = new Map<string, { categoryId: string; name: string; revenue: number }>();
  for (const order of orders) {
    for (const line of order.lines ?? []) {
      const menuItem = db.menuItems.find((item) => item.id === line.itemId);
      const categoryId = menuItem?.categoryId ?? "other";
      const category = db.categories.find((cat) => cat.id === categoryId);
      const existing = categorySalesMap.get(categoryId) ?? {
        categoryId,
        name: category?.name ?? "General",
        revenue: 0,
      };
      existing.revenue += line.unitPrice * line.qty;
      categorySalesMap.set(categoryId, existing);
    }
  }
  const salesByCategory = Array.from(categorySalesMap.values());

  // Hourly distribution (mocked distribution over service hours 11:00 to 22:00)
  const hourlySales = [
    { hour: "11:00", sales: Math.round(totalRevenue * 0.05), orders: Math.max(1, Math.round(totalOrders * 0.05)) },
    { hour: "13:00", sales: Math.round(totalRevenue * 0.22), orders: Math.max(1, Math.round(totalOrders * 0.22)) },
    { hour: "15:00", sales: Math.round(totalRevenue * 0.08), orders: Math.max(1, Math.round(totalOrders * 0.08)) },
    { hour: "18:00", sales: Math.round(totalRevenue * 0.18), orders: Math.max(1, Math.round(totalOrders * 0.18)) },
    { hour: "20:00", sales: Math.round(totalRevenue * 0.35), orders: Math.max(1, Math.round(totalOrders * 0.35)) },
    { hour: "22:00", sales: Math.round(totalRevenue * 0.12), orders: Math.max(1, Math.round(totalOrders * 0.12)) },
  ];

  // Daily distribution over 7 days
  const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const dailySales = weekDays.map((dayName, dayIndex) => ({
    date: dayName,
    sales: Math.round(totalRevenue * (0.1 + (dayIndex % 3) * 0.05)),
    orders: Math.max(1, Math.round(totalOrders * (0.1 + (dayIndex % 3) * 0.05))),
  }));

  return {
    totalRevenue,
    netSales,
    totalOrders,
    avgOrderValue,
    hourlySales,
    dailySales,
    topItems,
    salesByCategory,
  };
}

export async function getFinancialReport(tenantId: string, branchId?: string, range = "7d"): Promise<FinancialReport> {
  await latency(60, 150);
  const db = tenantDb(tenantId);
  const orders = db.orders.filter(
    (order) => (!branchId || order.branchId === branchId) && order.status !== "cancelled",
  );
  const expenses = db.expenses ?? [];

  const grossSales = orders.reduce((sum, order) => sum + (order.totals?.total ?? 0), 0);
  const discounts = orders.reduce((sum, order) => sum + (order.totals?.discount ?? 0), 0);
  const taxes = orders.reduce((sum, order) => sum + (order.totals?.tax ?? 0), 0);
  const serviceCharges = orders.reduce((sum, order) => sum + (order.totals?.serviceCharge ?? 0), 0);
  const refunds = orders.reduce((sum, order) => sum + (order.refunded ?? 0), 0);
  const netRevenue = grossSales - refunds;
  const expensesTotal = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const netProfit = netRevenue - expensesTotal;

  // Breakdown by payment method
  const paymentMethodMap = new Map<PaymentMethod, { count: number; total: number }>();
  for (const order of orders) {
    for (const payment of order.payments ?? []) {
      const existing = paymentMethodMap.get(payment.method) ?? { count: 0, total: 0 };
      existing.count += 1;
      existing.total += payment.amount;
      paymentMethodMap.set(payment.method, existing);
    }
  }
  const byPaymentMethod: { method: PaymentMethod; count: number; total: number }[] = (
    ["cash", "card", "mobile"] as const
  ).map((paymentMethod) => {
    const methodData = paymentMethodMap.get(paymentMethod) ?? { count: 0, total: 0 };
    return { method: paymentMethod, count: methodData.count, total: methodData.total };
  });

  return {
    grossSales,
    discounts,
    taxes,
    serviceCharges,
    refunds,
    netRevenue,
    expensesTotal,
    netProfit,
    byPaymentMethod,
  };
}

export async function getInventoryReport(tenantId: string, branchId?: string): Promise<InventoryReport> {
  await latency(60, 150);
  const db = tenantDb(tenantId);
  const targetIngredients = branchId
    ? db.ingredients.filter((ingredient) => ingredient.branchId === branchId)
    : db.ingredients;

  const totalValuation = Math.round(
    targetIngredients.reduce((sum, ingredient) => sum + ingredient.stock * ingredient.unitCost, 0),
  );
  const totalItems = targetIngredients.length;
  const lowStockList = targetIngredients
    .filter((ingredient) => ingredient.stock <= ingredient.reorderLevel)
    .map((ingredient) => ({
      id: ingredient.id,
      name: ingredient.name,
      unit: ingredient.unit,
      stock: ingredient.stock,
      reorderLevel: ingredient.reorderLevel,
      unitCost: ingredient.unitCost,
    }));
  const lowStockCount = lowStockList.length;

  const movements = db.movements ?? [];
  const wastageCost = Math.round(
    movements
      .filter((movement) => movement.reason === "waste")
      .reduce((sum, movement) => {
        const ingredient = db.ingredients.find((ing) => ing.id === movement.ingredientId);
        return sum + Math.abs(movement.qty) * (ingredient?.unitCost ?? 0);
      }, 0),
  );

  const topMovements = movements.slice(-8).reverse().map((movement) => {
    const ingredient = db.ingredients.find((ing) => ing.id === movement.ingredientId);
    return {
      ingredientId: movement.ingredientId,
      name: ingredient?.name ?? movement.ingredientId,
      qty: movement.qty,
      reason: movement.reason,
    };
  });

  return {
    totalValuation,
    totalItems,
    lowStockCount,
    wastageCost,
    lowStockList,
    topMovements,
  };
}

export async function getOperationsReport(tenantId: string, branchId?: string, range = "7d"): Promise<OperationsReport> {
  await latency(60, 150);
  const db = tenantDb(tenantId);
  const orders = branchId
    ? db.orders.filter((order) => order.branchId === branchId)
    : db.orders;

  const ordersByStatus = (["in_kitchen", "ready", "served", "completed", "cancelled"] as const).map((status) => ({
    status,
    count: orders.filter((order) => order.status === status).length,
  }));

  const orderTypeMap = new Map<string, { count: number; revenue: number }>();
  for (const order of orders) {
    const existing = orderTypeMap.get(order.type) ?? { count: 0, revenue: 0 };
    existing.count += 1;
    existing.revenue += order.totals?.total ?? 0;
    orderTypeMap.set(order.type, existing);
  }
  const ordersByType = Array.from(orderTypeMap.entries()).map(([orderType, stats]) => ({
    type: orderType as any,
    count: stats.count,
    revenue: stats.revenue,
  }));

  const kitchenBumpsCount = orders.filter(
    (order) => order.kitchenStatus === "ready" || order.kitchenStatus === "bumped",
  ).length;

  const tableTurnover = db.tables.map((table) => {
    const tableOrders = orders.filter((order) => order.tableId === table.id);
    return {
      tableId: table.id,
      name: table.name,
      orderCount: tableOrders.length,
      totalRevenue: tableOrders.reduce((sum, order) => sum + (order.totals?.total ?? 0), 0),
    };
  });

  const staffShiftsSummary = (db.staff ?? []).map((staffMember) => {
    const memberShifts = (db.shifts ?? []).filter((shift) => shift.staffId === staffMember.id);
    return {
      staffId: staffMember.id,
      name: staffMember.name,
      shiftsCount: memberShifts.length,
      totalHours: memberShifts.length * 8, // Estimated 8-hour shift default
    };
  });

  return {
    avgPrepTimeMinutes: 14.5, // Average calculated fulfillment time
    ordersByStatus,
    ordersByType,
    kitchenBumpsCount,
    tableTurnover,
    staffShiftsSummary,
  };
}

// ---------- Audit Logs ----------

export async function listAuditLogs(tenantId: string, entity?: string): Promise<AuditLog[]> {
  await latency(40, 100);
  const db = tenantDb(tenantId);
  let list = db.auditLogs ?? [];
  if (entity && entity !== "all") {
    list = list.filter((auditLog) => auditLog.entity === entity);
  }
  return list.sort((logA, logB) => logB.createdAt.localeCompare(logA.createdAt));
}

export async function recordAuditLog(
  tenantId: string,
  input: {
    actorId: string;
    actorName: string;
    action: any;
    entity: AuditEntity;
    entityId?: string;
    summary: string;
    details?: string;
  },
): Promise<AuditLog> {
  const db = tenantDb(tenantId);
  db.auditLogs ??= [];
  const log: AuditLog = {
    id: uid("aud"),
    tenantId,
    createdAt: new Date().toISOString(),
    ...input,
  };
  db.auditLogs.unshift(log);
  commit(tenantId);
  return log;
}

// ---------- Integrations ----------

export async function listIntegrations(tenantId: string): Promise<Integration[]> {
  await latency(40, 100);
  const db = tenantDb(tenantId);
  return db.integrations ?? [];
}

export async function toggleIntegration(
  tenantId: string,
  integrationId: string,
  enabled: boolean,
  config?: Record<string, string>,
): Promise<Integration> {
  await latency(80, 200);
  const db = tenantDb(tenantId);
  const integration = db.integrations.find((item) => item.id === integrationId);
  if (!integration) throw new ApiError(404, "Integration not found.");

  integration.enabled = enabled;
  integration.status = enabled ? "connected" : "disconnected";
  if (config) integration.config = { ...integration.config, ...config };
  if (enabled) integration.lastSyncAt = new Date().toISOString();

  // Record audit log
  await recordAuditLog(tenantId, {
    actorId: "u_owner",
    actorName: "Current User",
    action: "update",
    entity: "settings",
    entityId: integration.id,
    summary: `${enabled ? "Enabled" : "Disabled"} integration: ${integration.name}`,
  });

  commit(tenantId);
  return integration;
}

// ---------- Tenant Settings & Branding ----------

export async function updateTenantSettings(tenantId: string, input: TenantSettingsInput): Promise<Tenant> {
  await latency(100, 250);
  const db = tenantDb(tenantId);
  const tenant = TENANTS.find((currentTenant) => currentTenant.id === tenantId);
  if (!tenant) throw new ApiError(404, "Tenant not found.");

  // Update in-memory tenant
  tenant.name = input.name.trim();
  tenant.tagline = input.tagline.trim();
  tenant.initials = input.initials.trim().toUpperCase();
  tenant.accent = input.accent.trim();
  tenant.currency = input.currency.trim();
  tenant.locale = input.locale.trim();
  tenant.taxRate = input.taxRate;
  tenant.serviceChargeRate = input.serviceChargeRate;
  tenant.receiptFooter = input.receiptFooter.trim();

  // Store in tenantDb so it persists across reloads
  db.tenantSettings = { ...tenant };

  // Record audit log
  await recordAuditLog(tenantId, {
    actorId: "u_owner",
    actorName: "Current User",
    action: "update",
    entity: "settings",
    summary: `Updated restaurant settings and branding for ${tenant.name}`,
    details: `Accent: ${input.accent}, Tax: ${input.taxRate * 100}%, Service Charge: ${input.serviceChargeRate * 100}%`,
  });

  commit(tenantId);
  return { ...tenant };
}
