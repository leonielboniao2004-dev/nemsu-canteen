import { Link, useLocation, useNavigate } from "@/lib/router-compat";
import { UtensilsCrossed, LogOut, ShoppingCart, LayoutDashboard, ListOrdered, Salad, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { clearSession, getSession } from "@/lib/auth";
import { cartCount, useCart } from "@/lib/cart";
import { toast } from "sonner";
import { NotificationsBell } from "@/components/NotificationsBell";

export const AppShell = ({
  children,
  title,
  subtitle,
}: {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}) => {
  const session = getSession();
  const navigate = useNavigate();
  const loc = useLocation();
  const cart = useCart();
  const count = cartCount(cart);

  const isAdmin = session?.role === "admin";

  const onLogout = () => {
    clearSession();
    toast.success("Logged out");
    navigate("/");
  };

  const navItems = isAdmin
    ? [
        { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
        { to: "/admin/orders", label: "Order Queue", icon: Store },
      ]
    : [
        { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
        { to: "/menu", label: "Menu", icon: Salad },
        { to: "/orders", label: "My Orders", icon: ListOrdered },
      ];

  return (
    <div className="min-h-screen" style={{ background: "var(--gradient-page)" }}>
      <header className="bg-card/75 backdrop-blur-xl border-b border-border/60 sticky top-0 z-30 shadow-[0_1px_0_0_hsl(var(--border)/0.4)]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          <Link to="/dashboard" className="flex items-center gap-3 shrink-0 group">
            <div
              className="h-10 w-10 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-105 group-hover:rotate-3"
              style={{ background: "var(--gradient-primary)", boxShadow: "var(--shadow-button)" }}
            >
              <UtensilsCrossed className="h-5 w-5 text-primary-foreground" />
            </div>
            <div className="hidden sm:block">
              <p className="font-bold leading-tight tracking-tight">School Canteen</p>
              <p className="text-xs text-muted-foreground leading-tight">{isAdmin ? "Vendor Portal" : "Student Portal"}</p>
            </div>
          </Link>

          <nav className="flex items-center gap-1 overflow-x-auto scrollbar-none">
            {navItems.map(({ to, label, icon: Icon }) => {
              const active = loc.pathname === to;
              return (
                <Link
                  key={to}
                  to={to}
                  className={`relative flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    active
                      ? "text-primary-foreground shadow-[var(--shadow-button)]"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/70"
                  }`}
                  style={active ? { background: "var(--gradient-primary)" } : undefined}
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden md:inline">{label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            <NotificationsBell />
            {!isAdmin && (
              <Link to="/cart" className="relative">
                <Button variant="outline" size="icon" className="relative hover:bg-secondary hover:text-primary transition-colors">
                  <ShoppingCart className="h-4 w-4" />
                  {count > 0 && (
                    <Badge className="absolute -top-2 -right-2 h-5 min-w-5 px-1 rounded-full bg-primary text-primary-foreground border-2 border-card animate-fade-in">
                      {count}
                    </Badge>
                  )}
                </Button>
              </Link>
            )}
            <Button variant="outline" size="icon" onClick={onLogout} aria-label="Logout" className="hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 transition-colors">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 animate-fade-in">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{title}</h1>
          {subtitle && <p className="text-sm sm:text-base text-muted-foreground mt-1.5">{subtitle}</p>}
        </div>
        {children}
      </main>
    </div>
  );
};
