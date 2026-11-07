import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/team")({
  beforeLoad: ({ location }) => {
    if (location.pathname.startsWith("/team/roles")) {
      throw redirect({
        to: "/app/$tenantSlug/team/roles",
        params: { tenantSlug: "saffron-ember" },
        replace: true,
      });
    }
    throw redirect({
      to: "/app/$tenantSlug/team",
      params: { tenantSlug: "saffron-ember" },
      replace: true,
    });
  },
  component: () => null,
});
