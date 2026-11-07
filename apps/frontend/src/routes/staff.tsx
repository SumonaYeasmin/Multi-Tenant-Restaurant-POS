import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/staff")({
  beforeLoad: () => {
    throw redirect({
      to: "/app/$tenantSlug/team",
      params: { tenantSlug: "saffron-ember" },
      replace: true,
    });
  },
  component: () => null,
});

