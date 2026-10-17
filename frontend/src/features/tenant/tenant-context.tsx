import { createContext, useContext } from "react";
import type { Branch, RoleId, Tenant, User, Activation } from "@/types/domain";
import { can, type Permission } from "@/config/permissions.config";

export interface TenantContextValue {
  user: User;
  tenant: Tenant;
  role: RoleId;
  branches: Branch[];
  branch: Branch;
  activation: Activation;
  can: (p: Permission) => boolean;
}

export const TenantContext = createContext<TenantContextValue | null>(null);

export function useTenant(): TenantContextValue {
  const v = useContext(TenantContext);
  if (!v) throw new Error("useTenant must be used inside the tenant workspace");
  return v;
}

export const makeCan = (role: RoleId) => (p: Permission) => can(role, p);
