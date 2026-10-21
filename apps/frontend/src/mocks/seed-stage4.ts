import type { AuditLog, Integration, Tenant } from "@/types/domain";

export interface Stage4Data {
  auditLogs: AuditLog[];
  integrations: Integration[];
  tenantSettings?: Partial<Tenant>;
}

export function buildStage4(tenantId: string): Stage4Data {
  const currentTimestamp = new Date();
  const createIsoTimestampHoursAgo = (hoursAgo: number) =>
    new Date(currentTimestamp.getTime() - hoursAgo * 3600000).toISOString();
  const tenantPrefix = tenantId.replace(/^t_/, "").slice(0, 3);

  const auditLogs: AuditLog[] = [
    {
      id: `${tenantPrefix}_audit_001`,
      tenantId,
      actorId: "u_owner",
      actorName: "Nadia Rahman",
      action: "create",
      entity: "order",
      entityId: "ord_101",
      summary: "Placed new Dine-in Order #SE-101 (Table 4)",
      details: "Lines: 2x Mixed Grill, 1x Naan. Total: 1,450",
      createdAt: createIsoTimestampHoursAgo(1.5),
    },
    {
      id: `${tenantPrefix}_audit_002`,
      tenantId,
      actorId: "u_owner",
      actorName: "Nadia Rahman",
      action: "payment",
      entity: "payment",
      entityId: "pay_101",
      summary: "Received Cash Payment of 1,500 for Order #SE-101",
      details: "Tendered: 1,500, Change: 50",
      createdAt: createIsoTimestampHoursAgo(1.2),
    },
    {
      id: `${tenantPrefix}_audit_003`,
      tenantId,
      actorId: "u_owner",
      actorName: "Nadia Rahman",
      action: "stock_adjust",
      entity: "inventory",
      entityId: "ing_chicken",
      summary: "Stock deducted automatically on meal checkout",
      details: "Item: Chicken thigh (-1.5 kg)",
      createdAt: createIsoTimestampHoursAgo(1.1),
    },
    {
      id: `${tenantPrefix}_audit_004`,
      tenantId,
      actorId: "u_owner",
      actorName: "Nadia Rahman",
      action: "status_change",
      entity: "table",
      entityId: "tbl_4",
      summary: "Table 4 status changed to Available",
      details: "Billed and cleared",
      createdAt: createIsoTimestampHoursAgo(0.8),
    },
    {
      id: `${tenantPrefix}_audit_005`,
      tenantId,
      actorId: "u_owner",
      actorName: "Nadia Rahman",
      action: "update",
      entity: "menu",
      entityId: "m_item_1",
      summary: "Updated price for 'Saffron Special Biryani'",
      details: "New price: 680 (was 650)",
      createdAt: createIsoTimestampHoursAgo(5),
    },
    {
      id: `${tenantPrefix}_audit_006`,
      tenantId,
      actorId: "u_owner",
      actorName: "Nadia Rahman",
      action: "refund",
      entity: "payment",
      entityId: "ref_1",
      summary: "Processed partial refund of 200 on Order #SE-098",
      details: "Reason: Customer requested spicy level adjustment",
      createdAt: createIsoTimestampHoursAgo(8),
    },
  ];

  const integrations: Integration[] = [
    {
      id: "int_stripe",
      tenantId,
      key: "stripe",
      name: "Stripe Terminal & Card Payments",
      category: "payments",
      description: "Accept EMV chip cards, contactless Apple Pay and Google Pay directly on POS.",
      icon: "CreditCard",
      enabled: true,
      config: {
        publishableKey: "pk_test_sample_51O..." ,
        locationId: "loc_demo_terminal_1",
      },
      lastSyncAt: createIsoTimestampHoursAgo(0.5),
      status: "connected",
    },
    {
      id: "int_bkash",
      tenantId,
      key: "bkash",
      name: "bKash / Nagad Dynamic QR",
      category: "payments",
      description: "Instant mobile wallet QR generation on billing screen with instant payment notification.",
      icon: "QrCode",
      enabled: true,
      config: {
        merchantNumber: "01700000000",
        terminalId: "TERM-09",
      },
      lastSyncAt: createIsoTimestampHoursAgo(1),
      status: "connected",
    },
    {
      id: "int_ubereats",
      tenantId,
      key: "ubereats",
      name: "Uber Eats / Foodpanda Bridge",
      category: "delivery",
      description: "Directly ingest delivery platform orders straight into the Kitchen Display System (KDS).",
      icon: "Bike",
      enabled: true,
      config: {
        storeId: "store_se_gulshan_live",
        autoAccept: "true",
      },
      lastSyncAt: createIsoTimestampHoursAgo(0.2),
      status: "connected",
    },
    {
      id: "int_doordash",
      tenantId,
      key: "doordash",
      name: "DoorDash Drive & Dispatch",
      category: "delivery",
      description: "Request on-demand third party delivery drivers for in-house delivery orders.",
      icon: "Truck",
      enabled: false,
      config: {
        developerId: "",
        keyId: "",
      },
      lastSyncAt: null,
      status: "disconnected",
    },
    {
      id: "int_xero",
      tenantId,
      key: "xero",
      name: "Xero Cloud Accounting",
      category: "accounting",
      description: "Sync daily sales totals, tax summaries, payment methods and expenses automatically at shift close.",
      icon: "FileSpreadsheet",
      enabled: false,
      config: {
        tenantId: "",
        bankAccountId: "",
      },
      lastSyncAt: null,
      status: "disconnected",
    },
    {
      id: "int_twilio",
      tenantId,
      key: "twilio",
      name: "Twilio SMS & WhatsApp Gateway",
      category: "notifications",
      description: "Send automated SMS alerts for table reservation confirmations and order delivery updates.",
      icon: "MessageSquare",
      enabled: true,
      config: {
        senderId: "SE-RESTAURANT",
        autoReceiptSms: "true",
      },
      lastSyncAt: createIsoTimestampHoursAgo(3),
      status: "connected",
    },
  ];

  return {
    auditLogs,
    integrations,
    tenantSettings: {},
  };
}
