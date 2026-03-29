/**
 * Simple in-memory rate limiter
 * Limits to 1 request per IP per 5 seconds
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimitMap = new Map<string, RateLimitEntry>();

// Clean up old entries every 60 seconds
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of rateLimitMap.entries()) {
    if (entry.resetAt < now) {
      rateLimitMap.delete(ip);
    }
  }
}, 60000);

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

/**
 * Check if request from IP is allowed
 * @param ip - Client IP address
 * @param limit - Max requests allowed (default: 1)
 * @param windowMs - Time window in milliseconds (default: 5000ms = 5 seconds)
 */
export function checkRateLimit(
  ip: string,
  limit: number = 1,
  windowMs: number = 5000
): RateLimitResult {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  // No existing entry - allow and create new entry
  if (!entry) {
    rateLimitMap.set(ip, {
      count: 1,
      resetAt: now + windowMs,
    });
    return {
      allowed: true,
      remaining: limit - 1,
      resetAt: now + windowMs,
    };
  }

  // Entry exists but window has expired - reset
  if (entry.resetAt < now) {
    rateLimitMap.set(ip, {
      count: 1,
      resetAt: now + windowMs,
    });
    return {
      allowed: true,
      remaining: limit - 1,
      resetAt: now + windowMs,
    };
  }

  // Entry exists and window is active
  if (entry.count >= limit) {
    // Rate limit exceeded
    return {
      allowed: false,
      remaining: 0,
      resetAt: entry.resetAt,
    };
  }

  // Increment count and allow
  entry.count++;
  return {
    allowed: true,
    remaining: limit - entry.count,
    resetAt: entry.resetAt,
  };
}

/**
 * Extract client IP from Next.js request headers
 */
export function getClientIp(headers: Headers): string {
  // Try various headers that might contain the real IP
  const forwarded = headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  const realIp = headers.get('x-real-ip');
  if (realIp) {
    return realIp.trim();
  }

  // Fallback to a placeholder (should not happen in production)
  return 'unknown';
}
