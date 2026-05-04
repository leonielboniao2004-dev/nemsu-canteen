import { useEffect, useState } from "react";
export const VENDOR_SETTINGS_KEY = "canteen.vendor.settings";
export const VENDOR_SETTINGS_EVT = "canteen:vendor-settings-changed";
export const defaultVendorSettings = {
    canteenName: "School Canteen",
    contactEmail: "canteen@school.edu",
    phone: "0917 555 0101",
    hoursOpen: "07:00",
    hoursClose: "16:00",
    acceptingOrders: true,
    notifyNewOrder: true,
    notifyLowStock: true,
};
export const readVendorSettings = () => {
    if (typeof window === "undefined")
        return defaultVendorSettings;
    try {
        const raw = window.localStorage.getItem(VENDOR_SETTINGS_KEY);
        return raw ? { ...defaultVendorSettings, ...JSON.parse(raw) } : defaultVendorSettings;
    }
    catch {
        return defaultVendorSettings;
    }
};
export const writeVendorSettings = (s) => {
    if (typeof window === "undefined")
        return;
    window.localStorage.setItem(VENDOR_SETTINGS_KEY, JSON.stringify(s));
    window.dispatchEvent(new CustomEvent(VENDOR_SETTINGS_EVT));
};
export const useVendorSettings = () => {
    const [s, setS] = useState(readVendorSettings);
    useEffect(() => {
        const handler = () => setS(readVendorSettings());
        window.addEventListener(VENDOR_SETTINGS_EVT, handler);
        window.addEventListener("storage", handler);
        return () => {
            window.removeEventListener(VENDOR_SETTINGS_EVT, handler);
            window.removeEventListener("storage", handler);
        };
    }, []);
    return s;
};
