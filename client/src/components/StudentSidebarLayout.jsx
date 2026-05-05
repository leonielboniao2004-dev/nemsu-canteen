import { Link, useLocation, useNavigate } from "@/lib/router-compat";
import { LayoutDashboard, UtensilsCrossed as MenuIconNav, CalendarCheck, Settings as SettingsIcon, LogOut, UtensilsCrossed, ShieldCheck, Menu as MenuIcon, X, BadgeCheck, Clock } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { clearSession, getSession } from "@/lib/auth";
import { toast } from "sonner";
import { NotificationsBell } from "@/components/NotificationsBell";
export const StudentSidebarLayout = ({ children, title, subtitle, toolbar, }) => {
    const [session, setSessionState] = useState(() => getSession());
    const navigate = useNavigate();
    const loc = useLocation();
    const [open, setOpen] = useState(false);
    // Keep avatar / verification updates in sync after they change in Settings.
    useEffect(() => {
        const refresh = () => setSessionState(getSession());
        window.addEventListener("canteen.session.update", refresh);
        window.addEventListener("storage", refresh);
        return () => {
            window.removeEventListener("canteen.session.update", refresh);
            window.removeEventListener("storage", refresh);
        };
    }, []);
    if (!session || (session.role !== "student" && session.role !== "teacher"))
        return null;
    const isTeacher = session.role === "teacher";
    const portalLabel = isTeacher ? "Teacher Portal" : "Student Portal";
    const reservationsLabel = isTeacher ? "My Orders" : "My Reservations";
    const items = [
        { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
        { to: "/menu", label: "Menu", icon: MenuIconNav },
        { to: "/orders", label: reservationsLabel, icon: CalendarCheck },
        { to: "/settings", label: "Settings", icon: SettingsIcon },
    ];
    const onLogout = () => {
        clearSession();
        toast.success("Logged out");
        navigate("/");
    };
    const initials = session.name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
    const verified = !!session.idCardImage;
    const pending = false; // We are simplifying verification to existence of ID for now
    return (<div className="min-h-screen bg-muted/30 flex">
      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-40 w-72 bg-card border-r border-border flex flex-col transition-transform lg:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="p-6 flex items-center gap-3">
          <div className="h-11 w-11 rounded-2xl flex items-center justify-center" style={{ background: "var(--gradient-primary)" }}>
            <UtensilsCrossed className="h-5 w-5 text-primary-foreground"/>
          </div>
          <div>
            <p className="font-bold leading-tight">School Canteen</p>
            <p className="text-xs text-muted-foreground leading-tight">{portalLabel}</p>
          </div>
          <button className="ml-auto lg:hidden text-muted-foreground" onClick={() => setOpen(false)} aria-label="Close menu">
            <X className="h-5 w-5"/>
          </button>
        </div>

        <nav className="px-4 flex-1 space-y-1">
          {items.map(({ to, label, icon: Icon }) => {
            const active = loc.pathname === to;
            return (<Link key={to} to={to} onClick={() => setOpen(false)} className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${active ? "bg-accent text-primary" : "text-muted-foreground hover:bg-secondary hover:text-foreground"}`}>
                <Icon className="h-[18px] w-[18px]"/>
                <span className="flex-1">{label}</span>
              </Link>);
        })}
        </nav>

        <div className="p-4 space-y-3">
          {verified ? (<div className="bg-[hsl(var(--success))]/10 border border-[hsl(var(--success))]/20 rounded-xl p-3 flex items-start gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-[hsl(var(--success))]/15 flex items-center justify-center text-[hsl(var(--success))] shrink-0">
                <BadgeCheck className="h-4 w-4"/>
              </div>
              <div className="text-xs">
                <p className="font-semibold text-[hsl(var(--success))]">Verified {isTeacher ? "Teacher" : "Student"}</p>
                <p className="text-muted-foreground mt-0.5">ID: {session.studentId}</p>
              </div>
            </div>) : pending ? (<div className="bg-[hsl(var(--warning))]/10 border border-[hsl(var(--warning))]/20 rounded-xl p-3 flex items-start gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-[hsl(var(--warning))]/15 flex items-center justify-center text-[hsl(var(--warning))] shrink-0">
                <Clock className="h-4 w-4"/>
              </div>
              <div className="text-xs">
                <p className="font-semibold text-[hsl(var(--warning))]">Verification pending</p>
                <p className="text-muted-foreground mt-0.5">ID submitted for review.</p>
              </div>
            </div>) : (<Link to="/settings" className="block bg-muted/40 border border-dashed border-border rounded-xl p-3">
              <div className="flex items-start gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <ShieldCheck className="h-4 w-4"/>
                </div>
                <div className="text-xs">
                  <p className="font-semibold">Account not verified</p>
                  <p className="text-muted-foreground mt-0.5">Upload your ID in Settings.</p>
                </div>
              </div>
            </Link>)}
          <Button variant="outline" className="w-full gap-2 h-11" onClick={onLogout}>
            <LogOut className="h-4 w-4"/> Logout
          </Button>
        </div>
      </aside>

      {open && <div className="fixed inset-0 bg-black/30 z-30 lg:hidden" onClick={() => setOpen(false)}/>}

      {/* Main */}
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
            <Link to="/settings" className="hidden sm:flex items-center gap-3 pl-3 border-l border-border group" aria-label="Open settings">
              {session.avatar ? (<img src={session.avatar} alt={session.name} className="h-10 w-10 rounded-xl object-cover"/>) : (<div className="h-10 w-10 rounded-xl flex items-center justify-center text-sm font-bold text-primary-foreground" style={{ background: "var(--gradient-primary)" }}>
                  {initials}
                </div>)}
              <div className="text-right">
                <p className="text-sm font-semibold leading-tight truncate max-w-[140px] group-hover:text-primary transition-colors">{session.name}</p>
                <p className="text-xs text-muted-foreground leading-tight">
                  {isTeacher ? `${session.grade}${session.section ? ` · ${session.section}` : ""}` : `${session.grade} · ${session.section}`}
                </p>
              </div>
            </Link>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-8">{children}</main>

        <footer className="border-t border-border py-5 text-center text-xs text-muted-foreground">
          © 2026 School Canteen System. All rights reserved.
        </footer>
      </div>
    </div>);
};
