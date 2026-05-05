import { Router } from "express";
import Notification from "../models/Notification.js";
import { verifyToken } from "../middleware/auth.js";

const router = Router();

router.use(verifyToken);

// ── GET /api/notifications ────────────────────────────────────────────────────
// Vendor: all vendor notifications. Customer: their own + general customer ones.
router.get("/", async (req, res) => {
  try {
    let filter;
    if (req.user.role === "vendor") {
      filter = { audience: "vendor" };
    } else {
      filter = {
        $or: [
          { audience: "customer", audienceKey: req.user.email },
          { audience: "customer", audienceKey: null },
        ],
      };
    }

    const notifications = await Notification.find(filter)
      .sort("-createdAt")
      .limit(50);

    res.json(notifications);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── PATCH /api/notifications/:id/read ────────────────────────────────────────
router.patch("/:id/read", async (req, res) => {
  try {
    const notif = await Notification.findByIdAndUpdate(
      req.params.id,
      { read: true },
      { new: true }
    );
    if (!notif) return res.status(404).json({ error: "Notification not found." });
    res.json(notif);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── PATCH /api/notifications/read-all ────────────────────────────────────────
router.patch("/read-all", async (req, res) => {
  try {
    const filter =
      req.user.role === "vendor"
        ? { audience: "vendor" }
        : { audience: "customer", audienceKey: req.user.email };

    await Notification.updateMany(filter, { read: true });
    res.json({ message: "All marked as read." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
