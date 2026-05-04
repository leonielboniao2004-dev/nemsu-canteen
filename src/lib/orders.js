import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getSession } from "./auth";
import { productsStore } from "./products";
import { notificationsStore } from "./notifications";

const EVT = "canteen:orders-changed";
let _cache = [];
let _initialized = false;

const fromRow = (r) => ({
  id: r.short_id,
  rowId: r.id,
  studentEmail: r.buyer_email,
  studentName: r.buyer_name,
  studentId: r.buyer_id_number,
  studentRole: r.buyer_role,
  userId: r.user_id,
  lines: (r.order_items || []).map((l) => ({
    id: l.product_id, name: l.product_name, emoji: l.emoji, price: Number(l.price), qty: l.qty,
  })),
  total: Number(r.total),
  pickupTime: r.pickup_time,
  notes: r.notes || undefined,
  status: r.status,
  createdAt: new Date(r.created_at).getTime(),
  updatedAt: new Date(r.updated_at).getTime(),
});

const fire = () => { if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent(EVT)); };

const loadAll = async () => {
  const s = getSession();
  if (!s) { _cache = []; fire(); return; }
  const { data } = await supabase.from("orders").select("*, order_items(*)").order("created_at", { ascending: false }).limit(200);
  _cache = (data || []).map(fromRow);
  fire();
};

export const initOrders = () => {
  if (_initialized || typeof window === "undefined") return;
  _initialized = true;
  loadAll();
  window.addEventListener("canteen.session.update", loadAll);
  supabase.channel("orders-rt")
    .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => loadAll())
    .on("postgres_changes", { event: "*", schema: "public", table: "order_items" }, () => loadAll())
    .subscribe();
};

const shortId = () => "ORD-" + Math.random().toString(36).slice(2, 6).toUpperCase() + Math.random().toString(36).slice(2, 4).toUpperCase();

export const ordersStore = {
  all: () => _cache,
  forStudent: (email) => _cache.filter((o) => o.studentEmail === email).sort((a, b) => b.createdAt - a.createdAt),
  async create(input) {
    const s = getSession();
    if (!s?.userId) throw new Error("Not signed in");
    const lines = input.items.map((i) => ({
      id: i.item.id, name: i.item.name, emoji: i.item.emoji, price: i.item.price, qty: i.qty,
    }));
    const total = lines.reduce((sum, l) => sum + l.price * l.qty, 0);
    const sid = shortId();
    const { data: order, error } = await supabase.from("orders").insert({
      short_id: sid, user_id: s.userId,
      buyer_name: input.studentName, buyer_email: input.studentEmail,
      buyer_id_number: input.studentId || "", buyer_role: input.studentRole || s.role,
      pickup_time: input.pickupTime, notes: input.notes || null,
      total,
    }).select().single();
    if (error) throw error;
    await supabase.from("order_items").insert(lines.map((l) => ({
      order_id: order.id, product_id: l.id, product_name: l.name, emoji: l.emoji, price: l.price, qty: l.qty,
    })));
    // Decrement stock + low-stock alerts
    for (const l of lines) {
      const u = await productsStore.decrementStock(l.id, l.qty);
      if (u && u.stock <= (productsStore.get(l.id)?.lowStockThreshold ?? 6)) {
        await notificationsStore.push({
          audience: "vendor", type: "Alert", iconName: "AlertTriangle",
          title: u.stock === 0 ? "Out of stock" : "Low stock alert",
          body: `${u.name} is ${u.stock === 0 ? "out of stock" : `low (${u.stock} left)`}.`,
        });
      }
    }
    await notificationsStore.push({
      audience: "vendor", type: "Pending", iconName: "ShoppingBag",
      title: `New order ${sid}`,
      body: `${input.studentName} placed an order for ₱${total.toLocaleString("en-PH")} · pickup ${input.pickupTime}.`,
    });
    await notificationsStore.push({
      audience: "customer", audienceKey: s.userId, type: "Info", iconName: "ClipboardCheck",
      title: "Order received", body: `Your order ${sid} is pending vendor confirmation.`,
    });
    return { id: sid };
  },
  async setStatus(shortIdValue, status) {
    const target = _cache.find((o) => o.id === shortIdValue);
    if (!target) return;
    await supabase.from("orders").update({ status }).eq("id", target.rowId);
    if (status === "Cancelled" && target.status !== "Cancelled") {
      for (const l of target.lines) await productsStore.restock(l.id, l.qty);
    }
    const messages = {
      Pending: { t: "Order pending", b: `Your order ${shortIdValue} is awaiting confirmation.`, i: "CalendarCheck", ty: "Pending" },
      Preparing: { t: "Order accepted", b: `Your order ${shortIdValue} is now being prepared.`, i: "ChefHat", ty: "Info" },
      Ready: { t: "Ready for pickup", b: `Your order ${shortIdValue} is ready at the canteen.`, i: "CheckCircle2", ty: "Info" },
      Completed: { t: "Order completed", b: `Thanks! Your order ${shortIdValue} has been served.`, i: "CheckCircle2", ty: "Info" },
      Cancelled: { t: "Order cancelled", b: `Your order ${shortIdValue} was cancelled.`, i: "XCircle", ty: "Alert" },
    };
    const m = messages[status];
    await notificationsStore.push({
      audience: "customer", audienceKey: target.userId, type: m.ty, iconName: m.i, title: m.t, body: m.b,
    });
  },
};

export const useOrders = () => {
  const [orders, setOrders] = useState(_cache);
  useEffect(() => {
    const h = () => setOrders([..._cache]);
    window.addEventListener(EVT, h);
    return () => window.removeEventListener(EVT, h);
  }, []);
  return orders;
};
