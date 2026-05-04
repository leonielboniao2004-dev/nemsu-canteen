import { useMemo } from "react";
import { Link } from "@/lib/router-compat";
import { Package, ShoppingBag, AlertTriangle, Users, ChefHat, CheckCircle2, ArrowRight, BarChart3, Plus, ClipboardList, Boxes, FileText, } from "lucide-react";
import { VendorShell } from "@/components/VendorShell";
import { Badge } from "@/components/ui/badge";
import { useOrders } from "@/lib/orders";
import { useProducts, productsStore } from "@/lib/products";
import { peso } from "@/lib/menu";
const TINTS = {
    primary: { bg: "bg-primary/10", fg: "text-primary" },
    success: { bg: "bg-[hsl(var(--success))]/15", fg: "text-[hsl(var(--success))]" },
    warning: { bg: "bg-[hsl(var(--warning))]/15", fg: "text-[hsl(var(--warning))]" },
    info: { bg: "bg-sky-500/10", fg: "text-sky-600" },
    rose: { bg: "bg-rose-500/10", fg: "text-rose-600" },
};
const STATUS_COLOR = {
    Pending: "bg-[hsl(var(--warning))]/15 text-[hsl(var(--warning))]",
    Preparing: "bg-primary/10 text-primary",
    Ready: "bg-[hsl(var(--success))]/15 text-[hsl(var(--success))]",
    Completed: "bg-secondary text-secondary-foreground",
    Cancelled: "bg-destructive/10 text-destructive",
};
const VendorDashboard = () => {
    const orders = useOrders();
    const products = useProducts();
    const today = orders.filter((o) => new Date(o.createdAt).toDateString() === new Date().toDateString());
    const pending = orders.filter((o) => o.status === "Pending").length;
    const preparing = orders.filter((o) => o.status === "Preparing").length;
    const ready = orders.filter((o) => o.status === "Ready").length;
    const completedToday = today.filter((o) => o.status === "Completed").length;
    const revenueToday = today.filter((o) => o.status !== "Cancelled").reduce((s, o) => s + o.total, 0);
    const lowStock = products.filter((p) => productsStore.isLow(p));
    const customers = new Set(orders.map((o) => o.studentEmail)).size;
    const recent = [...orders].sort((a, b) => b.createdAt - a.createdAt).slice(0, 6);
    // Last-7-day sales for the chart.
    const sales = useMemo(() => {
        const days = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const key = d.toDateString();
            const total = orders
                .filter((o) => o.status !== "Cancelled" && new Date(o.createdAt).toDateString() === key)
                .reduce((s, o) => s + o.total, 0);
            days.push({ label: d.toLocaleDateString("en-US", { weekday: "short" }), value: total });
        }
        return days;
    }, [orders]);
    const maxSales = Math.max(...sales.map((d) => d.value), 1);
    // Best sellers by qty across non-cancelled orders.
    const bestSellers = useMemo(() => {
        const map = new Map();
        for (const o of orders) {
            if (o.status === "Cancelled")
                continue;
            for (const l of o.lines) {
                const cur = map.get(l.id) ?? { name: l.name, emoji: l.emoji, qty: 0, revenue: 0 };
                cur.qty += l.qty;
                cur.revenue += l.qty * l.price;
                map.set(l.id, cur);
            }
        }
        return [...map.values()].sort((a, b) => b.qty - a.qty).slice(0, 5);
    }, [orders]);
    return (<VendorShell title="Vendor Dashboard" subtitle="Live overview of your canteen operations">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard icon={<Package className="h-5 w-5"/>} tint="primary" label="Total Products" value={String(products.length)} link={{ to: "/vendor/products", label: "Manage products" }}/>
        <StatCard icon={<ShoppingBag className="h-5 w-5"/>} tint="info" label="Total Orders" value={String(orders.length)} link={{ to: "/admin/orders", label: "View orders" }}/>
        <StatCard icon={<AlertTriangle className="h-5 w-5"/>} tint="warning" label="Pending Orders" value={String(pending)} link={{ to: "/admin/orders", label: "View pending" }}/>
        <StatCard icon={<Users className="h-5 w-5"/>} tint="success" label="Customers" value={String(customers)} link={{ to: "/vendor/customers", label: "View customers" }}/>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard icon={<ChefHat className="h-5 w-5"/>} tint="primary" label="Preparing" value={String(preparing)} link={{ to: "/admin/orders", label: "Open queue" }}/>
        <StatCard icon={<CheckCircle2 className="h-5 w-5"/>} tint="success" label="Completed Today" value={String(completedToday)} link={{ to: "/admin/orders", label: "View completed" }}/>
        <StatCard icon={<BarChart3 className="h-5 w-5"/>} tint="info" label="Revenue Today" value={peso(revenueToday)} link={{ to: "/vendor/reports", label: "View report" }}/>
        <StatCard icon={<AlertTriangle className="h-5 w-5"/>} tint="rose" label="Low Stock" value={String(lowStock.length)} link={{ to: "/vendor/products", label: "Restock items" }}/>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Sales chart */}
        <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold">Sales · Last 7 days</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Total revenue per day</p>
            </div>
            <Link to="/vendor/reports" className="text-sm font-medium text-primary inline-flex items-center gap-1 hover:gap-2 transition-all">
              Reports <ArrowRight className="h-4 w-4"/>
            </Link>
          </div>
          <div className="h-56 flex items-end gap-3 px-2">
            {sales.map((d) => {
            const h = (d.value / maxSales) * 100;
            return (<div key={d.label} className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full flex-1 flex items-end">
                    <div className="w-full rounded-t-lg transition-all" style={{
                    height: `${Math.max(h, 4)}%`,
                    background: "var(--gradient-primary)",
                    opacity: d.value === 0 ? 0.2 : 1,
                }} title={peso(d.value)}/>
                  </div>
                  <p className="text-[11px] text-muted-foreground font-medium">{d.label}</p>
                  <p className="text-[10px] text-muted-foreground">{d.value > 0 ? peso(d.value) : "—"}</p>
                </div>);
        })}
          </div>
        </div>

        {/* Quick actions */}
        <div className="bg-card border border-border rounded-2xl p-5">
          <h3 className="font-bold mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3">
            <QuickAction to="/vendor/products" icon={Plus} label="Manage Products" desc="Add or restock items" tint="primary"/>
            <QuickAction to="/admin/orders" icon={ClipboardList} label="View Orders" desc="Manage queue" tint="info"/>
            <QuickAction to="/vendor/customers" icon={Boxes} label="Customers" desc="View customer list" tint="warning"/>
            <QuickAction to="/vendor/reports" icon={FileText} label="Reports" desc="Sales summary" tint="success"/>
          </div>

          <div className="mt-5 pt-5 border-t border-border">
            <h4 className="font-semibold text-sm mb-3">Live Status</h4>
            <ul className="space-y-2.5 text-sm">
              <StatusRow label="Pending" value={pending} dot="bg-[hsl(var(--warning))]"/>
              <StatusRow label="Preparing" value={preparing} dot="bg-primary"/>
              <StatusRow label="Ready for pickup" value={ready} dot="bg-[hsl(var(--success))]"/>
            </ul>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mt-6">
        {/* Recent orders */}
        <div className="lg:col-span-2 bg-card border border-border rounded-2xl overflow-hidden">
          <div className="p-5 flex items-center justify-between border-b border-border">
            <div>
              <h3 className="font-bold">Recent Orders</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Latest customer activity</p>
            </div>
            <Link to="/admin/orders" className="text-sm font-medium text-primary inline-flex items-center gap-1 hover:gap-2 transition-all">
              View all <ArrowRight className="h-4 w-4"/>
            </Link>
          </div>
          {recent.length === 0 ? (<div className="p-12 text-center">
              <Package className="h-10 w-10 text-muted-foreground mx-auto mb-3"/>
              <p className="text-sm text-muted-foreground">No orders yet. Once customers place orders they'll appear here.</p>
            </div>) : (<div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground border-b border-border bg-muted/40">
                    <th className="px-5 py-3 font-semibold">ID</th>
                    <th className="px-5 py-3 font-semibold">Customer</th>
                    <th className="px-5 py-3 font-semibold">Items</th>
                    <th className="px-5 py-3 font-semibold">Total</th>
                    <th className="px-5 py-3 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map((o) => {
                const itemCount = o.lines.reduce((s, l) => s + l.qty, 0);
                return (<tr key={o.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                        <td className="px-5 py-4 text-xs font-medium text-muted-foreground whitespace-nowrap">{o.id}</td>
                        <td className="px-5 py-4">
                          <p className="font-semibold leading-tight">{o.studentName}</p>
                          <p className="text-xs text-muted-foreground">ID {o.studentId}</p>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-1 text-base">
                            {o.lines.slice(0, 3).map((l) => <span key={l.id}>{l.emoji}</span>)}
                            <span className="text-xs text-muted-foreground ml-1">×{itemCount}</span>
                          </div>
                        </td>
                        <td className="px-5 py-4 font-semibold whitespace-nowrap">{peso(o.total)}</td>
                        <td className="px-5 py-4">
                          <Badge className={`${STATUS_COLOR[o.status]} hover:${STATUS_COLOR[o.status]} border-0 rounded-md`}>{o.status}</Badge>
                        </td>
                      </tr>);
            })}
                </tbody>
              </table>
            </div>)}
        </div>

        {/* Best sellers + low stock */}
        <div className="space-y-6">
          <div className="bg-card border border-border rounded-2xl p-5">
            <h3 className="font-bold mb-4">Best Sellers</h3>
            {bestSellers.length === 0 ? (<p className="text-xs text-muted-foreground">No sales data yet.</p>) : (<ul className="space-y-3">
                {bestSellers.map((b, i) => (<li key={b.name} className="flex items-center gap-3">
                    <span className="h-7 w-7 rounded-lg bg-secondary text-xs font-bold flex items-center justify-center">{i + 1}</span>
                    <div className="h-9 w-9 rounded-lg bg-accent flex items-center justify-center text-lg">{b.emoji}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold leading-tight truncate">{b.name}</p>
                      <p className="text-xs text-muted-foreground">{b.qty} sold · {peso(b.revenue)}</p>
                    </div>
                  </li>))}
              </ul>)}
          </div>

          <div className="bg-card border border-border rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold">Low Stock Alert</h3>
              <Badge className="bg-[hsl(var(--warning))]/15 text-[hsl(var(--warning))] hover:bg-[hsl(var(--warning))]/15 border-0">{lowStock.length}</Badge>
            </div>
            {lowStock.length === 0 ? (<p className="text-xs text-muted-foreground">All items are well stocked.</p>) : (<ul className="space-y-3">
                {lowStock.slice(0, 5).map((p) => (<li key={p.id} className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-accent flex items-center justify-center text-lg">{p.emoji}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold leading-tight truncate">{p.name}</p>
                      <p className="text-xs text-muted-foreground">Stock: {p.stock}</p>
                    </div>
                    <AlertTriangle className="h-4 w-4 text-[hsl(var(--warning))]"/>
                  </li>))}
              </ul>)}
          </div>
        </div>
      </div>
    </VendorShell>);
};
const StatCard = ({ icon, label, value, tint, link, }) => {
    const t = TINTS[tint];
    return (<div className="bg-card border border-border rounded-2xl p-5">
      <div className="flex items-start gap-4">
        <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${t.bg} ${t.fg}`}>{icon}</div>
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground font-medium">{label}</p>
          <p className="text-3xl font-bold mt-0.5">{value}</p>
        </div>
      </div>
      <Link to={link.to} className={`mt-4 inline-flex items-center gap-1.5 text-sm font-medium ${t.fg} hover:gap-2 transition-all`}>
        {link.label} <ArrowRight className="h-4 w-4"/>
      </Link>
    </div>);
};
const QuickAction = ({ to, icon: Icon, label, desc, tint, }) => {
    const t = TINTS[tint];
    return (<Link to={to} className="rounded-xl border border-border p-4 hover:border-primary hover:bg-primary/5 transition-colors text-center">
      <div className={`h-10 w-10 mx-auto rounded-xl ${t.bg} ${t.fg} flex items-center justify-center mb-2`}><Icon className="h-5 w-5"/></div>
      <p className="text-xs font-semibold">{label}</p>
      <p className="text-[11px] text-muted-foreground">{desc}</p>
    </Link>);
};
const StatusRow = ({ label, value, dot }) => (<li className="flex items-center justify-between">
    <span className="flex items-center gap-2 text-muted-foreground">
      <span className={`h-2 w-2 rounded-full ${dot}`}/>
      {label}
    </span>
    <span className="font-bold">{value}</span>
  </li>);
export default VendorDashboard;
