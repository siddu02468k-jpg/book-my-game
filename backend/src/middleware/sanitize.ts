import { Request, Response, NextFunction } from 'express';

/**
 * XSS & Injection Sanitizer
 * Strips script tags, HTML tags, event handlers, and null bytes from input strings.
 */
function sanitizeString(val: string): string {
  if (typeof val !== 'string') return val;

  return val
    // Remove null bytes
    .replace(/\0/g, '')
    // Remove script tags and contents
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    // Remove HTML tags
    .replace(/<\/?[^>]+(>|$)/g, '')
    // Remove dangerous inline event handlers (onerror=, onload=, onclick=)
    .replace(/on\w+\s*=/gi, '')
    // Remove javascript pseudo-protocol
    .replace(/javascript\s*:/gi, '')
    .trim();
}

function sanitizeObject(obj: any): any {
  if (!obj || typeof obj !== 'object') {
    return typeof obj === 'string' ? sanitizeString(obj) : obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item));
  }

  const cleaned: Record<string, any> = {};
  for (const key of Object.keys(obj)) {
    // Preserve base64 image strings from excessive tag stripping
    if (key === 'images' || key === 'avatarUrl' || key === 'ownershipDocProof') {
      cleaned[key] = obj[key];
    } else {
      cleaned[key] = sanitizeObject(obj[key]);
    }
  }
  return cleaned;
}

export const sanitizeInputs = (req: Request, _res: Response, next: NextFunction): void => {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeObject(req.body);
  }
  if (req.query && typeof req.query === 'object') {
    req.query = sanitizeObject(req.query);
  }
  if (req.params && typeof req.params === 'object') {
    req.params = sanitizeObject(req.params);
  }
  next();
};
