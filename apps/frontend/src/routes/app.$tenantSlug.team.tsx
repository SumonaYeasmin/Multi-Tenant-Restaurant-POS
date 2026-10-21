import { createFileRoute, Outlet } from "@tanstack/react-router";
import { PageHeader } from "@/components/common/states";
import { SubNav } from "@/components/layout/sub-nav";

// Each child page applies its own permission guard (clock in/out is open to all roles).
export const Route = createFileRoute("/app/$tenantSlug/team")({
  head: () => ({ meta: [{ title: "Team — Tablewise POS" }, { name: "description", content: "Staff, shifts, attendance and roles." }] }),
  component: () => (
    <>
      <PageHeader title="Team" className="mb-3" />
      <SubNav
        items={[
          { to: "/app/$tenantSlug/team", label: "Staff", perm: "shifts.manage" },
          { to: "/app/$tenantSlug/team/shifts", label: "Shifts", perm: "shifts.manage" },
          { to: "/app/$tenantSlug/team/attendance", label: "Attendance", perm: "attendance.self" },
          { to: "/app/$tenantSlug/team/roles", label: "Roles & permissions", perm: "roles.view" },
        ]}
      />
      <Outlet />
    </>
  ),
});
