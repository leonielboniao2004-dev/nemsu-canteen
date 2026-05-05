import { useEffect, useState } from "react";
import { getSession } from "./auth";
import api from "@/api/index";

const EVT = "canteen:cart-changed";

// Cart still uses localStorage (client-side only — fine for cart state)
const keyFor = () => {
    const s = getSession();
    if (s && (s.role === "student" || s.role === "teacher")) {
        return `canteen.cart:${s.role}:${s.email.toLowerCase()}`;
    }
    return "canteen.cart:guest";
};
const read = () => {
    if (typeof window === "undefined") return [];
    try {
        const raw = window.localStorage.getItem(keyFor());
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
};
const write = (items) => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(keyFor(), JSON.stringify(items));
    window.dispatchEvent(new CustomEvent(EVT));
};

export const cartStore = {
    get: read,
    add(id, qty = 1) {
        const items = read();
        const found = items.find((i) => i.id === id);
        if (found) found.qty += qty;
        else items.push({ id, qty });
        write(items);
    },
    setQty(id, qty) {
        let items = read();
        if (qty <= 0) items = items.filter((i) => i.id !== id);
        else items = items.map((i) => (i.id === id ? { ...i, qty } : i));
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

// Enriched cart — fetches products from API
export const useEnrichedCart = () => {
    const cart = useCart();
    const [enriched, setEnriched] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!cart.length) { setEnriched([]); return; }
        setLoading(true);
        api.get("/api/products").then(({ data }) => {
            const result = cart.map((c) => {
                const item = data.find((p) => p._id === c.id || p.id === c.id);
                return item ? { ...c, item } : null;
            }).filter(Boolean);
            setEnriched(result);
        }).catch(() => setEnriched([])).finally(() => setLoading(false));
    }, [cart]);

    return { enriched, loading };
};

// Sync fallback for Cart page (uses the hook above instead)
export const enrichCart = (items) => items; // kept for compat, used via useEnrichedCart
export const cartCount = (items) => items.reduce((s, i) => s + i.qty, 0);
export const cartTotal = (items) => items.reduce((s, i) => s + i.qty * (i.item?.price ?? 0), 0);
