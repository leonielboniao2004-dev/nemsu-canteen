import { useMemo, useState } from "react";
import { Bell, CheckCheck, AlertTriangle, ShoppingBag, Megaphone, Mail } from "lucide-react";
import { VendorShell } from "@/components/VendorShell";
import { Badge } from "@/components/ui/badge";
import { ICONS, notificationsStore, TYPE_ICON_BG, timeAgo, useNotifications, type NotifType } from "@/lib/notifications";
import { toast } from "sonner";

const TABS: ("All" | "Unread" | "Pending" | "Alerts" | "Announcements")[] = ["All", "Unread", "Pending", "Alerts", "Announcements"];

const VendorNotifications = () => {
  const items = useNotifications("vendor");
  const [tab, setTab] = useState<(typeof TABS)[number]>("All");

  const visible = useMemo(() => {
    if (tab === "All") return items;
    if (tab === "Unread") return items.filter((n) => !n.read);
    if (tab === "Pending") return items.filter((n) => n.type === "Pending");
    if (tab === "Alerts") return items.filter((n) => n.type === "Alert");
    return items.filter((n) => n.type === "Announcement");
  }, [items, tab]);

  const unread = items.filter((n) => !n.read).length;
  const alerts = items.filter((n) => n.type === "Alert").length;
  const newOrders = items.filter((n) => n.type === "Pending").length;

  const markAll = () => {
    notificationsStore.markAllReadFor("vendor");
    toast.success("All notifications marked as read");
  };

  return (
    <VendorShell title="Notifications" subtitle="New orders, low-stock alerts, and announcements.">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Stat icon={<Bell className="h-5 w-5" />} label="Total" value={String(items.length)} />
        <Stat icon={<Mail className="h-5 w-5" />} label="Unread" value={String(unread)} />
        <Stat icon={<ShoppingBag className="h-5 w-5" />} label="New Orders" value={String(newOrders)} />
        <Stat icon={<AlertTriangle className="h-5 w-5" />} label="Alerts" value={String(alerts)} />
      </div>

      <div className="bg-card border border-border rounded-2xl">
        <div className="p-5 flex flex-wrap items-center justify-between gap-3 border-b border-border">
          <div className="flex flex-wrap gap-2">
            {TABS.map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                  tab === t ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:bg-secondary"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
          <button onClick={markAll} className="text-sm font-medium text-primary inline-flex items-center gap-1.5 hover:underline disabled:opacity-50" disabled={unread === 0}>
            <CheckCheck className="h-4 w-4" /> Mark all as read
          </button>
        </div>

        <ul className="divide-y divide-border">
          {visible.length === 0 ? (
            <li className="text-center py-12 text-muted-foreground text-sm">No notifications.</li>
          ) : visible.map((n) => {
            const Icon = ICONS[n.iconName] ?? Megaphone;
            return (
              <li key={n.id} className="px-5 py-4 flex items-start gap-3 hover:bg-muted/30 transition-colors">
                <span className={`mt-2 h-2 w-2 rounded-full shrink-0 ${n.read ? "bg-border" : "bg-primary"}`} />
                <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${TYPE_ICON_BG[n.type as NotifType]}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm leading-tight ${n.read ? "font-medium" : "font-semibold"}`}>{n.title}</p>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{n.body}</p>
                </div>
                <p className="text-xs text-muted-foreground whitespace-nowrap hidden sm:block self-center">{timeAgo(n.createdAt)}</p>
                <Badge className={`${TYPE_ICON_BG[n.type as NotifType]} border-0 rounded-md font-medium self-center`}>{n.type}</Badge>
                {!n.read && (
                  <button onClick={() => notificationsStore.markRead(n.id)} className="h-8 px-2 text-xs rounded-lg text-muted-foreground hover:bg-secondary self-center">
                    Read
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </VendorShell>
  );
};

const Stat = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) => (
  <div className="bg-card border border-border rounded-2xl p-5">
    <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-3">{icon}</div>
    <p className="text-2xl font-bold">{value}</p>
    <p className="text-xs text-muted-foreground">{label}</p>
  </div>
);

export default VendorNotifications;
