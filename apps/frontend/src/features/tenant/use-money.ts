import { useCallback } from "react";
import { formatMoney } from "@/lib/pricing";
import { useTenant } from "./tenant-context";

export function useMoney() {
  const { tenant } = useTenant();
  return useCallback((n: number) => formatMoney(n, tenant.currency, tenant.locale), [tenant.currency, tenant.locale]);
}
