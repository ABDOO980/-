import { timingSafeEqual } from "node:crypto";
import type { NextFunction, Request, Response } from "express";
import rateLimit from "express-rate-limit";

// Lightweight protection: a single shared secret set as ADMIN_KEY, sent by
// the admin page as the x-admin-key header. There is no per-admin login —
// this is meant for the one developer/owner running the app, not a
// multi-admin system. Rotate ADMIN_KEY if it ever leaks.

// Brute-force guard: only FAILED attempts count (skipSuccessfulRequests), so
// the owner is never locked out by normal use. 10 wrong keys per 15 min / IP.
export const adminAuthLimiter = rateLimit({
  windowMs: 15 * 60_000,
  limit: 10,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "محاولات كثيرة خاطئة. حاول مرة أخرى بعد 15 دقيقة." },
});

function keysMatch(provided: string | undefined, expected: string): boolean {
  if (!provided) return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const expected = process.env.ADMIN_KEY;
  if (!expected) {
    res.status(503).json({ message: "لوحة التحكم غير مفعّلة: لم يتم ضبط ADMIN_KEY على الخادم." });
    return;
  }
  if (!keysMatch(req.header("x-admin-key"), expected)) {
    res.status(401).json({ message: "مفتاح الإدارة غير صحيح." });
    return;
  }
  next();
}
