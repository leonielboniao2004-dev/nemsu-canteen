import { useEffect, useState } from "react";
import { CalendarCheck, Package, Megaphone, ClipboardCheck, CheckCircle2, AlertTriangle, UserCog, Mail, ShoppingBag, XCircle, ChefHat, } from "lucide-react";
export const ICONS = {
    CalendarCheck,
    Package,
    Megaphone,
    ClipboardCheck,
    CheckCircle2,
    AlertTriangle,
    UserCog,
    Mail,
    ShoppingBag,
    XCircle,
    ChefHat,
};
export const TYPE_ICON_BG = {
    Pending: "bg-[hsl(var(--warning))]/15 text-[hsl(var(--warning))]",
    Alert: "bg-destructive/10 text-destructive",
    Announcement: "bg-primary/10 text-primary",
    Info: "bg-sky-500/10 text-sky-600",
    System: "bg-muted text-muted-foreground",
};
const KEY = "canteen.notifications";
const EVT = "canteen:notifications-changed";
const SEED = [
    {
        id: "n_seed_1",
        audience: "vendor",
        type: "Announcement",
        iconName: "Megaphone",
        title: "Welcome to your Vendor portal",
        body: "Manage menu, orders, customers, and reports from one place.",
        createdAt: Date.now() - 1000 * 60 * 60 * 24,
        read: true,
    },
];
const read = () => {
    if (typeof window === "undefined")
        return SEED;
    try {
        const raw = window.localStorage.getItem(KEY);
        if (!raw) {
            window.localStorage.setItem(KEY, JSON.stringify(SEED));
            return SEED;
        }
        return JSON.parse(raw);
    }
    catch {
        return SEED;
    }
};
const write = (items) => {
    if (typeof window === "undefined")
        return;
    window.localStorage.setItem(KEY, JSON.stringify(items));
    window.dispatchEvent(new CustomEvent(EVT));
};
const newId = () => "n" + Math.random().toString(36).slice(2, 9);
export const notificationsStore = {
    all: read,
    forVendor() {
        return read().filter((n) => n.audience === "vendor").sort((a, b) => b.createdAt - a.createdAt);
    },
    forCustomer(email) {
        return read()
            .filter((n) => n.audience === "customer" && n.audienceKey === email)
            .sort((a, b) => b.createdAt - a.createdAt);
    },
    push(n) {
        const item = {
            id: newId(),
            createdAt: Date.now(),
            read: n.read ?? false,
            ...n,
        };
        write([item, ...read()]);
        return item;
    },
    markRead(id) {
        write(read().map((n) => (n.id === id ? { ...n, read: true } : n)));
    },
    markAllReadFor(audience, key) {
        write(read().map((n) => {
            if (n.audience !== audience)
                return n;
            if (audience === "customer" && key && n.audienceKey !== key)
                return n;
            return { ...n, read: true };
        }));
    },
    remove(id) {
        write(read().filter((n) => n.id !== id));
    },
};
export const useNotifications = (audience, key) => {
    const get = () => (audience === "vendor" ? notificationsStore.forVendor() : notificationsStore.forCustomer(key ?? ""));
    const [items, setItems] = useState(get);
    useEffect(() => {
        const handler = () => setItems(get());
        window.addEventListener(EVT, handler);
        window.addEventListener("storage", handler);
        return () => {
            window.removeEventListener(EVT, handler);
            window.removeEventListener("storage", handler);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [audience, key]);
    return items;
};
export const timeAgo = (ts) => {
    const diff = Date.now() - ts;
    const m = Math.floor(diff / 60000);
    if (m < 1)
        return "Just now";
    if (m < 60)
        return `${m} minute${m === 1 ? "" : "s"} ago`;
    const h = Math.floor(m / 60);
    if (h < 24)
        return `${h} hour${h === 1 ? "" : "s"} ago`;
    const d = Math.floor(h / 24);
    if (d < 7)
        return `${d} day${d === 1 ? "" : "s"} ago`;
    return new Date(ts).toLocaleDateString();
};
