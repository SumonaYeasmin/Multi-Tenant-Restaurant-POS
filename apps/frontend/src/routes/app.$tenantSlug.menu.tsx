import { createFileRoute, Outlet } from "@tanstack/react-router";
import { RequirePermission } from "@/features/tenant/require-permission";
import { PageHeader } from "@/components/common/states";
import { SubNav } from "@/components/layout/sub-nav";

export const Route = createFileRoute("/app/$tenantSlug/menu")({
  head: () => ({ meta: [{ title: "Menu — Tablewise POS" }, { name: "description", content: "Manage menu items, categories, modifiers and combos." }] }),
  component: () => (
    <RequirePermission perm="menu.manage">
      <PageHeader title="Menu" description="Changes appear on the POS immediately for every branch." className="mb-3" />
      <SubNav
        items={[
          { to: "/app/$tenantSlug/menu", label: "Items" },
          { to: "/app/$tenantSlug/menu/categories", label: "Categories" },
          { to: "/app/$tenantSlug/menu/modifiers", label: "Modifiers" },
          { to: "/app/$tenantSlug/menu/combos", label: "Combos" },
        ]}
      />
      <Outlet />
    </RequirePermission>
  ),
});
