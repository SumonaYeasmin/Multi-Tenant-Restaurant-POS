import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { format } from "date-fns";
import { Loader2, Trash2 } from "lucide-react";
import { RequirePermission } from "@/features/tenant/require-permission";
import { useTenant } from "@/features/tenant/tenant-context";
import { useDeleteShiftMutation, useSaveShiftMutation, useShiftsQuery, useStaffQuery } from "@/features/people/api";
import { withToast } from "@/features/tenant/use-mutation-toast";
import { Confirm, DataTable, td } from "@/components/common/confirm";
import { EmptyState, ErrorState } from "@/components/common/states";
import { Field } from "@/components/common/field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/app/$tenantSlug/team/shifts")({
  head: () => ({ meta: [{ title: "Shifts — Tablewise POS" }, { name: "description", content: "Schedule staff shifts for the branch." }] }),
  component: () => (
    <RequirePermission perm="shifts.manage">
      <Shifts />
    </RequirePermission>
  ),
});

function Shifts() {
  const { tenant, branch } = useTenant();
  const list = useShiftsQuery({ tenantId: tenant.id, branchId: branch.id });
  const staff = useStaffQuery(tenant.id);
  const [save, { isLoading }] = useSaveShiftMutation();
  const [del] = useDeleteShiftMutation();
  const eligible = (staff.data ?? []).filter((s) => s.active && (s.branchIds === "all" || s.branchIds.includes(branch.id)));
  const [v, setV] = useState({ staffId: "", date: format(new Date(), "yyyy-MM-dd"), start: "09:00", end: "17:00", notes: "" });
  const today = format(new Date(), "yyyy-MM-dd");
  const rows = (list.data ?? []).filter((s) => s.date >= today);
  return (
    <div className="space-y-5">
      <form
        className="grid gap-3 rounded-lg border bg-card p-4 md:grid-cols-5"
        aria-label="New shift"
        onSubmit={async (e) => {
          e.preventDefault();
          await withToast(save({ tenantId: tenant.id, branchId: branch.id, ...v }), "Shift scheduled");
        }}
      >
        <Field label="Staff member">
          {(id) => (
            <select id={id} className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={v.staffId} onChange={(e) => setV({ ...v, staffId: e.target.value })} required>
              <option value="">Choose…</option>
              {eligible.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          )}
        </Field>
        <Field label="Date">{(id) => <Input id={id} type="date" value={v.date} onChange={(e) => setV({ ...v, date: e.target.value })} />}</Field>
        <Field label="Start">{(id) => <Input id={id} type="time" value={v.start} onChange={(e) => setV({ ...v, start: e.target.value })} />}</Field>
        <Field label="End">{(id) => <Input id={id} type="time" value={v.end} onChange={(e) => setV({ ...v, end: e.target.value })} />}</Field>
        <div className="flex items-end"><Button type="submit" disabled={isLoading} className="w-full">{isLoading && <Loader2 className="size-4 animate-spin" />} Add shift</Button></div>
      </form>
      {list.isLoading && <Skeleton className="h-48" />}
      {list.isError && <ErrorState message="Couldn't load shifts." onRetry={list.refetch} />}
      {list.data && rows.length === 0 && <EmptyState title="No upcoming shifts" />}
      {rows.length > 0 && (
        <DataTable head={["Date", "Staff", "Time", "Hours", ""]}>
          {rows.map((s) => {
            const [sh, sm] = s.start.split(":").map(Number);
            const [eh, em] = s.end.split(":").map(Number);
            const hrs = ((eh! * 60 + em!) - (sh! * 60 + sm!)) / 60;
            return (
              <tr key={s.id}>
                <td className={`${td} whitespace-nowrap`}>{format(new Date(`${s.date}T00:00`), "EEE d MMM")}</td>
                <td className={`${td} font-medium`}>{s.staffName}</td>
                <td className={td}>{s.start}–{s.end}</td>
                <td className={td}>{hrs.toFixed(1)}</td>
                <td className={`${td} text-right`}>
                  <Confirm title="Remove shift?" body={`${s.staffName}, ${s.date} ${s.start}–${s.end}`} confirmLabel="Remove" onConfirm={() => void withToast(del({ tenantId: tenant.id, id: s.id }), "Shift removed")}>
                    <Button size="icon" variant="ghost" aria-label={`Remove shift for ${s.staffName} on ${s.date}`}><Trash2 className="size-4" /></Button>
                  </Confirm>
                </td>
              </tr>
            );
          })}
        </DataTable>
      )}
    </div>
  );
}
