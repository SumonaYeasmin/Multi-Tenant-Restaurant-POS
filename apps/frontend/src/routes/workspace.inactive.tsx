import { createFileRoute, Link } from "@tanstack/react-router";
import { z } from "zod";
import { Lock, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RequireSession } from "@/features/auth/require-session";
import { useActivationQuery } from "@/app/api";
import { getTenantBySlug } from "@/services/platform.service";

export const Route = createFileRoute("/workspace/inactive")({
  validateSearch: z.object({ tenant: z.string().optional() }),
  head: () => ({
    meta: [
      { title: "Restaurant access inactive — Tablewise POS" },
      { name: "description", content: "This restaurant's access is not active." },
      { property: "og:title", content: "Restaurant access inactive — Tablewise POS" },
      { property: "og:description", content: "This restaurant's access is not active." },
    ],
  }),
  component: () => <RequireSession>{() => <Inactive />}</RequireSession>,
});

function Inactive() {
  const { tenant: slug } = Route.useSearch();
  const tenant = slug ? getTenantBySlug(slug) : null;
  const activation = useActivationQuery(tenant?.id ?? "", { skip: !tenant });
  const active = activation.data && activation.data.status !== "inactive";
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <span className="mb-4 flex size-12 items-center justify-center rounded-full bg-muted">
        <Lock className="size-5" aria-hidden />
      </span>
      <h1 className="text-2xl font-bold">{tenant?.name ?? "This restaurant"} is not active</h1>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        {activation.data?.message ?? "Access to this workspace is currently paused."} Access is managed outside the POS — ask the account owner to check it in the subscription portal.
      </p>
      <div className="mt-6 flex gap-2">
        <Button variant="outline" onClick={() => activation.refetch()} disabled={!tenant || activation.isFetching}>
          <RefreshCw className={`size-4 ${activation.isFetching ? "animate-spin" : ""}`} /> Check again
        </Button>
        {active && tenant ? (
          <Button asChild>
            <Link to="/app/$tenantSlug/dashboard" params={{ tenantSlug: tenant.slug }}>Open restaurant</Link>
          </Button>
        ) : (
          <Button asChild>
            <Link to="/workspace/select">Choose another restaurant</Link>
          </Button>
        )}
      </div>
    </div>
  );
}
