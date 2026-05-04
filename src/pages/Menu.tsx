import { useMemo, useState } from "react";
import { Plus, Search, ShoppingCart } from "lucide-react";
import { Link } from "@/lib/router-compat";
import { StudentSidebarLayout } from "@/components/StudentSidebarLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { peso, Category } from "@/lib/menu";
import { cartStore, useCart, cartCount } from "@/lib/cart";
import { useProducts, productsStore, type Product } from "@/lib/products";
import { toast } from "sonner";

const CATEGORIES: ("All" | Category)[] = ["All", "Meals", "Snacks", "Drinks", "Desserts"];

const Menu = () => {
  const [cat, setCat] = useState<(typeof CATEGORIES)[number]>("All");
  const [q, setQ] = useState("");
  const cart = useCart();
  const count = cartCount(cart);
  const products = useProducts();

  const items = useMemo(() => {
    return products
      .filter((m) => m.available)
      .filter((m) => (cat === "All" ? true : m.category === cat))
      .filter((m) =>
        q.trim() ? (m.name + " " + m.description).toLowerCase().includes(q.toLowerCase()) : true
      );
  }, [products, cat, q]);

  const add = (m: Product) => {
    if (m.stock <= 0) {
      toast.error("Out of stock", { description: m.name });
      return;
    }
    cartStore.add(m.id, 1);
    toast.success("Added to cart", { description: m.name });
  };

  const toolbar = (
    <Button asChild variant="outline" size="sm" className="gap-2 relative">
      <Link to="/cart">
        <ShoppingCart className="h-4 w-4" /> Cart
        {count > 0 && (
          <span className="ml-1 h-5 min-w-5 px-1 rounded-full bg-primary text-primary-foreground text-[11px] font-bold flex items-center justify-center">
            {count}
          </span>
        )}
      </Link>
    </Button>
  );

  return (
    <StudentSidebarLayout title="Today's Menu" subtitle="Pre-order and skip the line" toolbar={toolbar}>
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search dishes..." className="pl-10 h-11" />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {CATEGORIES.map((c) => (
            <Button
              key={c}
              variant={cat === c ? "default" : "outline"}
              size="sm"
              className="rounded-full shrink-0"
              onClick={() => setCat(c)}
            >
              {c}
            </Button>
          ))}
        </div>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">No items match your search.</div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((m) => {
            const low = productsStore.isLow(m);
            const out = m.stock <= 0;
            return (
              <div key={m.id} className="bg-card rounded-2xl p-5 flex flex-col" style={{ boxShadow: "var(--shadow-card)" }}>
                <div className="flex items-start justify-between mb-3">
                  <div className="h-14 w-14 rounded-2xl bg-accent flex items-center justify-center text-3xl">
                    {m.emoji}
                  </div>
                  <Badge variant="secondary" className="rounded-full">{m.category}</Badge>
                </div>
                <h3 className="font-bold leading-tight">{m.name}</h3>
                <p className="text-sm text-muted-foreground mt-1 flex-1">{m.description}</p>
                <div className="flex items-center gap-2 mt-2">
                  {out ? (
                    <Badge className="bg-destructive/10 text-destructive border-0 rounded-md">Out of stock</Badge>
                  ) : low ? (
                    <Badge className="bg-[hsl(var(--warning))]/15 text-[hsl(var(--warning))] border-0 rounded-md">Low — {m.stock} left</Badge>
                  ) : (
                    <span className="text-xs text-muted-foreground">{m.stock} in stock</span>
                  )}
                </div>
                <div className="flex items-center justify-between mt-4">
                  <p className="text-lg font-bold text-primary">{peso(m.price)}</p>
                  <Button size="sm" onClick={() => add(m)} className="gap-1.5" disabled={out}>
                    <Plus className="h-4 w-4" /> Add
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </StudentSidebarLayout>
  );
};

export default Menu;
