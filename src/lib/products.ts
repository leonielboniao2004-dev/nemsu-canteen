import { useEffect, useState } from "react";
import { MENU, MenuItem, Category } from "./menu";

export type Product = MenuItem & {
  sku: string;
  stock: number;
  lowStockThreshold: number;
};

const KEY = "canteen.products";
const EVT = "canteen:products-changed";
const LOW_STOCK_DEFAULT = 6;

const seed = (): Product[] =>
  MENU.map((m, i) => ({
    ...m,
    sku: `PRD-${String(32 - i).padStart(5, "0")}`,
    stock: ((i * 7) % 18) + 4,
    lowStockThreshold: LOW_STOCK_DEFAULT,
  }));

const read = (): Product[] => {
  if (typeof window === "undefined") return seed();
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) {
      const s = seed();
      window.localStorage.setItem(KEY, JSON.stringify(s));
      return s;
    }
    return JSON.parse(raw) as Product[];
  } catch {
    return seed();
  }
};

const write = (items: Product[]) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(items));
  window.dispatchEvent(new CustomEvent(EVT));
};

const newId = () => "p" + Math.random().toString(36).slice(2, 8);

export const productsStore = {
  all: read,
  get(id: string) {
    return read().find((p) => p.id === id);
  },
  add(input: { name: string; description: string; price: number; category: Category; emoji: string; stock: number; available?: boolean }) {
    const items = read();
    const sku = `PRD-${String(items.length + 33).padStart(5, "0")}`;
    const p: Product = {
      id: newId(),
      sku,
      name: input.name,
      description: input.description,
      price: input.price,
      category: input.category,
      emoji: input.emoji || "🍽️",
      available: input.available ?? true,
      stock: input.stock,
      lowStockThreshold: LOW_STOCK_DEFAULT,
    };
    write([p, ...items]);
    return p;
  },
  update(id: string, patch: Partial<Product>) {
    write(read().map((p) => (p.id === id ? { ...p, ...patch } : p)));
  },
  remove(id: string) {
    write(read().filter((p) => p.id !== id));
  },
  toggleAvailable(id: string) {
    const cur = read().find((p) => p.id === id);
    if (!cur) return;
    productsStore.update(id, { available: !cur.available });
  },
  decrementStock(id: string, qty: number) {
    const items = read();
    const next = items.map((p) =>
      p.id === id ? { ...p, stock: Math.max(0, p.stock - qty) } : p
    );
    write(next);
    return next.find((p) => p.id === id);
  },
  restock(id: string, qty: number) {
    const items = read().map((p) => (p.id === id ? { ...p, stock: p.stock + qty } : p));
    write(items);
  },
  isLow(p: Product) {
    return p.stock <= p.lowStockThreshold;
  },
};

export const useProducts = () => {
  const [items, setItems] = useState<Product[]>(read);
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
