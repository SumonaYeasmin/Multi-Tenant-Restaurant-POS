import { commit, latency, tenantDb, uid, ApiError } from "@/mocks/db";
import { TENANTS } from "@/mocks/platform";
import { backendFetch } from "./api-client";
import type {
  AuditEntity,
  AuditLog,
  AuditLogQueryParams,
  AuditLogStats,
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

export async function listAuditLogs(
  tenantId: string,
  queryOrEntity?: string | AuditLogQueryParams,
): Promise<AuditLog[]> {
  const query: AuditLogQueryParams =
    typeof queryOrEntity === "string"
      ? { entity: queryOrEntity }
      : (queryOrEntity ?? {});

  try {
    const params = new URLSearchParams();
    if (query.entity && query.entity !== "all") params.append("entity", query.entity);
    if (query.action && query.action !== "all") params.append("action", query.action);
    if (query.branchId && query.branchId !== "all") params.append("branchId", query.branchId);
    if (query.search?.trim()) params.append("search", query.search.trim());
    if (query.startDate) params.append("startDate", query.startDate);
    if (query.endDate) params.append("endDate", query.endDate);
    if (query.page) params.append("page", String(query.page));
    if (query.limit) params.append("limit", String(query.limit));

    const qs = params.toString() ? `?${params.toString()}` : "";
    const res = await backendFetch<AuditLog[] | { success: boolean; data: AuditLog[] }>(
      `/tenants/${tenantId}/audit-logs${qs}`,
    );

    const rawLogs = Array.isArray(res) ? res : (res as any)?.data;
    if (Array.isArray(rawLogs)) {
      const mapped: AuditLog[] = rawLogs.map((l: any) => ({
        id: l.id,
        tenantId: l.tenantId || tenantId,
        branchId: l.branchId ?? null,
        actorId: l.actorId ?? null,
        actorName: l.actorName || "System",
        actorRole: l.actorRole ?? null,
        action: l.action,
        entity: l.entity,
        entityId: l.entityId ?? null,
        summary: l.summary,
        details: l.details ?? null,
        metadata: l.metadata ?? null,
        ipAddress: l.ipAddress ?? null,
        userAgent: l.userAgent ?? null,
        createdAt: l.createdAt,
      }));

      // Cache / sync latest to tenantDb so offline fallback stays updated
      const db = tenantDb(tenantId);
      if (!query.entity || query.entity === "all") {
        db.auditLogs = mapped;
      }
      return mapped;
    }
  } catch (err) {
    if (!(err instanceof ApiError && err.status === 503)) {
      console.warn("Could not fetch audit logs from backend, falling back to local store:", err);
    }
  }

  // Fallback to local in-memory store
  await latency(40, 100);
  const db = tenantDb(tenantId);
  let list = db.auditLogs ?? [];
  if (query.entity && query.entity !== "all") {
    list = list.filter((auditLog) => auditLog.entity === query.entity);
  }
  if (query.action && query.action !== "all") {
    list = list.filter((auditLog) => auditLog.action === query.action);
  }
  if (query.search?.trim()) {
    const s = query.search.trim().toLowerCase();
    list = list.filter(
      (l) =>
        l.summary.toLowerCase().includes(s) ||
        l.actorName.toLowerCase().includes(s) ||
        (l.details && l.details.toLowerCase().includes(s)),
    );
  }
  return [...list].sort((logA, logB) => logB.createdAt.localeCompare(logA.createdAt));
}

export async function recordAuditLog(
  tenantId: string,
  input: {
    actorId?: string;
    actorName: string;
    actorRole?: string;
    action: any;
    entity: AuditEntity | string;
    entityId?: string;
    summary: string;
    details?: string;
    branchId?: string;
    metadata?: Record<string, unknown>;
  },
): Promise<AuditLog> {
  try {
    const res = await backendFetch<AuditLog | { success: boolean; data: AuditLog }>(
      `/tenants/${tenantId}/audit-logs`,
      {
        method: "POST",
        body: JSON.stringify({
          actorId: input.actorId,
          actorName: input.actorName?.trim() || "Current User",
          actorRole: input.actorRole,
          action: input.action,
          entity: input.entity,
          entityId: input.entityId,
          summary: input.summary?.trim(),
          details: input.details?.trim() || "",
          branchId: input.branchId,
          metadata: input.metadata,
        }),
      },
    );

    const saved = "id" in (res as any) ? (res as AuditLog) : (res as any)?.data;
    if (saved?.id) {
      const mapped: AuditLog = {
        id: saved.id,
        tenantId: saved.tenantId || tenantId,
        branchId: saved.branchId ?? input.branchId ?? null,
        actorId: saved.actorId ?? input.actorId ?? null,
        actorName: saved.actorName || input.actorName || "Current User",
        actorRole: saved.actorRole ?? input.actorRole ?? null,
        action: saved.action,
        entity: saved.entity,
        entityId: saved.entityId ?? input.entityId ?? null,
        summary: saved.summary,
        details: saved.details ?? input.details ?? null,
        metadata: saved.metadata ?? input.metadata ?? null,
        ipAddress: saved.ipAddress ?? null,
        userAgent: saved.userAgent ?? null,
        createdAt: saved.createdAt || new Date().toISOString(),
      };
      const db = tenantDb(tenantId);
      db.auditLogs ??= [];
      db.auditLogs.unshift(mapped);
      commit(tenantId);
      return mapped;
    }
  } catch (err) {
    if (!(err instanceof ApiError && err.status === 503)) {
      console.warn("Could not record audit log to backend, falling back to local store:", err);
    }
  }

  // Fallback to local mock store
  const db = tenantDb(tenantId);
  db.auditLogs ??= [];
  const log: AuditLog = {
    id: uid("aud"),
    tenantId,
    createdAt: new Date().toISOString(),
    actorId: input.actorId || "u_owner",
    actorName: input.actorName || "Current User",
    actorRole: input.actorRole || "OWNER",
    action: input.action,
    entity: input.entity,
    entityId: input.entityId,
    summary: input.summary,
    details: input.details,
    metadata: input.metadata,
  };
  db.auditLogs.unshift(log);
  commit(tenantId);
  return log;
}

export async function getAuditLogStats(tenantId: string): Promise<AuditLogStats> {
  try {
    const res = await backendFetch<AuditLogStats | { success: boolean; data: AuditLogStats }>(
      `/tenants/${tenantId}/audit-logs/stats`,
    );
    const stats = (res as any)?.data ?? res;
    if (stats && typeof stats.total === "number") {
      return stats;
    }
  } catch (err) {
    if (!(err instanceof ApiError && err.status === 503)) {
      console.warn("Could not fetch audit log stats from backend, falling back to local store:", err);
    }
  }

  const db = tenantDb(tenantId);
  const logs = db.auditLogs ?? [];
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const today = logs.filter((l) => new Date(l.createdAt) >= startOfDay).length;
  const criticalCount = logs.filter((l) => ["void", "refund", "delete"].includes(l.action)).length;
  const byEntity: Record<string, number> = {};
  for (const l of logs) {
    byEntity[l.entity] = (byEntity[l.entity] || 0) + 1;
  }

  return {
    total: logs.length,
    today,
    criticalCount,
    byEntity,
  };
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
