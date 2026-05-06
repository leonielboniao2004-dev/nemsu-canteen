import { useState, useEffect } from "react";
import api from "@/api/index";

const PRODUCTS_CHANGED_EVENT = "canteen:products-changed";

const notifyProductsChanged = () => {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(PRODUCTS_CHANGED_EVENT));
  }
};

const normalizeProduct = (product) => {
  const id = product.id || product._id;
  return {
    ...product,
    id,
    sku: product.sku || (id ? id.slice(-6).toUpperCase() : ""),
  };
};

export const productsStore = {
  all: () => [], // Fallback
  get: async (id) => {
    const { data } = await api.get(`/api/products/${id}`);
    return normalizeProduct(data);
  },
  isLow: (p) => p.isLowStock || p.stock < 5,
  add: async (p) => {
    const { data } = await api.post("/api/products", p);
    notifyProductsChanged();
    return normalizeProduct(data);
  },
  update: async (id, patch) => {
    const { data } = await api.patch(`/api/products/${id}`, patch);
    notifyProductsChanged();
    return normalizeProduct(data);
  },
  remove: async (id) => {
    await api.delete(`/api/products/${id}`);
    notifyProductsChanged();
  },
  restock: async (id, qty) => {
    const { data } = await api.get(`/api/products/${id}`);
    const response = await api.patch(`/api/products/${id}`, { stock: data.stock + qty });
    notifyProductsChanged();
    return normalizeProduct(response.data);
  },
  toggleAvailable: async (id) => {
    const { data } = await api.get(`/api/products/${id}`);
    const response = await api.patch(`/api/products/${id}`, { available: !data.available });
    notifyProductsChanged();
    return normalizeProduct(response.data);
  }
};

export const useProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchProducts = async () => {
    try {
      const { data } = await api.get("/api/products");
      setProducts(data.map(normalizeProduct));
    } catch (err) {
      console.error("Failed to fetch products", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
    window.addEventListener(PRODUCTS_CHANGED_EVENT, fetchProducts);
    return () => window.removeEventListener(PRODUCTS_CHANGED_EVENT, fetchProducts);
  }, []);

  return { products, loading, refetch: fetchProducts };
};
