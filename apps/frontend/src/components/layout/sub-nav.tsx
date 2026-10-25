import { Link } from "@tanstack/react-router";
import { useTenant } from "@/features/tenant/tenant-context";
import type { Permission } from "@/config/permissions.config";

export type SubNavTo =
  | "/app/$tenantSlug/menu"
  | "/app/$tenantSlug/menu/categories"
  | "/app/$tenantSlug/menu/modifiers"
  | "/app/$tenantSlug/menu/combos"
  | "/app/$tenantSlug/inventory"
  | "/app/$tenantSlug/inventory/stock-movements"
  | "/app/$tenantSlug/inventory/stock-counts"
  | "/app/$tenantSlug/finance"
  | "/app/$tenantSlug/finance/cash"
  | "/app/$tenantSlug/finance/expenses";


/** Tab-style links between sibling pages of one module. */
export function SubNav({ items }: { items: { to: SubNavTo; label: string; perm?: Permission }[] }) {
  const { tenant, can } = useTenant();
  return (
    <nav aria-label="Section" className="mb-5 flex gap-1 overflow-x-auto border-b">
      {items.filter((i) => !i.perm || can(i.perm)).map((i) => (
        <Link
          key={i.to}
          to={i.to}
          params={{ tenantSlug: tenant.slug }}
          activeOptions={{ exact: true }}
          className="-mb-px shrink-0 border-b-2 border-transparent px-3 py-2 text-sm text-muted-foreground hover:text-foreground"
          activeProps={{ className: "border-primary font-semibold text-foreground" }}
        >
          {i.label}
        </Link>
      ))}
    </nav>
  );
}
