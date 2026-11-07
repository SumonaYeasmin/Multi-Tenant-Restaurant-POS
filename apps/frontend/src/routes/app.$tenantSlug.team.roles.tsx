import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo, useEffect } from "react";
import {
  AlertCircle,
  Check,
  Info,
  Loader2,
  Lock,
  Pencil,
  Plus,
  RotateCcw,
  Save,
  Search,
  Shield,
  ShieldCheck,
  Sparkles,
  Trash2,
  Undo2,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { RequirePermission } from "@/features/tenant/require-permission";
import { useTenant } from "@/features/tenant/tenant-context";
import {
  PERMISSION_LABELS,
  ROLE_LABELS,
  ROLE_PERMISSIONS,
  type Permission,
} from "@/config/permissions.config";
import { Confirm } from "@/components/common/confirm";
import { PageHeader } from "@/components/common/states";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { useStaffQuery } from "@/features/people/api";
import {
  deleteCustomRole,
  getCustomRoles,
  getCustomRolesSync,
  getTenantRolesApi,
  saveCustomRole,
  updateCustomRolePermissions,
  updateRolePermissionsApi,
} from "@/services/people.service";
import type { CustomRole, RoleId } from "@/types/domain";

export const Route = createFileRoute("/app/$tenantSlug/team/roles")({
  head: () => ({
    meta: [
      { title: "Roles & permissions — Tablewise POS" },
      {
        name: "description",
        content: "Role-based access control and system permissions matrix.",
      },
    ],
  }),
  component: () => (
    <RequirePermission perm="roles.view">
      <Roles />
    </RequirePermission>
  ),
});

// All system default roles
const ALL_SYSTEM_ROLES: RoleId[] = ["owner", "manager", "cashier", "waiter", "kitchen"];
const CONFIGURABLE_STAFF_ROLES: RoleId[] = ["manager", "cashier", "waiter", "kitchen"];

const ROLE_DETAILS: Record<RoleId, { description: string; color: string; badge: string }> = {
  owner: {
    description: "Full unrestricted access across all branches, financials, staff, and system configurations.",
    color: "bg-primary/10 text-primary border-primary/20",
    badge: "bg-primary/15 text-primary border-primary/30",
  },
  manager: {
    description: "Branch operations leader managing POS, kitchen, menu, inventory, discounts, and reporting.",
    color: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
    badge: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30",
  },
  cashier: {
    description: "Front-desk counter staff handling POS terminal, orders, payments, discounts, and cash drawer.",
    color: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
    badge: "bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30",
  },
  waiter: {
    description: "Floor service staff managing table occupancy, taking dine-in orders, and booking reservations.",
    color: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
    badge: "bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/30",
  },
  kitchen: {
    description: "Back-of-house kitchen display station for line cooks tracking live order tickets and food preparation.",
    color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    badge: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
  },
};

const ROLE_COLOR_PRESETS: { id: string; label: string; badge: string; dot: string }[] = [
  { id: "purple", label: "Purple", badge: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20", dot: "bg-purple-500" },
  { id: "indigo", label: "Indigo", badge: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20", dot: "bg-indigo-500" },
  { id: "sky", label: "Sky Blue", badge: "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20", dot: "bg-sky-500" },
  { id: "teal", label: "Teal", badge: "bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20", dot: "bg-teal-500" },
  { id: "amber", label: "Amber", badge: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20", dot: "bg-amber-500" },
  { id: "rose", label: "Rose", badge: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20", dot: "bg-rose-500" },
];

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
    perms: [
      "dashboard.view",
      "reports.view",
      "audit.view",
      "staff.manage",
      "roles.view",
      "branches.manage",
      "settings.manage",
      "notifications.view",
    ],
  },
];

function Roles() {
  const { tenant, user, role: currentRole, can } = useTenant();
  const canEdit = can("staff.manage");
  const staffQuery = useStaffQuery(tenant.id);

  // Active Tab: "roles" or "permissions" (can be initialized from ?tab= URL search param)
  const [activeTab, setActiveTab] = useState<"roles" | "permissions">(() => {
    if (typeof window !== "undefined") {
      const p = new URLSearchParams(window.location.search).get("tab");
      if (p === "permissions") return "permissions";
    }
    return "roles";
  });

  // Permissions state for standard configurable roles
  const [permissionsMap, setPermissionsMap] = useState<Record<RoleId, Permission[]>>({
    owner: [...ROLE_PERMISSIONS.owner],
    manager: [...ROLE_PERMISSIONS.manager],
    cashier: [...ROLE_PERMISSIONS.cashier],
    kitchen: [...ROLE_PERMISSIONS.kitchen],
    waiter: [...ROLE_PERMISSIONS.waiter],
  });

  const [initialMap, setInitialMap] = useState<Record<RoleId, Permission[]>>({
    owner: [...ROLE_PERMISSIONS.owner],
    manager: [...ROLE_PERMISSIONS.manager],
    cashier: [...ROLE_PERMISSIONS.cashier],
    kitchen: [...ROLE_PERMISSIONS.kitchen],
    waiter: [...ROLE_PERMISSIONS.waiter],
  });

  // Custom roles state
  const [customRoles, setCustomRoles] = useState<CustomRole[]>([]);
  const [customPermissionsMap, setCustomPermissionsMap] = useState<Record<string, Permission[]>>({});
  const [initialCustomMap, setInitialCustomMap] = useState<Record<string, Permission[]>>({});

  // Dialog state: Create Role
  const [isCreatingRole, setIsCreatingRole] = useState(false);
  const [newRoleForm, setNewRoleForm] = useState<{
    name: string;
    description: string;
    baseRole: RoleId | "empty";
    color: string;
  }>({
    name: "",
    description: "",
    baseRole: "cashier",
    color: "purple",
  });

  // Dialog state: Edit / Update Role
  const [editingRole, setEditingRole] = useState<CustomRole | null>(null);
  const [editRoleForm, setEditRoleForm] = useState<{
    name: string;
    description: string;
    color: string;
    baseRole: RoleId;
  }>({
    name: "",
    description: "",
    color: "purple",
    baseRole: "waiter",
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [rolesSearch, setRolesSearch] = useState("");
  const [permissionSearch, setPermissionSearch] = useState("");
  const [selectedRoleForMatrix, setSelectedRoleForMatrix] = useState<string>("all");

  // Load active roles & permissions from backend and custom roles from storage
  useEffect(() => {
    let mounted = true;

    // Load custom roles from cache immediately
    const localCustom = getCustomRolesSync(tenant.slug);
    if (mounted && localCustom.length > 0) {
      setCustomRoles(localCustom);
      const permMap: Record<string, Permission[]> = {};
      for (const cr of localCustom) {
        permMap[cr.id] = cr.permissions;
      }
      setCustomPermissionsMap(permMap);
      setInitialCustomMap(permMap);
    }

    // Sync from server
    async function loadData() {
      try {
        setIsLoading(true);
        const [backendRoles, backendCustom] = await Promise.all([
          getTenantRolesApi(tenant.slug),
          getCustomRoles(tenant.slug),
        ]);

        if (!mounted) return;

        if (backendRoles && Object.keys(backendRoles).length > 0) {
          setPermissionsMap((prev) => ({
            ...prev,
            ...backendRoles,
            owner: [...ROLE_PERMISSIONS.owner], // Owner always has all permissions
          }));
          setInitialMap((prev) => ({
            ...prev,
            ...backendRoles,
            owner: [...ROLE_PERMISSIONS.owner],
          }));
        }

        if (Array.isArray(backendCustom)) {
          setCustomRoles(backendCustom);
          const cMap: Record<string, Permission[]> = {};
          for (const cr of backendCustom) {
            cMap[cr.id] = cr.permissions;
          }
          setCustomPermissionsMap(cMap);
          setInitialCustomMap(cMap);
        }
      } catch (err) {
        console.warn("Using offline fallback permissions state", err);
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    loadData();

    return () => {
      mounted = false;
    };
  }, [tenant.slug]);

  // Compute staff count per role
  const staffCounts = useMemo(() => {
    const counts: Record<string, number> = {
      owner: 1, // At least the restaurant owner account
      manager: 0,
      cashier: 0,
      waiter: 0,
      kitchen: 0,
    };
    if (staffQuery.data) {
      for (const s of staffQuery.data) {
        if (s.customRoleName) {
          const match = customRoles.find((cr) => cr.name.toLowerCase() === s.customRoleName?.toLowerCase());
          if (match) {
            counts[match.id] = (counts[match.id] || 0) + 1;
            continue;
          }
        }
        const r = s.role?.toLowerCase() as RoleId;
        if (r && counts[r] !== undefined) {
          counts[r] = counts[r] + 1;
        }
      }
    }
    return counts;
  }, [staffQuery.data, customRoles]);

  // Compute changes in standard roles
  const changedStandardRoles = useMemo(() => {
    return CONFIGURABLE_STAFF_ROLES.filter((r) => {
      const current = (permissionsMap[r] || []).slice().sort();
      const initial = (initialMap[r] || []).slice().sort();
      return JSON.stringify(current) !== JSON.stringify(initial);
    });
  }, [permissionsMap, initialMap]);

  // Compute changes in custom roles
  const changedCustomRoles = useMemo(() => {
    return customRoles.filter((cr) => {
      const current = (customPermissionsMap[cr.id] || []).slice().sort();
      const initial = (initialCustomMap[cr.id] || []).slice().sort();
      return JSON.stringify(current) !== JSON.stringify(initial);
    });
  }, [customRoles, customPermissionsMap, initialCustomMap]);

  const hasChanges = changedStandardRoles.length > 0 || changedCustomRoles.length > 0;

  // Toggle permission for a standard role
  const togglePermission = (role: RoleId, perm: Permission) => {
    if (!canEdit) return;
    if (role === "owner") {
      toast.info("Owner permissions are permanently granted to protect superadmin functionality.");
      return;
    }
    setPermissionsMap((prev) => {
      const current = prev[role] || [];
      const next = current.includes(perm) ? current.filter((p) => p !== perm) : [...current, perm];
      return { ...prev, [role]: next };
    });
  };

  // Toggle permission for a custom role
  const toggleCustomPermission = (roleId: string, perm: Permission) => {
    if (!canEdit) return;
    setCustomPermissionsMap((prev) => {
      const current = prev[roleId] || [];
      const next = current.includes(perm) ? current.filter((p) => p !== perm) : [...current, perm];
      return { ...prev, [roleId]: next };
    });
  };

  // Discard all changes
  const handleDiscard = () => {
    setPermissionsMap({ ...initialMap });
    setCustomPermissionsMap({ ...initialCustomMap });
    toast.info("Unsaved permission changes discarded.");
  };

  // Reset to default permissions
  const handleResetToDefaults = () => {
    setPermissionsMap({
      owner: [...ROLE_PERMISSIONS.owner],
      manager: [...ROLE_PERMISSIONS.manager],
      cashier: [...ROLE_PERMISSIONS.cashier],
      kitchen: [...ROLE_PERMISSIONS.kitchen],
      waiter: [...ROLE_PERMISSIONS.waiter],
    });
    toast.info("Permissions reset to defaults. Click 'Save changes' to apply to the database.");
  };

  // Save all modified permissions to backend & cache
  const handleSaveAll = async () => {
    if (!hasChanges) {
      toast.info("No permission modifications detected to save.");
      return;
    }

    setIsSaving(true);
    try {
      // 1. Save standard roles
      for (const r of changedStandardRoles) {
        await updateRolePermissionsApi(tenant.slug, r, permissionsMap[r] || []);
      }

      // 2. Save custom roles
      for (const cr of changedCustomRoles) {
        await updateCustomRolePermissions(tenant.slug, cr.id, customPermissionsMap[cr.id] || []);
      }

      setInitialMap({ ...permissionsMap });
      setInitialCustomMap({ ...customPermissionsMap });
      toast.success("Role permissions saved and synchronized across all branches!");
    } catch (err: any) {
      console.warn("Could not save to backend server, saved locally", err);
      setInitialMap({ ...permissionsMap });
      setInitialCustomMap({ ...customPermissionsMap });
      toast.success("Role permissions updated successfully in local workspace!");
    } finally {
      setIsSaving(false);
    }
  };

  // Create custom role
  const handleCreateRoleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = newRoleForm.name.trim();
    if (!name) {
      toast.error("Please enter a role name.");
      return;
    }

    const exists = customRoles.some((r) => r.name.toLowerCase() === name.toLowerCase());
    if (exists || ALL_SYSTEM_ROLES.some((r) => ROLE_LABELS[r].toLowerCase() === name.toLowerCase())) {
      toast.error(`A role named "${name}" already exists.`);
      return;
    }

    const templateBase: RoleId = newRoleForm.baseRole === "empty" ? "waiter" : newRoleForm.baseRole;
    const initialPerms: Permission[] =
      newRoleForm.baseRole === "empty"
        ? []
        : [...(permissionsMap[templateBase] || ROLE_PERMISSIONS[templateBase] || [])];

    try {
      const created = await saveCustomRole(tenant.slug, {
        name,
        description: newRoleForm.description.trim(),
        color: newRoleForm.color,
        baseRole: templateBase,
        permissions: initialPerms,
      });

      const updatedRoles = [...customRoles, created];
      setCustomRoles(updatedRoles);
      setCustomPermissionsMap((prev) => ({ ...prev, [created.id]: initialPerms }));
      setInitialCustomMap((prev) => ({ ...prev, [created.id]: initialPerms }));

      setIsCreatingRole(false);
      setNewRoleForm({ name: "", description: "", baseRole: "cashier", color: "purple" });
      toast.success(`Custom role "${created.name}" created! You can now configure its permissions.`);
    } catch (err: any) {
      toast.error(err?.message || "Failed to create custom role.");
    }
  };

  // Open Edit Role modal
  const handleStartEditRole = (role: CustomRole) => {
    setEditingRole(role);
    setEditRoleForm({
      name: role.name,
      description: role.description || "",
      color: role.color || "purple",
      baseRole: role.baseRole || "waiter",
    });
  };

  // Save Edited Role
  const handleSaveEditedRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRole) return;
    const name = editRoleForm.name.trim();
    if (!name) {
      toast.error("Role name cannot be empty.");
      return;
    }

    try {
      const currentPerms = customPermissionsMap[editingRole.id] || editingRole.permissions || [];
      const updated = await saveCustomRole(tenant.slug, {
        id: editingRole.id,
        name,
        description: editRoleForm.description.trim(),
        color: editRoleForm.color,
        baseRole: editRoleForm.baseRole,
        permissions: currentPerms,
      });

      setCustomRoles((prev) => prev.map((r) => (r.id === editingRole.id ? updated : r)));
      setEditingRole(null);
      toast.success(`Role "${updated.name}" updated successfully!`);
    } catch (err: any) {
      toast.error(err?.message || "Failed to update role.");
    }
  };

  // Delete custom role
  const handleDeleteRole = async (role: CustomRole) => {
    try {
      await deleteCustomRole(tenant.slug, role.id);
      setCustomRoles((prev) => prev.filter((r) => r.id !== role.id));
      setCustomPermissionsMap((prev) => {
        const next = { ...prev };
        delete next[role.id];
        return next;
      });
      setInitialCustomMap((prev) => {
        const next = { ...prev };
        delete next[role.id];
        return next;
      });
      if (selectedRoleForMatrix === role.id) setSelectedRoleForMatrix("all");
      toast.success(`Custom role "${role.name}" deleted.`);
    } catch (err: any) {
      toast.error(err?.message || "Failed to delete custom role.");
    }
  };

  // Switch to permissions tab and focus a role
  const handleFocusRoleInPermissions = (roleId: string) => {
    setSelectedRoleForMatrix(roleId);
    setActiveTab("permissions");
  };

  // Filtered permission groups
  const filteredGroups = useMemo(() => {
    const q = permissionSearch.trim().toLowerCase();
    return PERMISSION_GROUPS.map((g) => {
      const perms = g.perms.filter((p) => {
        const label = PERMISSION_LABELS[p]?.toLowerCase() ?? "";
        const matchesQuery = !q || label.includes(q) || p.toLowerCase().includes(q);

        let matchesRole = true;
        if (selectedRoleForMatrix !== "all") {
          if (selectedRoleForMatrix === "owner") {
            matchesRole = true;
          } else if (CONFIGURABLE_STAFF_ROLES.includes(selectedRoleForMatrix as RoleId)) {
            matchesRole = (permissionsMap[selectedRoleForMatrix as RoleId] || []).includes(p);
          } else {
            matchesRole = (customPermissionsMap[selectedRoleForMatrix] || []).includes(p);
          }
        }
        return matchesQuery && matchesRole;
      });
      return { ...g, perms };
    }).filter((g) => g.perms.length > 0);
  }, [permissionSearch, selectedRoleForMatrix, permissionsMap, customPermissionsMap]);

  // Filtered roles list for Roles Tab
  const filteredRolesList = useMemo(() => {
    const q = rolesSearch.trim().toLowerCase();
    const system = ALL_SYSTEM_ROLES.filter((r) => {
      if (!q) return true;
      return (
        ROLE_LABELS[r].toLowerCase().includes(q) ||
        (ROLE_DETAILS[r]?.description || "").toLowerCase().includes(q)
      );
    });
    const custom = customRoles.filter((cr) => {
      if (!q) return true;
      return (
        cr.name.toLowerCase().includes(q) ||
        (cr.description || "").toLowerCase().includes(q) ||
        ROLE_LABELS[cr.baseRole]?.toLowerCase().includes(q)
      );
    });
    return { system, custom };
  }, [rolesSearch, customRoles]);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <PageHeader
        title="Roles & Permissions"
        description="Manage restaurant roles, create custom positions, and configure permission access matrices."
        actions={
          <div className="flex items-center gap-2">
            <Button asChild variant="outline" size="sm" className="gap-1.5 shadow-2xs">
              <Link to="/app/$tenantSlug/team" params={{ tenantSlug: tenant.slug }}>
                <Users className="size-4 text-primary" /> Staff directory
              </Link>
            </Button>
            {activeTab === "roles" && canEdit && (
              <Button
                onClick={() => setIsCreatingRole(true)}
                size="sm"
                className="gap-1.5 font-medium shadow-xs"
              >
                <Plus className="size-4" /> Create role
              </Button>
            )}
            {activeTab === "permissions" && (
              <div className="flex items-center gap-2">
                {hasChanges && (
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={isSaving}
                    onClick={handleDiscard}
                    className="gap-1.5"
                  >
                    <Undo2 className="size-3.5" /> Discard
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  disabled={isSaving}
                  onClick={handleResetToDefaults}
                  className="gap-1.5"
                >
                  <RotateCcw className="size-3.5" /> Reset to defaults
                </Button>
                <Button
                  size="sm"
                  disabled={isSaving || !canEdit || !hasChanges}
                  onClick={handleSaveAll}
                  className="gap-1.5 font-medium shadow-xs"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="size-4 animate-spin" /> Saving...
                    </>
                  ) : (
                    <>
                      <Save className="size-4" /> Save changes
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        }
      />

      {/* Main Tabs Container */}
      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as "roles" | "permissions")}
        className="space-y-6"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b pb-2">
          {/* Tabs Trigger List */}
          <TabsList className="grid w-full sm:w-[340px] grid-cols-2 h-10 p-1">
            <TabsTrigger value="roles" className="gap-2 text-xs sm:text-sm font-semibold">
              <Users className="size-4" />
              <span>Roles ({ALL_SYSTEM_ROLES.length + customRoles.length})</span>
            </TabsTrigger>
            <TabsTrigger value="permissions" className="gap-2 text-xs sm:text-sm font-semibold">
              <Shield className="size-4" />
              <span>Permissions {hasChanges && <span className="size-2 rounded-full bg-amber-500 animate-pulse" />}</span>
            </TabsTrigger>
          </TabsList>

          {/* Active Profile Info Strip */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground self-start sm:self-auto">
            <span>Signed in as:</span>
            <span className="font-medium text-foreground">{user.name}</span>
            <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0.5 font-semibold", ROLE_DETAILS[currentRole]?.color)}>
              {ROLE_LABELS[currentRole]}
            </Badge>
          </div>
        </div>

        {/* ============================================================== */}
        {/* TAB 1: ROLES MANAGEMENT                                        */}
        {/* ============================================================== */}
        <TabsContent value="roles" className="space-y-6 m-0 focus-visible:outline-hidden">
          {/* Roles Filter & Search Toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card p-3 rounded-xl border shadow-2xs">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Search roles by name or description..."
                value={rolesSearch}
                onChange={(e) => setRolesSearch(e.target.value)}
                className="pl-9 h-9 text-xs"
              />
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs font-normal">
                {ALL_SYSTEM_ROLES.length} System roles
              </Badge>
              <Badge variant="outline" className="text-xs font-normal border-purple-500/30 text-purple-600 dark:text-purple-400">
                {customRoles.length} Custom roles
              </Badge>
            </div>
          </div>

          {/* 1. System Default Roles */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  System Roles ({filteredRolesList.system.length})
                </h3>
                <p className="text-xs text-muted-foreground">
                  Default core roles configured for restaurant operations.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredRolesList.system.map((r) => {
                const count = staffCounts[r] || 0;
                const permsCount = r === "owner" ? 30 : (permissionsMap[r] || ROLE_PERMISSIONS[r] || []).length;
                const isOwner = r === "owner";

                return (
                  <div
                    key={r}
                    className="flex flex-col justify-between rounded-xl border bg-card p-4 transition-all hover:border-primary/40 hover:shadow-xs"
                  >
                    <div>
                      {/* Card Header */}
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-base text-foreground">
                            {ROLE_LABELS[r]}
                          </span>
                          {isOwner && (
                            <Badge className="text-[10px] px-1.5 py-0 h-4 bg-primary text-primary-foreground font-semibold">
                              Owner
                            </Badge>
                          )}
                        </div>
                        <Badge variant="outline" className={cn("text-xs font-medium", ROLE_DETAILS[r]?.color)}>
                          {permsCount} perms
                        </Badge>
                      </div>

                      {/* Description */}
                      <p className="text-xs text-muted-foreground leading-relaxed min-h-[36px]">
                        {ROLE_DETAILS[r]?.description}
                      </p>

                      {/* Staff Assigned count pill */}
                      <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/30 px-2.5 py-1.5 rounded-lg border border-border/40">
                        <Users className="size-3.5 text-primary" />
                        <span>
                          <strong>{count}</strong> {count === 1 ? "staff assigned" : "staff members assigned"}
                        </span>
                      </div>
                    </div>

                    {/* Card Actions */}
                    <div className="mt-4 pt-3 border-t border-border/60 flex items-center justify-between gap-2">
                      <span className="text-[11px] text-muted-foreground font-medium flex items-center gap-1">
                        {isOwner ? (
                          <>
                            <Lock className="size-3 text-muted-foreground" />
                            Permanent Root
                          </>
                        ) : (
                          "System Protected"
                        )}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleFocusRoleInPermissions(r)}
                        className="h-7 text-xs px-2.5 font-medium hover:text-primary hover:bg-primary/10"
                      >
                        <Shield className="size-3.5 mr-1 text-primary" />
                        {isOwner ? "View permissions" : "Permissions"}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 2. Custom Roles */}
          <div className="pt-2">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wider text-purple-600 dark:text-purple-400 flex items-center gap-1.5">
                  <Sparkles className="size-4" />
                  Custom Roles ({filteredRolesList.custom.length})
                </h3>
                <p className="text-xs text-muted-foreground">
                  Custom roles created specifically for your restaurant team with customized permissions.
                </p>
              </div>
              {canEdit && (
                <Button
                  onClick={() => setIsCreatingRole(true)}
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs gap-1 border-purple-500/30 text-purple-600 dark:text-purple-400 hover:bg-purple-500/10"
                >
                  <Plus className="size-3.5" /> New custom role
                </Button>
              )}
            </div>

            {filteredRolesList.custom.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border/80 bg-muted/10 p-8 text-center">
                <Sparkles className="mx-auto size-8 text-purple-500/50 mb-2" />
                <h4 className="text-sm font-semibold text-foreground">No custom roles created yet</h4>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto mt-1 mb-4">
                  Need a specialized position like Sommelier, Shift Lead, or Barista? Create custom roles with tailored capabilities.
                </p>
                {canEdit && (
                  <Button
                    onClick={() => setIsCreatingRole(true)}
                    size="sm"
                    className="gap-1.5 bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    <Plus className="size-4" /> Create first custom role
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredRolesList.custom.map((cr) => {
                  const count = staffCounts[cr.id] || 0;
                  const permsCount = (customPermissionsMap[cr.id] || cr.permissions || []).length;
                  const colorPreset =
                    ROLE_COLOR_PRESETS.find((p) => p.id === cr.color) ?? ROLE_COLOR_PRESETS[0]!;

                  return (
                    <div
                      key={cr.id}
                      className="flex flex-col justify-between rounded-xl border border-purple-500/20 bg-card p-4 transition-all hover:border-purple-500/50 hover:shadow-xs"
                    >
                      <div>
                        {/* Header */}
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2">
                            <span className={cn("size-2.5 rounded-full shrink-0", colorPreset.dot)} />
                            <span className="font-semibold text-base text-foreground">
                              {cr.name}
                            </span>
                          </div>
                          <Badge variant="outline" className={cn("text-xs font-medium", colorPreset.badge)}>
                            {permsCount} perms
                          </Badge>
                        </div>

                        {/* Description */}
                        <p className="text-xs text-muted-foreground leading-relaxed min-h-[36px]">
                          {cr.description || "No description provided."}
                        </p>

                        {/* Base role template & staff count */}
                        <div className="mt-3 flex items-center justify-between gap-2 text-xs text-muted-foreground bg-muted/30 px-2.5 py-1.5 rounded-lg border border-border/40">
                          <div className="flex items-center gap-1">
                            <span>Base:</span>
                            <Badge variant="secondary" className="text-[10px] h-4 px-1 font-medium">
                              {ROLE_LABELS[cr.baseRole]}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-1 font-medium text-foreground">
                            <Users className="size-3 text-primary" />
                            <span>{count} staff</span>
                          </div>
                        </div>
                      </div>

                      {/* Actions: Edit, Delete, Configure Permissions */}
                      <div className="mt-4 pt-3 border-t border-border/60 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1">
                          {canEdit && (
                            <>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => handleStartEditRole(cr)}
                                className="size-7 text-muted-foreground hover:text-foreground"
                                title="Edit role details"
                              >
                                <Pencil className="size-3.5" />
                              </Button>

                              <Confirm
                                title={`Delete role "${cr.name}"?`}
                                body="Are you sure you want to delete this custom role? Staff members assigned to this role will need to be reassigned."
                                confirmLabel="Delete role"
                                onConfirm={() => handleDeleteRole(cr)}
                              >
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="size-7 text-muted-foreground hover:text-destructive"
                                  title="Delete custom role"
                                >
                                  <Trash2 className="size-3.5" />
                                </Button>
                              </Confirm>
                            </>
                          )}
                        </div>

                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleFocusRoleInPermissions(cr.id)}
                          className="h-7 text-xs px-2.5 font-medium text-purple-600 dark:text-purple-400 hover:bg-purple-500/10"
                        >
                          <Shield className="size-3.5 mr-1" />
                          Permissions
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </TabsContent>

        {/* ============================================================== */}
        {/* TAB 2: PERMISSIONS MATRIX                                      */}
        {/* ============================================================== */}
        <TabsContent value="permissions" className="space-y-6 m-0 focus-visible:outline-hidden">
          {/* Superadmin Owner Notice Banner */}
          <div className="flex items-center gap-3 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 text-xs text-muted-foreground shadow-2xs">
            <ShieldCheck className="size-4.5 shrink-0 text-primary" />
            <span>
              <strong className="font-semibold text-foreground">Superadmin Access:</strong> The restaurant{" "}
              <strong>Owner</strong> account automatically possesses permanent unrestricted superadmin privileges across
              all POS modules, finances, branches, and configurations. Configure permissions below for team staff roles.
            </span>
          </div>

          {/* Unsaved Changes Banner */}
          {hasChanges && (
            <div className="flex items-center justify-between gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-amber-900 dark:text-amber-200 text-sm shadow-xs animate-in fade-in">
              <div className="flex items-center gap-2">
                <AlertCircle className="size-4 shrink-0 text-amber-600 dark:text-amber-400" />
                <span>
                  You have unsaved changes (
                  {[
                    ...changedStandardRoles.map((r) => ROLE_LABELS[r]),
                    ...changedCustomRoles.map((cr) => cr.name),
                  ].join(", ")}
                  ). Click <strong>Save changes</strong> to update the database.
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Button size="sm" variant="outline" className="h-7 px-2.5 text-xs" onClick={handleDiscard}>
                  Discard
                </Button>
                <Button size="sm" className="h-7 px-3 text-xs" disabled={isSaving} onClick={handleSaveAll}>
                  {isSaving && <Loader2 className="size-3 animate-spin mr-1" />}
                  Save changes
                </Button>
              </div>
            </div>
          )}

          {/* Permissions Search & Role Filter Toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card p-3 rounded-xl border shadow-2xs">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Search capabilities (e.g. pos, void, refund, discount, menu...)"
                value={permissionSearch}
                onChange={(e) => setPermissionSearch(e.target.value)}
                className="pl-9 h-9 text-xs"
              />
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-xs">
                <span className="text-muted-foreground font-medium">Filter role:</span>
                <Select value={selectedRoleForMatrix} onValueChange={setSelectedRoleForMatrix}>
                  <SelectTrigger className="h-8 text-xs w-[160px]">
                    <SelectValue placeholder="All roles" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All roles (Matrix view)</SelectItem>
                    <SelectItem value="owner">Owner (Superadmin)</SelectItem>
                    {CONFIGURABLE_STAFF_ROLES.map((r) => (
                      <SelectItem key={r} value={r}>
                        {ROLE_LABELS[r]}
                      </SelectItem>
                    ))}
                    {customRoles.length > 0 && (
                      <>
                        <div className="px-2 py-1 text-[10px] font-semibold text-purple-600 dark:text-purple-400 uppercase">
                          Custom Roles
                        </div>
                        {customRoles.map((cr) => (
                          <SelectItem key={cr.id} value={cr.id}>
                            ✨ {cr.name}
                          </SelectItem>
                        ))}
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <span className="text-xs text-muted-foreground hidden sm:inline">
                {filteredGroups.reduce((acc, g) => acc + g.perms.length, 0)} capabilities listed
              </span>
            </div>
          </div>

          {/* Permissions Matrix by Group */}
          <div className="space-y-4">
            {isLoading ? (
              <div className="space-y-3">
                {[0, 1, 2].map((i) => (
                  <Skeleton key={i} className="h-32 w-full rounded-xl" />
                ))}
              </div>
            ) : filteredGroups.length === 0 ? (
              <div className="rounded-lg border border-dashed p-8 text-center bg-card">
                <Shield className="mx-auto size-8 text-muted-foreground/50 mb-2" />
                <p className="text-sm font-medium">No matching capabilities found</p>
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
                      {group.perms.length} capabilities
                    </span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="border-b bg-muted/10 text-xs text-muted-foreground">
                        <tr>
                          <th className="px-4 py-2.5 text-left font-medium min-w-[220px]">Capability</th>

                          {/* Owner column */}
                          {(selectedRoleForMatrix === "all" || selectedRoleForMatrix === "owner") && (
                            <th className="px-3 py-2 text-center font-medium min-w-[100px] bg-primary/5 text-primary">
                              <div>Owner</div>
                              <div className="text-[10px] font-normal text-muted-foreground">
                                30 perms (Root)
                              </div>
                            </th>
                          )}

                          {/* Standard Configurable Roles Columns */}
                          {CONFIGURABLE_STAFF_ROLES.filter((r) => selectedRoleForMatrix === "all" || selectedRoleForMatrix === r).map((r) => (
                            <th
                              key={r}
                              className={cn(
                                "px-3 py-2 text-center font-medium min-w-[100px]",
                                selectedRoleForMatrix === r && "bg-primary/5 text-primary font-semibold"
                              )}
                            >
                              <div>{ROLE_LABELS[r]}</div>
                              <div className="text-[10px] font-normal text-muted-foreground">
                                {(permissionsMap[r] || []).length} perms
                              </div>
                            </th>
                          ))}

                          {/* Custom Roles Columns */}
                          {customRoles.filter((cr) => selectedRoleForMatrix === "all" || selectedRoleForMatrix === cr.id).map((cr) => (
                            <th
                              key={cr.id}
                              className={cn(
                                "px-3 py-2 text-center font-medium min-w-[120px] bg-purple-500/5",
                                selectedRoleForMatrix === cr.id && "bg-purple-500/15 text-purple-600 font-semibold"
                              )}
                            >
                              <div className="flex items-center justify-center gap-1">
                                <Sparkles className="size-3 text-purple-500" />
                                <span>{cr.name}</span>
                              </div>
                              <div className="text-[10px] font-normal text-muted-foreground">
                                {(customPermissionsMap[cr.id] || []).length} perms
                              </div>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/60">
                        {group.perms.map((p) => (
                          <tr key={p} className="hover:bg-muted/30 transition-colors">
                            <td className="px-4 py-2.5">
                              <div className="font-medium text-foreground">{PERMISSION_LABELS[p] ?? p}</div>
                              <span className="text-[11px] font-mono text-muted-foreground/70">{p}</span>
                            </td>

                            {/* Owner Checkbox (Permanent Full Access) */}
                            {(selectedRoleForMatrix === "all" || selectedRoleForMatrix === "owner") && (
                              <td className="px-3 py-2 text-center align-middle bg-primary/5">
                                <div className="flex items-center justify-center">
                                  <div
                                    className="size-6 rounded-md bg-emerald-600/80 text-white flex items-center justify-center shadow-xs cursor-default"
                                    title="Permanent root privileges: Owner cannot be revoked."
                                  >
                                    <Check className="size-3.5 stroke-[3]" />
                                  </div>
                                </div>
                              </td>
                            )}

                            {/* Standard Roles Checkboxes */}
                            {CONFIGURABLE_STAFF_ROLES.filter((r) => selectedRoleForMatrix === "all" || selectedRoleForMatrix === r).map((r) => {
                              const allowed = (permissionsMap[r] || []).includes(p);
                              const isHighlighted = selectedRoleForMatrix === r;

                              return (
                                <td
                                  key={r}
                                  className={cn(
                                    "px-3 py-2 text-center align-middle",
                                    isHighlighted && "bg-primary/5"
                                  )}
                                >
                                  <div className="flex items-center justify-center">
                                    <button
                                      type="button"
                                      disabled={!canEdit || isSaving}
                                      onClick={() => togglePermission(r, p)}
                                      className={cn(
                                        "group relative inline-flex items-center justify-center size-6 rounded-md transition-all duration-150 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 cursor-pointer",
                                        allowed
                                          ? "bg-emerald-600 text-white shadow-xs hover:bg-emerald-700 active:scale-90"
                                          : "border-2 border-border/80 bg-background hover:border-emerald-500 hover:bg-emerald-500/10 dark:hover:bg-emerald-950/20 active:scale-90",
                                        (!canEdit || isSaving) && "cursor-not-allowed opacity-60"
                                      )}
                                      title={`${allowed ? "Click to Revoke" : "Click to Grant"} "${PERMISSION_LABELS[p] || p}" for ${ROLE_LABELS[r]}`}
                                    >
                                      {allowed ? (
                                        <Check className="size-4 stroke-[3] text-white transition-transform group-hover:scale-110" />
                                      ) : (
                                        <span className="size-2 rounded-xs opacity-0 transition-opacity group-hover:opacity-40 group-hover:bg-emerald-600" />
                                      )}
                                    </button>
                                  </div>
                                </td>
                              );
                            })}

                            {/* Custom Roles Checkboxes */}
                            {customRoles.filter((cr) => selectedRoleForMatrix === "all" || selectedRoleForMatrix === cr.id).map((cr) => {
                              const allowed = (customPermissionsMap[cr.id] || []).includes(p);
                              const isHighlighted = selectedRoleForMatrix === cr.id;

                              return (
                                <td
                                  key={cr.id}
                                  className={cn(
                                    "px-3 py-2 text-center align-middle bg-purple-500/5",
                                    isHighlighted && "bg-purple-500/15"
                                  )}
                                >
                                  <div className="flex items-center justify-center">
                                    <button
                                      type="button"
                                      disabled={!canEdit || isSaving}
                                      onClick={() => toggleCustomPermission(cr.id, p)}
                                      className={cn(
                                        "group relative inline-flex items-center justify-center size-6 rounded-md transition-all duration-150 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 cursor-pointer",
                                        allowed
                                          ? "bg-emerald-600 text-white shadow-xs hover:bg-emerald-700 active:scale-90"
                                          : "border-2 border-border/80 bg-background hover:border-emerald-500 hover:bg-emerald-500/10 dark:hover:bg-emerald-950/20 active:scale-90",
                                        (!canEdit || isSaving) && "cursor-not-allowed opacity-60"
                                      )}
                                      title={`${allowed ? "Click to Revoke" : "Click to Grant"} "${PERMISSION_LABELS[p] || p}" for ${cr.name}`}
                                    >
                                      {allowed ? (
                                        <Check className="size-4 stroke-[3] text-white transition-transform group-hover:scale-110" />
                                      ) : (
                                        <span className="size-2 rounded-xs opacity-0 transition-opacity group-hover:opacity-40 group-hover:bg-emerald-600" />
                                      )}
                                    </button>
                                  </div>
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
        </TabsContent>
      </Tabs>

      {/* ============================================================== */}
      {/* DIALOG 1: CREATE CUSTOM ROLE                                   */}
      {/* ============================================================== */}
      <Dialog open={isCreatingRole} onOpenChange={setIsCreatingRole}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="size-5 text-purple-500" />
              Create Custom Role
            </DialogTitle>
            <DialogDescription>
              Define a new restaurant staff role. You can choose a starting template to copy default permissions.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateRoleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="create-role-name">
                Role Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="create-role-name"
                placeholder="e.g. Sommelier, Shift Lead, Barista"
                value={newRoleForm.name}
                onChange={(e) => setNewRoleForm((prev) => ({ ...prev, name: e.target.value }))}
                required
                autoFocus
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="create-role-desc">Role Description</Label>
              <Textarea
                id="create-role-desc"
                placeholder="What responsibilities and modules does this role cover?"
                rows={2}
                value={newRoleForm.description}
                onChange={(e) => setNewRoleForm((prev) => ({ ...prev, description: e.target.value }))}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="create-role-base">Permissions Starting Template</Label>
              <Select
                value={newRoleForm.baseRole}
                onValueChange={(v) =>
                  setNewRoleForm((prev) => ({ ...prev, baseRole: v as RoleId | "empty" }))
                }
              >
                <SelectTrigger id="create-role-base">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cashier">Copy from Cashier (Front-desk POS & Cash)</SelectItem>
                  <SelectItem value="waiter">Copy from Waiter (Orders & Tables)</SelectItem>
                  <SelectItem value="kitchen">Copy from Kitchen (KDS & Prep)</SelectItem>
                  <SelectItem value="manager">Copy from Manager (Branch operations)</SelectItem>
                  <SelectItem value="empty">Start with zero permissions (Empty)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Color Preset</Label>
              <div className="grid grid-cols-3 gap-2">
                {ROLE_COLOR_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => setNewRoleForm((prev) => ({ ...prev, color: preset.id }))}
                    className={cn(
                      "flex items-center gap-2 rounded-lg border p-2 text-xs font-medium transition-all text-left cursor-pointer",
                      newRoleForm.color === preset.id
                        ? "border-primary bg-primary/10 ring-1 ring-primary/30"
                        : "border-border hover:bg-muted/50"
                    )}
                  >
                    <span className={cn("size-3 rounded-full", preset.dot)} />
                    <span>{preset.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setIsCreatingRole(false)}>
                Cancel
              </Button>
              <Button type="submit" className="gap-1.5 bg-purple-600 hover:bg-purple-700 text-white">
                <Plus className="size-4" /> Create role
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ============================================================== */}
      {/* DIALOG 2: EDIT CUSTOM ROLE                                     */}
      {/* ============================================================== */}
      <Dialog open={!!editingRole} onOpenChange={(open) => !open && setEditingRole(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="size-4.5 text-primary" />
              Edit Role: {editingRole?.name}
            </DialogTitle>
            <DialogDescription>
              Update the name, description, and color for this custom role.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveEditedRole} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="edit-role-name">
                Role Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="edit-role-name"
                value={editRoleForm.name}
                onChange={(e) => setEditRoleForm((prev) => ({ ...prev, name: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit-role-desc">Role Description</Label>
              <Textarea
                id="edit-role-desc"
                rows={2}
                value={editRoleForm.description}
                onChange={(e) => setEditRoleForm((prev) => ({ ...prev, description: e.target.value }))}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Color Preset</Label>
              <div className="grid grid-cols-3 gap-2">
                {ROLE_COLOR_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => setEditRoleForm((prev) => ({ ...prev, color: preset.id }))}
                    className={cn(
                      "flex items-center gap-2 rounded-lg border p-2 text-xs font-medium transition-all text-left cursor-pointer",
                      editRoleForm.color === preset.id
                        ? "border-primary bg-primary/10 ring-1 ring-primary/30"
                        : "border-border hover:bg-muted/50"
                    )}
                  >
                    <span className={cn("size-3 rounded-full", preset.dot)} />
                    <span>{preset.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setEditingRole(null)}>
                Cancel
              </Button>
              <Button type="submit" className="gap-1.5">
                <Save className="size-4" /> Save changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
