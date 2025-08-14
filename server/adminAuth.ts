import type { Request, Response, NextFunction } from "express";

// Middleware to check if user is admin
export function isAdmin(req: any, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: "Admin access required" });
  }

  next();
}

// Middleware that allows both admin and regular users (for mixed endpoints)
export function requireAuth(req: any, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
}