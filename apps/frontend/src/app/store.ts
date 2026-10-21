import { combineReducers, configureStore } from "@reduxjs/toolkit";
import { setupListeners } from "@reduxjs/toolkit/query";
import { baseApi } from "./base-api";
import { sessionSlice } from "@/features/auth/session.slice";
import { tenantSlice } from "@/features/tenant/tenant.slice";
import { uiSlice } from "@/features/ui/ui.slice";
import { cartSlice } from "@/features/pos/cart.slice";

export const rootReducer = combineReducers({
  [baseApi.reducerPath]: baseApi.reducer,
  session: sessionSlice.reducer,
  tenant: tenantSlice.reducer,
  ui: uiSlice.reducer,
  cart: cartSlice.reducer,
});

export function makeStore() {
  const store = configureStore({
    reducer: rootReducer,
    middleware: (gdm) => gdm().concat(baseApi.middleware),
  });
  if (typeof window !== "undefined") setupListeners(store.dispatch);
  return store;
}

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<typeof rootReducer>;
export type AppDispatch = AppStore["dispatch"];
