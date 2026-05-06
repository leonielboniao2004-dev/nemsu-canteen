import { Router } from "express";
import { v2 as cloudinary } from "cloudinary";
import multer from "multer";
import { verifyToken } from "../middleware/auth.js";
import User from "../models/User.js";

const router = Router();
const PROFILE_UPLOAD_FOLDER = "canteen_profiles";
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;

function httpError(message, status) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function configureCloudinary() {
  const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } =
    process.env;

  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
    throw httpError("Cloudinary environment variables are not configured.", 503);
  }

  cloudinary.config({
    cloud_name: CLOUDINARY_CLOUD_NAME,
    api_key: CLOUDINARY_API_KEY,
    api_secret: CLOUDINARY_API_SECRET,
    secure: true,
  });
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_IMAGE_SIZE_BYTES },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype?.startsWith("image/")) {
      return cb(httpError("Only image uploads are allowed.", 400));
    }

    cb(null, true);
  },
});

function uploadImageToCloudinary(fileBuffer) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: PROFILE_UPLOAD_FOLDER,
        resource_type: "image",
      },
      (err, result) => {
        if (err) return reject(err);
        if (!result?.secure_url) {
          return reject(new Error("Cloudinary upload failed."));
        }
        resolve(result);
      }
    );

    stream.end(fileBuffer);
  });
}

function requireCloudinary(_req, _res, next) {
  try {
    configureCloudinary();
    next();
  } catch (err) {
    next(err);
  }
}

async function updateUserImage(req, res, imageField) {
  if (!req.file?.buffer) {
    return res.status(400).json({ error: "No image file provided." });
  }

  const user = await User.findById(req.user.id);
  if (!user) return res.status(404).json({ error: "User not found." });

  const result = await uploadImageToCloudinary(req.file.buffer);
  user[imageField] = result.secure_url;
  await user.save();

  return res.json({ url: result.secure_url, user: user.toSafeObject() });
}

const imageUploadMiddleware = [
  verifyToken,
  requireCloudinary,
  upload.single("image"),
];

router.post("/avatar", imageUploadMiddleware, async (req, res, next) => {
  try {
    await updateUserImage(req, res, "avatar");
  } catch (err) {
    next(err);
  }
});

router.post("/id-card", imageUploadMiddleware, async (req, res, next) => {
  try {
    await updateUserImage(req, res, "idCardImage");
  } catch (err) {
    next(err);
  }
});

export default router;
