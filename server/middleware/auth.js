import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "canteen_super_secret_2026";

/** Sign a payload → token (default 7 days) */
export const signToken = (payload) =>
  jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });

/** Express middleware — verifies Bearer token and attaches req.user */
export const verifyToken = (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ error: "No token provided" });
  }
  const token = header.slice(7);
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};

/** Role guard — use after verifyToken */
export const requireRole = (...roles) =>
  (req, res, next) => {
    if (!roles.includes(req.user?.role)) {
      return res.status(403).json({ error: "Forbidden: insufficient role" });
    }
    next();
  };
