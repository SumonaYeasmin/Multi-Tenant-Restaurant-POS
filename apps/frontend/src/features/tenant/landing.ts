import { NAVIGATION, type AppPath } from "@/config/navigation.config";
import { can } from "@/config/permissions.config";
import type { RoleId } from "@/types/domain";

/** First navigation destination the role is allowed to open. */
export function landingPathFor(role: RoleId): AppPath {
  if (role === "kitchen") return "kitchen";
  for (const g of NAVIGATION) for (const i of g.items) if (can(role, i.permission)) return i.path;
  return "orders";
}
