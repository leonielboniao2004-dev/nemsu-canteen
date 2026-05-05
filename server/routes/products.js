import { Router } from "express";
import Product from "../models/Product.js";
import { verifyToken, requireRole } from "../middleware/auth.js";

const router = Router();

// ── GET /api/products ─────────────────────────────────────────────────────────
// Public — supports ?category=Meals&sort=price&q=rice
router.get("/", async (req, res) => {
  try {
    const { category, sort, q, status } = req.query;
    const filter = {};

    if (category && category !== "All") filter.category = category;
    if (status === "Low Stock") {
      // We'll filter in JS after fetching since isLowStock is virtual
    } else if (status === "Available") {
      filter.stock = { $gte: 1 };
    }
    if (q) {
      filter.$or = [
        { name: { $regex: q, $options: "i" } },
        { description: { $regex: q, $options: "i" } },
      ];
    }

    let sortObj = { name: 1 };
    if (sort === "price-asc") sortObj = { price: 1 };
    if (sort === "price-desc") sortObj = { price: -1 };

    let products = await Product.find(filter).sort(sortObj).lean({ virtuals: true });

    // Apply low stock filter in JS (virtual)
    if (status === "Low Stock") {
      products = products.filter((p) => p.stock < (p.lowStockThreshold ?? 5));
    }

    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/products/:id ─────────────────────────────────────────────────────
router.get("/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ error: "Product not found." });
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/products ────────────────────────────────────────────────────────
// Vendor only
router.post("/", verifyToken, requireRole("vendor"), async (req, res) => {
  try {
    const product = await Product.create(req.body);
    res.status(201).json(product);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ── PATCH /api/products/:id ───────────────────────────────────────────────────
router.patch("/:id", verifyToken, requireRole("vendor"), async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!product) return res.status(404).json({ error: "Product not found." });
    res.json(product);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ── DELETE /api/products/:id ──────────────────────────────────────────────────
router.delete("/:id", verifyToken, requireRole("vendor"), async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ error: "Product not found." });
    res.json({ message: "Product deleted." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
