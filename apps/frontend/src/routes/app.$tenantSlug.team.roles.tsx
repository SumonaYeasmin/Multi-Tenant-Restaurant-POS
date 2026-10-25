import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { Check, Minus, Search, Shield, ShieldCheck, Users } from "lucide-react";
import { RequirePermission } from "@/features/tenant/require-permission";
import { PERMISSION_LABELS, ROLE_LABELS, ROLE_PERMISSIONS, type Permission } from "@/config/permissions.config";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import type { RoleId } from "@/types/domain";

export const Route = createFileRoute("/app/$tenantSlug/team/roles")({
  head: () => ({
    meta: [
      { title: "Roles & permissions — Tablewise POS" },
      { name: "description", content: "Role-based access control and system permissions matrix." },
    ],
  }),
  component: () => (
    <RequirePermission perm="roles.view">
      <Roles />
    </RequirePermission>
  ),
});

const ROLE_DETAILS: Record<RoleId, { description: string; color: string }> = {
  owner: {
    description: "Complete unrestricted access across all branches, financials, staff, and system settings.",
    color: "bg-primary/10 text-primary border-primary/20",
  },
  manager: {
    description: "Branch leadership with operational control over POS, menu, inventory, voids, and reporting.",
    color: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  },
  cashier: {
    description: "Front-desk counter staff processing orders, accepting payments, and managing cash drawer.",
    color: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  },
  waiter: {
    description: "Floor service staff managing dine-in table orders, table occupancy, and guest seating.",
    color: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
  },
  kitchen: {
    description: "Back-of-house station for tracking live order tickets, line cooking, and prep statuses.",
    color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  },
};

const PERMISSION_GROUPS: { name: string; perms: Permission[] }[] = [
  {
    name: "POS Terminal & Orders",
    perms: ["pos.use", "orders.view", "orders.manage", "orders.void", "discounts.apply"],
  },
  {
    name: "Kitchen & Dining Tables",
    perms: ["kitchen.view", "tables.view", "tables.manage", "reservations.manage"],
  },
  {
    name: "Payments & Cash Drawer",
    perms: ["payments.process", "payments.view", "refunds.process", "cash.manage", "expenses.manage"],
  },
  {
    name: "Menu, Recipes & Inventory",
    perms: ["menu.manage", "recipes.view", "inventory.view", "inventory.manage", "purchasing.manage"],
  },
  {
    name: "Customers & Delivery",
    perms: ["customers.manage", "promotions.manage", "delivery.manage"],
  },
  {
    name: "Management & System",
    perms: ["dashboard.view", "reports.view", "audit.view", "staff.manage", "roles.view", "branches.manage", "settings.manage", "notifications.view"],
  },
];

