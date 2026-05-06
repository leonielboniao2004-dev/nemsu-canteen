import { useState, useEffect } from "react";
import { Bell, Mail, CheckCircle2, Megaphone, AlertTriangle, Info, ShieldCheck } from "lucide-react";
import api from "@/api/index";

const NOTIFICATIONS_CHANGED_EVENT = "canteen:notifications-changed";

const notifyNotificationsChanged = () => {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(NOTIFICATIONS_CHANGED_EVENT));
  }
};

export const ICONS = {
  Bell,
  Mail,
  CheckCircle2,
  Megaphone,
  AlertTriangle,
  Info,
  ShieldCheck,
};

export const TYPE_ICON_BG = {
  Announcement: "bg-primary/10 text-primary",
  Alert: "bg-[hsl(var(--warning))]/10 text-[hsl(var(--warning))]",
  Info: "bg-[hsl(var(--success))]/10 text-[hsl(var(--success))]",
  System: "bg-muted text-muted-foreground",
};

export const timeAgo = (date) => {
  if (!date) return "";
  const now = new Date();
  const then = new Date(date);
  const seconds = Math.floor((now - then) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return then.toLocaleDateString();
};

export const notificationsStore = {
  async markRead(id) {
    try {
      await api.patch(`/api/notifications/${id}/read`);
      notifyNotificationsChanged();
    } catch (err) {
      console.error("Failed to mark notification as read", err);
      throw err;
    }
  },
  async markAllReadFor() {
    try {
      await api.patch("/api/notifications/read-all");
      notifyNotificationsChanged();
    } catch (err) {
      console.error("Failed to mark all read", err);
      throw err;
    }
  }
};

export const useNotifications = (audience, key) => {
  const [notifications, setNotifications] = useState([]);

  const fetchNotifs = async () => {
    try {
      const { data } = await api.get("/api/notifications");
      setNotifications(data);
    } catch (err) {
      console.error("Failed to fetch notifications", err);
    }
  };

  useEffect(() => {
    fetchNotifs();
    window.addEventListener(NOTIFICATIONS_CHANGED_EVENT, fetchNotifs);
    const interval = setInterval(fetchNotifs, 15000); // Poll every 15s
    return () => {
      clearInterval(interval);
      window.removeEventListener(NOTIFICATIONS_CHANGED_EVENT, fetchNotifs);
    };
  }, [audience, key]);

  return notifications;
};
