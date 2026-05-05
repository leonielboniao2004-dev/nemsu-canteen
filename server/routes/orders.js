import { Router } from "express";
import Order from "../models/Order.js";
import Product from "../models/Product.js";
import Notification from "../models/Notification.js";
import { verifyToken, requireRole } from "../middleware/auth.js";

const router = Router();

// All order routes require login
router.use(verifyToken);

// ── GET /api/orders ───────────────────────────────────────────────────────────
// Vendor: all orders. Student/Teacher: own orders only.
router.get("/", async (req, res) => {
  try {
    const { status, sort = "-createdAt" } = req.query;
    const filter = {};

    if (req.user.role !== "vendor") {
      filter.studentEmail = req.user.email;
    }
    if (status && status !== "All") filter.status = status;

    const orders = await Order.find(filter).sort(sort);
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/orders ──────────────────────────────────────────────────────────
// Student / Teacher creates a new order
router.post("/", requireRole("student", "teacher"), async (req, res) => {
  try {
    const { items, pickupTime, notes } = req.body;

    if (!items || !items.length) {
      return res.status(400).json({ error: "Order must contain at least one item." });
    }

    // Build lines and verify products exist
    const lines = [];
    let total = 0;

    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product) {
        return res.status(404).json({ error: `Product ${item.productId} not found.` });
      }
      if (product.stock < item.qty) {
        return res.status(400).json({ error: `Not enough stock for ${product.name}.` });
      }
      lines.push({
        productId: product._id,
        name: product.name,
        emoji: product.emoji,
        price: product.price,
        qty: item.qty,
      });
      total += product.price * item.qty;

      // Decrement stock
      product.stock -= item.qty;
      await product.save();

      // Low-stock alert
      if (product.stock <= product.lowStockThreshold) {
        await Notification.create({
          audience: "vendor",
          type: "Alert",
          iconName: "AlertTriangle",
          title: product.stock === 0 ? "Out of stock" : "Low stock alert",
          body: `${product.name} is ${product.stock === 0 ? "out of stock" : `low (${product.stock} left)`}.`,
        });
      }
    }

    const order = await Order.create({
      studentEmail: req.user.email,
      studentName: req.user.name,
      studentId: req.body.studentId || "",
      studentRole: req.user.role,
      lines,
      total,
      pickupTime: pickupTime || "ASAP",
      notes: notes || "",
    });

    // Notify vendor of new order
    await Notification.create({
      audience: "vendor",
      type: "Pending",
      iconName: "ShoppingBag",
      title: `New order ${order.shortId}`,
      body: `${order.studentName} placed an order for ₱${total.toLocaleString("en-PH")} · pickup ${order.pickupTime}.`,
    });

    // Confirm to customer
    await Notification.create({
      audience: "customer",
      audienceKey: req.user.email,
      type: "Info",
      iconName: "ClipboardCheck",
      title: "Order received",
      body: `Your order ${order.shortId} is pending vendor confirmation.`,
    });

    res.status(201).json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── PATCH /api/orders/:id/status ──────────────────────────────────────────────
// Vendor updates order status
router.patch("/:id/status", requireRole("vendor"), async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ["Pending", "Preparing", "Ready", "Completed", "Cancelled"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: "Invalid status." });
    }

    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ error: "Order not found." });

    const prevStatus = order.status;
    order.status = status;
    await order.save();

    // Restock if cancelled
    if (status === "Cancelled" && prevStatus !== "Cancelled") {
      for (const line of order.lines) {
        await Product.findByIdAndUpdate(line.productId, { $inc: { stock: line.qty } });
      }
    }

    // Notify customer
    const messages = {
      Pending: { title: "Order pending", body: `Your order ${order.shortId} is awaiting confirmation.`, icon: "CalendarCheck", type: "Pending" },
      Preparing: { title: "Order accepted", body: `Your order ${order.shortId} is now being prepared!`, icon: "ChefHat", type: "Info" },
      Ready: { title: "Ready for pickup! 🎉", body: `Your order ${order.shortId} is ready at the canteen.`, icon: "CheckCircle2", type: "Success" },
      Completed: { title: "Order completed", body: `Thanks! Your order ${order.shortId} has been served.`, icon: "CheckCircle2", type: "Info" },
      Cancelled: { title: "Order cancelled", body: `Your order ${order.shortId} was cancelled.`, icon: "XCircle", type: "Alert" },
    };

    const m = messages[status];
    await Notification.create({
      audience: "customer",
      audienceKey: order.studentEmail,
      type: m.type,
      iconName: m.icon,
      title: m.title,
      body: m.body,
    });

    res.json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
