import { useState } from "react";
import { Bell, CheckCheck, Settings as SettingsIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger, } from "@/components/ui/popover";
import { Link } from "@/lib/router-compat";
import { ICONS, TYPE_ICON_BG, notificationsStore, timeAgo, useNotifications, } from "@/lib/notifications";
import { getSession } from "@/lib/auth";
export const NotificationsBell = () => {
    const session = getSession();
    const audience = session?.role === "admin" ? "vendor" : "customer";
    const key = audience === "customer" && session && "email" in session ? session.email : undefined;
    const items = useNotifications(audience, key);
    const [open, setOpen] = useState(false);
    const unread = items.filter((n) => !n.read).length;
    const markAll = () => notificationsStore.markAllReadFor();
    const markOne = (id) => notificationsStore.markRead(id);
    return (<Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="relative h-10 w-10 rounded-xl bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors" aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`}>
          <Bell className="h-4 w-4"/>
          {unread > 0 && (<span className="absolute -top-1 -right-1 h-5 min-w-5 px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center border-2 border-card">
              {unread}
            </span>)}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" sideOffset={10} className="w-[360px] p-0 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div>
            <p className="font-semibold text-sm">Notifications</p>
            <p className="text-xs text-muted-foreground">
              {unread === 0 ? "You're all caught up." : `${unread} unread`}
            </p>
          </div>
          <button onClick={markAll} className="text-xs font-medium text-primary inline-flex items-center gap-1 hover:underline disabled:opacity-50 disabled:no-underline" disabled={unread === 0}>
            <CheckCheck className="h-3.5 w-3.5"/> Mark all
          </button>
        </div>

        <ul className="max-h-[360px] overflow-y-auto divide-y divide-border">
          {items.length === 0 ? (<li className="px-4 py-10 text-center text-sm text-muted-foreground">No notifications yet.</li>) : (items.slice(0, 6).map((n) => {
            const Icon = ICONS[n.iconName] ?? ICONS.Mail;
            return (<li key={n.id}>
                  <button onClick={() => markOne(n.id)} className="w-full text-left flex items-start gap-3 px-4 py-3 hover:bg-muted/40 transition-colors">
                    <span className={`mt-1.5 h-2 w-2 rounded-full shrink-0 ${n.read ? "bg-transparent" : "bg-primary"}`}/>
                    <div className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${TYPE_ICON_BG[n.type]}`}>
                      <Icon className="h-4 w-4"/>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm leading-tight ${n.read ? "font-medium" : "font-semibold"}`}>{n.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.body}</p>
                      <p className="text-[11px] text-muted-foreground mt-1">{timeAgo(n.createdAt)}</p>
                    </div>
                  </button>
                </li>);
        }))}
        </ul>

        <div className="border-t border-border p-2 flex items-center justify-between">
          <Link to={audience === "vendor" ? "/vendor/notifications" : "/notifications"} onClick={() => setOpen(false)} className="text-xs font-medium text-primary px-3 py-2 hover:underline">
            View all notifications
          </Link>
          <Link to={audience === "vendor" ? "/vendor/settings" : "/settings"} onClick={() => setOpen(false)} className="text-xs font-medium text-muted-foreground hover:text-foreground inline-flex items-center gap-1 px-3 py-2">
            <SettingsIcon className="h-3.5 w-3.5"/> Preferences
          </Link>
        </div>
      </PopoverContent>
    </Popover>);
};
