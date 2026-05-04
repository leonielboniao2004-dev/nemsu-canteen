import { useMemo, useState } from "react";
import { Download, BarChart3, ShoppingBag, TrendingUp, Trophy } from "lucide-react";
import { VendorShell } from "@/components/VendorShell";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useOrders } from "@/lib/orders";
import { peso } from "@/lib/menu";
import { toast } from "sonner";
const VendorReports = () => {
    const orders = useOrders();
    const [range, setRange] = useState("week");
    const filtered = useMemo(() => {
        const now = new Date();
        return orders.filter((o) => {
            if (o.status === "Cancelled")
                return false;
            const d = new Date(o.createdAt);
            if (range === "today")
                return d.toDateString() === now.toDateString();
            if (range === "week") {
                const ms = now.getTime() - d.getTime();
                return ms <= 7 * 24 * 60 * 60 * 1000;
            }
            if (range === "month")
                return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
            return true;
        });
    }, [orders, range]);
    const totalRevenue = filtered.reduce((s, o) => s + o.total, 0);
    const avgOrder = filtered.length ? totalRevenue / filtered.length : 0;
    const itemsSold = filtered.reduce((s, o) => s + o.lines.reduce((x, l) => x + l.qty, 0), 0);
    // Per-day series for chart
    const series = useMemo(() => {
        const days = range === "today" ? 1 : range === "week" ? 7 : range === "month" ? 30 : 14;
        const arr = [];
        for (let i = days - 1; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const key = d.toDateString();
            const v = filtered.filter((o) => new Date(o.createdAt).toDateString() === key).reduce((s, o) => s + o.total, 0);
            arr.push({ label: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }), value: v });
        }
        return arr;
    }, [filtered, range]);
    const max = Math.max(...series.map((d) => d.value), 1);
    // Best sellers
    const bestSellers = useMemo(() => {
        const map = new Map();
        for (const o of filtered)
            for (const l of o.lines) {
                const cur = map.get(l.id) ?? { name: l.name, emoji: l.emoji, qty: 0, revenue: 0 };
                cur.qty += l.qty;
                cur.revenue += l.qty * l.price;
                map.set(l.id, cur);
            }
        return [...map.values()].sort((a, b) => b.qty - a.qty);
    }, [filtered]);
    const exportCSV = () => {
        const headers = ["Order ID", "Date", "Customer", "Email", "Status", "Items", "Total"];
        const rows = filtered.map((o) => [
            o.id,
            new Date(o.createdAt).toISOString(),
            o.studentName,
            o.studentEmail,
            o.status,
            o.lines.map((l) => `${l.qty}× ${l.name}`).join("; "),
            o.total.toFixed(2),
        ]);
        const csv = [headers, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
        const blob = new Blob([csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `canteen-report-${range}-${Date.now()}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success("Report exported");
    };
    return (<VendorShell title="Reports & Analytics" subtitle="Track sales, orders, and best-selling items." toolbar={<div className="flex items-center gap-2">
          <Select value={range} onValueChange={(v) => setRange(v)}>
            <SelectTrigger className="h-10 w-[140px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">Last 7 days</SelectItem>
              <SelectItem value="month">This month</SelectItem>
              <SelectItem value="all">All time</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" className="gap-2" onClick={exportCSV}><Download className="h-4 w-4"/> Export CSV</Button>
        </div>}>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Stat icon={<TrendingUp className="h-5 w-5"/>} label="Revenue" value={peso(totalRevenue)}/>
        <Stat icon={<ShoppingBag className="h-5 w-5"/>} label="Orders" value={String(filtered.length)}/>
        <Stat icon={<BarChart3 className="h-5 w-5"/>} label="Avg Order" value={peso(Math.round(avgOrder))}/>
        <Stat icon={<Trophy className="h-5 w-5"/>} label="Items Sold" value={String(itemsSold)}/>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-5">
          <h3 className="font-bold mb-4">Sales over time</h3>
          {series.every((d) => d.value === 0) ? (<div className="h-56 flex items-center justify-center text-sm text-muted-foreground">No sales in this range yet.</div>) : (<div className="h-56 flex items-end gap-2">
              {series.map((d) => {
                const h = (d.value / max) * 100;
                return (<div key={d.label} className="flex-1 flex flex-col items-center gap-1.5">
                    <div className="w-full flex-1 flex items-end">
                      <div className="w-full rounded-t-md transition-all" style={{ height: `${Math.max(h, 4)}%`, background: "var(--gradient-primary)", opacity: d.value === 0 ? 0.2 : 1 }} title={peso(d.value)}/>
                    </div>
                    <p className="text-[10px] text-muted-foreground whitespace-nowrap">{d.label}</p>
                  </div>);
            })}
            </div>)}
        </div>

        <div className="bg-card border border-border rounded-2xl p-5">
          <h3 className="font-bold mb-4">Best Sellers</h3>
          {bestSellers.length === 0 ? (<p className="text-xs text-muted-foreground">No data yet.</p>) : (<ul className="space-y-3">
              {bestSellers.slice(0, 8).map((b, i) => (<li key={b.name} className="flex items-center gap-3">
                  <span className="h-7 w-7 rounded-lg bg-secondary text-xs font-bold flex items-center justify-center">{i + 1}</span>
                  <div className="h-9 w-9 rounded-lg bg-accent flex items-center justify-center text-lg">{b.emoji}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold leading-tight truncate">{b.name}</p>
                    <p className="text-xs text-muted-foreground">{b.qty} sold · {peso(b.revenue)}</p>
                  </div>
                </li>))}
            </ul>)}
        </div>
      </div>
    </VendorShell>);
};
const Stat = ({ icon, label, value }) => (<div className="bg-card border border-border rounded-2xl p-5">
    <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-3">{icon}</div>
    <p className="text-2xl font-bold">{value}</p>
    <p className="text-xs text-muted-foreground">{label}</p>
  </div>);
export default VendorReports;
