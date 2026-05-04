import { useEffect, useState } from "react";
import { MenuItem } from "./menu";
import { productsStore } from "./products";
import { getSession } from "./auth";

export type CartItem = { id: string; qty: number };
const EVT = "canteen:cart-changed";

const keyFor = () => {
  const s = getSession();
  if (s && (s.role === "student" || s.role === "teacher")) {
    return `canteen.cart:${s.role}:${s.email.toLowerCase()}`;
  }
  return "canteen.cart:guest";
};

const read = (): CartItem[] => {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(keyFor());
    return raw ? (JSON.parse(raw) as CartItem[]) : [];
  } catch {
    return [];
  }
};
const write = (items: CartItem[]) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(keyFor(), JSON.stringify(items));
  window.dispatchEvent(new CustomEvent(EVT));
};

export const cartStore = {
  get: read,
  add(id: string, qty = 1) {
    const items = read();
    const found = items.find((i) => i.id === id);
    if (found) found.qty += qty;
    else items.push({ id, qty });
    write(items);
  },
  setQty(id: string, qty: number) {
    let items = read();
    if (qty <= 0) items = items.filter((i) => i.id !== id);
    else items = items.map((i) => (i.id === id ? { ...i, qty } : i));
    write(items);
  },
  remove(id: string) {
    write(read().filter((i) => i.id !== id));
  },
  clear() {
    write([]);
  },
};

export const useCart = () => {
  const [items, setItems] = useState<CartItem[]>(read);
  useEffect(() => {
    const handler = () => setItems(read());
    window.addEventListener(EVT, handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener(EVT, handler);
      window.removeEventListener("storage", handler);
    };
  }, []);
  return items;
};

export type DetailedCartItem = CartItem & { item: MenuItem };
export const enrichCart = (items: CartItem[]): DetailedCartItem[] => {
  const products = productsStore.all();
  return items
    .map((c) => {
      const item = products.find((m) => m.id === c.id);
      return item ? { ...c, item } : null;
    })
    .filter(Boolean) as DetailedCartItem[];
};

export const cartCount = (items: CartItem[]) => items.reduce((s, i) => s + i.qty, 0);
export const cartTotal = (items: DetailedCartItem[]) =>
  items.reduce((s, i) => s + i.qty * i.item.price, 0);
