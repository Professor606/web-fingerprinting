const jwt = require("jsonwebtoken");

const ADMIN_KEY = process.env.ADMIN_KEY || "changeme";
const JWT_SECRET = process.env.JWT_SECRET || "default-jwt-secret-change-me";

// ─── Admin Auth Middleware ────────────────────────────────────────────────────

function adminAuth(req, res, next) {
  // 1. Check for JWT in Authorization header
  const authHeader = req.headers["authorization"];
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.admin = decoded;
      return next();
    } catch (err) {
      return res.status(401).json({ error: "Invalid or expired token" });
    }
  }

  // 2. Check for JWT in cookie
  const cookieToken = req.cookies && req.cookies.admin_token;
  if (cookieToken) {
    try {
      const decoded = jwt.verify(cookieToken, JWT_SECRET);
      req.admin = decoded;
      return next();
    } catch (err) {
      // Cookie token invalid/expired, fall through
    }
  }

  // 3. Fallback: query param or x-admin-key header
  const key = req.query.key || req.headers["x-admin-key"];
  if (key === ADMIN_KEY) {
    return next();
  }

  return res.status(401).json({ error: "Unauthorized" });
}

module.exports = adminAuth;
