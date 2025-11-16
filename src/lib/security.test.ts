import { describe, it, expect, beforeEach } from 'vitest';
import {
  checkCORS,
  getClientIP,
  apiRateLimiter,
  chatRateLimiter,
  createRateLimitResponse,
} from './security';

describe('security', () => {
  describe('checkCORS', () => {
    it('should allow whitelisted origins', () => {
      expect(checkCORS('https://areyouhuman.com')).toBe(true);
      expect(checkCORS('https://www.areyouhuman.com')).toBe(true);
    });

    it('should reject non-whitelisted origins', () => {
      expect(checkCORS('https://evil.com')).toBe(false);
      expect(checkCORS('https://malicious.site')).toBe(false);
    });

    it('should reject null origin', () => {
      expect(checkCORS(null)).toBe(false);
    });
  });

  describe('getClientIP', () => {
    it('should extract IP from x-forwarded-for', () => {
      const request = new Request('https://example.com', {
        headers: {
          'x-forwarded-for': '192.168.1.1, 10.0.0.1',
        },
      });
      expect(getClientIP(request)).toBe('192.168.1.1');
    });

    it('should extract IP from cf-connecting-ip', () => {
      const request = new Request('https://example.com', {
        headers: {
          'cf-connecting-ip': '203.0.113.1',
        },
      });
      expect(getClientIP(request)).toBe('203.0.113.1');
    });

    it('should extract IP from x-real-ip', () => {
      const request = new Request('https://example.com', {
        headers: {
          'x-real-ip': '198.51.100.1',
        },
      });
      expect(getClientIP(request)).toBe('198.51.100.1');
    });

    it('should return unknown if no IP found', () => {
      const request = new Request('https://example.com');
      expect(getClientIP(request)).toBe('unknown');
    });

    it('should prioritize x-forwarded-for', () => {
      const request = new Request('https://example.com', {
        headers: {
          'x-forwarded-for': '192.168.1.1',
          'x-real-ip': '10.0.0.1',
        },
      });
      expect(getClientIP(request)).toBe('192.168.1.1');
    });
  });

  describe('RateLimiter', () => {
    beforeEach(() => {
      // Clear rate limiter state between tests
      // Note: In a real implementation, you'd want a reset method
    });

    it('should allow requests within limit', () => {
      const result1 = apiRateLimiter.check('test-ip-1');
      expect(result1.allowed).toBe(true);
      expect(result1.remaining).toBeGreaterThan(0);

      const result2 = apiRateLimiter.check('test-ip-1');
      expect(result2.allowed).toBe(true);
      expect(result2.remaining).toBe(result1.remaining - 1);
    });

    it('should track different identifiers separately', () => {
      const result1 = chatRateLimiter.check('user-1');
      const result2 = chatRateLimiter.check('user-2');

      expect(result1.allowed).toBe(true);
      expect(result2.allowed).toBe(true);
      expect(result1.remaining).toBe(result2.remaining);
    });

    it('should block requests over limit', () => {
      // Make max requests
      for (let i = 0; i < 20; i++) {
        chatRateLimiter.check('test-user-limit');
      }

      // Next request should be blocked
      const result = chatRateLimiter.check('test-user-limit');
      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
    });
  });

  describe('createRateLimitResponse', () => {
    it('should create proper rate limit response', async () => {
      const resetTime = Date.now() + 60000; // 1 minute from now
      const response = createRateLimitResponse(resetTime);

      expect(response.status).toBe(429);
      expect(response.headers.get('Content-Type')).toBe('application/json');
      expect(response.headers.get('Retry-After')).toBeTruthy();

      const body = await response.json();
      expect(body.error).toBe('Too many requests');
      expect(body.retryAfter).toBeGreaterThan(0);
    });

    it('should include security headers', () => {
      const resetTime = Date.now() + 60000;
      const response = createRateLimitResponse(resetTime);

      expect(response.headers.get('X-Frame-Options')).toBe('DENY');
      expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff');
      expect(response.headers.get('Content-Security-Policy')).toBeTruthy();
    });
  });
});
