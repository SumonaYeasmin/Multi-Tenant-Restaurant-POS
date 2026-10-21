import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

interface TenantState {
  activeTenantId: string | null;
  /** Selected branch per tenant — persisted via the tenant-scoped adapter. */
  branchByTenant: Record<string, string>;
}

const initialState: TenantState = { activeTenantId: null, branchByTenant: {} };

export const tenantSlice = createSlice({
  name: "tenant",
  initialState,
  reducers: {
    setActiveTenant: (s, a: PayloadAction<string | null>) => {
      s.activeTenantId = a.payload;
    },
    setBranch: (s, a: PayloadAction<{ tenantId: string; branchId: string }>) => {
      s.branchByTenant[a.payload.tenantId] = a.payload.branchId;
    },
  },
});

export const { setActiveTenant, setBranch } = tenantSlice.actions;
