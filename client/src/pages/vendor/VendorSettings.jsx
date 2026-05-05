import { useState } from "react";
import { Save, Megaphone, Send } from "lucide-react";
import { VendorShell } from "@/components/VendorShell";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { notificationsStore } from "@/lib/notifications";
import { useOrders } from "@/lib/orders";
import { readVendorSettings, writeVendorSettings, } from "@/lib/vendorSettings";
const VendorSettings = () => {
    const [s, setS] = useState(readVendorSettings);
    const [announceTitle, setAnnounceTitle] = useState("");
    const [announceBody, setAnnounceBody] = useState("");
    const { orders = [] } = useOrders();
    const save = () => {
        writeVendorSettings(s);
        toast.success("Settings saved");
    };
    const sendAnnouncement = () => {
        if (!announceTitle.trim() || !announceBody.trim()) {
            toast.error("Please add a title and message");
            return;
        }
        const recipients = new Set(orders.map((o) => o.studentEmail));
        // Always broadcast — even if no orders exist yet, send vendor-wide too.
        for (const email of recipients) {
            notificationsStore.push({
                audience: "customer",
                audienceKey: email,
                type: "Announcement",
                iconName: "Megaphone",
                title: announceTitle.trim(),
                body: announceBody.trim(),
            });
        }
        notificationsStore.push({
            audience: "vendor",
            type: "Announcement",
            iconName: "Megaphone",
            title: announceTitle.trim(),
            body: announceBody.trim(),
        });
        toast.success(recipients.size === 0
            ? "Announcement saved"
            : `Sent to ${recipients.size} customer${recipients.size === 1 ? "" : "s"}`);
        setAnnounceTitle("");
        setAnnounceBody("");
    };
    return (<VendorShell title="Settings" subtitle="Vendor information, operating hours, and preferences.">
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Canteen info */}
        <section className="bg-card border border-border rounded-2xl p-6 space-y-4">
          <h3 className="font-bold">Canteen Information</h3>
          <div>
            <Label className="text-xs">Canteen / Vendor name</Label>
            <Input value={s.canteenName} onChange={(e) => setS({ ...s, canteenName: e.target.value })} className="h-11"/>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Contact email</Label>
              <Input value={s.contactEmail} onChange={(e) => setS({ ...s, contactEmail: e.target.value })} className="h-11"/>
            </div>
            <div>
              <Label className="text-xs">Phone</Label>
              <Input value={s.phone} onChange={(e) => setS({ ...s, phone: e.target.value })} className="h-11"/>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Opens</Label>
              <Input type="time" value={s.hoursOpen} onChange={(e) => setS({ ...s, hoursOpen: e.target.value })} className="h-11"/>
            </div>
            <div>
              <Label className="text-xs">Closes</Label>
              <Input type="time" value={s.hoursClose} onChange={(e) => setS({ ...s, hoursClose: e.target.value })} className="h-11"/>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-border">
            <div>
              <p className="font-semibold text-sm">Accepting new orders</p>
              <p className="text-xs text-muted-foreground">Pause if you need to stop receiving orders.</p>
            </div>
            <Switch checked={s.acceptingOrders} onCheckedChange={(v) => setS({ ...s, acceptingOrders: v })}/>
          </div>

          <Button onClick={save} className="gap-2 w-full"><Save className="h-4 w-4"/> Save changes</Button>
        </section>

        {/* Notifications + Announcements */}
        <section className="space-y-6">
          <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
            <h3 className="font-bold">Notification Preferences</h3>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-sm">New order alerts</p>
                <p className="text-xs text-muted-foreground">Get notified when a customer places an order.</p>
              </div>
              <Switch checked={s.notifyNewOrder} onCheckedChange={(v) => setS({ ...s, notifyNewOrder: v })}/>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-sm">Low stock alerts</p>
                <p className="text-xs text-muted-foreground">Be warned when an item runs low.</p>
              </div>
              <Switch checked={s.notifyLowStock} onCheckedChange={(v) => setS({ ...s, notifyLowStock: v })}/>
            </div>
            <Button variant="outline" onClick={save} className="gap-2 w-full"><Save className="h-4 w-4"/> Save preferences</Button>
          </div>

          <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Megaphone className="h-4 w-4 text-primary"/>
              <h3 className="font-bold">Send Announcement</h3>
            </div>
            <p className="text-xs text-muted-foreground">Broadcast a message to every customer who has ordered with you.</p>
            <div>
              <Label className="text-xs">Title</Label>
              <Input value={announceTitle} onChange={(e) => setAnnounceTitle(e.target.value)} placeholder="e.g. Closed tomorrow" className="h-11"/>
            </div>
            <div>
              <Label className="text-xs">Message</Label>
              <Textarea value={announceBody} onChange={(e) => setAnnounceBody(e.target.value)} placeholder="Details for your customers…" className="min-h-[90px]"/>
            </div>
            <Button onClick={sendAnnouncement} className="gap-2 w-full"><Send className="h-4 w-4"/> Send announcement</Button>
          </div>
        </section>
      </div>
    </VendorShell>);
};
export default VendorSettings;
