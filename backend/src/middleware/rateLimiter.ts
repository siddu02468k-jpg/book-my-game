import { Request, Response, NextFunction } from 'express';

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

const ipRequestMap = new Map<string, RateLimitRecord>();
const authRequestMap = new Map<string, RateLimitRecord>();

// Periodic memory garbage collection every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of ipRequestMap.entries()) {
    if (now > record.resetTime) {
      ipRequestMap.delete(ip);
    }
  }
  for (const [ip, record] of authRequestMap.entries()) {
    if (now > record.resetTime) {
      authRequestMap.delete(ip);
    }
  }
}, 300000);

function getClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  return req.socket.remoteAddress || '127.0.0.1';
}

/**
 * General API Rate Limiter
 * 180 requests per 1 minute window
 */
export const apiRateLimiter = (req: Request, res: Response, next: NextFunction): void => {
  const ip = getClientIp(req);
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute
  const maxRequests = 180;

  const record = ipRequestMap.get(ip) || { count: 0, resetTime: now + windowMs };

  if (now > record.resetTime) {
    record.count = 1;
    record.resetTime = now + windowMs;
  } else {
    record.count++;
  }

  ipRequestMap.set(ip, record);

  res.setHeader('X-RateLimit-Limit', maxRequests);
  res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - record.count));
  res.setHeader('X-RateLimit-Reset', Math.ceil(record.resetTime / 1000));

  if (record.count > maxRequests) {
    const retryAfter = Math.ceil((record.resetTime - now) / 1000);
    res.setHeader('Retry-After', retryAfter);
    res.status(429).json({
      success: false,
      error: `Too many requests from your IP. Please retry in ${retryAfter} seconds.`,
      retryAfter
    });
    return;
  }

  next();
};

/**
 * Auth Rate Limiter (Brute-Force & Credential Stuffing Protection)
 * Max 15 attempts per 15 minutes window for login, register & google auth
 */
export const authRateLimiter = (req: Request, res: Response, next: NextFunction): void => {
  const ip = getClientIp(req);
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 minutes
  const maxAttempts = 15;

  const record = authRequestMap.get(ip) || { count: 0, resetTime: now + windowMs };

  if (now > record.resetTime) {
    record.count = 1;
    record.resetTime = now + windowMs;
  } else {
    record.count++;
  }

  authRequestMap.set(ip, record);

  res.setHeader('X-AuthRateLimit-Limit', maxAttempts);
  res.setHeader('X-AuthRateLimit-Remaining', Math.max(0, maxAttempts - record.count));

  if (record.count > maxAttempts) {
    const retryAfter = Math.ceil((record.resetTime - now) / 1000);
    res.setHeader('Retry-After', retryAfter);
    res.status(429).json({
      success: false,
      error: `Too many authentication attempts. Please wait ${Math.ceil(retryAfter / 60)} minutes before trying again.`,
      retryAfter
    });
    return;
  }

  next();
};
