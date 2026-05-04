import { useEffect, useState } from "react";
import { MENU } from "./menu";
const KEY = "canteen.products";
const EVT = "canteen:products-changed";
const LOW_STOCK_DEFAULT = 6;
const seed = () => MENU.map((m, i) => ({
    ...m,
    sku: `PRD-${String(32 - i).padStart(5, "0")}`,
    stock: ((i * 7) % 18) + 4,
    lowStockThreshold: LOW_STOCK_DEFAULT,
}));
const read = () => {
    if (typeof window === "undefined")
        return seed();
    try {
        const raw = window.localStorage.getItem(KEY);
        if (!raw) {
            const s = seed();
            window.localStorage.setItem(KEY, JSON.stringify(s));
            return s;
        }
        return JSON.parse(raw);
    }
    catch {
        return seed();
    }
};
const write = (items) => {
    if (typeof window === "undefined")
        return;
    window.localStorage.setItem(KEY, JSON.stringify(items));
    window.dispatchEvent(new CustomEvent(EVT));
};
const newId = () => "p" + Math.random().toString(36).slice(2, 8);
export const productsStore = {
    all: read,
    get(id) {
        return read().find((p) => p.id === id);
    },
    add(input) {
        const items = read();
        const sku = `PRD-${String(items.length + 33).padStart(5, "0")}`;
        const p = {
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
    update(id, patch) {
        write(read().map((p) => (p.id === id ? { ...p, ...patch } : p)));
    },
    remove(id) {
        write(read().filter((p) => p.id !== id));
    },
    toggleAvailable(id) {
        const cur = read().find((p) => p.id === id);
        if (!cur)
            return;
        productsStore.update(id, { available: !cur.available });
    },
    decrementStock(id, qty) {
        const items = read();
        const next = items.map((p) => p.id === id ? { ...p, stock: Math.max(0, p.stock - qty) } : p);
        write(next);
        return next.find((p) => p.id === id);
    },
    restock(id, qty) {
        const items = read().map((p) => (p.id === id ? { ...p, stock: p.stock + qty } : p));
        write(items);
    },
    isLow(p) {
        return p.stock <= p.lowStockThreshold;
    },
};
export const useProducts = () => {
    const [items, setItems] = useState(read);
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
