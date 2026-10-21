import type { ReactNode } from "react";
import { ShieldOff } from "lucide-react";
import { useTenant } from "./tenant-context";
import type { Permission } from "@/config/permissions.config";
import { ROLE_LABELS } from "@/config/permissions.config";

/** UI permission guard for a page or section. */
export function RequirePermission({ perm, children }: { perm: Permission; children: ReactNode }) {
  const { can, role } = useTenant();
  if (can(perm)) return <>{children}</>;
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <ShieldOff className="mb-3 size-8 text-muted-foreground" aria-hidden />
      <h1 className="text-xl font-bold">You don't have access to this page</h1>
      <p className="mt-1 text-sm text-muted-foreground">Your role ({ROLE_LABELS[role]}) can't open it. Ask a manager if you need access.</p>
    </div>
  );
}
