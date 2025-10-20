/**
 * Email Validation Utility
 * Ensures users provide properly formatted email addresses
 */

/**
 * Validates email format
 * @param email - Email string to validate
 * @returns true if valid, false otherwise
 */
export function isValidEmail(email: string | null | undefined): boolean {
  if (!email || typeof email !== 'string') {
    return false;
  }

  // Trim whitespace
  email = email.trim();

  // Basic email regex: requires @ and domain with extension
  // Examples: test@gmail.com ✅, user@company.co.uk ✅, test ❌, test@ ❌
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  return emailRegex.test(email);
}

/**
 * Validates and cleans email
 * @param email - Email string to validate
 * @returns Cleaned email if valid, null if invalid
 */
export function validateAndCleanEmail(email: string | null | undefined): string | null {
  if (!email || typeof email !== 'string') {
    return null;
  }

  // Clean the email
  const cleaned = email.trim().toLowerCase();

  // Validate format
  if (!isValidEmail(cleaned)) {
    return null;
  }

  return cleaned;
}

/**
 * Get email validation error message for user
 * @param email - Email that failed validation
 * @returns User-friendly error message
 */
export function getEmailErrorMessage(email: string): string {
  if (!email || email.trim() === '') {
    return "Please provide your email address.";
  }

  if (!email.includes('@')) {
    return "Hmm, that doesn't look like a complete email. It needs an '@' symbol (e.g., you@company.com).";
  }

  if (!email.includes('.')) {
    return "Almost there! Your email needs a domain like .com, .au, or .co (e.g., you@company.com).";
  }

  return "That email format doesn't look quite right. Can you double-check it? (e.g., you@company.com)";
}

/**
 * Common email typo corrections
 * @param email - Email to check for typos
 * @returns Suggested correction or original email
 */
export function suggestEmailCorrection(email: string): string {
  if (!email) return email;

  const cleaned = email.trim().toLowerCase();

  // Common typos
  const typoMap: Record<string, string> = {
    'gmial.com': 'gmail.com',
    'gmai.com': 'gmail.com',
    'gmil.com': 'gmail.com',
    'yahooo.com': 'yahoo.com',
    'yaho.com': 'yahoo.com',
    'hotmial.com': 'hotmail.com',
    'outlok.com': 'outlook.com',
  };

  // Check domain typos
  for (const [typo, correct] of Object.entries(typoMap)) {
    if (cleaned.endsWith(typo)) {
      return cleaned.replace(typo, correct);
    }
  }

  return cleaned;
}

