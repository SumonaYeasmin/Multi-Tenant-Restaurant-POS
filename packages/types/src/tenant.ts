export type RoleId = "owner" | "manager" | "cashier" | "kitchen" | "waiter";

export type ActivationStatus = "active" | "grace" | "inactive";

export interface Tenant {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  initials: string;
  accent: string;
  currency: string;
  locale: string;
  taxRate: number;
  serviceChargeRate: number;
  receiptFooter: string;
}

export interface Branch {
  id: string;
  tenantId: string;
  name: string;
  address: string;
  phone: string;
}

export interface Membership {
  tenantId: string;
  role: RoleId;
  branchIds: string[] | "all";
}

export interface User {
  id: string;
  name: string;
  email: string;
  initials: string;
  memberships: Membership[];
}

export interface Activation {
  tenantId: string;
  status: ActivationStatus;
  checkedAt: string;
  validUntil: string | null;
  message: string;
}

export interface TenantSettings {
  tenantId: string;
  allowManualDiscount: boolean;
  maxDiscountPercent: number;
  requireTableForDineIn: boolean;
  autoSendKitchen: boolean;
  printReceiptOnPayment: boolean;
  soundAlerts: boolean;
  defaultOrderType: string;
  taxRate: number;
  serviceChargeRate: number;
}
