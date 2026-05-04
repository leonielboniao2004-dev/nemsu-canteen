import { useMemo, useState } from "react";
import { Link, useNavigate } from "@/lib/router-compat";
import { Minus, Plus, Trash2, ShoppingBag, Clock } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cartStore, cartTotal, enrichCart, useCart } from "@/lib/cart";
import { peso } from "@/lib/menu";
import { ordersStore } from "@/lib/orders";
import { getSession } from "@/lib/auth";
import { toast } from "sonner";

const PICKUPS = ["10:00 AM", "10:30 AM", "12:00 PM", "12:30 PM", "1:00 PM", "3:00 PM"];

const Cart = () => {
  const cart = useCart();
  const detailed = useMemo(() => enrichCart(cart), [cart]);
  const total = cartTotal(detailed);
  const [pickup, setPickup] = useState(PICKUPS[2]);
  const [notes, setNotes] = useState("");
  const [placing, setPlacing] = useState(false);
  const navigate = useNavigate();

  const placeOrder = async () => {
    const session = getSession();
    if (!session || session.role !== "student" && session.role !== "teacher") {
      toast.error("Please sign in as a student");
      return;
    }
    if (detailed.length === 0) return;
    setPlacing(true);
    await new Promise((r) => setTimeout(r, 500));
    const order = ordersStore.create({
      studentEmail: session.email,
      studentName: session.name,
      studentId: session.studentId,
      studentRole: session.role,
      items: detailed,
      pickupTime: pickup,
      notes: notes.trim() || undefined,
    });
    cartStore.clear();
    setPlacing(false);
    toast.success("Order placed!", { description: `Reference ${order.id} · pickup at ${order.pickupTime}` });
    navigate("/orders");
  };

  return (
    <AppShell title="Your Cart" subtitle="Review and confirm your pre-order">
      {detailed.length === 0 ? (
        <div className="bg-card rounded-2xl p-12 text-center" style={{ boxShadow: "var(--shadow-card)" }}>
          <ShoppingBag className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
          <h2 className="text-lg font-semibold">Your cart is empty</h2>
          <p className="text-sm text-muted-foreground mt-1">Browse the menu to add some delicious items.</p>
          <Button asChild className="mt-5"><Link to="/menu">Browse menu</Link></Button>
        </div>
      ) : (
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-card rounded-2xl p-2 sm:p-4" style={{ boxShadow: "var(--shadow-card)" }}>
            <ul className="divide-y divide-border">
              {detailed.map((line) => (
                <li key={line.id} className="flex items-center gap-3 sm:gap-4 p-3">
                  <div className="h-14 w-14 rounded-xl bg-accent flex items-center justify-center text-2xl shrink-0">{line.item.emoji}</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">{line.item.name}</p>
                    <p className="text-xs text-muted-foreground">{peso(line.item.price)} each</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => cartStore.setQty(line.id, line.qty - 1)}>
                      <Minus className="h-3.5 w-3.5" />
                    </Button>
                    <span className="w-8 text-center font-semibold">{line.qty}</span>
                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => cartStore.setQty(line.id, line.qty + 1)}>
                      <Plus className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <p className="font-bold w-20 text-right text-sm sm:text-base">{peso(line.qty * line.item.price)}</p>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => cartStore.remove(line.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-card rounded-2xl p-6 h-fit sticky top-24" style={{ boxShadow: "var(--shadow-card)" }}>
            <h3 className="font-bold mb-4">Order Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Items</span>
                <span>{detailed.reduce((s, l) => s + l.qty, 0)}</span>
              </div>
              <div className="flex justify-between font-bold text-base border-t border-border pt-3 mt-3">
                <span>Total</span>
                <span className="text-primary">{peso(total)}</span>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              <div>
                <Label className="text-xs flex items-center gap-1.5"><Clock className="h-3 w-3" /> Pickup time</Label>
                <div className="grid grid-cols-3 gap-1.5 mt-1.5">
                  {PICKUPS.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPickup(p)}
                      className={`text-xs py-2 rounded-lg border transition-colors ${
                        pickup === p ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border hover:bg-secondary"
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <Label htmlFor="notes" className="text-xs">Notes (optional)</Label>
                <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="No onions, extra sauce..." className="mt-1.5 min-h-[60px] text-sm" />
              </div>
            </div>

            <Button className="w-full mt-5 h-11" onClick={placeOrder} disabled={placing}>
              {placing ? "Placing..." : `Place Order · ${peso(total)}`}
            </Button>
            <p className="text-[11px] text-muted-foreground text-center mt-2">Pay at the counter on pickup.</p>
          </div>
        </div>
      )}
    </AppShell>
  );
};

export default Cart;
