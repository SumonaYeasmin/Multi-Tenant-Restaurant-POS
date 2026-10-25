import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Building2, Loader2, Mail, Pencil, Plus, Trash2 } from "lucide-react";
import { RequirePermission } from "@/features/tenant/require-permission";
import { useTenant } from "@/features/tenant/tenant-context";
import { useMoney } from "@/features/tenant/use-money";
import { useAllBranchesQuery, useDeleteStaffMutation, useSaveStaffMutation, useStaffQuery } from "@/features/people/api";
import { withToast } from "@/features/tenant/use-mutation-toast";
import { ROLE_LABELS } from "@/config/permissions.config";
import { Confirm, DataTable, td } from "@/components/common/confirm";
import { EmptyState, ErrorState } from "@/components/common/states";
import { num } from "@/components/common/field";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { RoleId, StaffMember } from "@/types/domain";

export const Route = createFileRoute("/app/$tenantSlug/team/")({
  head: () => ({ meta: [{ title: "Staff — Tablewise POS" }, { name: "description", content: "Staff directory, roles and branch access." }] }),
  component: () => (
    <RequirePermission perm="shifts.manage">
      <Staff />
    </RequirePermission>
  ),
});

function Staff() {
  const { tenant, branches: contextBranches, can } = useTenant();
  const money = useMoney();
  const list = useStaffQuery(tenant.id);
  const branchesQuery = useAllBranchesQuery(tenant.id);
  const branches = (branchesQuery.data && branchesQuery.data.length > 0)
    ? branchesQuery.data
    : (contextBranches && contextBranches.length > 0 ? contextBranches : []);

  const [deleteStaff] = useDeleteStaffMutation();
  const [editing, setEditing] = useState<StaffMember | "new" | null>(null);

  const bName = (id: string) => branches.find((b) => b.id === id)?.name ?? id;
  const canEdit = can("staff.manage");

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">{canEdit ? "Add staff as drafts or send email invitations. Staff receive a link to set their own password." : "Only the owner can change staff and roles."}</p>
        {canEdit && <Button onClick={() => setEditing("new")}><Plus className="size-4" /> Add staff</Button>}
      </div>
      {list.isLoading && <Skeleton className="h-48" />}
      {list.isError && <ErrorState message="Couldn't load staff." onRetry={list.refetch} />}
      {list.data && list.data.length === 0 && <EmptyState title="No staff yet" />}
      {list.data && list.data.length > 0 && (
        <DataTable head={["Name", "Role", "Branches", "Hourly rate", "Status", ""]}>
          {list.data.map((s) => (
            <tr key={s.id}>
              <td className={`${td} font-medium`}>
                {s.name}
                {s.userId && <Badge variant="info" className="ml-2">Sign-in</Badge>}
                <p className="text-xs text-muted-foreground">{s.email || s.phone || "—"}</p>
              </td>
              <td className={td}>{ROLE_LABELS[s.role]}</td>
              <td className={td}>{s.branchIds === "all" ? "All branches" : s.branchIds.map(bName).join(", ")}</td>
              <td className={td}>{s.hourlyRate ? money(s.hourlyRate) : "—"}</td>
              <td className={td}>
                {s.status === "invited" ? (
                  <Badge variant="warning">Invited</Badge>
                ) : s.status === "draft" ? (
                  <Badge variant="muted">Draft</Badge>
                ) : s.active ? (
                  <Badge variant="success">Active</Badge>
                ) : (
                  <Badge variant="muted">Inactive</Badge>
                )}
              </td>
              <td className={`${td} text-right space-x-1 whitespace-nowrap`}>
                {canEdit && (
                  <>
                    <Button size="icon" variant="ghost" aria-label={`Edit ${s.name}`} onClick={() => setEditing(s)}>
                      <Pencil className="size-4" />
                    </Button>
                    <Confirm
                      title={`Remove ${s.name}?`}
                      body="This will soft delete the staff member from the active directory."
                      onConfirm={() => withToast(deleteStaff({ tenantId: tenant.id, id: s.id }), "Staff member removed")}
                    >
                      <Button size="icon" variant="ghost" aria-label={`Delete ${s.name}`} className="text-destructive hover:bg-destructive/10">
                        <Trash2 className="size-4" />
                      </Button>
                    </Confirm>
                  </>
                )}
              </td>
            </tr>
          ))}
        </DataTable>
      )}
      {editing && <StaffDialog s={editing === "new" ? null : editing} onClose={() => setEditing(null)} />}
    </div>
  );
}

