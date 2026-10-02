import { Request, Response, NextFunction } from 'express';

const buckets = new Map<string, { count: number; reset: number }>();
let lastSweep = Date.now();

const SWEEP_INTERVAL = 60_000;

export function rateLimit(max = 300, windowMs = 60_000) {
  return (req: Request, res: Response, next: NextFunction) => {
    const now = Date.now();

    if (now - lastSweep > SWEEP_INTERVAL) {
      lastSweep = now;
      for (const [key, entry] of buckets) {
        if (now > entry.reset) buckets.delete(key);
      }
    }

    const key = req.ip || req.socket.remoteAddress || 'unknown';
    let entry = buckets.get(key);
    if (!entry || now > entry.reset) {
      entry = { count: 0, reset: now + windowMs };
      buckets.set(key, entry);
    }
    entry.count++;

    if (entry.count > max) {
      res.setHeader('Retry-After', String(Math.ceil((entry.reset - now) / 1000)));
      res.status(429).json({ error: 'Quá nhiều yêu cầu, thử lại sau ít phút.' });
      return;
    }
    next();
  };
}
