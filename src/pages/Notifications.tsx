import { useMemo, useState } from "react";
import {
  Bell, Mail, CheckCircle2, Megaphone, AlertTriangle,
  CheckCheck, History, Settings, ChevronRight,
  ChevronLeft, ChevronRight as ChevronR,
} from "lucide-react";
import { StudentSidebarLayout } from "@/components/StudentSidebarLayout";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { getSession } from "@/lib/auth";
import {
  ICONS,
  type NotifType,
  notificationsStore,
  timeAgo,
  TYPE_ICON_BG,
  useNotifications,
} from "@/lib/notifications";

const TYPE_PILL: Record<NotifType, string> = TYPE_ICON_BG;

const TABS: ("All" | "Unread" | "Announcements" | "Alerts" | "System")[] = ["All", "Unread", "Announcements", "Alerts", "System"];
const PAGE_SIZE = 8;

const Notifications = () => {
  const session = getSession();
  const email = session && "email" in session ? session.email : "";
  const items = useNotifications("customer", email);
  const [tab, setTab] = useState<(typeof TABS)[number]>("All");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    if (tab === "All") return items;
    if (tab === "Unread") return items.filter((n) => !n.read);
    if (tab === "Announcements") return items.filter((n) => n.type === "Announcement");
    if (tab === "Alerts") return items.filter((n) => n.type === "Alert");
    return items.filter((n) => n.type === "System");
  }, [items, tab]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const visible = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const total = items.length;
  const unread = items.filter((n) => !n.read).length;
  const read = total - unread;
  const announcements = items.filter((n) => n.type === "Announcement").length;
  const alerts = items.filter((n) => n.type === "Alert").length;
  const info = items.filter((n) => n.type === "Info").length;
  const system = items.filter((n) => n.type === "System").length;

  const summary = [
    { label: "Unread", count: unread, color: "bg-sky-500" },
    { label: "Announcements", count: announcements, color: "bg-primary" },
    { label: "Alerts", count: alerts, color: "bg-[hsl(var(--warning))]" },
    { label: "Info", count: info, color: "bg-[hsl(var(--success))]" },
    { label: "System", count: system, color: "bg-muted-foreground" },
  ];

  const markAllRead = () => {
    notificationsStore.markAllReadFor("customer", email);
    toast.success("All notifications marked as read");
  };

  const markRead = (id: string) => notificationsStore.markRead(id);

  return (
    <StudentSidebarLayout title="Notifications" subtitle="Stay updated with important alerts and announcements.">
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4 mb-6">
        <NStat icon={<Bell className="h-5 w-5" />} tint="primary" label="Total" value={String(total)} />
        <NStat icon={<Mail className="h-5 w-5" />} tint="info" label="Unread" value={String(unread)} />
        <NStat icon={<CheckCircle2 className="h-5 w-5" />} tint="success" label="Read" value={String(read)} />
        <NStat icon={<Megaphone className="h-5 w-5" />} tint="primary" label="Announcements" value={String(announcements)} />
        <NStat icon={<AlertTriangle className="h-5 w-5" />} tint="warning" label="Alerts" value={String(alerts)} />
      </div>

      <div className="grid xl:grid-cols-[1fr_320px] gap-6">
        <div className="bg-card border border-border rounded-2xl">
          <div className="p-5 flex flex-wrap items-center justify-between gap-3 border-b border-border">
            <h3 className="font-bold">All Notifications</h3>
            <button onClick={markAllRead} className="text-sm font-medium text-primary inline-flex items-center gap-1.5 hover:underline">
              <CheckCheck className="h-4 w-4" /> Mark all as read
            </button>
          </div>

          <div className="px-5 pt-4 flex flex-wrap gap-2">
            {TABS.map((t) => (
              <button
                key={t}
                onClick={() => { setTab(t); setPage(1); }}
                className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                  tab === t ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:bg-secondary"
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          <ul className="divide-y divide-border mt-2">
            {visible.length === 0 ? (
              <li className="text-center py-12 text-muted-foreground text-sm">No notifications in this view.</li>
            ) : (
              visible.map((n) => {
                const Icon = ICONS[n.iconName] ?? ICONS.Mail;
                return (
                  <li key={n.id} className="px-5 py-4 flex items-start gap-3 hover:bg-muted/30 transition-colors">
                    <span className={`mt-2 h-2 w-2 rounded-full shrink-0 ${n.read ? "bg-border" : "bg-primary"}`} />
                    <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${TYPE_ICON_BG[n.type]}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm leading-tight ${n.read ? "font-medium" : "font-semibold"}`}>{n.title}</p>
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{n.body}</p>
                    </div>
                    <p className="text-xs text-muted-foreground whitespace-nowrap hidden sm:block self-center">{timeAgo(n.createdAt)}</p>
                    <Badge className={`${TYPE_PILL[n.type]} hover:${TYPE_PILL[n.type]} border-0 rounded-md font-medium self-center`}>{n.type}</Badge>
                    <button
                      onClick={() => markRead(n.id)}
                      className="h-8 px-2 rounded-lg text-xs text-muted-foreground hover:bg-secondary self-center"
                    >
                      Read
                    </button>
                  </li>
                );
              })
            )}
          </ul>

          <div className="p-5 flex flex-wrap items-center justify-between gap-3 border-t border-border">
            <p className="text-xs text-muted-foreground">Showing {filtered.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1} to {Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}</p>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} className="h-8 w-8 rounded-lg border border-border hover:bg-secondary flex items-center justify-center"><ChevronLeft className="h-4 w-4" /></button>
              {Array.from({ length: totalPages }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setPage(i + 1)}
                  className={`h-8 min-w-8 px-2 rounded-lg border text-sm ${page === i + 1 ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-secondary"}`}
                >
                  {i + 1}
                </button>
              ))}
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} className="h-8 w-8 rounded-lg border border-border hover:bg-secondary flex items-center justify-center"><ChevronR className="h-4 w-4" /></button>
            </div>
          </div>
        </div>

        <aside className="space-y-4">
          <div className="bg-card border border-border rounded-2xl p-5">
            <h3 className="font-bold mb-4">Summary</h3>
            <ul className="space-y-2 text-sm">
              {summary.map((s) => {
                const pct = total ? Math.round((s.count / total) * 100) : 0;
                return (
                  <li key={s.label} className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <span className={`h-2 w-2 rounded-full ${s.color}`} />
                      {s.label}
                    </span>
                    <span className="text-muted-foreground">{s.count} ({pct}%)</span>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="bg-card border border-border rounded-2xl p-5">
            <h3 className="font-bold mb-3">Quick Actions</h3>
            <ul className="space-y-2">
              <QuickAction icon={CheckCheck} title="Mark all as read" desc="Mark all as read" onClick={markAllRead} />
              <QuickAction icon={History} title="History" desc="View past notifications" />
              <QuickAction icon={Settings} title="Preferences" desc="Customize notification settings" />
            </ul>
          </div>

          <div className="bg-card border border-border rounded-2xl p-5">
            <h3 className="font-bold">Preferences</h3>
            <p className="text-xs text-muted-foreground mt-1 mb-4">Choose how you receive notifications.</p>
            <ul className="space-y-3">
              <PrefRow icon={Mail} title="Email" desc="Receive notifications via email" defaultOn />
              <PrefRow icon={Bell} title="Push" desc="Receive push notifications" defaultOn />
              <PrefRow icon={Megaphone} title="Announcements" desc="Receive canteen announcements" defaultOn />
            </ul>
          </div>
        </aside>
      </div>
    </StudentSidebarLayout>
  );
};

const QuickAction = ({ icon: Icon, title, desc, onClick }: { icon: React.ElementType; title: string; desc: string; onClick?: () => void }) => (
  <li>
    <button onClick={onClick} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-secondary transition-colors text-left">
      <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold">{title}</p>
        <p className="text-xs text-muted-foreground">{desc}</p>
      </div>
      <ChevronRight className="h-4 w-4 text-muted-foreground" />
    </button>
  </li>
);

const PrefRow = ({ icon: Icon, title, desc, defaultOn }: { icon: React.ElementType; title: string; desc: string; defaultOn?: boolean }) => {
  const [on, setOn] = useState(!!defaultOn);
  return (
    <li className="flex items-center gap-3">
      <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold leading-tight">{title}</p>
        <p className="text-xs text-muted-foreground">{desc}</p>
      </div>
      <Switch checked={on} onCheckedChange={setOn} />
    </li>
  );
};

const NStat = ({ icon, label, value, tint }: { icon: React.ReactNode; label: string; value: string; tint: "primary" | "success" | "warning" | "info" }) => {
  const tints: Record<string, { bg: string; fg: string }> = {
    primary: { bg: "bg-primary/10", fg: "text-primary" },
    success: { bg: "bg-[hsl(var(--success))]/15", fg: "text-[hsl(var(--success))]" },
    warning: { bg: "bg-[hsl(var(--warning))]/15", fg: "text-[hsl(var(--warning))]" },
    info: { bg: "bg-sky-500/10", fg: "text-sky-600" },
  };
  const t = tints[tint];
  return (
    <div className="bg-card border border-border rounded-2xl p-5">
      <div className="flex items-start gap-3">
        <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${t.bg} ${t.fg}`}>{icon}</div>
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground font-medium">{label}</p>
          <p className="text-2xl font-bold mt-0.5">{value}</p>
        </div>
      </div>
    </div>
  );
};

export default Notifications;
