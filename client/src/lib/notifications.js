import { useState, useEffect } from "react";
import { Bell, Mail, CheckCircle2, Megaphone, AlertTriangle, Info, ShieldCheck } from "lucide-react";
import api from "@/api/index";

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
    } catch (err) {
      console.error("Failed to mark notification as read", err);
    }
  },
  async markAllReadFor(audience, email) {
    try {
      // In a real app, this would be an API call. 
      // For now, we'll just log it as the API handles specific IDs.
      console.log(`Marking all read for ${audience} ${email}`);
    } catch (err) {
      console.error("Failed to mark all read", err);
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
    const interval = setInterval(fetchNotifs, 15000); // Poll every 15s
    return () => clearInterval(interval);
  }, [audience, key]);

  return notifications;
};
