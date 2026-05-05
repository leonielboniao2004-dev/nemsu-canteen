import { Router } from "express";
import User from "../models/User.js";
import { signToken, verifyToken } from "../middleware/auth.js";

const router = Router();

// ── POST /api/auth/signup ─────────────────────────────────────────────────────
router.post("/signup", async (req, res) => {
  try {
    const { name, email, password, role = "student", studentId, grade, section, phone } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: "Name, email and password are required." });
    }

    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists) {
      return res.status(409).json({ error: "An account with that email already exists." });
    }

    const user = await User.create({ name, email, password, role, studentId, grade, section, phone });
    const token = signToken({ id: user._id, email: user.email, role: user.role, name: user.name });

    res.status(201).json({ token, user: user.toSafeObject() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/auth/login ──────────────────────────────────────────────────────
router.post("/login", async (req, res) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required." });
    }

    // Build query — optionally filter by role (vendor login is separate)
    const query = { email: email.toLowerCase() };
    if (role) query.role = role;

    const user = await User.findOne(query);
    if (!user) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    const ok = await user.comparePassword(password);
    if (!ok) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    const token = signToken({ id: user._id, email: user.email, role: user.role, name: user.name });
    res.json({ token, user: user.toSafeObject() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/auth/vendor-login ───────────────────────────────────────────────
// Vendor logs in with a special vendor key + password
router.post("/vendor-login", async (req, res) => {
  try {
    const { vendorKey, password } = req.body;
    const VENDOR_KEY = process.env.VENDOR_KEY || "VENDOR-2026";

    if (vendorKey !== VENDOR_KEY) {
      return res.status(401).json({ error: "Invalid vendor key. Access denied." });
    }

    // Find (or auto-create) the single vendor account
    let vendor = await User.findOne({ role: "vendor" });
    if (!vendor) {
      vendor = await User.create({
        name: "Canteen Vendor",
        email: "vendor@canteen.local",
        password: password || "vendor123",
        role: "vendor",
      });
    } else if (password) {
      const ok = await vendor.comparePassword(password);
      if (!ok) return res.status(401).json({ error: "Incorrect vendor password." });
    }

    const token = signToken({ id: vendor._id, email: vendor.email, role: vendor.role, name: vendor.name });
    res.json({ token, user: vendor.toSafeObject() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/auth/me ──────────────────────────────────────────────────────────
router.get("/me", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) return res.status(404).json({ error: "User not found." });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── PATCH /api/auth/me ────────────────────────────────────────────────────────
router.patch("/me", verifyToken, async (req, res) => {
  try {
    const allowed = ["name", "phone", "grade", "section", "studentId", "avatar", "idCardImage", "password"];
    const updates = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: "User not found." });

    Object.assign(user, updates);
    await user.save(); // triggers pre-save hash if password changed
    res.json(user.toSafeObject());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
