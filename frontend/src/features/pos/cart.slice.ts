import { createEntityAdapter, createSlice, type EntityState, type PayloadAction } from "@reduxjs/toolkit";
import type { Discount, OrderLine, OrderType } from "@/types/domain";

// In-progress POS order draft. Lines are normalised with an entity adapter
// so quantity edits and removals are O(1) and keep stable ordering.
export const linesAdapter = createEntityAdapter<OrderLine>();

export interface CartState {
  tenantId: string | null;
  orderType: OrderType;
  tableId: string | null;
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  notes: string;
  discount: Discount | null;
  lines: EntityState<OrderLine, string>;
}

const initialState: CartState = {
  tenantId: null,
  orderType: "dine_in",
  tableId: null,
  customerName: "",
  customerPhone: "",
  deliveryAddress: "",
  notes: "",
  discount: null,
  lines: linesAdapter.getInitialState(),
};

const sameConfig = (a: OrderLine, b: OrderLine) =>
  a.itemId === b.itemId &&
  a.variantId === b.variantId &&
  a.notes === b.notes &&
  a.modifiers.map((m) => m.optionId).sort().join() === b.modifiers.map((m) => m.optionId).sort().join();

export const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    bindCartToTenant: (s, a: PayloadAction<string>) => {
      if (s.tenantId !== a.payload) return { ...initialState, tenantId: a.payload };
      return undefined;
    },
    addLine: (s, a: PayloadAction<OrderLine>) => {
      const existing = Object.values(s.lines.entities).find((l) => l && sameConfig(l, a.payload));
      if (existing) linesAdapter.updateOne(s.lines, { id: existing.id, changes: { qty: existing.qty + a.payload.qty } });
      else linesAdapter.addOne(s.lines, a.payload);
    },
    setQty: (s, a: PayloadAction<{ id: string; qty: number }>) => {
      if (a.payload.qty <= 0) linesAdapter.removeOne(s.lines, a.payload.id);
      else linesAdapter.updateOne(s.lines, { id: a.payload.id, changes: { qty: a.payload.qty } });
    },
    removeLine: (s, a: PayloadAction<string>) => {
      linesAdapter.removeOne(s.lines, a.payload);
    },
    setOrderType: (s, a: PayloadAction<OrderType>) => {
      s.orderType = a.payload;
      if (a.payload !== "dine_in") s.tableId = null;
    },
    setTable: (s, a: PayloadAction<string | null>) => {
      s.tableId = a.payload;
      if (a.payload) s.orderType = "dine_in";
    },
    setCustomer: (s, a: PayloadAction<{ name: string; phone: string }>) => {
      s.customerName = a.payload.name;
      s.customerPhone = a.payload.phone;
    },
    setDeliveryAddress: (s, a: PayloadAction<string>) => {
      s.deliveryAddress = a.payload;
    },
    setNotes: (s, a: PayloadAction<string>) => {
      s.notes = a.payload;
    },
    setDiscount: (s, a: PayloadAction<Discount | null>) => {
      s.discount = a.payload;
    },
    clearCart: (s) => ({ ...initialState, tenantId: s.tenantId }),
  },
});

export const cartActions = cartSlice.actions;
export const cartLineSelectors = linesAdapter.getSelectors();
