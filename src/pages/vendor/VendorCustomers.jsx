import { useMemo, useState } from "react";
import { Search, BadgeCheck, GraduationCap, User, ShoppingBag } from "lucide-react";
import { VendorShell } from "@/components/VendorShell";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useOrders } from "@/lib/orders";
import { peso } from "@/lib/menu";
const VendorCustomers = () => {
    const orders = useOrders();
    const [q, setQ] = useState("");
    const [selected, setSelected] = useState(null);
    const customers = useMemo(() => {
        const map = new Map();
        for (const o of orders) {
            const cur = map.get(o.studentEmail) ?? {
                email: o.studentEmail,
                name: o.studentName,
                studentId: o.studentId,
                role: o.studentRole ?? "student",
                ordersCount: 0,
                spent: 0,
                lastOrderAt: 0,
                recent: [],
            };
            cur.ordersCount += 1;
            if (o.status !== "Cancelled")
                cur.spent += o.total;
            cur.lastOrderAt = Math.max(cur.lastOrderAt, o.createdAt);
            cur.recent.push(o);
            map.set(o.studentEmail, cur);
        }
        return [...map.values()]
            .map((c) => ({ ...c, recent: c.recent.sort((a, b) => b.createdAt - a.createdAt).slice(0, 5) }))
            .sort((a, b) => b.spent - a.spent);
    }, [orders]);
    const filtered = useMemo(() => {
        if (!q.trim())
            return customers;
        const s = q.toLowerCase();
        return customers.filter((c) => (c.name + c.email + c.studentId).toLowerCase().includes(s));
    }, [customers, q]);
    const active = filtered.find((c) => c.email === selected) ?? filtered[0];
    return (<VendorShell title="Customers" subtitle="View customer profiles and order history.">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <SmallStat label="Total Customers" value={String(customers.length)} icon={<User className="h-4 w-4"/>}/>
        <SmallStat label="Students" value={String(customers.filter((c) => c.role === "student").length)} icon={<GraduationCap className="h-4 w-4"/>}/>
        <SmallStat label="Teachers" value={String(customers.filter((c) => c.role === "teacher").length)} icon={<BadgeCheck className="h-4 w-4"/>}/>
        <SmallStat label="Total Orders" value={String(orders.length)} icon={<ShoppingBag className="h-4 w-4"/>}/>
      </div>

      <div className="grid lg:grid-cols-[1fr_360px] gap-6">
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-border">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"/>
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name, email, ID…" className="pl-10 h-10"/>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground border-b border-border bg-muted/40">
                  <th className="px-5 py-3 font-semibold">Customer</th>
                  <th className="px-5 py-3 font-semibold">ID</th>
                  <th className="px-5 py-3 font-semibold">Role</th>
                  <th className="px-5 py-3 font-semibold">Orders</th>
                  <th className="px-5 py-3 font-semibold">Spent</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (<tr><td colSpan={5} className="text-center py-12 text-muted-foreground">No customers yet.</td></tr>) : filtered.map((c) => {
            const isActive = active?.email === c.email;
            return (<tr key={c.email} onClick={() => setSelected(c.email)} className={`border-b border-border last:border-0 cursor-pointer transition-colors ${isActive ? "bg-accent/40" : "hover:bg-muted/30"}`}>
                      <td className="px-5 py-4">
                        <p className="font-semibold leading-tight">{c.name}</p>
                        <p className="text-xs text-muted-foreground">{c.email}</p>
                      </td>
                      <td className="px-5 py-4 text-xs font-medium text-muted-foreground whitespace-nowrap">{c.studentId}</td>
                      <td className="px-5 py-4">
                        <Badge variant="secondary" className="rounded-md capitalize">{c.role}</Badge>
                      </td>
                      <td className="px-5 py-4 font-medium">{c.ordersCount}</td>
                      <td className="px-5 py-4 font-semibold text-primary whitespace-nowrap">{peso(c.spent)}</td>
                    </tr>);
        })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Detail panel */}
        <aside className="bg-card border border-border rounded-2xl p-5 h-fit">
          {active ? (<>
              <div className="flex items-center gap-3 pb-4 border-b border-border">
                <div className="h-12 w-12 rounded-xl flex items-center justify-center text-base font-bold text-primary-foreground" style={{ background: "var(--gradient-primary)" }}>
                  {active.name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="font-bold leading-tight">{active.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{active.email}</p>
                </div>
              </div>
              <dl className="grid grid-cols-2 gap-3 mt-4 text-sm">
                <KV k="ID" v={active.studentId}/>
                <KV k="Role" v={active.role} cap/>
                <KV k="Orders" v={String(active.ordersCount)}/>
                <KV k="Spent" v={peso(active.spent)}/>
                <KV k="Last order" v={new Date(active.lastOrderAt).toLocaleDateString()} className="col-span-2"/>
              </dl>

              <div className="mt-5 pt-5 border-t border-border">
                <h4 className="font-semibold text-sm mb-3">Recent orders</h4>
                {active.recent.length === 0 ? (<p className="text-xs text-muted-foreground">No orders yet.</p>) : (<ul className="space-y-2">
                    {active.recent.map((o) => (<li key={o.id} className="flex items-center justify-between text-sm border border-border rounded-lg px-3 py-2">
                        <div>
                          <p className="font-medium leading-tight">{o.id}</p>
                          <p className="text-[11px] text-muted-foreground">{new Date(o.createdAt).toLocaleString()}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">{peso(o.total)}</p>
                          <p className="text-[11px] text-muted-foreground">{o.status}</p>
                        </div>
                      </li>))}
                  </ul>)}
              </div>
            </>) : (<p className="text-sm text-muted-foreground">Select a customer to see details.</p>)}
        </aside>
      </div>
    </VendorShell>);
};
const SmallStat = ({ label, value, icon }) => (<div className="bg-card border border-border rounded-2xl p-5">
    <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-3">{icon}</div>
    <p className="text-2xl font-bold">{value}</p>
    <p className="text-xs text-muted-foreground">{label}</p>
  </div>);
const KV = ({ k, v, cap, className = "" }) => (<div className={className}>
    <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">{k}</dt>
    <dd className={`text-sm font-semibold ${cap ? "capitalize" : ""}`}>{v}</dd>
  </div>);
export default VendorCustomers;
