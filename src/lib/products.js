import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const EVT = "canteen:products-changed";
let _cache = [];
let _initialized = false;

const fromRow = (r) => ({
  id: r.id,
  sku: r.sku,
  name: r.name,
  description: r.description || "",
  price: Number(r.price),
  category: r.category,
  emoji: r.emoji,
  available: r.available,
  stock: r.stock,
  lowStockThreshold: r.low_stock_threshold,
});

const fire = () => { if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent(EVT)); };

const loadAll = async () => {
  const { data } = await supabase.from("products").select("*").order("created_at", { ascending: false });
  _cache = (data || []).map(fromRow);
  fire();
};

export const initProducts = () => {
  if (_initialized || typeof window === "undefined") return;
  _initialized = true;
  loadAll();
  supabase.channel("products-rt")
    .on("postgres_changes", { event: "*", schema: "public", table: "products" }, () => loadAll())
    .subscribe();
};

export const productsStore = {
  all: () => _cache,
  get: (id) => _cache.find((p) => p.id === id),
  async add(input) {
    const sku = `PRD-${String(Date.now()).slice(-5)}`;
    const { data } = await supabase.from("products").insert({
      sku, name: input.name, description: input.description, price: input.price,
      category: input.category, emoji: input.emoji || "🍽️", stock: input.stock,
      available: input.available ?? true,
    }).select().single();
    if (data) { _cache = [fromRow(data), ..._cache]; fire(); }
    return data ? fromRow(data) : null;
  },
  async update(id, patch) {
    const dbPatch = {};
    if ("name" in patch) dbPatch.name = patch.name;
    if ("description" in patch) dbPatch.description = patch.description;
    if ("price" in patch) dbPatch.price = patch.price;
    if ("category" in patch) dbPatch.category = patch.category;
    if ("emoji" in patch) dbPatch.emoji = patch.emoji;
    if ("available" in patch) dbPatch.available = patch.available;
    if ("stock" in patch) dbPatch.stock = patch.stock;
    if ("lowStockThreshold" in patch) dbPatch.low_stock_threshold = patch.lowStockThreshold;
    await supabase.from("products").update(dbPatch).eq("id", id);
  },
  async remove(id) { await supabase.from("products").delete().eq("id", id); },
  async toggleAvailable(id) {
    const cur = _cache.find((p) => p.id === id);
    if (!cur) return;
    await this.update(id, { available: !cur.available });
  },
  async decrementStock(id, qty) {
    const cur = _cache.find((p) => p.id === id);
    if (!cur) return null;
    const next = Math.max(0, cur.stock - qty);
    await supabase.from("products").update({ stock: next }).eq("id", id);
    return { ...cur, stock: next };
  },
  async restock(id, qty) {
    const cur = _cache.find((p) => p.id === id);
    if (!cur) return;
    await supabase.from("products").update({ stock: cur.stock + qty }).eq("id", id);
  },
  isLow: (p) => p.stock <= p.lowStockThreshold,
};

export const useProducts = () => {
  const [items, setItems] = useState(_cache);
  useEffect(() => {
    const h = () => setItems([..._cache]);
    window.addEventListener(EVT, h);
    return () => window.removeEventListener(EVT, h);
  }, []);
  return items;
};
