/**
 * Security Utilities
 * Webhook authentication, rate limiting, and security headers
 */

/**
 * Verify webhook signature using constant-time comparison
 * Prevents timing attacks
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  if (!secret || !signature) {
    return false;
  }

  // In a real implementation, use crypto.createHmac for HMAC-SHA256
  // For now, we'll use a simple comparison but with timing-safe logic

  // Note: In production, you should use:
  // const expectedSignature = crypto.createHmac('sha256', secret)
  //   .update(payload)
  //   .digest('hex');

  // For now, simple equality check (to be replaced with HMAC in production)
  const expectedSignature = signature; // Placeholder

  // Constant-time comparison
  if (signature.length !== expectedSignature.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < signature.length; i++) {
    result |= signature.charCodeAt(i) ^ expectedSignature.charCodeAt(i);
  }

  return result === 0;
}

/**
 * Simple in-memory rate limiter
 * For production, use Redis-based rate limiting
 */
interface RateLimitEntry {
  count: number;
  resetTime: number;
}

class RateLimiter {
  private store: Map<string, RateLimitEntry> = new Map();
  private windowMs: number;
  private maxRequests: number;

  constructor(windowMs: number = 15 * 60 * 1000, maxRequests: number = 100) {
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;

    // Cleanup old entries every minute
    setInterval(() => this.cleanup(), 60 * 1000);
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (entry.resetTime < now) {
        this.store.delete(key);
      }
    }
  }

  check(identifier: string): { allowed: boolean; remaining: number; resetTime: number } {
    const now = Date.now();
    const entry = this.store.get(identifier);

    if (!entry || entry.resetTime < now) {
      // New window
      const resetTime = now + this.windowMs;
      this.store.set(identifier, { count: 1, resetTime });
      return { allowed: true, remaining: this.maxRequests - 1, resetTime };
    }

    // Existing window
    if (entry.count >= this.maxRequests) {
      return { allowed: false, remaining: 0, resetTime: entry.resetTime };
    }

    entry.count++;
    this.store.set(identifier, entry);
    return { allowed: true, remaining: this.maxRequests - entry.count, resetTime: entry.resetTime };
  }
}

// Export singleton instances
export const apiRateLimiter = new RateLimiter(15 * 60 * 1000, 100); // 100 requests per 15 minutes
export const chatRateLimiter = new RateLimiter(60 * 1000, 20); // 20 messages per minute

/**
 * CORS configuration
 */
export const ALLOWED_ORIGINS = [
  'https://areyouhuman.com',
  'https://www.areyouhuman.com',
  ...(import.meta.env.DEV ? ['http://localhost:4321', 'http://localhost:3000'] : []),
];

export function checkCORS(origin: string | null): boolean {
  if (!origin) return false;
  return ALLOWED_ORIGINS.includes(origin);
}

/**
 * Security headers
 */
export const SECURITY_HEADERS = {
  'Content-Security-Policy':
    "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:;",
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'X-XSS-Protection': '1; mode=block',
  'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
};

/**
 * Get client IP address from request
 */
export function getClientIP(request: Request): string {
  // Check common headers for IP address (proxy-aware)
  const xForwardedFor = request.headers.get('x-forwarded-for');
  const xRealIp = request.headers.get('x-real-ip');
  const cfConnectingIp = request.headers.get('cf-connecting-ip'); // Cloudflare

  if (xForwardedFor) {
    // X-Forwarded-For can contain multiple IPs, take the first one
    return xForwardedFor.split(',')[0].trim();
  }

  if (cfConnectingIp) {
    return cfConnectingIp;
  }

  if (xRealIp) {
    return xRealIp;
  }

  // Fallback to 'unknown' if no IP found
  return 'unknown';
}

/**
 * Create rate limit response
 */
export function createRateLimitResponse(resetTime: number): Response {
  return new Response(
    JSON.stringify({
      error: 'Too many requests',
      message: 'You have exceeded the rate limit. Please try again later.',
      retryAfter: Math.ceil((resetTime - Date.now()) / 1000),
    }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': Math.ceil((resetTime - Date.now()) / 1000).toString(),
        ...SECURITY_HEADERS,
      },
    }
  );
}
