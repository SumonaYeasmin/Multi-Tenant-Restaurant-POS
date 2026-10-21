export interface Ingredient {
  id: string;
  tenantId: string;
  key: string;
  name: string;
  unit: string;
  costPerUnit: number;
  currentStock: number;
  minThreshold: number;
}

export type MovementType = "in" | "out" | "waste" | "count_adjustment" | "sale";

export interface StockMovement {
  id: string;
  tenantId: string;
  ingredientId: string;
  type: MovementType;
  quantity: number;
  reason?: string;
  createdAt: string;
  createdBy: string;
}

export interface Supplier {
  id: string;
  tenantId: string;
  name: string;
  contactName: string;
  phone: string;
  email: string;
  address: string;
}

export interface PurchaseOrderLine {
  ingredientId: string;
  quantity: number;
  unitPrice: number;
}

export interface PurchaseOrder {
  id: string;
  tenantId: string;
  supplierId: string;
  orderNumber: string;
  status: "draft" | "submitted" | "partial" | "received" | "cancelled";
  lines: PurchaseOrderLine[];
  totalAmount: number;
  createdAt: string;
}