function StaffDialog({ s, onClose }: { s: StaffMember | null; onClose: () => void }) {
  const { tenant, branches: contextBranches } = useTenant();
  const branchesQuery = useAllBranchesQuery(tenant.id);
  const [save, { isLoading }] = useSaveStaffMutation();

  const availableBranches = (branchesQuery.data && branchesQuery.data.length > 0)
    ? branchesQuery.data
    : (contextBranches && contextBranches.length > 0 ? contextBranches : []);

  const [v, setV] = useState({
    name: s?.name ?? "",
    email: s?.email ?? "",
    phone: s?.phone ?? "",
    role: s?.role ?? ("waiter" as RoleId),
    hourlyRate: String(s?.hourlyRate ?? 0),
    active: s?.active ?? true,
  });

  // Default to all branches if editing an 'all' staff, otherwise specific picked branches
  const [all, setAll] = useState(s ? s.branchIds === "all" : true);
  const [picked, setPicked] = useState<string[]>(
    s && s.branchIds !== "all" ? s.branchIds : (availableBranches[0]?.id ? [availableBranches[0].id] : [])
  );

  const toggleBranch = (branchId: string) => {
    if (all) {
      // Switching from "all" to specifically selecting this one branch
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

  const handleSave = async (statusOverride?: "draft" | "invited") => {
    if (!v.name.trim()) return;
    const input = {
      tenantId: tenant.id,
      id: s?.id,
      ...v,
      name: v.name.trim(),
      email: v.email.trim(),
      phone: v.phone.trim(),
      hourlyRate: num(v.hourlyRate) || 0,
      branchIds: all ? ("all" as const) : picked,
      status: statusOverride ?? (s?.status || (v.email.trim() && !s ? "invited" : "active")),
      sendInvite: statusOverride === "draft" ? false : true,
    };
    const toastMsg = statusOverride === "draft" ? "Saved as draft" : v.email.trim() && !s ? "Invitation email sent" : "Staff saved";
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

          {/* Email Address - Generous Full Width */}
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

          {/* Role selector */}
          <div className="space-y-1.5">
            <Label htmlFor="staff-role" className="text-sm font-medium">
              Staff Role <span className="text-destructive">*</span>
            </Label>
            <Select value={v.role} onValueChange={(val) => setV({ ...v, role: val as RoleId })}>
              <SelectTrigger id="staff-role" className="h-10 w-full">
                <SelectValue placeholder="Select staff role" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(ROLE_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Branch Access Section */}
          <div className="space-y-3 rounded-lg border bg-muted/20 p-4 shadow-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building2 className="size-4 text-primary" />
                <Label className="text-sm font-semibold">Branch Access</Label>
              </div>
              <Badge variant={all ? "default" : "outline"} className="text-xs">
                {all ? "All branches" : `${picked.length} selected`}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Choose which physical branch locations this staff member can access and serve.
            </p>

            {/* All Branches Card */}
            <div
              onClick={() => handleToggleAll(!all)}
              className={cn(
                "flex items-start gap-3 rounded-md border p-3 cursor-pointer transition-colors",
                all ? "border-primary bg-primary/10 shadow-xs" : "border-border hover:bg-muted/50"
              )}
            >
              <Checkbox
                id="branch-all"
                checked={all}
                onCheckedChange={(c) => handleToggleAll(c === true)}
                className="mt-0.5"
              />
              <div className="space-y-0.5">
                <label htmlFor="branch-all" className="text-sm font-medium leading-none cursor-pointer">
                  All branches (Full restaurant access)
                </label>
                <p className="text-xs text-muted-foreground">
                  Staff member can work at and switch between all present and future locations.
                </p>
              </div>
            </div>

            {/* Individual Branches Options */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {all ? "Available locations (all granted):" : "Select specific branches:"}
                </span>
                {!all && picked.length === 0 && (
                  <span className="text-xs text-destructive font-medium">Select at least one branch</span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {availableBranches.map((b) => {
                  const isChecked = all || picked.includes(b.id);
                  return (
                    <div
                      key={b.id}
                      onClick={() => toggleBranch(b.id)}
                      className={cn(
                        "flex items-start gap-2.5 rounded-md border p-2.5 cursor-pointer transition-all",
                        isChecked
                          ? "border-primary/50 bg-primary/5"
                          : "border-border/80 hover:bg-muted/40"
                      )}
                    >
                      <Checkbox
                        checked={isChecked}
                        onCheckedChange={() => toggleBranch(b.id)}
                        className="mt-0.5"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-sm font-medium leading-tight truncate">{b.name}</span>
                          {all && (
                            <Badge variant="secondary" className="h-4 px-1 text-[10px] text-muted-foreground">
                              All
                            </Badge>
                          )}
                        </div>
                        {b.address && (
                          <p className="text-[11px] text-muted-foreground truncate mt-0.5" title={b.address}>
                            {b.address}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Active status for edit */}
          {s && (
            <div className="flex items-center justify-between rounded-lg border p-3 shadow-xs">
              <div className="space-y-0.5">
                <Label htmlFor="staff-active" className="text-sm font-medium cursor-pointer">
                  Account Active
                </Label>
                <p className="text-xs text-muted-foreground">
                  Active staff members can log in and be scheduled for shifts.
                </p>
              </div>
              <Switch
                id="staff-active"
                checked={v.active}
                onCheckedChange={(a) => setV({ ...v, active: a })}
              />
            </div>
          )}

          {/* Footer buttons */}
          <DialogFooter className="flex flex-col-reverse sm:flex-row items-center justify-between gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
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
              <Button
                type="submit"
                disabled={isLoading || !v.name.trim() || (!all && picked.length === 0)}
              >
                {isLoading && <Loader2 className="size-4 animate-spin mr-1.5" />}
                {!s ? (v.email.trim() ? "Send invitation" : "Save staff") : "Save changes"}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
