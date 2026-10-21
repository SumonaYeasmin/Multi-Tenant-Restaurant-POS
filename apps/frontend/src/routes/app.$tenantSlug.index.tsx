import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useTenant } from "@/features/tenant/tenant-context";
import { landingPathFor } from "@/features/tenant/landing";
import type { AppPath } from "@/config/navigation.config";

export const Route = createFileRoute("/app/$tenantSlug/")({
  component: TenantHome,
});

function TenantHome() {
  const { tenant, role } = useTenant();
  const to = `/app/$tenantSlug/${landingPathFor(role)}` as `/app/$tenantSlug/${AppPath}`;
  return <Navigate to={to} params={{ tenantSlug: tenant.slug }} replace />;
}
