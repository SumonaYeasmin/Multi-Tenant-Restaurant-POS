import { createFileRoute } from "@tanstack/react-router";
import { format } from "date-fns";
import { Clock, Loader2 } from "lucide-react";
import { RequirePermission } from "@/features/tenant/require-permission";
import { useTenant } from "@/features/tenant/tenant-context";
import { useAttendanceQuery, useStaffQuery, useToggleClockMutation } from "@/features/people/api";
import { withToast } from "@/features/tenant/use-mutation-toast";
import { hoursWorked } from "@/services/people.service";
import { DataTable, td } from "@/components/common/confirm";
import { EmptyState, ErrorState } from "@/components/common/states";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/app/$tenantSlug/team/attendance")({
  head: () => ({ meta: [{ title: "Attendance — Tablewise POS" }, { name: "description", content: "Clock in and out, and review hours worked." }] }),
  component: () => (
    <RequirePermission perm="attendance.self">
      <Attendance />
    </RequirePermission>
  ),
});

function Attendance() {
  const { tenant, branch, user, can } = useTenant();
  const list = useAttendanceQuery({ tenantId: tenant.id, branchId: branch.id });
  const staff = useStaffQuery(tenant.id);
  const [toggle, { isLoading }] = useToggleClockMutation();
  const me = staff.data?.find((s) => s.userId === user.id);
  const mine = (list.data ?? []).find((a) => a.staffId === me?.id && a.clockOut === null);
  const rows = (list.data ?? []).filter((a) => can("shifts.manage") || a.staffId === me?.id);
  return (
    <div className="space-y-5">
      <section className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-card p-4" aria-label="My clock">
        <div>
          <p className="font-semibold">{user.name}</p>
          <p className="text-sm text-muted-foreground">{mine ? `Clocked in at ${format(new Date(mine.clockIn), "HH:mm")} · ${hoursWorked(mine).toFixed(2)} h so far` : `Not clocked in at ${branch.name}`}</p>
        </div>
        <Button size="lg" variant={mine ? "outline" : "default"} disabled={isLoading || !me} onClick={() => void withToast(toggle({ tenantId: tenant.id, userId: user.id, branchId: branch.id }), mine ? "Clocked out" : "Clocked in")}>
          {isLoading ? <Loader2 className="size-4 animate-spin" /> : <Clock className="size-4" />} {mine ? "Clock out" : "Clock in"}
        </Button>
      </section>
      {list.isLoading && <Skeleton className="h-40" />}
      {list.isError && <ErrorState message="Couldn't load attendance." onRetry={list.refetch} />}
      {list.data && rows.length === 0 && <EmptyState title="No attendance yet" />}
      {rows.length > 0 && (
        <DataTable head={["Staff", "Clock in", "Clock out", "Hours"]}>
          {rows.map((a) => (
            <tr key={a.id}>
              <td className={`${td} font-medium`}>{a.staffName}</td>
              <td className={td}>{format(new Date(a.clockIn), "d MMM HH:mm")}</td>
              <td className={td}>{a.clockOut ? format(new Date(a.clockOut), "d MMM HH:mm") : <Badge variant="success">On shift</Badge>}</td>
              <td className={`${td} tabular-nums`}>{hoursWorked(a).toFixed(2)}</td>
            </tr>
          ))}
        </DataTable>
      )}
    </div>
  );
}
