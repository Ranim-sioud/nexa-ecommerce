import jwt from "jsonwebtoken";
import logger from "../config/logger.js";

export function requireAuth(req, res, next) {
  const token = req.cookies?.accessToken;

  if (!token) {
    logger.warn('Auth failed: no token', { ip: req.ip, url: req.originalUrl });
    return res.status(401).json({ message: "Non authentifié" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    logger.warn('Auth failed: invalid token', {
      ip: req.ip,
      url: req.originalUrl,
      reason: err.message,
    });
    return res.status(401).json({ message: "Token invalide" });
  }
}

export function requireAdmin(req, res, next) {
  if (!req.user) {
    logger.warn('Admin access denied: no user', { ip: req.ip, url: req.originalUrl });
    return res.status(401).json({ message: "Non authentifié" });
  }
  if (req.user.role !== "admin") {
    logger.warn('Admin access denied: insufficient role', {
      userId: req.user.id,
      role: req.user.role,
      url: req.originalUrl,
    });
    return res.status(403).json({ message: "Accès admin requis" });
  }
  next();
}
