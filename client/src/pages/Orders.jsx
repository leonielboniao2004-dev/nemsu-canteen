import { useMemo, useState } from "react";
import { CalendarCheck, CheckCircle2, Clock, CheckCheck, ChevronLeft, ChevronRight, Download, HelpCircle } from "lucide-react";
import { StudentSidebarLayout } from "@/components/StudentSidebarLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getSession } from "@/lib/auth";
import { useOrders, updateOrderStatus } from "@/lib/orders";
import { peso } from "@/lib/menu";
import { toast } from "sonner";
const toDisplay = (s) => s === "Preparing" || s === "Ready" ? "Accepted" : s;
const STATUS_PILL = {
    Pending: "bg-[hsl(var(--warning))]/15 text-[hsl(var(--warning))]",
    Accepted: "bg-[hsl(var(--success))]/15 text-[hsl(var(--success))]",
    Completed: "bg-sky-500/10 text-sky-600",
    Cancelled: "bg-destructive/10 text-destructive",
};
const STATUS_DOT = {
    Pending: "bg-[hsl(var(--warning))]",
    Accepted: "bg-[hsl(var(--success))]",
    Completed: "bg-sky-500",
    Cancelled: "bg-destructive",
};
const Orders = () => {
    const session = getSession();
    const { orders: all, loading: ordersLoading } = useOrders();
    const [statusFilter, setStatusFilter] = useState("All");
    const [period, setPeriod] = useState("This Month");
    const [calMonth, setCalMonth] = useState(() => new Date());
    const mine = useMemo(() => {
        if (!session || session.role !== "student" && session.role !== "teacher")
            return [];
        return all
            .filter((o) => o.studentEmail === session.email)
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }, [all, session]);
    const filtered = useMemo(() => {
        let list = mine;
        if (period === "This Month") {
            const m = new Date().getMonth();
            const y = new Date().getFullYear();
            list = list.filter((o) => {
                const d = new Date(o.createdAt);
                return d.getMonth() === m && d.getFullYear() === y;
            });
        }
        if (statusFilter !== "All")
            list = list.filter((o) => toDisplay(o.status) === statusFilter);
        return list;
    }, [mine, period, statusFilter]);
    const total = mine.length;
    const upcoming = mine.filter((o) => ["Pending", "Preparing", "Ready"].includes(o.status)).length;
    const pending = mine.filter((o) => o.status === "Pending").length;
    const completed = mine.filter((o) => o.status === "Completed").length;
    const summary = ["Pending", "Accepted", "Completed", "Cancelled"].map((s) => ({
        label: s,
        count: mine.filter((o) => toDisplay(o.status) === s).length,
    }));
    const cancel = async (o) => {
        try {
            await updateOrderStatus(o._id || o.id, "Cancelled");
            toast.success(`Order ${o.shortId || o._id} cancelled`);
        } catch (err) {
            toast.error("Failed to cancel order");
        }
    };
    if (!session || session.role !== "student" && session.role !== "teacher")
        return null;
    return (<StudentSidebarLayout title="My Reservations" subtitle="View and manage all your canteen reservations.">
      <div className="grid xl:grid-cols-[1fr_320px] gap-6">
        {/* LEFT */}
        <div className="space-y-6">
          {/* Stat cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard icon={<CalendarCheck className="h-5 w-5"/>} tint="primary" label="Total Reservations" value={String(total)} link="View all"/>
            <StatCard icon={<CheckCircle2 className="h-5 w-5"/>} tint="success" label="Upcoming" value={String(upcoming)} link="View upcoming"/>
            <StatCard icon={<Clock className="h-5 w-5"/>} tint="warning" label="Pending" value={String(pending)} link="View pending"/>
            <StatCard icon={<CheckCheck className="h-5 w-5"/>} tint="info" label="Completed" value={String(completed)} link="View completed"/>
          </div>

          {/* Reservations List */}
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <div className="p-5 flex flex-wrap items-center justify-between gap-3 border-b border-border">
              <h3 className="font-bold">Reservations List</h3>
              <div className="flex flex-wrap items-center gap-2">
                <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v)}>
                  <SelectTrigger className="h-9 w-[130px] text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All Status</SelectItem>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="Accepted">Accepted</SelectItem>
                    <SelectItem value="Completed">Completed</SelectItem>
                    <SelectItem value="Cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={period} onValueChange={(v) => setPeriod(v)}>
                  <SelectTrigger className="h-9 w-[130px] text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="This Month">This Month</SelectItem>
                    <SelectItem value="All Time">All Time</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" size="sm" className="h-9 gap-1.5"><Download className="h-4 w-4"/> Export</Button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground border-b border-border bg-muted/40">
                    <th className="px-5 py-3 font-semibold">ID</th>
                    <th className="px-5 py-3 font-semibold">Product</th>
                    <th className="px-5 py-3 font-semibold">Date</th>
                    <th className="px-5 py-3 font-semibold">Time Slot</th>
                    <th className="px-5 py-3 font-semibold">Quantity</th>
                    <th className="px-5 py-3 font-semibold">Status</th>
                    <th className="px-5 py-3 font-semibold">Amount</th>
                    <th className="px-5 py-3 font-semibold text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (<tr><td colSpan={8} className="text-center py-12 text-muted-foreground">No reservations to show.</td></tr>) : (filtered.map((o, idx) => {
            const line = o.lines[0];
            const qty = o.lines.reduce((s, l) => s + l.qty, 0);
            const ds = toDisplay(o.status);
            const d = new Date(o.createdAt);
            const dateStr = d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
            const dayStr = d.toLocaleDateString("en-US", { weekday: "short" });
            const sku = o.shortId || `#${(o._id || o.id).toString().slice(-6).toUpperCase()}`;
            return (<tr key={o._id || o.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                          <td className="px-5 py-4 text-xs font-medium text-muted-foreground whitespace-nowrap">{sku}</td>
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className="h-11 w-11 rounded-xl bg-accent flex items-center justify-center text-2xl shrink-0">{line?.emoji}</div>
                              <div className="min-w-0">
                                <p className="font-semibold leading-tight">{line?.name}{o.lines.length > 1 ? ` +${o.lines.length - 1}` : ""}</p>
                                <p className="text-xs text-muted-foreground mt-0.5">{peso(line?.price ?? 0)}.00</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            <p className="font-medium leading-tight">{dateStr}</p>
                            <p className="text-xs text-muted-foreground">{dayStr}</p>
                          </td>
                          <td className="px-5 py-4 text-sm whitespace-nowrap">{o.pickupTime}</td>
                          <td className="px-5 py-4 font-medium">{qty}</td>
                          <td className="px-5 py-4">
                            <Badge className={`${STATUS_PILL[ds]} hover:${STATUS_PILL[ds]} border-0 rounded-md font-medium`}>{ds}</Badge>
                          </td>
                          <td className="px-5 py-4 font-semibold whitespace-nowrap">{peso(o.total)}.00</td>
                          <td className="px-5 py-4">
                            <div className="flex items-center justify-end gap-2">
                              <button className="h-8 px-3 rounded-lg border border-border text-xs font-medium hover:bg-secondary">View</button>
                              {ds === "Pending" && (<button onClick={() => cancel(o)} className="h-8 px-3 rounded-lg border border-destructive/30 text-destructive text-xs font-medium hover:bg-destructive/10">Cancel</button>)}
                            </div>
                          </td>
                        </tr>);
        }))}
                </tbody>
              </table>
            </div>

            <div className="p-5 border-t border-border">
              <p className="text-xs text-muted-foreground">Showing 1 to {filtered.length} of {filtered.length} reservations</p>
            </div>
          </div>
        </div>

        {/* RIGHT */}
        <aside className="space-y-4">
          <CalendarCard month={calMonth} onPrev={() => setCalMonth(addMonth(calMonth, -1))} onNext={() => setCalMonth(addMonth(calMonth, 1))} orders={mine}/>

          <div className="bg-card border border-border rounded-2xl p-5">
            <h3 className="font-bold mb-4">Reservation Summary</h3>
            <ul className="space-y-3">
              {summary.map((s) => {
            const pct = total ? Math.round((s.count / total) * 100) : 0;
            return (<li key={s.label} className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <span className={`h-2 w-2 rounded-full ${STATUS_DOT[s.label]}`}/>
                      {s.label}
                    </span>
                    <span className="text-muted-foreground">{s.count} ({pct}%)</span>
                  </li>);
        })}
            </ul>
            <div className="flex items-center justify-between text-sm font-semibold mt-4 pt-4 border-t border-border">
              <span>Total Reservations</span>
              <span>{total}</span>
            </div>
          </div>

          <div className="bg-accent/60 border border-border rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-2">
              <HelpCircle className="h-4 w-4 text-primary"/>
              <p className="font-semibold text-sm">Need Help?</p>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              If you have any issues with your reservations, please visit our Help Center.
            </p>
            <button className="text-xs font-semibold text-primary mt-2 inline-flex items-center gap-1 hover:gap-1.5 transition-all">
              Go to Help Center →
            </button>
          </div>
        </aside>
      </div>
    </StudentSidebarLayout>);
};
const addMonth = (d, delta) => {
    const n = new Date(d);
    n.setMonth(n.getMonth() + delta);
    return n;
};
const CalendarCard = ({ month, onPrev, onNext, orders }) => {
    const y = month.getFullYear();
    const m = month.getMonth();
    const firstDay = new Date(y, m, 1).getDay();
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    const today = new Date();
    const isThisMonth = today.getFullYear() === y && today.getMonth() === m;
    const orderDays = new Set(orders
        .filter((o) => {
        const d = new Date(o.createdAt);
        return d.getFullYear() === y && d.getMonth() === m;
    })
        .map((o) => new Date(o.createdAt).getDate()));
    const cells = [];
    for (let i = 0; i < firstDay; i++)
        cells.push(null);
    for (let d = 1; d <= daysInMonth; d++)
        cells.push(d);
    return (<div className="bg-card border border-border rounded-2xl p-5">
      <h3 className="font-bold mb-4">Reservation Calendar</h3>
      <div className="flex items-center justify-between mb-3">
        <button onClick={onPrev} className="h-8 w-8 rounded-lg hover:bg-secondary flex items-center justify-center"><ChevronLeft className="h-4 w-4"/></button>
        <p className="text-sm font-semibold">{month.toLocaleDateString("en-US", { month: "long", year: "numeric" })}</p>
        <button onClick={onNext} className="h-8 w-8 rounded-lg hover:bg-secondary flex items-center justify-center"><ChevronRight className="h-4 w-4"/></button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-[10px] uppercase tracking-wide text-muted-foreground mb-2">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => <div key={d}>{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-sm">
        {cells.map((d, i) => {
            if (d === null)
                return <div key={i}/>;
            const isToday = isThisMonth && d === today.getDate();
            const hasOrder = orderDays.has(d);
            return (<div key={i} className="relative aspect-square flex items-center justify-center">
              <div className={`h-8 w-8 flex items-center justify-center rounded-full text-sm ${isToday ? "bg-primary text-primary-foreground font-semibold" : "hover:bg-secondary"}`}>
                {d}
              </div>
              {hasOrder && !isToday && <span className="absolute bottom-0.5 h-1 w-1 rounded-full bg-[hsl(var(--success))]"/>}
            </div>);
        })}
      </div>
    </div>);
};
const STAT_TINTS = {
    primary: { bg: "bg-primary/10", fg: "text-primary", link: "text-primary" },
    success: { bg: "bg-[hsl(var(--success))]/15", fg: "text-[hsl(var(--success))]", link: "text-[hsl(var(--success))]" },
    warning: { bg: "bg-[hsl(var(--warning))]/15", fg: "text-[hsl(var(--warning))]", link: "text-[hsl(var(--warning))]" },
    info: { bg: "bg-sky-500/10", fg: "text-sky-600", link: "text-sky-600" },
};
const StatCard = ({ icon, label, value, tint, link }) => {
    const t = STAT_TINTS[tint];
    return (<div className="bg-card border border-border rounded-2xl p-5">
      <div className="flex items-start gap-4">
        <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${t.bg} ${t.fg}`}>{icon}</div>
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground font-medium">{label}</p>
          <p className="text-3xl font-bold mt-0.5">{value}</p>
        </div>
      </div>
      <button className={`mt-4 inline-flex items-center gap-1.5 text-sm font-medium ${t.link} hover:gap-2 transition-all`}>
        {link} →
      </button>
    </div>);
};
export default Orders;
