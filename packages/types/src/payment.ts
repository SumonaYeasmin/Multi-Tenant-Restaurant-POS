export type PaymentMethod = "cash" | "card" | "mobile_banking" | "other";

export type PaymentStatus = "pending" | "completed" | "failed" | "refunded";

export interface Payment {
  id: string;
  tenantId: string;
  orderId: string;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  reference?: string;
  createdAt: string;
  createdBy: string;
}

export interface SplitPaymentLine {
  method: PaymentMethod;
  amount: number;
  reference?: string;
}
