import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/roles")({
  beforeLoad: () => {
    throw redirect({
      to: "/app/$tenantSlug/team/roles",
      params: { tenantSlug: "saffron-ember" },
      replace: true,
    });
  },
  component: () => null,
});

