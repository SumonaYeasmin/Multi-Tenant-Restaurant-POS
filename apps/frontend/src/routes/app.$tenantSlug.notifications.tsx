import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { Bell, CheckCheck, Inbox, ShieldAlert, Sparkles, Tag, Utensils } from "lucide-react";
import { RequirePermission } from "@/features/tenant/require-permission";
import { useTenant } from "@/features/tenant/tenant-context";
import { useMarkNotificationsReadMutation, useNotificationsQuery } from "@/app/api";
import { PageHeader, EmptyState, SkeletonCard } from "@/components/common/states";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/app/$tenantSlug/notifications")({
  head: () => ({
    meta: [
      { title: "Notifications — Tablewise POS" },
      { name: "description", content: "View all real-time restaurant alerts, inventory warnings, and system notices." },
    ],
  }),
  component: () => (
    <RequirePermission perm="notifications.view">
      <NotificationsPage />
    </RequirePermission>
  ),
});

function NotificationsPage() {
  const { tenant } = useTenant();
  const { data: notifications = [], isLoading } = useNotificationsQuery(tenant.id);
  const [markAllRead, { isLoading: marking }] = useMarkNotificationsReadMutation();
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const unreadCount = notifications.filter((n) => !n.read).length;
  const filtered = notifications.filter((n) => (filter === "unread" ? !n.read : true));

  const handleMarkAll = async () => {
    try {
      await markAllRead(tenant.id).unwrap();
      toast.success("All notifications marked as read.");
    } catch {
      toast.error("Couldn't update notifications.");
    }
  };

  const getIcon = (title: string) => {
    const t = title.toLowerCase();
    if (t.includes("stock") || t.includes("inventory")) return <ShieldAlert className="size-5 text-amber-500" />;
    if (t.includes("order") || t.includes("kitchen")) return <Utensils className="size-5 text-blue-500" />;
    if (t.includes("welcome")) return <Sparkles className="size-5 text-primary" />;
    return <Tag className="size-5 text-muted-foreground" />;
  };

  const formatTimeAgo = (dateStr?: string) => {
    if (!dateStr) return "Recently";
    try {
      const parsed = new Date(dateStr);
      if (isNaN(parsed.getTime())) return "Recently";
      return formatDistanceToNow(parsed, { addSuffix: true });
    } catch {
      return "Recently";
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notifications Center"
        description={`Stay updated with real-time alerts across ${tenant.name}.`}
        actions={
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <Button variant="outline" size="sm" onClick={handleMarkAll} disabled={marking} className="gap-2">
                <CheckCheck className="size-4" /> Mark all as read
              </Button>
            )}
          </div>
        }
      />

      <Tabs value={filter} onValueChange={(v) => setFilter(v as any)} className="space-y-4">
        <TabsList>
          <TabsTrigger value="all" className="gap-2">
            All Alerts
            <Badge variant="secondary" className="text-xs px-1.5 py-0">
              {notifications.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="unread" className="gap-2">
            Unread
            {unreadCount > 0 && (
              <Badge variant="default" className="text-xs px-1.5 py-0 bg-primary">
                {unreadCount}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {isLoading ? (
        <div className="space-y-3">
          {[0, 1, 2, 3].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Inbox className="size-8" />}
          title={filter === "unread" ? "No unread alerts" : "No notifications yet"}
          description={filter === "unread" ? "You are completely caught up!" : "New operational alerts will appear here."}
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((item) => (
            <Card
              key={item.id}
              className={`transition-colors border ${
                item.read ? "bg-card/60 border-border/50" : "bg-card border-primary/40 shadow-sm"
              }`}
            >
              <CardContent className="p-4 flex items-start gap-4">
                <div className="mt-0.5 rounded-full p-2 bg-muted/60">{getIcon(item.title)}</div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-sm flex items-center gap-2">
                      {item.title}
                      {!item.read && (
                        <span className="size-2 rounded-full bg-primary inline-block" title="Unread" />
                      )}
                    </p>
                    <span className="text-xs text-muted-foreground">
                      {formatTimeAgo(item.createdAt)}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">{item.body}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
