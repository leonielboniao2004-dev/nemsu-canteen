import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import path from "path";
import mongoose from "mongoose";

import authRoutes from "./routes/auth.js";
import productRoutes from "./routes/products.js";
import orderRoutes from "./routes/orders.js";
import notificationRoutes from "./routes/notifications.js";
import uploadRoutes from "./routes/upload.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGODB_URI;

let dbConnectionPromise = null;
let nextDbRetryAt = 0;
const DB_RETRY_COOLDOWN_MS = 15000;
const DB_CONNECT_TIMEOUT_MS = process.env.NODE_ENV === "production" ? 10000 : 2000;

async function connectDb() {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  if (Date.now() < nextDbRetryAt) {
    throw new Error("Database temporarily unavailable");
  }

  if (dbConnectionPromise) {
    return dbConnectionPromise;
  }

  dbConnectionPromise = (async () => {
    if (!MONGO_URI) {
      throw new Error("MONGODB_URI is not defined");
    }

    const instance = await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: DB_CONNECT_TIMEOUT_MS,
    });
    console.log("MongoDB connected");
    return instance.connection;
  })().catch((err) => {
    dbConnectionPromise = null;
    nextDbRetryAt = Date.now() + DB_RETRY_COOLDOWN_MS;
    console.error("MongoDB connection error:", err.message);
    throw err;
  });

  return dbConnectionPromise;
}

app.use(
  cors({
    origin: true,
    credentials: true,
  })
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, ts: Date.now() });
});

// Ensure MongoDB is connected before API routes use Mongoose models.
app.use("/api", async (_req, res, next) => {
  try {
    await connectDb();
    _req.dbUnavailable = false;
    next();
  } catch {
    _req.dbUnavailable = true;
    if (_req.path.startsWith("/auth/")) {
      return next();
    }
    res.status(503).json({
      error: "Database connection failed. Check MONGODB_URI and network access.",
    });
  }
});

app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/upload", uploadRoutes);

app.use((_req, res) => res.status(404).json({ error: "Route not found" }));

app.use((err, _req, res, _next) => {
  console.error("[server error]", err);
  res
    .status(err.status ?? 500)
    .json({ error: err.message ?? "Internal server error" });
});

if (process.env.NODE_ENV !== "production") {
  app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
}

export default app;
