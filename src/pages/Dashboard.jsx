import { Link } from "@/lib/router-compat";
import { Package, CheckCircle2, AlertTriangle, Layers, ArrowRight, Search, Eye, ShoppingCart, Info } from "lucide-react";
import { cartStore } from "@/lib/cart";
import { toast } from "sonner";
import { useMemo, useState } from "react";
import { StudentSidebarLayout } from "@/components/StudentSidebarLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getSession } from "@/lib/auth";
import { peso, MENU } from "@/lib/menu";
import { useOrders } from "@/lib/orders";
import { AppShell } from "@/components/AppShell";
import VendorDashboard from "@/pages/vendor/VendorDashboard";
const Dashboard = () => {
    const session = getSession();
    if (!session)
        return null;
    if (session.role === "admin")
        return <VendorDashboard />;
    return <StudentDashboard />;
};
const StudentDashboard = () => {
    const session = getSession();
    const orders = useOrders();
    const [q, setQ] = useState("");
    const [cat, setCat] = useState("All");
    const [status, setStatus] = useState("All");
    const [sort, setSort] = useState("name");
    // Synthetic "stock" so the layout matches the reference data shape
    const stocked = useMemo(() => MENU.map((m, i) => ({
        ...m,
        sku: `PRD-${String(32 - i).padStart(5, "0")}`,
        stock: ((i * 7) % 18) + 2,
    })), []);
    const totalProducts = stocked.length;
    const availableItems = stocked.filter((m) => m.stock >= 6).length;
    const lowStock = stocked.filter((m) => m.stock < 6).length;
    const categories = new Set(stocked.map((m) => m.category)).size;
    const filtered = useMemo(() => {
        let list = stocked.filter((m) => (cat === "All" ? true : m.category === cat));
        if (status !== "All")
            list = list.filter((m) => (status === "Low Stock" ? m.stock < 6 : m.stock >= 6));
        if (q.trim())
            list = list.filter((m) => (m.name + " " + m.description).toLowerCase().includes(q.toLowerCase()));
        if (sort === "name")
            list = [...list].sort((a, b) => a.name.localeCompare(b.name));
        if (sort === "price-asc")
            list = [...list].sort((a, b) => a.price - b.price);
        if (sort === "price-desc")
            list = [...list].sort((a, b) => b.price - a.price);
        return list;
    }, [stocked, cat, status, q, sort]);
    if (!session || (session.role !== "student" && session.role !== "teacher"))
        return null;
    return (<StudentSidebarLayout title="Products" subtitle="Manage and organize all canteen products." toolbar={<div className="hidden md:block relative w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"/>
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search products..." className="pl-10 h-10 bg-secondary/60 border-0"/>
        </div>}>
      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard icon={<Package className="h-5 w-5"/>} tint="primary" label="Total Products" value={String(totalProducts)} link={{ to: "/menu", label: "View all products" }}/>
        <StatCard icon={<CheckCircle2 className="h-5 w-5"/>} tint="success" label="Available Items" value={String(availableItems)} link={{ to: "/menu", label: "View available" }}/>
        <StatCard icon={<AlertTriangle className="h-5 w-5"/>} tint="warning" label="Low Stock Items" value={String(lowStock)} link={{ to: "/menu", label: "View low stock" }}/>
        <StatCard icon={<Layers className="h-5 w-5"/>} tint="info" label="Categories" value={String(categories)} link={{ to: "/menu", label: "Manage categories" }}/>
      </div>

      {/* List + filter */}
      <div className="grid xl:grid-cols-[1fr_280px] gap-6">
        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          <div className="p-5 flex flex-wrap items-center justify-between gap-3 border-b border-border">
            <h3 className="font-bold">Products List</h3>
            <div className="flex flex-wrap items-center gap-2">
              <Select value={cat} onValueChange={(v) => setCat(v)}>
                <SelectTrigger className="h-9 w-[140px] text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Categories</SelectItem>
                  <SelectItem value="Meals">Meals</SelectItem>
                  <SelectItem value="Snacks">Snacks</SelectItem>
                  <SelectItem value="Drinks">Drinks</SelectItem>
                  <SelectItem value="Desserts">Desserts</SelectItem>
                </SelectContent>
              </Select>
              <Select value={status} onValueChange={(v) => setStatus(v)}>
                <SelectTrigger className="h-9 w-[120px] text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Status</SelectItem>
                  <SelectItem value="Available">Available</SelectItem>
                  <SelectItem value="Low Stock">Low Stock</SelectItem>
                </SelectContent>
              </Select>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"/>
                <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search products..." className="pl-9 h-9 w-44 text-sm"/>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground border-b border-border bg-muted/40">
                  <th className="px-5 py-3 font-semibold">ID</th>
                  <th className="px-5 py-3 font-semibold">Product</th>
                  <th className="px-5 py-3 font-semibold">Category</th>
                  <th className="px-5 py-3 font-semibold">Price</th>
                  <th className="px-5 py-3 font-semibold">Stock</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.slice(0, 7).map((p) => (<ProductRow key={p.id} p={p}/>))}
                {filtered.length === 0 && (<tr><td colSpan={7} className="text-center py-12 text-muted-foreground">No products match your filters.</td></tr>)}
              </tbody>
            </table>
          </div>

          <div className="p-5 flex flex-wrap items-center justify-between gap-3 border-t border-border">
            <p className="text-xs text-muted-foreground">Showing 1 to {Math.min(7, filtered.length)} of {filtered.length} products</p>
            <div className="flex items-center gap-1">
              {["‹", "1", "2", "3", "›"].map((p, i) => (<button key={i} className={`h-8 min-w-8 px-2 rounded-lg border text-sm ${p === "1" ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-secondary"}`}>
                  {p}
                </button>))}
            </div>
          </div>
        </div>

        {/* Filter sidebar */}
        <aside className="space-y-4">
          <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
            <h3 className="font-semibold">Filter Products</h3>
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1.5">Category</p>
              <Select value={cat} onValueChange={(v) => setCat(v)}>
                <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Categories</SelectItem>
                  <SelectItem value="Meals">Meals</SelectItem>
                  <SelectItem value="Snacks">Snacks</SelectItem>
                  <SelectItem value="Drinks">Drinks</SelectItem>
                  <SelectItem value="Desserts">Desserts</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1.5">Status</p>
              <Select value={status} onValueChange={(v) => setStatus(v)}>
                <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Status</SelectItem>
                  <SelectItem value="Available">Available</SelectItem>
                  <SelectItem value="Low Stock">Low Stock</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1.5">Price Range</p>
              <div className="flex items-center gap-2">
                <Input placeholder="Min price" className="h-10 text-sm"/>
                <span className="text-muted-foreground">–</span>
                <Input placeholder="Max price" className="h-10 text-sm"/>
              </div>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1.5">Sort By</p>
              <Select value={sort} onValueChange={(v) => setSort(v)}>
                <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Name (A – Z)</SelectItem>
                  <SelectItem value="price-asc">Price (Low – High)</SelectItem>
                  <SelectItem value="price-desc">Price (High – Low)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-1">
              <Button className="h-10">Apply Filters</Button>
              <Button variant="outline" className="h-10" onClick={() => { setCat("All"); setStatus("All"); setQ(""); setSort("name"); }}>Reset</Button>
            </div>
          </div>

          <div className="bg-accent/60 border border-border rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-2">
              <Info className="h-4 w-4 text-primary"/>
              <p className="font-semibold text-sm">About Products</p>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Browse the canteen menu, view stock levels, and place reservations. Products marked as Low Stock may sell out soon.
            </p>
          </div>
        </aside>
      </div>
    </StudentSidebarLayout>);
};
const CATEGORY_COLORS = {
    Meals: "bg-primary/10 text-primary",
    Snacks: "bg-[hsl(var(--warning))]/15 text-[hsl(var(--warning))]",
    Drinks: "bg-sky-500/10 text-sky-600",
    Desserts: "bg-pink-500/10 text-pink-600",
};
const ProductRow = ({ p }) => {
    const low = p.stock < 6;
    return (<tr className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
      <td className="px-5 py-4 text-xs font-medium text-muted-foreground whitespace-nowrap">{p.sku}</td>
      <td className="px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-accent flex items-center justify-center text-2xl shrink-0">{p.emoji}</div>
          <div className="min-w-0">
            <p className="font-semibold leading-tight">{p.name}</p>
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2 max-w-[220px]">{p.description}</p>
          </div>
        </div>
      </td>
      <td className="px-5 py-4">
        <Badge className={`${CATEGORY_COLORS[p.category]} hover:${CATEGORY_COLORS[p.category]} border-0 rounded-md font-medium`}>{p.category}</Badge>
      </td>
      <td className="px-5 py-4 font-semibold whitespace-nowrap">{peso(p.price)}.00</td>
      <td className="px-5 py-4 font-medium">{p.stock}</td>
      <td className="px-5 py-4">
        {low ? (<Badge className="bg-[hsl(var(--warning))]/15 text-[hsl(var(--warning))] hover:bg-[hsl(var(--warning))]/15 border-0 rounded-md">Low Stock</Badge>) : (<Badge className="bg-[hsl(var(--success))]/15 text-[hsl(var(--success))] hover:bg-[hsl(var(--success))]/15 border-0 rounded-md">Available</Badge>)}
      </td>
      <td className="px-5 py-4">
        <div className="flex items-center justify-end gap-1.5">
          <button disabled={low} onClick={() => { cartStore.add(p.id, 1); toast.success("Added to cart", { description: p.name }); }} className="h-8 px-3 rounded-lg bg-primary text-primary-foreground hover:opacity-90 flex items-center gap-1.5 text-xs font-medium disabled:opacity-40 disabled:cursor-not-allowed">
            <ShoppingCart className="h-3.5 w-3.5"/> Order
          </button>
          <button className="h-8 w-8 rounded-lg bg-secondary text-muted-foreground hover:text-foreground flex items-center justify-center" aria-label="View"><Eye className="h-3.5 w-3.5"/></button>
        </div>
      </td>
    </tr>);
};
const STAT_TINTS = {
    primary: { bg: "bg-primary/10", fg: "text-primary" },
    success: { bg: "bg-[hsl(var(--success))]/15", fg: "text-[hsl(var(--success))]" },
    warning: { bg: "bg-[hsl(var(--warning))]/15", fg: "text-[hsl(var(--warning))]" },
    info: { bg: "bg-sky-500/10", fg: "text-sky-600" },
};
const STAT_LINK_COLORS = {
    primary: "text-primary",
    success: "text-[hsl(var(--success))]",
    warning: "text-[hsl(var(--warning))]",
    info: "text-sky-600",
};
const StatCard = ({ icon, label, value, tint, link, }) => {
    const t = STAT_TINTS[tint];
    return (<div className="bg-card border border-border rounded-2xl p-5">
      <div className="flex items-start gap-4">
        <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${t.bg} ${t.fg}`}>{icon}</div>
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground font-medium">{label}</p>
          <p className="text-3xl font-bold mt-0.5">{value}</p>
        </div>
      </div>
      <Link to={link.to} className={`mt-4 inline-flex items-center gap-1.5 text-sm font-medium ${STAT_LINK_COLORS[tint]} hover:gap-2 transition-all`}>
        {link.label} <ArrowRight className="h-4 w-4"/>
      </Link>
    </div>);
};
// --- Vendor Dashboard ---
const AdminDashboard = () => {
    const orders = useOrders();
    const today = orders.filter((o) => new Date(o.createdAt).toDateString() === new Date().toDateString());
    const pending = orders.filter((o) => o.status === "Pending").length;
    const preparing = orders.filter((o) => o.status === "Preparing").length;
    const ready = orders.filter((o) => o.status === "Ready").length;
    const completedToday = today.filter((o) => o.status === "Completed").length;
    const revenue = today.filter((o) => o.status !== "Cancelled").reduce((s, o) => s + o.total, 0);
    const recent = [...orders].sort((a, b) => b.createdAt - a.createdAt).slice(0, 6);
    const stocked = useMemo(() => MENU.map((m, i) => ({ ...m, sku: `PRD-${String(32 - i).padStart(5, "0")}`, stock: ((i * 7) % 18) + 2 })), []);
    const lowStock = stocked.filter((p) => p.stock < 6).slice(0, 5);
    const STATUS_COLOR = {
        Pending: "bg-[hsl(var(--warning))]/15 text-[hsl(var(--warning))]",
        Preparing: "bg-primary/10 text-primary",
        Ready: "bg-[hsl(var(--success))]/15 text-[hsl(var(--success))]",
        Completed: "bg-secondary text-secondary-foreground",
        Cancelled: "bg-destructive/10 text-destructive",
    };
    return (<AppShell title="Vendor Dashboard" subtitle="Live overview of your canteen operations">
      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard icon={<Package className="h-5 w-5"/>} tint="primary" label="Total Products" value={String(MENU.length)} link={{ to: "/admin/orders", label: "View products" }}/>
        <StatCard icon={<AlertTriangle className="h-5 w-5"/>} tint="warning" label="Pending Orders" value={String(pending)} link={{ to: "/admin/orders", label: "View pending" }}/>
        <StatCard icon={<CheckCircle2 className="h-5 w-5"/>} tint="success" label="Completed Today" value={String(completedToday)} link={{ to: "/admin/orders", label: "View completed" }}/>
        <StatCard icon={<Layers className="h-5 w-5"/>} tint="info" label="Today's Revenue" value={peso(revenue)} link={{ to: "/admin/orders", label: "View report" }}/>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent orders */}
        <div className="lg:col-span-2 bg-card border border-border rounded-2xl overflow-hidden">
          <div className="p-5 flex items-center justify-between border-b border-border">
            <div>
              <h3 className="font-bold">Recent Orders</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Latest activity across the queue</p>
            </div>
            <Link to="/admin/orders" className="text-sm font-medium text-primary inline-flex items-center gap-1 hover:gap-2 transition-all">
              View all <ArrowRight className="h-4 w-4"/>
            </Link>
          </div>

          {recent.length === 0 ? (<div className="p-12 text-center">
              <Package className="h-10 w-10 text-muted-foreground mx-auto mb-3"/>
              <p className="text-sm text-muted-foreground">No orders yet. Once students place orders they'll appear here.</p>
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

        {/* Right column */}
        <div className="space-y-6">
          {/* Quick actions */}
          <div className="bg-card border border-border rounded-2xl p-5">
            <h3 className="font-bold mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-3">
              <Link to="/admin/orders" className="rounded-xl border border-border p-4 hover:border-primary hover:bg-primary/5 transition-colors text-center">
                <div className="h-10 w-10 mx-auto rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-2"><Package className="h-5 w-5"/></div>
                <p className="text-xs font-semibold">Order Queue</p>
                <p className="text-[11px] text-muted-foreground">Manage incoming</p>
              </Link>
              <Link to="/menu" className="rounded-xl border border-border p-4 hover:border-primary hover:bg-primary/5 transition-colors text-center">
                <div className="h-10 w-10 mx-auto rounded-xl bg-[hsl(var(--success))]/15 text-[hsl(var(--success))] flex items-center justify-center mb-2"><Layers className="h-5 w-5"/></div>
                <p className="text-xs font-semibold">View Menu</p>
                <p className="text-[11px] text-muted-foreground">Browse products</p>
              </Link>
              <Link to="/notifications" className="rounded-xl border border-border p-4 hover:border-primary hover:bg-primary/5 transition-colors text-center">
                <div className="h-10 w-10 mx-auto rounded-xl bg-sky-500/10 text-sky-600 flex items-center justify-center mb-2"><Info className="h-5 w-5"/></div>
                <p className="text-xs font-semibold">Notifications</p>
                <p className="text-[11px] text-muted-foreground">All updates</p>
              </Link>
              <Link to="/settings" className="rounded-xl border border-border p-4 hover:border-primary hover:bg-primary/5 transition-colors text-center">
                <div className="h-10 w-10 mx-auto rounded-xl bg-[hsl(var(--warning))]/15 text-[hsl(var(--warning))] flex items-center justify-center mb-2"><CheckCircle2 className="h-5 w-5"/></div>
                <p className="text-xs font-semibold">Settings</p>
                <p className="text-[11px] text-muted-foreground">Preferences</p>
              </Link>
            </div>
          </div>

          {/* Live status */}
          <div className="bg-card border border-border rounded-2xl p-5">
            <h3 className="font-bold mb-4">Live Status</h3>
            <ul className="space-y-3">
              <StatusRow label="Pending" value={pending} dot="bg-[hsl(var(--warning))]"/>
              <StatusRow label="Preparing" value={preparing} dot="bg-primary"/>
              <StatusRow label="Ready for pickup" value={ready} dot="bg-[hsl(var(--success))]"/>
            </ul>
          </div>

          {/* Low stock */}
          <div className="bg-card border border-border rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold">Low Stock Alert</h3>
              <Badge className="bg-[hsl(var(--warning))]/15 text-[hsl(var(--warning))] hover:bg-[hsl(var(--warning))]/15 border-0">{lowStock.length}</Badge>
            </div>
            {lowStock.length === 0 ? (<p className="text-xs text-muted-foreground">All items are well stocked.</p>) : (<ul className="space-y-3">
                {lowStock.map((p) => (<li key={p.id} className="flex items-center gap-3">
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
    </AppShell>);
};
const StatusRow = ({ label, value, dot }) => (<li className="flex items-center justify-between">
    <span className="flex items-center gap-2 text-sm text-muted-foreground">
      <span className={`h-2 w-2 rounded-full ${dot}`}/>
      {label}
    </span>
    <span className="font-bold">{value}</span>
  </li>);
export default Dashboard;
