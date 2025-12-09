/**
 * Security Utilities
 * Provides secure cryptographic operations for webhook verification,
 * input sanitization, and other security-critical functions.
 */

import { createHmac, timingSafeEqual, randomBytes } from 'crypto';

// =============================================================================
// WEBHOOK SIGNATURE VERIFICATION
// =============================================================================

/**
 * Verify webhook signature using timing-safe comparison
 * Prevents timing attacks by using constant-time comparison
 *
 * @param payload - Raw request body as string
 * @param signature - Signature from request header
 * @param secret - Webhook secret key
 * @returns boolean - true if signature is valid
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string | null,
  secret: string
): boolean {
  if (!signature || !secret) {
    return false;
  }

  try {
    // Compute expected signature
    const expectedSignature = createHmac('sha256', secret)
      .update(payload, 'utf8')
      .digest('hex');

    // Ensure both are same length for timing-safe comparison
    const signatureBuffer = Buffer.from(signature, 'utf8');
    const expectedBuffer = Buffer.from(expectedSignature, 'utf8');

    if (signatureBuffer.length !== expectedBuffer.length) {
      return false;
    }

    return timingSafeEqual(signatureBuffer, expectedBuffer);
  } catch (error) {
    console.error('Signature verification error:', error);
    return false;
  }
}

/**
 * Generate a webhook signature for outgoing requests
 *
 * @param payload - Request body as string
 * @param secret - Webhook secret key
 * @returns string - HMAC-SHA256 signature
 */
export function generateWebhookSignature(payload: string, secret: string): string {
  return createHmac('sha256', secret)
    .update(payload, 'utf8')
    .digest('hex');
}

// =============================================================================
// INPUT SANITIZATION
// =============================================================================

/**
 * Sanitize user input to prevent XSS attacks
 * Escapes HTML special characters
 *
 * @param input - Raw user input
 * @returns string - Sanitized string
 */
export function sanitizeInput(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  const htmlEntities: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
    '`': '&#x60;',
    '=': '&#x3D;',
  };

  return input.replace(/[&<>"'`=/]/g, (char) => htmlEntities[char] || char);
}

/**
 * Sanitize object values recursively
 *
 * @param obj - Object with potentially unsafe values
 * @returns object - Sanitized object
 */
export function sanitizeObject<T extends Record<string, unknown>>(obj: T): T {
  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeInput(value);
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map((item) =>
        typeof item === 'string' ? sanitizeInput(item) : item
      );
    } else if (value !== null && typeof value === 'object') {
      sanitized[key] = sanitizeObject(value as Record<string, unknown>);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized as T;
}

// =============================================================================
// RATE LIMITING HELPERS
// =============================================================================

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

/**
 * Check if a request should be rate limited
 *
 * @param identifier - Unique identifier (IP, user ID, etc.)
 * @param maxRequests - Maximum requests allowed in window
 * @param windowMs - Time window in milliseconds
 * @returns object - { allowed: boolean, remaining: number, resetIn: number }
 */
export function checkRateLimit(
  identifier: string,
  maxRequests: number = 100,
  windowMs: number = 60000
): { allowed: boolean; remaining: number; resetIn: number } {
  const now = Date.now();
  const entry = rateLimitStore.get(identifier);

  // Clean up expired entries periodically
  if (rateLimitStore.size > 10000) {
    for (const [key, value] of rateLimitStore.entries()) {
      if (value.resetTime < now) {
        rateLimitStore.delete(key);
      }
    }
  }

  if (!entry || entry.resetTime < now) {
    // Create new entry or reset expired one
    rateLimitStore.set(identifier, {
      count: 1,
      resetTime: now + windowMs,
    });

    return {
      allowed: true,
      remaining: maxRequests - 1,
      resetIn: windowMs,
    };
  }

  if (entry.count >= maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetIn: entry.resetTime - now,
    };
  }

  entry.count++;

  return {
    allowed: true,
    remaining: maxRequests - entry.count,
    resetIn: entry.resetTime - now,
  };
}

// =============================================================================
// TOKEN GENERATION
// =============================================================================

/**
 * Generate a cryptographically secure random token
 *
 * @param length - Token length in bytes (default 32)
 * @returns string - Hex-encoded random token
 */
export function generateSecureToken(length: number = 32): string {
  return randomBytes(length).toString('hex');
}

/**
 * Generate a short, URL-safe token
 *
 * @param length - Token length in bytes (default 16)
 * @returns string - Base64url-encoded token
 */
export function generateUrlSafeToken(length: number = 16): string {
  return randomBytes(length)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

// =============================================================================
// VALIDATION HELPERS
// =============================================================================

/**
 * Validate that a string contains only allowed characters
 *
 * @param input - String to validate
 * @param pattern - Regex pattern of allowed characters
 * @returns boolean
 */
export function validatePattern(input: string, pattern: RegExp): boolean {
  return pattern.test(input);
}

/**
 * Check if input length is within bounds
 *
 * @param input - String to check
 * @param minLength - Minimum length (inclusive)
 * @param maxLength - Maximum length (inclusive)
 * @returns boolean
 */
export function validateLength(
  input: string,
  minLength: number,
  maxLength: number
): boolean {
  const length = input?.length ?? 0;
  return length >= minLength && length <= maxLength;
}

/**
 * Validate UUID format
 *
 * @param uuid - String to validate
 * @returns boolean
 */
export function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

// =============================================================================
// ENVIRONMENT SECURITY
// =============================================================================

/**
 * Safely get environment variable with validation
 *
 * @param key - Environment variable name
 * @param required - Whether the variable is required
 * @returns string | undefined
 * @throws Error if required variable is missing
 */
export function getEnvVar(key: string, required: boolean = false): string | undefined {
  const value = import.meta.env?.[key] || process.env[key];

  if (required && (!value || value.includes('placeholder'))) {
    throw new Error(`Required environment variable ${key} is not configured`);
  }

  return value && !value.includes('placeholder') ? value : undefined;
}

/**
 * Check if running in production environment
 */
export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

/**
 * Mask sensitive data for logging
 *
 * @param value - Sensitive string to mask
 * @param visibleChars - Number of characters to show at start/end
 * @returns string - Masked string
 */
export function maskSensitiveData(value: string, visibleChars: number = 4): string {
  if (!value || value.length <= visibleChars * 2) {
    return '***';
  }

  const start = value.slice(0, visibleChars);
  const end = value.slice(-visibleChars);
  const maskedLength = value.length - visibleChars * 2;

  return `${start}${'*'.repeat(Math.min(maskedLength, 8))}${end}`;
}
