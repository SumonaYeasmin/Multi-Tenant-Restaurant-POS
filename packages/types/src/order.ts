export type OrderType = "dine_in" | "takeaway" | "delivery" | "pickup" | "counter";

export enum OrderTypeEnum {
  DINE_IN = "DINE_IN",
  TAKEAWAY = "TAKEAWAY",
  DELIVERY = "DELIVERY",
  PICKUP = "PICKUP",
  COUNTER = "COUNTER",
}

export type OrderStatus = "open" | "paid" | "completed" | "cancelled" | "refunded";

export type KitchenStatus = "pending" | "preparing" | "ready" | "served" | "cancelled";

export interface OrderModifier {
  groupId: string;
  optionId: string;
  name: string;
  price: number;
}

export interface OrderLine {
  id: string;
  menuItemId: string;
  name: string;
  variantId?: string | null;
  variantName?: string | null;
  unitPrice: number;
  qty: number;
  notes?: string;
  modifiers: OrderModifier[];
  kitchenStatus: KitchenStatus;
}

export interface Discount {
  kind: "percent" | "amount";
  value: number;
  reason: string;
}

export interface Totals {
  subtotal: number;
  discount: number;
  serviceCharge: number;
  tax: number;
  total: number;
}

export interface Order {
  id: string;
  tenantId: string;
  branchId: string;
  orderNumber: string;
  type: OrderType;
  tableId: string | null;
  tableName: string | null;
  status: OrderStatus;
  lines: OrderLine[];
  discount: Discount | null;
  totals: Totals;
  paidAmount: number;
  changeDue: number;
  notes: string;
  createdAt: string;
  updatedAt: string;
  customerName?: string;
  customerPhone?: string;
  deliveryAddress?: string;
  createdBy: string;
}

/**
 * Universal Contract for creating an order across REST API DTOs and Frontend Payloads.
 */
export interface ICreateOrderPayload {
  branchId: string;
  type: OrderType | OrderTypeEnum;
  tableId?: string | null;
  tableName?: string | null;
  customerName?: string;
  customerPhone?: string;
  deliveryAddress?: string;
  lines: Array<{
    menuItemId: string;
    variantId?: string | null;
    qty: number;
    notes?: string;
    modifiers?: Array<{
      groupId: string;
      optionId: string;
      price?: number;
    }>;
  }>;
  discount?: Discount | null;
  notes?: string;
  createdBy?: string;
}
