export type TableStatus = "vacant" | "occupied" | "reserved" | "dirty";

export type TableShape = "rect" | "round" | "square";

export interface DiningTable {
  id: string;
  tenantId: string;
  branchId: string;
  name: string;
  seats: number;
  section: string;
  shape: TableShape;
  status: TableStatus;
  currentOrderId?: string | null;
  activeGuests?: number;
}
