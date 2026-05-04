import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getSession } from "./auth";
import {
  CalendarCheck, Package, Megaphone, ClipboardCheck, CheckCircle2,
  AlertTriangle, UserCog, Mail, ShoppingBag, XCircle, ChefHat,
} from "lucide-react";

export const ICONS = {
  CalendarCheck, Package, Megaphone, ClipboardCheck, CheckCircle2,
  AlertTriangle, UserCog, Mail, ShoppingBag, XCircle, ChefHat,
};
export const TYPE_ICON_BG = {
  Pending: "bg-[hsl(var(--warning))]/15 text-[hsl(var(--warning))]",
  Alert: "bg-destructive/10 text-destructive",
  Announcement: "bg-primary/10 text-primary",
  Info: "bg-sky-500/10 text-sky-600",
  System: "bg-muted text-muted-foreground",
};

const EVT = "canteen:notifications-changed";
let _cache = [];
let _initialized = false;

const fromRow = (r) => ({
  id: r.id,
  audience: r.audience,
  audienceKey: r.user_id || undefined,
  type: r.type,
  iconName: r.icon_name,
  title: r.title,
  body: r.body,
  read: r.read,
  createdAt: new Date(r.created_at).getTime(),
});

const fire = () => { if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent(EVT)); };

const loadAll = async () => {
  const s = getSession();
  if (!s) { _cache = []; fire(); return; }
  const { data } = await supabase.from("notifications").select("*").order("created_at", { ascending: false }).limit(200);
  _cache = (data || []).map(fromRow);
  fire();
};

export const initNotifications = () => {
  if (_initialized || typeof window === "undefined") return;
  _initialized = true;
  loadAll();
  window.addEventListener("canteen.session.update", loadAll);
  supabase.channel("notif-rt")
    .on("postgres_changes", { event: "*", schema: "public", table: "notifications" }, () => loadAll())
    .subscribe();
};

export const notificationsStore = {
  all: () => _cache,
  forVendor: () => _cache.filter((n) => n.audience === "vendor").sort((a, b) => b.createdAt - a.createdAt),
  forCustomer: (email) => {
    const s = getSession();
    const uid = s?.userId;
    return _cache.filter((n) => n.audience === "customer" && n.audienceKey === uid).sort((a, b) => b.createdAt - a.createdAt);
  },
  async push(n) {
    const row = {
      audience: n.audience,
      user_id: n.audience === "customer" ? (n.audienceKey || getSession()?.userId) : null,
      type: n.type, icon_name: n.iconName, title: n.title, body: n.body, read: n.read ?? false,
    };
    await supabase.from("notifications").insert(row);
  },
  async markRead(id) {
    await supabase.from("notifications").update({ read: true }).eq("id", id);
  },
  async markAllReadFor(audience /*, key */) {
    const s = getSession();
    if (!s) return;
    let q = supabase.from("notifications").update({ read: true }).eq("audience", audience).eq("read", false);
    if (audience === "customer") q = q.eq("user_id", s.userId);
    await q;
  },
  async remove(id) { await supabase.from("notifications").delete().eq("id", id); },
};

export const useNotifications = (audience, key) => {
  const get = () => audience === "vendor" ? notificationsStore.forVendor() : notificationsStore.forCustomer(key);
  const [items, setItems] = useState(get);
  useEffect(() => {
    const h = () => setItems(get());
    window.addEventListener(EVT, h);
    return () => window.removeEventListener(EVT, h);
    // eslint-disable-next-line
  }, [audience, key]);
  return items;
};

export const timeAgo = (ts) => {
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  if (m < 1) return "Just now";
  if (m < 60) return `${m} minute${m === 1 ? "" : "s"} ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} hour${h === 1 ? "" : "s"} ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d} day${d === 1 ? "" : "s"} ago`;
  return new Date(ts).toLocaleDateString();
};
