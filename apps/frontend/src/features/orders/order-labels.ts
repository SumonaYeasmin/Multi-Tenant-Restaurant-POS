import type { KitchenStatus, OrderStatus, OrderType, PaymentMethod } from "@/types/domain";

export const ORDER_TYPE_LABELS: Record<OrderType, string> = {
  dine_in: "Dine-in",
  takeaway: "Takeaway",
  pickup: "Pickup",
  counter: "Counter",
  delivery: "Delivery",
};

export const ORDER_STATUS: Record<OrderStatus, { label: string; variant: "info" | "warning" | "success" | "muted" | "danger" | "soft" }> = {
  in_kitchen: { label: "In kitchen", variant: "info" },
  ready: { label: "Ready", variant: "warning" },
  served: { label: "Served", variant: "soft" },
  completed: { label: "Completed", variant: "success" },
  cancelled: { label: "Voided", variant: "danger" },
};

export const KITCHEN_LABELS: Record<KitchenStatus, string> = {
  new: "New",
  preparing: "Preparing",
  ready: "Ready",
  bumped: "Done",
};

export const PAYMENT_LABELS: Record<PaymentMethod, string> = { cash: "Cash", card: "Card", mobile: "Mobile wallet" };
