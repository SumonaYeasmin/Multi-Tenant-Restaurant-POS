import { createFileRoute, Navigate, Outlet } from "@tanstack/react-router";
import { useEffect, useMemo, type CSSProperties } from "react";
import { RequireSession } from "@/features/auth/require-session";
import { useActivationQuery, useBranchesQuery, useMyTenantsQuery } from "@/app/api";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { FullPageSpinner, ErrorState } from "@/components/common/states";
import { TenantContext, makeCan, type TenantContextValue } from "@/features/tenant/tenant-context";
import { setActiveTenant, setBranch } from "@/features/tenant/tenant.slice";
import { cartActions } from "@/features/pos/cart.slice";
import { readJson, storageKey, writeJson } from "@/lib/persistence";
import { AppShell } from "@/components/layout/app-shell";
import type { User } from "@/types/domain";

export const Route = createFileRoute("/app/$tenantSlug")({
  head: () => ({
    meta: [
      { title: "Restaurant workspace — Tablewise POS" },
      { name: "description", content: "Run service for your restaurant." },
      { property: "og:title", content: "Restaurant workspace — Tablewise POS" },
      { property: "og:description", content: "Run service for your restaurant." },
    ],
  }),
  component: () => <RequireSession>{(user) => <TenantGate user={user} />}</RequireSession>,
});

/** Tenant-context + activation guard. */
function TenantGate({ user }: { user: User }) {
  const { tenantSlug } = Route.useParams();
  const dispatch = useAppDispatch();
  const tenants = useMyTenantsQuery(user.id);
  const tenant = tenants.data?.find((t) => t.slug === tenantSlug);
  const membership = tenant ? user.memberships.find((m) => m.tenantId === tenant.id) : undefined;
  const activation = useActivationQuery(tenant?.id ?? "", { skip: !tenant });
  const branches = useBranchesQuery({ tenantId: tenant?.id ?? "", userId: user.id }, { skip: !tenant });
  const storedBranch = useAppSelector((s) => (tenant ? s.tenant.branchByTenant[tenant.id] : undefined));

  useEffect(() => {
    if (!tenant) return;
    dispatch(setActiveTenant(tenant.id));
    dispatch(cartActions.bindCartToTenant(tenant.id));
    if (!storedBranch) {
      const saved = readJson<string>(storageKey("branch", tenant.id));
      if (saved) dispatch(setBranch({ tenantId: tenant.id, branchId: saved }));
    }
  }, [tenant, storedBranch, dispatch]);

  useEffect(() => {
    if (tenant && storedBranch) writeJson(storageKey("branch", tenant.id), storedBranch);
  }, [tenant, storedBranch]);

  const branch = branches.data?.find((b) => b.id === storedBranch) ?? branches.data?.[0];

  const value = useMemo<TenantContextValue | null>(() => {
    if (!tenant || !membership || !activation.data || !branches.data || !branch) return null;
    return { user, tenant, role: membership.role, branches: branches.data, branch, activation: activation.data, can: makeCan(membership.role) };
  }, [user, tenant, membership, activation.data, branches.data, branch]);

  if (tenants.isLoading) return <FullPageSpinner label="Opening restaurant…" />;
  if (tenants.isError) return <ErrorState message="Couldn't load restaurants." onRetry={tenants.refetch} />;
  if (!tenant || !membership) return <Navigate to="/access-denied" replace />;
  if (activation.data?.status === "inactive") return <Navigate to="/workspace/inactive" search={{ tenant: tenant.slug }} replace />;
  if (activation.isError) return <ErrorState message="Couldn't verify restaurant access." onRetry={activation.refetch} />;
  if (!value) return <FullPageSpinner label="Opening restaurant…" />;

  const style = { "--primary": tenant.accent } as CSSProperties;
  return (
    <TenantContext.Provider value={value}>
      <div style={style} className="min-h-screen bg-background text-foreground">
        <AppShell>
          <Outlet />
        </AppShell>
      </div>
    </TenantContext.Provider>
  );
}
