import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Loader2, Mail, Pencil, Plus, Send, Trash2 } from "lucide-react";
import { RequirePermission } from "@/features/tenant/require-permission";
import { useTenant } from "@/features/tenant/tenant-context";
import { useMoney } from "@/features/tenant/use-money";
import { useAllBranchesQuery, useDeleteStaffMutation, useReinviteStaffMutation, useSaveStaffMutation, useStaffQuery } from "@/features/people/api";
import { withToast } from "@/features/tenant/use-mutation-toast";
import { ROLE_LABELS } from "@/config/permissions.config";
import { Confirm, DataTable, td } from "@/components/common/confirm";
import { EmptyState, ErrorState } from "@/components/common/states";
import { Field, num } from "@/components/common/field";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
  const { tenant, can } = useTenant();
  const money = useMoney();
  const list = useStaffQuery(tenant.id);
  const branches = useAllBranchesQuery(tenant.id);
  const [deleteStaff] = useDeleteStaffMutation();
  const [reinvite] = useReinviteStaffMutation();
  const [editing, setEditing] = useState<StaffMember | "new" | null>(null);
  const bName = (id: string) => branches.data?.find((b) => b.id === id)?.name ?? id;
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
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <Badge variant="warning">Invited</Badge>
                    {canEdit && s.email && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-6 px-1.5 text-[11px] gap-1"
                        title="Resend invitation link"
                        onClick={() => withToast(reinvite({ tenantId: tenant.id, id: s.id }), "Invitation resent")}
                      >
                        <Send className="size-3" /> Re-invite
                      </Button>
                    )}
                  </div>
                ) : s.status === "draft" ? (
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <Badge variant="muted">Draft</Badge>
                    {canEdit && s.email && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-6 px-1.5 text-[11px] gap-1"
                        title="Send invitation link"
                        onClick={() => withToast(reinvite({ tenantId: tenant.id, id: s.id }), "Invitation sent")}
                      >
                        <Mail className="size-3" /> Send invite
                      </Button>
                    )}
                  </div>
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
  const { tenant } = useTenant();
  const branches = useAllBranchesQuery(tenant.id);
  const [save, { isLoading }] = useSaveStaffMutation();
  const [v, setV] = useState({
    name: s?.name ?? "",
    email: s?.email ?? "",
    phone: s?.phone ?? "",
    role: s?.role ?? ("waiter" as RoleId),
    hourlyRate: String(s?.hourlyRate ?? 0),
    active: s?.active ?? true,
  });
  const [all, setAll] = useState(s?.branchIds === "all");
  const [picked, setPicked] = useState<string[]>(s && s.branchIds !== "all" ? s.branchIds : []);

  const handleSave = async (statusOverride?: "draft" | "invited") => {
    const input = {
      tenantId: tenant.id,
      id: s?.id,
      ...v,
      hourlyRate: num(v.hourlyRate) || 0,
      branchIds: all ? ("all" as const) : picked,
      status: statusOverride ?? (s?.status || (v.email && !s ? "invited" : "active")),
      sendInvite: statusOverride === "draft" ? false : true,
    };
    const toastMsg = statusOverride === "draft" ? "Saved as draft" : v.email && !s ? "Staff invited" : "Staff saved";
    if (await withToast(save(input), toastMsg)) onClose();
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{s ? `Edit ${s.name}` : "Add staff member"}</DialogTitle>
        </DialogHeader>
        <form
          className="grid grid-cols-2 gap-3"
          onSubmit={async (e) => {
            e.preventDefault();
            await handleSave();
          }}
        >
          <Field label="Name" className="col-span-2">
            {(id) => <Input id={id} value={v.name} maxLength={60} onChange={(e) => setV({ ...v, name: e.target.value })} required />}
          </Field>
          <Field label="Email">
            {(id) => <Input id={id} type="email" value={v.email} maxLength={80} placeholder="For invitation link" onChange={(e) => setV({ ...v, email: e.target.value })} />}
          </Field>
          <Field label="Phone">
            {(id) => <Input id={id} type="tel" value={v.phone} maxLength={20} onChange={(e) => setV({ ...v, phone: e.target.value })} />}
          </Field>
          <Field label="Role">
            {(id) => (
              <select id={id} className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={v.role} onChange={(e) => setV({ ...v, role: e.target.value as RoleId })}>
                {Object.entries(ROLE_LABELS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
              </select>
            )}
          </Field>
          <Field label="Hourly rate">
            {(id) => <Input id={id} inputMode="decimal" value={v.hourlyRate} onChange={(e) => setV({ ...v, hourlyRate: e.target.value })} />}
          </Field>
          <fieldset className="col-span-2 space-y-1.5">
            <legend className="mb-1 text-sm font-medium">Branch access</legend>
            <label className="flex items-center gap-2 text-sm"><Checkbox checked={all} onCheckedChange={(c) => setAll(c === true)} /> All branches</label>
            {!all && (branches.data ?? []).map((b) => (
              <label key={b.id} className="flex items-center gap-2 text-sm">
                <Checkbox checked={picked.includes(b.id)} onCheckedChange={(c) => setPicked(c === true ? [...picked, b.id] : picked.filter((x) => x !== b.id))} /> {b.name}
              </label>
            ))}
          </fieldset>
          {s && (
            <label className="col-span-2 flex items-center gap-2 text-sm">
              <Switch checked={v.active} onCheckedChange={(a) => setV({ ...v, active: a })} /> Active
            </label>
          )}
          <DialogFooter className="col-span-2 flex items-center justify-between gap-2 sm:justify-between">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <div className="flex items-center gap-2">
              {!s && (
                <Button
                  type="button"
                  variant="secondary"
                  disabled={isLoading}
                  onClick={() => handleSave("draft")}
                >
                  Save as draft
                </Button>
              )}
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="size-4 animate-spin mr-1" />}
                {!s ? (v.email ? "Send invitation" : "Save staff") : "Save changes"}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
