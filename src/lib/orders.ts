import { useEffect, useState } from "react";
import { DetailedCartItem } from "./cart";
import { notificationsStore } from "./notifications";
import { productsStore } from "./products";

export type OrderStatus = "Pending" | "Preparing" | "Ready" | "Completed" | "Cancelled";

export type OrderLine = {
  id: string;
  name: string;
  emoji: string;
  price: number;
  qty: number;
};

export type Order = {
  id: string;
  studentEmail: string;
  studentName: string;
  studentId: string;
  studentRole?: "student" | "teacher";
  lines: OrderLine[];
  total: number;
  pickupTime: string;
  notes?: string;
  status: OrderStatus;
  createdAt: number;
  updatedAt: number;
};

const KEY = "canteen.orders";
const EVT = "canteen:orders-changed";

const read = (): Order[] => {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Order[]) : [];
  } catch {
    return [];
  }
};
const write = (orders: Order[]) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(orders));
  window.dispatchEvent(new CustomEvent(EVT));
};

const shortId = () =>
  "ORD-" +
  Math.random().toString(36).slice(2, 6).toUpperCase() +
  Math.random().toString(36).slice(2, 4).toUpperCase();

export const ordersStore = {
  all: read,
  forStudent(email: string) {
    return read()
      .filter((o) => o.studentEmail === email)
      .sort((a, b) => b.createdAt - a.createdAt);
  },
  create(input: {
    studentEmail: string;
    studentName: string;
    studentId: string;
    studentRole?: "student" | "teacher";
    items: DetailedCartItem[];
    pickupTime: string;
    notes?: string;
  }): Order {
    const lines: OrderLine[] = input.items.map((i) => ({
      id: i.item.id,
      name: i.item.name,
      emoji: i.item.emoji,
      price: i.item.price,
      qty: i.qty,
    }));
    const order: Order = {
      id: shortId(),
      studentEmail: input.studentEmail,
      studentName: input.studentName,
      studentId: input.studentId,
      studentRole: input.studentRole,
      lines,
      total: lines.reduce((s, l) => s + l.price * l.qty, 0),
      pickupTime: input.pickupTime,
      notes: input.notes,
      status: "Pending",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    write([order, ...read()]);

    // Decrement stock and emit low-stock alerts.
    for (const line of lines) {
      const updated = productsStore.decrementStock(line.id, line.qty);
      if (updated && updated.stock <= updated.lowStockThreshold) {
        notificationsStore.push({
          audience: "vendor",
          type: updated.stock === 0 ? "Alert" : "Alert",
          iconName: "AlertTriangle",
          title: updated.stock === 0 ? "Out of stock" : "Low stock alert",
          body: `${updated.name} is ${updated.stock === 0 ? "out of stock" : `low (${updated.stock} left)`}.`,
        });
      }
    }

    // Notify vendor of new order.
    notificationsStore.push({
      audience: "vendor",
      type: "Pending",
      iconName: "ShoppingBag",
      title: `New order ${order.id}`,
      body: `${order.studentName} placed an order for ₱${order.total.toLocaleString("en-PH")} · pickup ${order.pickupTime}.`,
    });

    // Confirmation to customer.
    notificationsStore.push({
      audience: "customer",
      audienceKey: order.studentEmail,
      type: "Info",
      iconName: "ClipboardCheck",
      title: "Order received",
      body: `Your order ${order.id} is pending vendor confirmation.`,
    });

    return order;
  },
  setStatus(id: string, status: OrderStatus) {
    const orders = read();
    const target = orders.find((o) => o.id === id);
    if (!target) return;
    write(orders.map((o) => (o.id === id ? { ...o, status, updatedAt: Date.now() } : o)));

    // If cancelled, restock items.
    if (status === "Cancelled" && target.status !== "Cancelled") {
      for (const line of target.lines) productsStore.restock(line.id, line.qty);
    }

    const messages: Record<OrderStatus, { title: string; body: string; icon: keyof typeof iconMap; type: "Info" | "Pending" | "Alert" | "Announcement" }> = {
      Pending: { title: "Order pending", body: `Your order ${id} is awaiting confirmation.`, icon: "CalendarCheck", type: "Pending" },
      Preparing: { title: "Order accepted", body: `Your order ${id} is now being prepared.`, icon: "ChefHat", type: "Info" },
      Ready: { title: "Ready for pickup", body: `Your order ${id} is ready at the canteen.`, icon: "CheckCircle2", type: "Info" },
      Completed: { title: "Order completed", body: `Thanks! Your order ${id} has been served.`, icon: "CheckCircle2", type: "Info" },
      Cancelled: { title: "Order cancelled", body: `Your order ${id} was cancelled.`, icon: "XCircle", type: "Alert" },
    };
    const iconMap = {
      CalendarCheck: 1,
      ChefHat: 1,
      CheckCircle2: 1,
      XCircle: 1,
    } as const;
    const m = messages[status];
    notificationsStore.push({
      audience: "customer",
      audienceKey: target.studentEmail,
      type: m.type,
      iconName: m.icon,
      title: m.title,
      body: m.body,
    });
  },
};

export const useOrders = () => {
  const [orders, setOrders] = useState<Order[]>(read);
  useEffect(() => {
    const handler = () => setOrders(read());
    window.addEventListener(EVT, handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener(EVT, handler);
      window.removeEventListener("storage", handler);
    };
  }, []);
  return orders;
};
