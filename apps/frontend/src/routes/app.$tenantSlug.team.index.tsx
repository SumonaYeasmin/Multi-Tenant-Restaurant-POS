import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo, useEffect } from "react";
import {
  Building2,
  Check,
  Filter,
  Loader2,
  Mail,
  Pencil,
  Plus,
  Search,
  Shield,
  Sparkles,
  Trash2,
  UserCheck,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { RequirePermission } from "@/features/tenant/require-permission";
import { useTenant } from "@/features/tenant/tenant-context";
import { useMoney } from "@/features/tenant/use-money";
import {
  useAllBranchesQuery,
  useDeleteStaffMutation,
  useSaveStaffMutation,
  useStaffQuery,
} from "@/features/people/api";
import { withToast } from "@/features/tenant/use-mutation-toast";
import { ROLE_LABELS, ROLE_PERMISSIONS } from "@/config/permissions.config";
import { Confirm, DataTable, td } from "@/components/common/confirm";
import { EmptyState, ErrorState } from "@/components/common/states";
import { num } from "@/components/common/field";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import {
  getCustomRoles,
  getCustomRolesSync,
  saveCustomRole,
} from "@/services/people.service";
import type { CustomRole, RoleId, StaffMember } from "@/types/domain";

export const Route = createFileRoute("/app/$tenantSlug/team/")({
  head: () => ({
    meta: [
      { title: "Staff Directory — Tablewise POS" },
      { name: "description", content: "Manage restaurant staff members, branch assignments, and invitations." },
    ],
  }),
  component: () => (
    <RequirePermission perm="staff.manage">
      <StaffDirectoryPage />
    </RequirePermission>
  ),
});

const ROLE_BADGE_COLORS: Record<RoleId, string> = {
  owner: "bg-primary/10 text-primary border-primary/20",
  manager: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  cashier: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  waiter: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
  kitchen: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
};

const ROLE_SUMMARY_DESCRIPTIONS: Record<RoleId, string> = {
  owner: "Full unrestricted root access across all POS modules, finances, branches, and configurations.",
  manager: "Operations lead: POS terminal, kitchen display, menu & inventory adjustments, discounts, and reports.",
  cashier: "Front-desk counter handling POS checkout, dining orders, payments, refunds, discounts, and cash drawer.",
  waiter: "Floor service staff managing table occupancy, taking dine-in orders, and booking table reservations.",
  kitchen: "Back-of-house kitchen display station for line cooks tracking live order tickets and food preparation.",
};

function StaffDirectoryPage() {
  const { tenant, branches: contextBranches, can } = useTenant();
  const money = useMoney();
  const list = useStaffQuery(tenant.id);
  const branchesQuery = useAllBranchesQuery(tenant.id);
  const branches =
    branchesQuery.data && branchesQuery.data.length > 0
      ? branchesQuery.data
      : contextBranches && contextBranches.length > 0
        ? contextBranches
        : [];

  const [deleteStaff] = useDeleteStaffMutation();
  const [customRoles, setCustomRoles] = useState<CustomRole[]>([]);
  const [editingStaff, setEditingStaff] = useState<StaffMember | "new" | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [branchFilter, setBranchFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    setCustomRoles(getCustomRolesSync(tenant.slug));
    getCustomRoles(tenant.slug).then(setCustomRoles).catch(console.error);
  }, [tenant.slug]);

  const bName = (id: string) => branches.find((b) => b.id === id)?.name ?? id;
  const canEdit = can("staff.manage");

  // Metrics
  const staffList = list.data || [];
  const totalStaff = staffList.length;
  const activeStaffCount = staffList.filter((s) => s.active && s.status !== "invited" && s.status !== "draft").length;
  const pendingInvitesCount = staffList.filter((s) => s.status === "invited").length;
  const draftCount = staffList.filter((s) => s.status === "draft").length;

  // Filtered rows
  const filteredStaff = useMemo(() => {
    const q = search.trim().toLowerCase();
    return staffList.filter((s) => {
      // Search matches
      const matchesSearch =
        !q ||
        s.name.toLowerCase().includes(q) ||
        (s.email && s.email.toLowerCase().includes(q)) ||
        (s.phone && s.phone.toLowerCase().includes(q));

      // Role filter
      let matchesRole = true;
      if (roleFilter !== "all") {
        if (roleFilter.startsWith("custom:")) {
          const cName = roleFilter.replace("custom:", "");
          matchesRole = s.customRoleName === cName;
        } else {
          matchesRole = !s.customRoleName && s.role === roleFilter;
        }
      }

      // Branch filter
      let matchesBranch = true;
      if (branchFilter !== "all") {
        matchesBranch = s.branchIds === "all" || (Array.isArray(s.branchIds) && s.branchIds.includes(branchFilter));
      }

      // Status filter
      let matchesStatus = true;
      if (statusFilter !== "all") {
        if (statusFilter === "active") {
          matchesStatus = s.active && s.status !== "invited" && s.status !== "draft";
        } else if (statusFilter === "invited") {
          matchesStatus = s.status === "invited";
        } else if (statusFilter === "draft") {
          matchesStatus = s.status === "draft";
        } else if (statusFilter === "inactive") {
          matchesStatus = !s.active;
        }
      }

      return matchesSearch && matchesRole && matchesBranch && matchesStatus;
    });
  }, [staffList, search, roleFilter, branchFilter, statusFilter]);

  const hasActiveFilters = search || roleFilter !== "all" || branchFilter !== "all" || statusFilter !== "all";

  const resetFilters = () => {
    setSearch("");
    setRoleFilter("all");
    setBranchFilter("all");
    setStatusFilter("all");
  };

  return (
    <div className="space-y-6">
      {/* 4 Overview Stat Cards */}
      <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-4">
        <div className="rounded-xl border bg-card p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Total Staff</span>
            <Users className="size-4 text-muted-foreground" />
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight">{totalStaff}</div>
          <p className="mt-1 text-[11px] text-muted-foreground">Registered team profiles</p>
        </div>

        <div className="rounded-xl border bg-card p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Active Staff</span>
            <UserCheck className="size-4 text-emerald-600" />
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
            {activeStaffCount}
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground">Currently on-duty / working</p>
        </div>

        <div className="rounded-xl border bg-card p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Pending Invites</span>
            <Mail className="size-4 text-amber-500" />
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-amber-600 dark:text-amber-400">
            {pendingInvitesCount}
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground">Awaiting password setup</p>
        </div>

        <div className="rounded-xl border bg-card p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Drafts</span>
            <UserPlus className="size-4 text-blue-500" />
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-blue-600 dark:text-blue-400">
            {draftCount}
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground">Unfinished onboardings</p>
        </div>
      </div>

      {/* Toolbar & Filter Bar */}
      <div className="flex flex-col gap-3 rounded-xl border bg-card p-3.5 shadow-2xs">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search */}
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Search staff by name, email, phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9"
            />
          </div>

          {/* Action Button */}
          {canEdit && (
            <Button
              onClick={() => setEditingStaff("new")}
              size="sm"
              className="gap-1.5 font-medium shadow-xs shrink-0"
            >
              <Plus className="size-4" /> Add staff member
            </Button>
          )}
        </div>

        {/* Multi-Filters Row */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t text-xs">
          <div className="flex items-center gap-1.5 text-muted-foreground mr-1">
            <Filter className="size-3.5" />
            <span>Filters:</span>
          </div>

          {/* Role Filter */}
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="h-8 text-xs w-[140px]">
              <SelectValue placeholder="All roles" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All roles</SelectItem>
              <SelectGroup>
                <SelectLabel className="text-[10px] uppercase font-semibold text-muted-foreground">Standard</SelectLabel>
                {Object.entries(ROLE_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectGroup>
              {customRoles.length > 0 && (
                <SelectGroup>
                  <SelectSeparator />
                  <SelectLabel className="text-[10px] uppercase font-semibold text-purple-600 dark:text-purple-400">Custom Roles</SelectLabel>
                  {customRoles.map((cr) => (
                    <SelectItem key={cr.id} value={`custom:${cr.name}`}>
                      {cr.name}
                    </SelectItem>
                  ))}
                </SelectGroup>
              )}
            </SelectContent>
          </Select>

          {/* Branch Filter */}
          <Select value={branchFilter} onValueChange={setBranchFilter}>
            <SelectTrigger className="h-8 text-xs w-[140px]">
              <SelectValue placeholder="All branches" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All branches</SelectItem>
              {branches.map((b) => (
                <SelectItem key={b.id} value={b.id}>
                  {b.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Status Filter */}
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-8 text-xs w-[120px]">
              <SelectValue placeholder="All status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="invited">Invited</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={resetFilters}
              className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground gap-1"
            >
              <X className="size-3" /> Reset
            </Button>
          )}

          <div className="ml-auto text-xs text-muted-foreground">
            Showing <strong className="text-foreground">{filteredStaff.length}</strong> of {totalStaff} members
          </div>
        </div>
      </div>

      {/* Staff Table */}
      {list.isLoading && (
        <div className="space-y-3">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-14 w-full rounded-xl" />
          ))}
        </div>
      )}

      {list.isError && (
        <ErrorState
          title="Couldn't load staff members"
          message="There was an issue connecting to the staff directory."
          onRetry={() => list.refetch()}
        />
      )}

      {list.data && filteredStaff.length === 0 && (
        <EmptyState
          title={hasActiveFilters ? "No matching staff members" : "No staff members yet"}
          description={
            hasActiveFilters
              ? "Try resetting your search query or filter selection."
              : "Invite your restaurant team members, assign their branch duties, and configure roles."
          }
          action={
            hasActiveFilters ? (
              <Button variant="outline" size="sm" onClick={resetFilters}>
                Clear filters
              </Button>
            ) : canEdit ? (
              <Button size="sm" onClick={() => setEditingStaff("new")}>
                <Plus className="size-4 mr-1.5" /> Add staff member
              </Button>
            ) : undefined
          }
        />
      )}

      {list.data && filteredStaff.length > 0 && (
        <div className="overflow-hidden rounded-xl border bg-card shadow-2xs">
          <DataTable
            headers={[
              "Staff member",
              "Role & Permissions",
              "Branch access",
              "Hourly rate",
              "Status",
              canEdit ? "Actions" : "",
            ].filter(Boolean)}
            rows={filteredStaff.map((s) => {
              const customMatch = s.customRoleName
                ? customRoles.find((cr) => cr.name.toLowerCase() === s.customRoleName?.toLowerCase())
                : null;

              return [
                // Staff member info with avatar initials
                <div key="member" className="flex items-center gap-3 py-1">
                  <div className="size-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold text-xs border border-primary/20 shrink-0">
                    {s.initials || s.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-medium text-foreground">{s.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {s.email || (s.phone ? s.phone : "No email")}
                    </div>
                  </div>
                </div>,

                // Role badge & custom role indicator
                <div key="role" className="py-1">
                  {s.customRoleName ? (
                    <Badge
                      variant="outline"
                      className="gap-1 bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20 font-medium"
                      title={`Custom Role based on ${ROLE_LABELS[s.role] || s.role}`}
                    >
                      <Sparkles className="size-3 text-purple-500" />
                      {s.customRoleName}
                    </Badge>
                  ) : (
                    <Badge
                      variant="outline"
                      className={cn("font-medium", ROLE_BADGE_COLORS[s.role] || ROLE_BADGE_COLORS.waiter)}
                    >
                      {ROLE_LABELS[s.role] || s.role}
                    </Badge>
                  )}
                </div>,

                // Branch access
                <div key="branches" className="py-1 text-xs">
                  {s.branchIds === "all" ? (
                    <Badge variant="secondary" className="font-normal text-[11px]">
                      All branches ({branches.length})
                    </Badge>
                  ) : Array.isArray(s.branchIds) && s.branchIds.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {s.branchIds.slice(0, 2).map((bid) => (
                        <Badge key={bid} variant="outline" className="text-[10px] px-1.5 py-0 h-5 font-normal">
                          {bName(bid)}
                        </Badge>
                      ))}
                      {s.branchIds.length > 2 && (
                        <span className="text-[10px] text-muted-foreground self-center">
                          +{s.branchIds.length - 2} more
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </div>,

                // Hourly rate
                <div key="rate" className="py-1 text-xs tabular font-medium">
                  {s.hourlyRate && s.hourlyRate > 0 ? (
                    `${money(s.hourlyRate)}/hr`
                  ) : (
                    <span className="text-muted-foreground font-normal">—</span>
                  )}
                </div>,

                // Status
                <div key="status" className="py-1">
                  {s.status === "invited" ? (
                    <Badge variant="outline" className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 text-[11px]">
                      Invited
                    </Badge>
                  ) : s.status === "draft" ? (
                    <Badge variant="outline" className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 text-[11px]">
                      Draft
                    </Badge>
                  ) : s.active ? (
                    <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-[11px]">
                      Active
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-muted-foreground text-[11px]">
                      Inactive
                    </Badge>
                  )}
                </div>,

                // Actions
                canEdit && (
                  <div key="actions" className="flex items-center justify-end gap-1.5 py-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 text-muted-foreground hover:text-foreground"
                      onClick={() => setEditingStaff(s)}
                      title={`Edit ${s.name}`}
                    >
                      <Pencil className="size-3.5" />
                    </Button>
                    <Confirm
                      title={`Remove ${s.name}?`}
                      body="This staff member will lose access to all restaurant branches and terminals. This action cannot be undone."
                      confirmLabel="Remove staff"
                      onConfirm={async () => {
                        await withToast(deleteStaff({ tenantId: tenant.id, id: s.id }), "Staff member removed");
                      }}
                    >
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 text-muted-foreground hover:text-destructive"
                        title={`Remove ${s.name}`}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </Confirm>
                  </div>
                ),
              ].filter(Boolean) as React.ReactNode[];
            })}
          />
        </div>
      )}

      {/* Staff Creation & Edit Dialog */}
      {editingStaff && (
        <StaffDialog
          s={editingStaff === "new" ? null : editingStaff}
          onClose={() => setEditingStaff(null)}
          customRoles={customRoles}
          onCustomRoleCreated={(newRole) => setCustomRoles((prev) => [...prev, newRole])}
        />
      )}
    </div>
  );
}

// ---------- Staff Dialog with Inline Role Creator & Permissions Preview ----------
function StaffDialog({
  s,
  onClose,
  customRoles,
  onCustomRoleCreated,
}: {
  s: StaffMember | null;
  onClose: () => void;
  customRoles: CustomRole[];
  onCustomRoleCreated?: (role: CustomRole) => void;
}) {
  const { tenant, branches: contextBranches } = useTenant();
  const branchesQuery = useAllBranchesQuery(tenant.id);
  const [save, { isLoading }] = useSaveStaffMutation();
  const [localCustomRoles, setLocalCustomRoles] = useState<CustomRole[]>(customRoles);

  // Inline role creator state
  const [isCreatingRoleInline, setIsCreatingRoleInline] = useState(false);
  const [inlineRoleForm, setInlineRoleForm] = useState<{
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
  const [isSavingInlineRole, setIsSavingInlineRole] = useState(false);

  useEffect(() => {
    setLocalCustomRoles(customRoles);
  }, [customRoles]);

  const availableBranches =
    branchesQuery.data && branchesQuery.data.length > 0
      ? branchesQuery.data
      : contextBranches && contextBranches.length > 0
        ? contextBranches
        : [];

  const [v, setV] = useState({
    name: s?.name ?? "",
    email: s?.email ?? "",
    phone: s?.phone ?? "",
    role: s?.role ?? ("waiter" as RoleId),
    customRoleName: s?.customRoleName ?? "",
    hourlyRate: String(s?.hourlyRate ?? 0),
    active: s?.active ?? true,
  });

  const [all, setAll] = useState(s ? s.branchIds === "all" : true);
  const [picked, setPicked] = useState<string[]>(
    s && s.branchIds !== "all"
      ? s.branchIds
      : availableBranches[0]?.id
        ? [availableBranches[0].id]
        : []
  );

  const toggleBranch = (branchId: string) => {
    if (all) {
      setAll(false);
      setPicked([branchId]);
    } else {
      if (picked.includes(branchId)) {
        setPicked(picked.filter((id) => id !== branchId));
      } else {
        const next = [...picked, branchId];
        if (availableBranches.length > 0 && next.length === availableBranches.length) {
          setAll(true);
          setPicked([]);
        } else {
          setPicked(next);
        }
      }
    }
  };

  const handleToggleAll = (checked: boolean) => {
    setAll(checked);
    if (!checked) {
      if (picked.length === 0 && availableBranches[0]?.id) {
        setPicked([availableBranches[0].id]);
      }
    }
  };

  // Handle inline custom role creation without leaving the dialog
  const handleCreateInlineRole = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = inlineRoleForm.name.trim();
    if (!name) {
      toast.error("Please enter a role name.");
      return;
    }
    const exists = localCustomRoles.some((r) => r.name.toLowerCase() === name.toLowerCase());
    if (exists || Object.values(ROLE_LABELS).some((lbl) => lbl.toLowerCase() === name.toLowerCase())) {
      toast.error(`A role named "${name}" already exists.`);
      return;
    }

    const templateBase: RoleId = inlineRoleForm.baseRole === "empty" ? "waiter" : inlineRoleForm.baseRole;
    setIsSavingInlineRole(true);
    try {
      const created = await saveCustomRole(tenant.slug, {
        name,
        description: inlineRoleForm.description.trim(),
        color: inlineRoleForm.color,
        baseRole: templateBase,
        permissions: [...(ROLE_PERMISSIONS[templateBase] || [])],
      });
      setLocalCustomRoles((prev) => [...prev, created]);
      if (onCustomRoleCreated) onCustomRoleCreated(created);

      setV((prev) => ({
        ...prev,
        customRoleName: created.name,
        role: created.baseRole,
      }));
      setIsCreatingRoleInline(false);
      setInlineRoleForm({ name: "", description: "", baseRole: "cashier", color: "purple" });
      toast.success(`Role "${created.name}" created and assigned to this staff member!`);
    } catch (err: any) {
      toast.error(err?.message || "Failed to create custom role.");
    } finally {
      setIsSavingInlineRole(false);
    }
  };

  const handleSave = async (statusOverride?: "draft" | "invited") => {
    if (!v.name.trim()) return;
    const input = {
      tenantId: tenant.id,
      id: s?.id,
      ...v,
      name: v.name.trim(),
      email: v.email.trim(),
      phone: v.phone.trim(),
      role: v.role,
      customRoleName: v.customRoleName?.trim() || undefined,
      hourlyRate: num(v.hourlyRate) || 0,
      branchIds: all ? ("all" as const) : picked,
      status: statusOverride ?? (s?.status || (v.email.trim() && !s ? "invited" : "active")),
      sendInvite: statusOverride === "draft" ? false : true,
    };
    const toastMsg =
      statusOverride === "draft"
        ? "Saved as draft"
        : v.email.trim() && !s
          ? "Invitation email sent"
          : "Staff saved";
    if (await withToast(save(input), toastMsg)) onClose();
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-[560px] max-h-[90vh] overflow-y-auto p-6">
        <DialogHeader className="space-y-1 pb-2">
          <DialogTitle className="text-xl font-semibold">
            {s ? `Edit ${s.name}` : "Add Staff Member"}
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            {s
              ? "Update role, contact details, and branch assignments."
              : "Create a staff member as a draft or send an email invitation with login setup."}
          </DialogDescription>
        </DialogHeader>

        <form
          className="space-y-4 pt-1"
          onSubmit={async (e) => {
            e.preventDefault();
            await handleSave();
          }}
        >
          {/* Full Name */}
          <div className="space-y-1.5">
            <Label htmlFor="staff-name" className="text-sm font-medium">
              Full Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="staff-name"
              value={v.name}
              maxLength={60}
              placeholder="e.g. Tanvir Hossain"
              onChange={(e) => setV({ ...v, name: e.target.value })}
              required
              className="h-10 w-full"
            />
          </div>

          {/* Email Address */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="staff-email" className="text-sm font-medium">
                Email Address
              </Label>
              <span className="text-xs text-muted-foreground">For invitation link</span>
            </div>
            <div className="relative">
              <Mail className="absolute left-3 top-3 size-4 text-muted-foreground" />
              <Input
                id="staff-email"
                type="email"
                value={v.email}
                maxLength={120}
                placeholder="staff.member@restaurant.com"
                onChange={(e) => setV({ ...v, email: e.target.value })}
                className="pl-9 h-10 w-full"
              />
            </div>
            <p className="text-[11px] text-muted-foreground">
              An invitation link will be sent to this email so the staff member can set their password.
            </p>
          </div>

          {/* Phone & Hourly rate */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="staff-phone" className="text-sm font-medium">
                Phone Number (optional)
              </Label>
              <Input
                id="staff-phone"
                type="tel"
                value={v.phone}
                maxLength={30}
                placeholder="e.g. +880 1711-000111"
                onChange={(e) => setV({ ...v, phone: e.target.value })}
                className="h-10 w-full"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="staff-rate" className="text-sm font-medium">
                Hourly Rate ({tenant.currency || "BDT"})
              </Label>
              <Input
                id="staff-rate"
                inputMode="decimal"
                value={v.hourlyRate}
                placeholder="0.00"
                onChange={(e) => setV({ ...v, hourlyRate: e.target.value })}
                className="h-10 w-full"
              />
            </div>
          </div>

          {/* Role selector with Inline Creation & Capabilities Preview */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="staff-role" className="text-sm font-medium">
                Staff Role <span className="text-destructive">*</span>
              </Label>
              <div className="flex items-center gap-2">
                {!isCreatingRoleInline && (
                  <button
                    type="button"
                    onClick={() => setIsCreatingRoleInline(true)}
                    className="text-xs text-primary hover:underline flex items-center gap-1 font-medium"
                  >
                    <Plus className="size-3" /> Create new role
                  </button>
                )}
                <span className="text-muted-foreground/30">·</span>
                <Link
                  to="/app/$tenantSlug/team/roles"
                  params={{ tenantSlug: tenant.slug }}
                  className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                >
                  <Shield className="size-3" /> View matrix
                </Link>
              </div>
            </div>

            {/* Inline Quick Role Creator */}
            {isCreatingRoleInline ? (
              <div className="rounded-xl border border-purple-500/30 bg-purple-500/5 p-3.5 space-y-3 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-semibold text-xs text-purple-700 dark:text-purple-300">
                    <Sparkles className="size-3.5 text-purple-500" />
                    Create & Assign New Custom Role
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsCreatingRoleInline(false)}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    ✕ Cancel
                  </button>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="inline-role-name" className="text-xs font-medium">
                    Role Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="inline-role-name"
                    placeholder="e.g. Senior Barista, Floor Captain, Head Chef"
                    value={inlineRoleForm.name}
                    onChange={(e) => setInlineRoleForm({ ...inlineRoleForm, name: e.target.value })}
                    className="h-8 text-xs bg-background"
                    autoFocus
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs font-medium">Base Template</Label>
                    <Select
                      value={inlineRoleForm.baseRole}
                      onValueChange={(val) => setInlineRoleForm({ ...inlineRoleForm, baseRole: val as RoleId })}
                    >
                      <SelectTrigger className="h-8 text-xs bg-background">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cashier">Cashier (checkout & cash)</SelectItem>
                        <SelectItem value="waiter">Waiter (tables & orders)</SelectItem>
                        <SelectItem value="kitchen">Kitchen (kitchen display)</SelectItem>
                        <SelectItem value="manager">Manager (full operations)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-medium">Color Badge</Label>
                    <Select
                      value={inlineRoleForm.color}
                      onValueChange={(val) => setInlineRoleForm({ ...inlineRoleForm, color: val })}
                    >
                      <SelectTrigger className="h-8 text-xs bg-background">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="purple">Purple</SelectItem>
                        <SelectItem value="indigo">Indigo</SelectItem>
                        <SelectItem value="sky">Sky Blue</SelectItem>
                        <SelectItem value="teal">Teal</SelectItem>
                        <SelectItem value="amber">Amber</SelectItem>
                        <SelectItem value="rose">Rose</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-1 border-t border-purple-500/20">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => setIsCreatingRoleInline(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    className="h-7 text-xs gap-1 bg-purple-600 hover:bg-purple-700 text-white font-medium"
                    disabled={isSavingInlineRole || !inlineRoleForm.name.trim()}
                    onClick={handleCreateInlineRole}
                  >
                    {isSavingInlineRole && <Loader2 className="size-3 animate-spin mr-1" />}
                    Create & Assign Role
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <Select
                  value={v.customRoleName ? `custom:${v.customRoleName}` : `standard:${v.role}`}
                  onValueChange={(val) => {
                    if (val === "action:create_new_role") {
                      setIsCreatingRoleInline(true);
                      return;
                    }
                    if (val.startsWith("custom:")) {
                      const cName = val.replace("custom:", "");
                      const found = localCustomRoles.find((cr) => cr.name === cName);
                      setV({
                        ...v,
                        customRoleName: cName,
                        role: found ? found.baseRole : "waiter",
                      });
                    } else {
                      const stdRole = val.replace("standard:", "") as RoleId;
                      setV({
                        ...v,
                        customRoleName: "",
                        role: stdRole,
                      });
                    }
                  }}
                >
                  <SelectTrigger id="staff-role" className="h-10 w-full">
                    <SelectValue placeholder="Select staff role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel className="text-xs uppercase font-semibold text-muted-foreground">Standard Roles</SelectLabel>
                      {Object.entries(ROLE_LABELS).map(([key, label]) => (
                        <SelectItem key={key} value={`standard:${key}`}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                    {localCustomRoles.length > 0 && (
                      <SelectGroup>
                        <SelectSeparator />
                        <SelectLabel className="text-xs uppercase font-semibold text-purple-600 dark:text-purple-400">Custom Roles</SelectLabel>
                        {localCustomRoles.map((cr) => (
                          <SelectItem key={cr.id} value={`custom:${cr.name}`}>
                            {cr.name}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    )}
                    <SelectSeparator />
                    <SelectItem value="action:create_new_role" className="text-purple-600 dark:text-purple-400 font-medium">
                      + Create new custom role...
                    </SelectItem>
                  </SelectContent>
                </Select>

                {/* Role Capabilities Scope Preview Pill */}
                <div className="rounded-lg border bg-muted/30 p-2.5 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-foreground flex items-center gap-1.5">
                      <Shield className="size-3.5 text-primary" />
                      Scope: {v.customRoleName || ROLE_LABELS[v.role]}
                    </span>
                    <Link
                      to="/app/$tenantSlug/team/roles"
                      params={{ tenantSlug: tenant.slug }}
                      className="text-[11px] text-primary hover:underline"
                    >
                      Configure matrix ↗
                    </Link>
                  </div>
                  <p className="text-muted-foreground text-[11px] leading-relaxed">
                    {v.customRoleName
                      ? `Custom role based on ${ROLE_LABELS[v.role]}. Specific terminal permissions can be adjusted in the Roles & Permissions matrix.`
                      : ROLE_SUMMARY_DESCRIPTIONS[v.role] || "Standard operational permissions."}
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Branch Access Section */}
          <div className="space-y-3 rounded-lg border bg-muted/20 p-4 shadow-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building2 className="size-4 text-primary" />
                <Label className="text-sm font-semibold">Branch Access</Label>
              </div>
              <div className="flex items-center gap-2">
                <label htmlFor="all-branches-toggle" className="text-xs text-muted-foreground cursor-pointer">
                  All branches
                </label>
                <Switch id="all-branches-toggle" checked={all} onCheckedChange={handleToggleAll} />
              </div>
            </div>

            {!all && (
              <div className="space-y-2 pt-2 border-t">
                <p className="text-xs text-muted-foreground">Select which branches this staff member can access:</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 max-h-40 overflow-y-auto">
                  {availableBranches.map((b) => {
                    const isChecked = picked.includes(b.id);
                    return (
                      <div
                        key={b.id}
                        onClick={() => toggleBranch(b.id)}
                        className={cn(
                          "flex items-center space-x-2.5 rounded-md border p-2.5 cursor-pointer transition-colors",
                          isChecked
                            ? "border-primary/50 bg-primary/5 font-medium"
                            : "border-border hover:bg-accent/40"
                        )}
                      >
                        <Checkbox
                          id={`branch-${b.id}`}
                          checked={isChecked}
                          onCheckedChange={() => toggleBranch(b.id)}
                        />
                        <label htmlFor={`branch-${b.id}`} className="text-xs font-medium cursor-pointer leading-none flex-1 truncate">
                          {b.name}
                        </label>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="flex items-center justify-between gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <div className="flex items-center gap-2">
              {!s && (
                <Button
                  type="button"
                  variant="secondary"
                  disabled={isLoading || !v.name.trim()}
                  onClick={() => handleSave("draft")}
                >
                  Save as draft
                </Button>
              )}
              <Button type="submit" disabled={isLoading || !v.name.trim()}>
                {isLoading && <Loader2 className="size-4 animate-spin mr-1.5" />}
                {s ? "Save changes" : v.email.trim() ? "Send invitation" : "Add staff"}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
