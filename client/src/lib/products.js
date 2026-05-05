import { useState, useEffect } from "react";
import api from "@/api/index";

export const productsStore = {
  all: () => [], // Fallback
  get: async (id) => {
    const { data } = await api.get(`/api/products/${id}`);
    return data;
  },
  isLow: (p) => p.isLowStock || p.stock < 5,
  add: async (p) => {
    const { data } = await api.post("/api/products", p);
    return data;
  },
  update: async (id, patch) => {
    const { data } = await api.patch(`/api/products/${id}`, patch);
    return data;
  },
  remove: async (id) => {
    await api.delete(`/api/products/${id}`);
  },
  restock: async (id, qty) => {
    const { data } = await api.get(`/api/products/${id}`);
    await api.patch(`/api/products/${id}`, { stock: data.stock + qty });
  },
  toggleAvailable: async (id) => {
    const { data } = await api.get(`/api/products/${id}`);
    await api.patch(`/api/products/${id}`, { available: !data.available });
  }
};

export const useProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchProducts = async () => {
    try {
      const { data } = await api.get("/api/products");
      setProducts(data);
    } catch (err) {
      console.error("Failed to fetch products", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  return { products, loading, refetch: fetchProducts };
};
