import { Router } from "express";
import { randomUUID } from "crypto";
import User from "../models/User.js";
import { signToken, verifyToken } from "../middleware/auth.js";

const router = Router();
const offlineUsers = new Map();

function toOfflineSafeUser(user) {
  const { password, ...safe } = user;
  return safe;
}

function ensureOfflineVendor(preferredPassword) {
  const email = "vendor@canteen.local";
  let vendor = offlineUsers.get(email);

  if (!vendor) {
    const now = new Date().toISOString();
    vendor = {
      id: "offline-vendor-1",
      name: "Canteen Vendor",
      email,
      password: preferredPassword || "vendor123",
      role: "vendor",
      studentId: "",
      grade: "",
      section: "",
      phone: "",
      avatar: "",
      idCardImage: "",
      createdAt: now,
      updatedAt: now,
    };
    offlineUsers.set(email, vendor);
  }

  return vendor;
}

function ensureOfflineUserFromToken(payload) {
  const email = String(payload?.email || "").toLowerCase();
  if (!email) return null;

  let user = offlineUsers.get(email);
  if (!user) {
    const now = new Date().toISOString();
    user = {
      id: String(payload.id || randomUUID()),
      name: payload.name || "User",
      email,
      password: "",
      role: payload.role || "student",
      studentId: "",
      grade: "",
      section: "",
      phone: "",
      avatar: "",
      idCardImage: "",
      createdAt: now,
      updatedAt: now,
    };
    offlineUsers.set(email, user);
  }

  return user;
}

router.post("/signup", async (req, res) => {
  try {
    const { name, email, password, role = "student", studentId, grade, section, phone } = req.body;
    const normalizedEmail = String(email || "").toLowerCase();

    if (!name || !email || !password) {
      return res.status(400).json({ error: "Name, email and password are required." });
    }

    if (req.dbUnavailable) {
      if (offlineUsers.has(normalizedEmail)) {
        return res.status(409).json({ error: "An account with that email already exists." });
      }

      const now = new Date().toISOString();
      const user = {
        id: randomUUID(),
        name,
        email: normalizedEmail,
        password,
        role,
        studentId: studentId || "",
        grade: grade || "",
        section: section || "",
        phone: phone || "",
        avatar: "",
        idCardImage: "",
        createdAt: now,
        updatedAt: now,
      };
      offlineUsers.set(user.email, user);

      const token = signToken({
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
      });
      return res.status(201).json({ token, user: toOfflineSafeUser(user) });
    }

    const exists = await User.findOne({ email: normalizedEmail });
    if (exists) {
      return res.status(409).json({ error: "An account with that email already exists." });
    }

    const user = await User.create({ name, email, password, role, studentId, grade, section, phone });
    const token = signToken({ id: user._id, email: user.email, role: user.role, name: user.name });
    return res.status(201).json({ token, user: user.toSafeObject() });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password, role } = req.body;
    const normalizedEmail = String(email || "").toLowerCase();

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required." });
    }

    if (req.dbUnavailable) {
      const user = offlineUsers.get(normalizedEmail);
      if (!user || user.password !== password || (role && user.role !== role)) {
        return res.status(401).json({ error: "Invalid email or password." });
      }

      const token = signToken({
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
      });
      return res.json({ token, user: toOfflineSafeUser(user) });
    }

    const query = { email: normalizedEmail };
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
    return res.json({ token, user: user.toSafeObject() });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.post("/vendor-login", async (req, res) => {
  try {
    const { vendorKey, password } = req.body;
    const VENDOR_KEY = process.env.VENDOR_KEY || "VENDOR-2026";

    if (vendorKey !== VENDOR_KEY) {
      return res.status(401).json({ error: "Invalid vendor key. Access denied." });
    }

    if (req.dbUnavailable) {
      const vendor = ensureOfflineVendor(password);
      if (password && vendor.password !== password) {
        return res.status(401).json({ error: "Incorrect vendor password." });
      }

      const token = signToken({
        id: vendor.id,
        email: vendor.email,
        role: vendor.role,
        name: vendor.name,
      });
      return res.json({ token, user: toOfflineSafeUser(vendor) });
    }

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
    return res.json({ token, user: vendor.toSafeObject() });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.get("/me", verifyToken, async (req, res) => {
  try {
    if (req.dbUnavailable) {
      const user = ensureOfflineUserFromToken(req.user);
      return res.json(toOfflineSafeUser(user));
    }

    const user = await User.findById(req.user.id).select("-password");
    if (!user) return res.status(404).json({ error: "User not found." });
    return res.json(user);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.patch("/me", verifyToken, async (req, res) => {
  try {
    const allowed = ["name", "phone", "grade", "section", "studentId", "avatar", "idCardImage", "password"];
    const updates = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }

    if (req.dbUnavailable) {
      const user = ensureOfflineUserFromToken(req.user);
      Object.assign(user, updates);
      user.updatedAt = new Date().toISOString();
      return res.json(toOfflineSafeUser(user));
    }

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: "User not found." });

    Object.assign(user, updates);
    await user.save();
    return res.json(user.toSafeObject());
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
