import { Router } from "express";
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import multer from "multer";
import { verifyToken } from "../middleware/auth.js";
import User from "../models/User.js";

const router = Router();

// Configure Cloudinary lazily to ensure environment variables are loaded
function configureCloudinary() {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

// Setup Multer Storage
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "canteen_profiles",
  },
});

const upload = multer({ storage });

// ── POST /api/upload/avatar ───────────────────────────────────────────────────
router.post("/avatar", verifyToken, (req, res, next) => {
  configureCloudinary();
  next();
}, upload.single("image"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No image file provided." });

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: "User not found." });

    user.avatar = req.file.path; // Cloudinary URL
    await user.save();

    res.json({ url: req.file.path, user: user.toSafeObject() });
  } catch (err) {
    console.error("[upload error]", err);
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/upload/id-card ──────────────────────────────────────────────────
router.post("/id-card", verifyToken, (req, res, next) => {
  configureCloudinary();
  next();
}, upload.single("image"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No image file provided." });

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: "User not found." });

    user.idCardImage = req.file.path; // Cloudinary URL
    await user.save();

    res.json({ url: req.file.path, user: user.toSafeObject() });
  } catch (err) {
    console.error("[upload error]", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
