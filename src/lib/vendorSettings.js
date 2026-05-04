import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const VENDOR_SETTINGS_EVT = "canteen:vendor-settings-changed";
export const defaultVendorSettings = {
  canteenName: "School Canteen",
  contactEmail: "canteen@school.edu",
  phone: "",
  hoursOpen: "07:00",
  hoursClose: "16:00",
  acceptingOrders: true,
  notifyNewOrder: true,
  notifyLowStock: true,
};

let _cache = defaultVendorSettings;
let _initialized = false;

const fromRow = (r) => ({
  canteenName: r.canteen_name, contactEmail: r.contact_email, phone: r.phone,
  hoursOpen: r.hours_open, hoursClose: r.hours_close,
  acceptingOrders: r.accepting_orders, notifyNewOrder: r.notify_new_order, notifyLowStock: r.notify_low_stock,
});

const fire = () => { if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent(VENDOR_SETTINGS_EVT)); };

const load = async () => {
  const { data } = await supabase.from("vendor_settings").select("*").eq("id", 1).maybeSingle();
  if (data) { _cache = fromRow(data); fire(); }
};

export const initVendorSettings = () => {
  if (_initialized || typeof window === "undefined") return;
  _initialized = true;
  load();
  supabase.channel("vendor-settings-rt")
    .on("postgres_changes", { event: "*", schema: "public", table: "vendor_settings" }, () => load())
    .subscribe();
};

export const readVendorSettings = () => _cache;
export const writeVendorSettings = async (s) => {
  await supabase.from("vendor_settings").update({
    canteen_name: s.canteenName, contact_email: s.contactEmail, phone: s.phone,
    hours_open: s.hoursOpen, hours_close: s.hoursClose,
    accepting_orders: s.acceptingOrders, notify_new_order: s.notifyNewOrder, notify_low_stock: s.notifyLowStock,
  }).eq("id", 1);
  _cache = s; fire();
};

export const useVendorSettings = () => {
  const [s, setS] = useState(_cache);
  useEffect(() => {
    const h = () => setS({ ..._cache });
    window.addEventListener(VENDOR_SETTINGS_EVT, h);
    return () => window.removeEventListener(VENDOR_SETTINGS_EVT, h);
  }, []);
  return s;
};
