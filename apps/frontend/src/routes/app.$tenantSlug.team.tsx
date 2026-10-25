import { createFileRoute, Outlet } from "@tanstack/react-router";
import { PageHeader } from "@/components/common/states";
import { SubNav } from "@/components/layout/sub-nav";

// Child pages apply their own permission guards.
export const Route = createFileRoute("/app/$tenantSlug/team")({
  head: () => ({ meta: [{ title: "Team — Tablewise POS" }, { name: "description", content: "Staff and roles & permissions." }] }),
  component: () => (
    <>
      <PageHeader title="Team" className="mb-3" />
      <SubNav
        items={[
          { to: "/app/$tenantSlug/team", label: "Staff", perm: "shifts.manage" },
          { to: "/app/$tenantSlug/team/roles", label: "Roles & permissions", perm: "roles.view" },
        ]}
      />
      <Outlet />
    </>
  ),
});
