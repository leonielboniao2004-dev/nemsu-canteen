import { useEffect, useState } from "react";
import { productsStore } from "./products";
import { getSession } from "./auth";
const EVT = "canteen:cart-changed";
const keyFor = () => {
    const s = getSession();
    if (s && (s.role === "student" || s.role === "teacher")) {
        return `canteen.cart:${s.role}:${s.email.toLowerCase()}`;
    }
    return "canteen.cart:guest";
};
const read = () => {
    if (typeof window === "undefined")
        return [];
    try {
        const raw = window.localStorage.getItem(keyFor());
        return raw ? JSON.parse(raw) : [];
    }
    catch {
        return [];
    }
};
const write = (items) => {
    if (typeof window === "undefined")
        return;
    window.localStorage.setItem(keyFor(), JSON.stringify(items));
    window.dispatchEvent(new CustomEvent(EVT));
};
export const cartStore = {
    get: read,
    add(id, qty = 1) {
        const items = read();
        const found = items.find((i) => i.id === id);
        if (found)
            found.qty += qty;
        else
            items.push({ id, qty });
        write(items);
    },
    setQty(id, qty) {
        let items = read();
        if (qty <= 0)
            items = items.filter((i) => i.id !== id);
        else
            items = items.map((i) => (i.id === id ? { ...i, qty } : i));
        write(items);
    },
    remove(id) {
        write(read().filter((i) => i.id !== id));
    },
    clear() {
        write([]);
    },
};
export const useCart = () => {
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
export const enrichCart = (items) => {
    const products = productsStore.all();
    return items
        .map((c) => {
        const item = products.find((m) => m.id === c.id);
        return item ? { ...c, item } : null;
    })
        .filter(Boolean);
};
export const cartCount = (items) => items.reduce((s, i) => s + i.qty, 0);
export const cartTotal = (items) => items.reduce((s, i) => s + i.qty * i.item.price, 0);
