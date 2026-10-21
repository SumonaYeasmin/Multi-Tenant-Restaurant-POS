import { createFileRoute, Outlet } from "@tanstack/react-router";
import { RequirePermission } from "@/features/tenant/require-permission";
import { PageHeader } from "@/components/common/states";
import { SubNav } from "@/components/layout/sub-nav";

export const Route = createFileRoute("/app/$tenantSlug/finance")({
  head: () => ({ meta: [{ title: "Payments & cash — Tablewise POS" }, { name: "description", content: "Payments ledger, refunds, cash drawer and expenses." }] }),
  component: () => (
    <RequirePermission perm="payments.view">
      <PageHeader title="Payments & cash" description="Figures are for the selected branch." className="mb-3" />
      <SubNav
        items={[
          { to: "/app/$tenantSlug/finance", label: "Payments & refunds" },
          { to: "/app/$tenantSlug/finance/cash", label: "Cash drawer", perm: "cash.manage" },
          { to: "/app/$tenantSlug/finance/expenses", label: "Expenses", perm: "expenses.manage" },
        ]}
      />
      <Outlet />
    </RequirePermission>
  ),
});
