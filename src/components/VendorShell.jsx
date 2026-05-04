import { Link, useLocation, useNavigate } from "@/lib/router-compat";
import { LayoutDashboard, Package, ClipboardList, Users, BarChart3, Settings as SettingsIcon, LogOut, Store, Menu as MenuIcon, X, Bell, } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { clearSession, getSession } from "@/lib/auth";
import { toast } from "sonner";
import { NotificationsBell } from "@/components/NotificationsBell";
const NAV = [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/vendor/products", label: "Products", icon: Package },
    { to: "/admin/orders", label: "Orders", icon: ClipboardList },
    { to: "/vendor/customers", label: "Customers", icon: Users },
    { to: "/vendor/reports", label: "Reports", icon: BarChart3 },
    { to: "/vendor/notifications", label: "Notifications", icon: Bell },
    { to: "/vendor/settings", label: "Settings", icon: SettingsIcon },
];
export const VendorShell = ({ children, title, subtitle, toolbar, }) => {
    const session = getSession();
    const navigate = useNavigate();
    const loc = useLocation();
    const [open, setOpen] = useState(false);
    if (!session || session.role !== "admin")
        return null;
    const onLogout = () => {
        clearSession();
        toast.success("Logged out");
        navigate("/");
    };
    const initials = session.name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
    return (<div className="min-h-screen bg-muted/30 flex">
      <aside className={`fixed lg:static inset-y-0 left-0 z-40 w-72 bg-card border-r border-border flex flex-col transition-transform lg:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="p-6 flex items-center gap-3">
          <div className="h-11 w-11 rounded-2xl flex items-center justify-center" style={{ background: "var(--gradient-primary)" }}>
            <Store className="h-5 w-5 text-primary-foreground"/>
          </div>
          <div>
            <p className="font-bold leading-tight">School Canteen</p>
            <p className="text-xs text-muted-foreground leading-tight">Vendor Portal</p>
          </div>
          <button className="ml-auto lg:hidden text-muted-foreground" onClick={() => setOpen(false)} aria-label="Close menu">
            <X className="h-5 w-5"/>
          </button>
        </div>

        <nav className="px-4 flex-1 space-y-1 overflow-y-auto">
          {NAV.map(({ to, label, icon: Icon }) => {
            const active = loc.pathname === to;
            return (<Link key={to} to={to} onClick={() => setOpen(false)} className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${active ? "bg-accent text-primary" : "text-muted-foreground hover:bg-secondary hover:text-foreground"}`}>
                <Icon className="h-[18px] w-[18px]"/>
                <span className="flex-1">{label}</span>
              </Link>);
        })}
        </nav>

        <div className="p-4">
          <Button variant="outline" className="w-full gap-2 h-11" onClick={onLogout}>
            <LogOut className="h-4 w-4"/> Logout
          </Button>
        </div>
      </aside>

      {open && <div className="fixed inset-0 bg-black/30 z-30 lg:hidden" onClick={() => setOpen(false)}/>}

      <div className="flex-1 min-w-0 flex flex-col">
        <header className="bg-card border-b border-border px-4 sm:px-8 py-4 flex items-center gap-4">
          <button className="lg:hidden text-muted-foreground" onClick={() => setOpen(true)} aria-label="Open menu">
            <MenuIcon className="h-5 w-5"/>
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold tracking-tight truncate">{title}</h1>
            {subtitle && <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>}
          </div>
          <div className="flex items-center gap-3">
            {toolbar}
            <NotificationsBell />
            <Link to="/vendor/settings" className="hidden sm:flex items-center gap-3 pl-3 border-l border-border group" aria-label="Open settings">
              {session.avatarDataUrl ? (<img src={session.avatarDataUrl} alt={session.name} className="h-10 w-10 rounded-xl object-cover"/>) : (<div className="h-10 w-10 rounded-xl flex items-center justify-center text-sm font-bold text-primary-foreground" style={{ background: "var(--gradient-primary)" }}>
                  {initials}
                </div>)}
              <div className="text-right">
                <p className="text-sm font-semibold leading-tight">{session.name}</p>
                <p className="text-xs text-muted-foreground leading-tight">Vendor</p>
              </div>
            </Link>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-8">{children}</main>

        <footer className="border-t border-border py-5 text-center text-xs text-muted-foreground">
          © 2026 School Canteen System · Vendor Portal
        </footer>
      </div>
    </div>);
};
