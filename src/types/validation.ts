/**
 * Validation Types
 * Type definitions for data validation and guardrails
 */

export interface ValidationResult {
  isValid: boolean;
  isHallucinated: boolean;
  missingFields: string[];
  suspiciousFields: string[];
  confidence: number; // 0-1
  warnings: string[];
}

export interface ProjectValidationResult {
  isValid: boolean;
  missingFields: string[];
  lowQualityFields: string[];
  suggestions: string[];
}

export interface GuardrailResult {
  isValid: boolean;
  isOffTopic: boolean;
  wordCount: number;
  maxWords: number;
  redirectMessage?: string;
}

export interface EmailValidationResult {
  isValid: boolean;
  email?: string;
  error?: string;
}

export interface DataCollectionVerification {
  collected: string[];
  missing: string[];
  needsFollowUp: boolean;
}
