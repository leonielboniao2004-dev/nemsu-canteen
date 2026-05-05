import { useEffect, useState, useCallback } from "react";
import api from "@/api/index";

// ── useOrders hook ────────────────────────────────────────────────────────────
export const useOrders = (filters = {}) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetch = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
      if (filters.status && filters.status !== "All") params.status = filters.status;

      const { data } = await api.get("/api/orders", { params });
      setOrders(data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to load orders.");
    } finally {
      setLoading(false);
    }
  }, [filters.status]);

  useEffect(() => { fetch(); }, [fetch]);

  return { orders, loading, error, refetch: fetch };
};

// ── Create order ──────────────────────────────────────────────────────────────
export const createOrder = async ({ items, pickupTime, notes, studentId }) => {
  const payload = {
    items: items.map((i) => ({ productId: i.item._id ?? i.item.id, qty: i.qty })),
    pickupTime,
    notes,
    studentId,
  };
  const { data } = await api.post("/api/orders", payload);
  return data;
};

// ── Update order status (vendor) ──────────────────────────────────────────────
export const updateOrderStatus = async (id, status) => {
  const { data } = await api.patch(`/api/orders/${id}/status`, { status });
  return data;
};

// ── Legacy ordersStore shim (for pages that still call ordersStore.setStatus) ─
export const ordersStore = {
  setStatus: updateOrderStatus,
  create: createOrder,
};
