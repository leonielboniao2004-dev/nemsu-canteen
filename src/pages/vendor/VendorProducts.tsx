import { useMemo, useState } from "react";
import { Plus, Search, Edit3, Trash2, Boxes, Eye, EyeOff } from "lucide-react";
import { VendorShell } from "@/components/VendorShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { useProducts, productsStore, type Product } from "@/lib/products";
import { peso, type Category } from "@/lib/menu";
import { toast } from "sonner";

const CATEGORIES: Category[] = ["Meals", "Snacks", "Drinks", "Desserts"];

type FormState = {
  name: string;
  description: string;
  price: string;
  category: Category;
  emoji: string;
  stock: string;
  available: boolean;
};

const empty: FormState = { name: "", description: "", price: "", category: "Meals", emoji: "🍽️", stock: "10", available: true };

const VendorProducts = () => {
  const products = useProducts();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<"All" | Category>("All");
  const [status, setStatus] = useState<"All" | "Available" | "Out" | "Low">("All");
  const [openForm, setOpenForm] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState<FormState>(empty);
  const [restock, setRestock] = useState<{ p: Product; qty: string } | null>(null);

  const filtered = useMemo(() => {
    let list = products;
    if (cat !== "All") list = list.filter((p) => p.category === cat);
    if (status === "Available") list = list.filter((p) => p.available && p.stock > 0);
    if (status === "Out") list = list.filter((p) => p.stock <= 0);
    if (status === "Low") list = list.filter((p) => productsStore.isLow(p) && p.stock > 0);
    if (q.trim()) list = list.filter((p) => (p.name + p.description + p.sku).toLowerCase().includes(q.toLowerCase()));
    return list;
  }, [products, cat, status, q]);

  const openAdd = () => { setEditing(null); setForm(empty); setOpenForm(true); };
  const openEdit = (p: Product) => {
    setEditing(p);
    setForm({
      name: p.name, description: p.description, price: String(p.price),
      category: p.category, emoji: p.emoji, stock: String(p.stock), available: p.available,
    });
    setOpenForm(true);
  };

  const submit = () => {
    if (!form.name.trim()) { toast.error("Name is required"); return; }
    const price = Number(form.price);
    const stock = Number(form.stock);
    if (!Number.isFinite(price) || price < 0) { toast.error("Enter a valid price"); return; }
    if (!Number.isFinite(stock) || stock < 0) { toast.error("Enter a valid stock"); return; }

    if (editing) {
      productsStore.update(editing.id, {
        name: form.name.trim(),
        description: form.description.trim(),
        price, category: form.category, emoji: form.emoji.trim() || "🍽️",
        stock, available: form.available,
      });
      toast.success("Product updated");
    } else {
      productsStore.add({
        name: form.name.trim(),
        description: form.description.trim(),
        price, category: form.category, emoji: form.emoji.trim() || "🍽️",
        stock, available: form.available,
      });
      toast.success("Product added");
    }
    setOpenForm(false);
  };

  const removeProduct = (p: Product) => {
    if (!confirm(`Delete ${p.name}?`)) return;
    productsStore.remove(p.id);
    toast.success("Product removed");
  };

  const doRestock = () => {
    if (!restock) return;
    const qty = Number(restock.qty);
    if (!Number.isFinite(qty) || qty <= 0) { toast.error("Enter a valid quantity"); return; }
    productsStore.restock(restock.p.id, qty);
    toast.success(`Added ${qty} to ${restock.p.name}`);
    setRestock(null);
  };

  return (
    <VendorShell
      title="Product Management"
      subtitle="Add, edit, restock, and toggle availability of menu items."
      toolbar={
        <Button onClick={openAdd} className="gap-2"><Plus className="h-4 w-4" /> Add Product</Button>
      }
    >
      {/* Filters */}
      <div className="bg-card border border-border rounded-2xl p-4 mb-6 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name, SKU…" className="pl-10 h-10" />
        </div>
        <Select value={cat} onValueChange={(v) => setCat(v as typeof cat)}>
          <SelectTrigger className="h-10 w-[150px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Categories</SelectItem>
            {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={(v) => setStatus(v as typeof status)}>
          <SelectTrigger className="h-10 w-[150px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Status</SelectItem>
            <SelectItem value="Available">Available</SelectItem>
            <SelectItem value="Low">Low Stock</SelectItem>
            <SelectItem value="Out">Out of Stock</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground border-b border-border bg-muted/40">
                <th className="px-5 py-3 font-semibold">SKU</th>
                <th className="px-5 py-3 font-semibold">Product</th>
                <th className="px-5 py-3 font-semibold">Category</th>
                <th className="px-5 py-3 font-semibold">Price</th>
                <th className="px-5 py-3 font-semibold">Stock</th>
                <th className="px-5 py-3 font-semibold">Status</th>
                <th className="px-5 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-muted-foreground">No products match your filters.</td></tr>
              ) : filtered.map((p) => {
                const out = p.stock <= 0;
                const low = productsStore.isLow(p) && !out;
                return (
                  <tr key={p.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                    <td className="px-5 py-4 text-xs font-medium text-muted-foreground whitespace-nowrap">{p.sku}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-xl bg-accent flex items-center justify-center text-2xl shrink-0">{p.emoji}</div>
                        <div className="min-w-0">
                          <p className="font-semibold leading-tight">{p.name}</p>
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1 max-w-[260px]">{p.description}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4"><Badge variant="secondary" className="rounded-md">{p.category}</Badge></td>
                    <td className="px-5 py-4 font-semibold whitespace-nowrap">{peso(p.price)}</td>
                    <td className="px-5 py-4 font-medium">{p.stock}</td>
                    <td className="px-5 py-4">
                      {!p.available ? (
                        <Badge className="bg-muted text-muted-foreground border-0 rounded-md">Hidden</Badge>
                      ) : out ? (
                        <Badge className="bg-destructive/10 text-destructive border-0 rounded-md">Out</Badge>
                      ) : low ? (
                        <Badge className="bg-[hsl(var(--warning))]/15 text-[hsl(var(--warning))] border-0 rounded-md">Low Stock</Badge>
                      ) : (
                        <Badge className="bg-[hsl(var(--success))]/15 text-[hsl(var(--success))] border-0 rounded-md">Available</Badge>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button size="sm" variant="outline" className="h-8 px-2 gap-1.5" onClick={() => setRestock({ p, qty: "10" })}>
                          <Boxes className="h-3.5 w-3.5" /> Restock
                        </Button>
                        <Button size="sm" variant="outline" className="h-8 w-8 p-0" onClick={() => productsStore.toggleAvailable(p.id)} aria-label={p.available ? "Hide" : "Show"}>
                          {p.available ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                        </Button>
                        <Button size="sm" variant="outline" className="h-8 w-8 p-0" onClick={() => openEdit(p)} aria-label="Edit"><Edit3 className="h-3.5 w-3.5" /></Button>
                        <Button size="sm" variant="outline" className="h-8 w-8 p-0 text-destructive hover:text-destructive" onClick={() => removeProduct(p)} aria-label="Delete"><Trash2 className="h-3.5 w-3.5" /></Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit dialog */}
      <Dialog open={openForm} onOpenChange={setOpenForm}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Product" : "Add Product"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-[80px_1fr] gap-3">
              <div>
                <Label className="text-xs">Emoji</Label>
                <Input value={form.emoji} onChange={(e) => setForm({ ...form, emoji: e.target.value })} className="h-11 text-2xl text-center" maxLength={4} />
              </div>
              <div>
                <Label className="text-xs">Name</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Chicken Burger" className="h-11" />
              </div>
            </div>
            <div>
              <Label className="text-xs">Description</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Short description" className="min-h-[70px]" />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="text-xs">Price (₱)</Label>
                <Input type="number" min={0} value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="h-11" />
              </div>
              <div>
                <Label className="text-xs">Stock</Label>
                <Input type="number" min={0} value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} className="h-11" />
              </div>
              <div>
                <Label className="text-xs">Category</Label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v as Category })}>
                  <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.available} onChange={(e) => setForm({ ...form, available: e.target.checked })} />
              Available for ordering
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenForm(false)}>Cancel</Button>
            <Button onClick={submit}>{editing ? "Save Changes" : "Add Product"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Restock dialog */}
      <Dialog open={!!restock} onOpenChange={(v) => !v && setRestock(null)}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Restock {restock?.p.name}</DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <p className="text-sm text-muted-foreground mb-3">Current stock: <span className="font-semibold text-foreground">{restock?.p.stock}</span></p>
            <Label className="text-xs">Add quantity</Label>
            <Input type="number" min={1} value={restock?.qty ?? ""} onChange={(e) => restock && setRestock({ ...restock, qty: e.target.value })} className="h-11" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRestock(null)}>Cancel</Button>
            <Button onClick={doRestock}>Add to Stock</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </VendorShell>
  );
};

export default VendorProducts;
