import jwt from "jsonwebtoken";

export function requireAuth(req, res, next) {
  const token = req.cookies?.accessToken;

  if (!token) {
    return res.status(401).json({ message: "Non authentifié" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Token invalide" });
  }
}
export function requireAdmin(req, res, next) {
  if (!req.user) return res.status(401).json({ message: "Non authentifié" });
  if (req.user.role !== "admin") return res.status(403).json({ message: "Accès admin requis" });
  next();
}