import { createFileRoute, Outlet } from "@tanstack/react-router";
import { Users, Shield } from "lucide-react";
import { PageHeader } from "@/components/common/states";
import { SubNav } from "@/components/layout/sub-nav";

export const Route = createFileRoute("/app/$tenantSlug/team")({
  head: () => ({
    meta: [
      { title: "Team & Staff — Tablewise POS" },
      { name: "description", content: "Staff directory, invitations, and role-based access control." },
    ],
  }),
  component: () => (
    <>
      <PageHeader
        title="Team & Access"
        description="Manage your restaurant staff directory, branch assignments, and role-based permissions."
        className="mb-3"
      />
      <SubNav
        items={[
          { to: "/app/$tenantSlug/team", label: "Staff directory", icon: Users, perm: "staff.manage" },
          { to: "/app/$tenantSlug/team/roles", label: "Roles & permissions", icon: Shield, perm: "roles.view" },
        ]}
      />
      <Outlet />
    </>
  ),
});
