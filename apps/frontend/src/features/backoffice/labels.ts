import type { PurchaseOrderStatus } from "@/types/domain";

export const PO_STATUS: Record<PurchaseOrderStatus, { label: string; variant: "muted" | "info" | "warning" | "success" | "danger" }> = {
  draft: { label: "Draft", variant: "muted" },
  sent: { label: "Sent", variant: "info" },
  partial: { label: "Partly received", variant: "warning" },
  received: { label: "Received", variant: "success" },
  cancelled: { label: "Cancelled", variant: "danger" },
};
