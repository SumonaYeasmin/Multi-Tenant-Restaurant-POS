import { createFileRoute } from "@tanstack/react-router";
import { Check, Minus } from "lucide-react";
import { RequirePermission } from "@/features/tenant/require-permission";
import { PERMISSION_LABELS, ROLE_LABELS, ROLE_PERMISSIONS, type Permission } from "@/config/permissions.config";
import type { RoleId } from "@/types/domain";

export const Route = createFileRoute("/app/$tenantSlug/team/roles")({
  head: () => ({ meta: [{ title: "Roles & permissions — Tablewise POS" }, { name: "description", content: "What each role can see and do." }] }),
  component: () => (
    <RequirePermission perm="roles.view">
      <Roles />
    </RequirePermission>
  ),
});

function Roles() {
  const roles = Object.keys(ROLE_LABELS) as RoleId[];
  const perms = Object.keys(PERMISSION_LABELS) as Permission[];
  return (
    <div>
      <p className="mb-4 text-sm text-muted-foreground">Roles are fixed for this prototype. Each screen and action checks these permissions.</p>
      <div className="overflow-x-auto rounded-lg border bg-card">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr><th className="px-4 py-2.5 font-medium">Permission</th>{roles.map((r) => <th key={r} className="px-3 py-2.5 text-center font-medium">{ROLE_LABELS[r]}</th>)}</tr>
          </thead>
          <tbody className="divide-y">
            {perms.map((p) => (
              <tr key={p}>
                <td className="px-4 py-2">{PERMISSION_LABELS[p]}</td>
                {roles.map((r) => (
                  <td key={r} className="px-3 py-2 text-center">
                    {ROLE_PERMISSIONS[r].includes(p) ? <Check className="mx-auto size-4 text-success" aria-label="Allowed" /> : <Minus className="mx-auto size-4 text-muted-foreground/50" aria-label="Not allowed" />}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
