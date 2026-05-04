import { useMemo, useState } from "react";
import { ChefHat, PackageCheck, CheckCircle2, XCircle, Clock, ShieldCheck, Inbox } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ordersStore, useOrders } from "@/lib/orders";
import { peso } from "@/lib/menu";
import { toast } from "sonner";
const TABS = [
    { key: "All", label: "All" },
    { key: "Pending", label: "Pending" },
    { key: "Preparing", label: "Preparing" },
    { key: "Ready", label: "Ready" },
    { key: "Completed", label: "Completed" },
];
const STATUS_COLOR = {
    Pending: "bg-[hsl(var(--warning))]/15 text-[hsl(var(--warning))]",
    Preparing: "bg-primary/10 text-primary",
    Ready: "bg-[hsl(var(--success))]/15 text-[hsl(var(--success))]",
    Completed: "bg-secondary text-secondary-foreground",
    Cancelled: "bg-destructive/10 text-destructive",
};
const NEXT_ACTION = {
    Pending: { to: "Preparing", label: "Start preparing", icon: ChefHat },
    Preparing: { to: "Ready", label: "Mark ready", icon: PackageCheck },
    Ready: { to: "Completed", label: "Mark completed", icon: CheckCircle2 },
};
const AdminOrders = () => {
    const orders = useOrders();
    const [filter, setFilter] = useState("Pending");
    const visible = useMemo(() => {
        const list = filter === "All" ? orders : orders.filter((o) => o.status === filter);
        return [...list].sort((a, b) => b.createdAt - a.createdAt);
    }, [orders, filter]);
    const counts = useMemo(() => {
        const c = { All: orders.length };
        for (const t of TABS)
            if (t.key !== "All")
                c[t.key] = orders.filter((o) => o.status === t.key).length;
        return c;
    }, [orders]);
    const updateStatus = (o, status) => {
        ordersStore.setStatus(o.id, status);
        toast.success(`${o.id} → ${status}`);
    };
    const todayRevenue = orders
        .filter((o) => o.status !== "Cancelled" && new Date(o.createdAt).toDateString() === new Date().toDateString())
        .reduce((s, o) => s + o.total, 0);
    return (<AppShell title="Order Queue" subtitle="Manage incoming canteen orders from your vendor portal">
      <div className="grid sm:grid-cols-3 gap-4 mb-6">
        <Stat icon={<Inbox className="h-5 w-5"/>} label="Pending now" value={String(counts.Pending || 0)} tint="warning"/>
        <Stat icon={<ChefHat className="h-5 w-5"/>} label="In kitchen" value={String(counts.Preparing || 0)} tint="primary"/>
        <Stat icon={<ShieldCheck className="h-5 w-5"/>} label="Today's revenue" value={peso(todayRevenue)} tint="success"/>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 mb-4">
        {TABS.map((t) => (<Button key={t.key} variant={filter === t.key ? "default" : "outline"} size="sm" className="rounded-full shrink-0 gap-2" onClick={() => setFilter(t.key)}>
            {t.label}
            <Badge variant="secondary" className="rounded-full px-2 py-0 text-[10px]">{counts[t.key] ?? 0}</Badge>
          </Button>))}
      </div>

      {visible.length === 0 ? (<div className="bg-card rounded-2xl p-12 text-center" style={{ boxShadow: "var(--shadow-card)" }}>
          <Inbox className="h-12 w-12 text-muted-foreground mx-auto mb-3"/>
          <p className="text-muted-foreground">No orders in this view.</p>
        </div>) : (<div className="space-y-4">
          {visible.map((o) => {
                const next = NEXT_ACTION[o.status];
                return (<div key={o.id} className="bg-card rounded-2xl p-5" style={{ boxShadow: "var(--shadow-card)" }}>
                <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-bold">{o.id}</p>
                      <Badge className={`${STATUS_COLOR[o.status]} hover:${STATUS_COLOR[o.status]} border-0 rounded-full`}>
                        {o.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {o.studentName} · ID {o.studentId} · {o.studentEmail}
                    </p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                      <Clock className="h-3 w-3"/> Pickup {o.pickupTime} · placed {new Date(o.createdAt).toLocaleTimeString()}
                    </p>
                  </div>
                  <p className="text-lg font-bold text-primary">{peso(o.total)}</p>
                </div>

                <ul className="grid sm:grid-cols-2 gap-x-6 divide-y divide-border sm:divide-y-0">
                  {o.lines.map((l) => (<li key={l.id} className="flex items-center gap-3 py-2">
                      <span className="text-xl">{l.emoji}</span>
                      <span className="flex-1 text-sm">{l.name}</span>
                      <span className="text-sm font-semibold">×{l.qty}</span>
                    </li>))}
                </ul>

                {o.notes && <p className="text-xs text-muted-foreground mt-3 bg-muted/50 rounded-lg px-3 py-2">📝 {o.notes}</p>}

                <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-border">
                  {next && (<Button size="sm" onClick={() => updateStatus(o, next.to)} className="gap-1.5">
                      <next.icon className="h-4 w-4"/> {next.label}
                    </Button>)}
                  {o.status !== "Cancelled" && o.status !== "Completed" && (<Button size="sm" variant="outline" className="gap-1.5 text-destructive hover:text-destructive" onClick={() => updateStatus(o, "Cancelled")}>
                      <XCircle className="h-4 w-4"/> Cancel
                    </Button>)}
                </div>
              </div>);
            })}
        </div>)}
    </AppShell>);
};
const Stat = ({ icon, label, value, tint }) => {
    const tints = {
        primary: "bg-primary/10 text-primary",
        success: "bg-[hsl(var(--success))]/10 text-[hsl(var(--success))]",
        warning: "bg-[hsl(var(--warning))]/10 text-[hsl(var(--warning))]",
    };
    return (<div className="bg-card rounded-2xl p-5" style={{ boxShadow: "var(--shadow-card)" }}>
      <div className={`h-10 w-10 rounded-xl flex items-center justify-center mb-3 ${tints[tint]}`}>{icon}</div>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>);
};
export default AdminOrders;