function Roles() {
  const roles = Object.keys(ROLE_LABELS) as RoleId[];
  const [search, setSearch] = useState("");
  const [selectedRole, setSelectedRole] = useState<RoleId | "all">("all");

  const filteredGroups = useMemo(() => {
    const q = search.trim().toLowerCase();
    return PERMISSION_GROUPS.map((g) => {
      const perms = g.perms.filter((p) => {
        const label = PERMISSION_LABELS[p]?.toLowerCase() ?? "";
        const matchesQuery = !q || label.includes(q) || p.toLowerCase().includes(q);
        const matchesRole = selectedRole === "all" || ROLE_PERMISSIONS[selectedRole].includes(p);
        return matchesQuery && matchesRole;
      });
      return { ...g, perms };
    }).filter((g) => g.perms.length > 0);
  }, [search, selectedRole]);

  return (
    <div className="space-y-6">
      {/* Header Description */}
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-semibold tracking-tight">Roles & Permissions Matrix</h2>
        <p className="text-sm text-muted-foreground">
          Define access control across your restaurant. Every screen, button, and action checks these capabilities before granting access.
        </p>
      </div>

      {/* Role Summary Cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {roles.map((r) => {
          const isSelected = selectedRole === r;
          const allowedCount = ROLE_PERMISSIONS[r].length;
          return (
            <button
              key={r}
              type="button"
              onClick={() => setSelectedRole(isSelected ? "all" : r)}
              className={`flex flex-col justify-between rounded-xl border p-3.5 text-left transition-all hover:border-primary/50 hover:shadow-sm ${
                isSelected
                  ? "border-primary bg-primary/5 shadow-sm ring-1 ring-primary/30"
                  : "bg-card hover:bg-accent/40"
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="font-semibold text-sm">{ROLE_LABELS[r]}</span>
                  <Badge variant="outline" className={`text-xs px-1.5 py-0 font-medium ${ROLE_DETAILS[r]?.color}`}>
                    {allowedCount} perms
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                  {ROLE_DETAILS[r]?.description}
                </p>
              </div>
              <div className="mt-3 flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
                <ShieldCheck className="size-3.5 text-primary" />
                <span>{isSelected ? "Filter active (Click to clear)" : "Click to inspect role"}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Controls Bar: Search & Filter */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search permissions (e.g. pos, orders, refund)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9"
          />
        </div>
        <div className="flex items-center gap-2">
          {selectedRole !== "all" && (
            <Badge variant="secondary" className="gap-1.5 pl-2">
              Viewing: <span className="font-semibold">{ROLE_LABELS[selectedRole]}</span>
              <button
                type="button"
                onClick={() => setSelectedRole("all")}
                className="ml-1 text-muted-foreground hover:text-foreground"
              >
                ✕
              </button>
            </Badge>
          )}
          <span className="text-xs text-muted-foreground">
            {filteredGroups.reduce((acc, g) => acc + g.perms.length, 0)} capabilities shown
          </span>
        </div>
      </div>

      {/* Permissions Matrix by Group */}
      <div className="space-y-4">
        {filteredGroups.length === 0 ? (
          <div className="rounded-lg border border-dashed p-8 text-center">
            <Shield className="mx-auto size-8 text-muted-foreground/50 mb-2" />
            <p className="text-sm font-medium">No matching permissions found</p>
            <p className="text-xs text-muted-foreground">Try clearing the search or role filter.</p>
          </div>
        ) : (
          filteredGroups.map((group) => (
            <div key={group.name} className="overflow-hidden rounded-xl border bg-card shadow-xs">
              <div className="border-b bg-muted/40 px-4 py-2.5 flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {group.name}
                </span>
                <span className="text-[11px] text-muted-foreground font-medium">
                  {group.perms.length} items
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b bg-muted/10 text-xs text-muted-foreground">
                    <tr>
                      <th className="px-4 py-2 text-left font-medium w-1/3">Capability</th>
                      {roles.map((r) => (
                        <th
                          key={r}
                          className={`px-3 py-2 text-center font-medium ${
                            selectedRole === r ? "bg-primary/5 text-primary font-semibold" : ""
                          }`}
                        >
                          {ROLE_LABELS[r]}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {group.perms.map((p) => (
                      <tr key={p} className="hover:bg-muted/20 transition-colors">
                        <td className="px-4 py-2.5 font-medium text-foreground">
                          <div>{PERMISSION_LABELS[p] || p}</div>
                          <span className="text-[11px] font-mono text-muted-foreground/70">{p}</span>
                        </td>
                        {roles.map((r) => {
                          const allowed = ROLE_PERMISSIONS[r].includes(p);
                          const isHighlighted = selectedRole === r;
                          return (
                            <td
                              key={r}
                              className={`px-3 py-2.5 text-center ${
                                isHighlighted ? "bg-primary/5" : ""
                              }`}
                            >
                              {allowed ? (
                                <span className="inline-flex items-center justify-center size-6 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                                  <Check className="size-3.5 stroke-[2.5]" aria-label="Allowed" />
                                </span>
                              ) : (
                                <span className="inline-flex items-center justify-center size-6 rounded-full bg-muted text-muted-foreground/40">
                                  <Minus className="size-3 stroke-[2.5]" aria-label="Restricted" />
                                </span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
