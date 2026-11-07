import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/app/$tenantSlug/team")({
  head: () => ({
    meta: [
      { title: "Team & Staff — Tablewise POS" },
      { name: "description", content: "Staff directory, invitations, and role-based access control." },
    ],
  }),
  component: () => <Outlet />,
});

