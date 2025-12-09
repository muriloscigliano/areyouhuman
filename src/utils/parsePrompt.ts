/**
 * Prompt Parser and Builder
 * Dynamically loads and composes AI prompts from markdown files
 * with variable injection and caching support
 */

import fs from 'fs/promises';
import path from 'path';
import type { ConversationStage } from '../types';

// =============================================================================
// TYPES
// =============================================================================

interface PromptCache {
  content: string;
  timestamp: number;
}

interface VariableValidation {
  valid: boolean;
  missing: string[];
}

// =============================================================================
// CONSTANTS
// =============================================================================

const CACHE_TTL_MS = 60000; // 1 minute cache TTL
const promptCache = new Map<string, PromptCache>();
const contextCache = new Map<string, PromptCache>();

export const PromptStages = {
  GREETING: 'greeting',
  BRIEFING: 'briefing',
  QUOTE: 'quote',
  FOLLOWUP: 'followup',
  ACTIONS: 'actions',
  ROADMAP: 'roadmap',
} as const;

// Stage to prompt files mapping
const STAGE_PROMPTS: Record<ConversationStage, string[]> = {
  greeting: ['objective', 'context'],
  briefing: ['objective', 'context', 'lead-collection', 'early-extraction', 'anti-hallucination', 'briefing'],
  quote: ['objective', 'context', 'quote-builder'],
  followup: ['objective', 'context', 'followup'],
  actions: ['objective', 'context', 'actions'],
  roadmap: ['objective', 'context', 'roadmap'],
};

// =============================================================================
// CACHE MANAGEMENT
// =============================================================================

/**
 * Check if cached content is still valid
 */
function isCacheValid(cache: PromptCache | undefined): boolean {
  if (!cache) return false;
  return Date.now() - cache.timestamp < CACHE_TTL_MS;
}

/**
 * Clear all prompt caches
 */
export function clearPromptCache(): void {
  promptCache.clear();
  contextCache.clear();
}

/**
 * Get cache statistics
 */
export function getCacheStats(): { prompts: number; contexts: number } {
  return {
    prompts: promptCache.size,
    contexts: contextCache.size,
  };
}

// =============================================================================
// FILE LOADING
// =============================================================================

/**
 * Load a prompt file by name with caching
 *
 * @param promptName - Name of the prompt file (without .md extension)
 * @returns Promise<string> - Prompt content
 */
export async function loadPrompt(promptName: string): Promise<string> {
  // Check cache first
  const cached = promptCache.get(promptName);
  if (isCacheValid(cached)) {
    return cached!.content;
  }

  try {
    const promptPath = path.join(process.cwd(), 'src', 'data', 'prompts', `${promptName}.md`);
    const content = await fs.readFile(promptPath, 'utf-8');

    // Update cache
    promptCache.set(promptName, {
      content,
      timestamp: Date.now(),
    });

    return content;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error(`Error loading prompt "${promptName}":`, message);
    return '';
  }
}

/**
 * Load a context file by name with caching
 *
 * @param contextName - Name of the context file (without .md extension)
 * @returns Promise<string> - Context content
 */
export async function loadContext(contextName: string): Promise<string> {
  // Check cache first
  const cached = contextCache.get(contextName);
  if (isCacheValid(cached)) {
    return cached!.content;
  }

  try {
    const contextPath = path.join(process.cwd(), 'src', 'data', 'context', `${contextName}.md`);
    const content = await fs.readFile(contextPath, 'utf-8');

    // Update cache
    contextCache.set(contextName, {
      content,
      timestamp: Date.now(),
    });

    return content;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error(`Error loading context "${contextName}":`, message);
    return '';
  }
}

// =============================================================================
// PROMPT COMPOSITION
// =============================================================================

/**
 * Compose multiple prompts into a single system message
 *
 * @param promptNames - Array of prompt names to combine
 * @param variables - Variables to inject into prompts
 * @returns Promise<string> - Combined prompt
 */
export async function composePrompts(
  promptNames: string[],
  variables: Record<string, string> = {}
): Promise<string> {
  const prompts = await Promise.all(promptNames.map((name) => loadPrompt(name)));

  let combined = prompts.filter((p) => p.length > 0).join('\n\n---\n\n');

  // Inject variables
  combined = injectVariables(combined, variables);

  return combined;
}

/**
 * Build a complete system prompt for the AI assistant
 *
 * @param stage - Current conversation stage
 * @param context - Additional context variables
 * @returns Promise<string> - Complete system prompt
 */
export async function buildSystemPrompt(
  stage: ConversationStage = 'briefing',
  context: Record<string, string> = {}
): Promise<string> {
  // Get prompts for this stage
  const promptNames = STAGE_PROMPTS[stage] || STAGE_PROMPTS.briefing;

  // Load context files (use mini versions for token efficiency)
  const [tone, knowledge, faq, mainPrompt] = await Promise.all([
    loadContext('tone-mini'),
    loadContext('knowledge-mini'),
    loadContext('faq-mini'),
    composePrompts(promptNames, context),
  ]);

  // Build complete prompt with sections
  return `# Telos System Prompt

${mainPrompt}

---

# Brand Voice & Tone
${tone}

---

# Studio Knowledge
${knowledge}

---

# Quick Reference FAQ
${faq}

---

Remember: You are Telos — half machine, fully human. Stay curious, empathetic, and clear.`;
}

/**
 * Get a ready-to-use system prompt for a specific stage
 * Alias for buildSystemPrompt for backwards compatibility
 */
export async function getSystemPrompt(
  stage: ConversationStage = 'briefing',
  context: Record<string, string> = {}
): Promise<string> {
  return buildSystemPrompt(stage, context);
}

// =============================================================================
// VARIABLE HANDLING
// =============================================================================

/**
 * Extract variables from a markdown prompt
 * Finds all {{variable}} placeholders
 *
 * @param promptContent - Prompt markdown content
 * @returns string[] - Array of variable names
 */
export function extractVariables(promptContent: string): string[] {
  const regex = /\{\{(\w+)\}\}/g;
  const matches = [...promptContent.matchAll(regex)];
  return [...new Set(matches.map((match) => match[1]))];
}

/**
 * Validate that all required variables are provided
 *
 * @param promptContent - Prompt content with variables
 * @param variables - Variables object
 * @returns VariableValidation
 */
export function validateVariables(
  promptContent: string,
  variables: Record<string, string>
): VariableValidation {
  const required = extractVariables(promptContent);
  const provided = Object.keys(variables);
  const missing = required.filter((v) => !provided.includes(v));

  return {
    valid: missing.length === 0,
    missing,
  };
}

/**
 * Inject variables into a prompt template
 *
 * @param template - Prompt template with {{variables}}
 * @param variables - Variables to inject
 * @param strict - Throw error if variables are missing
 * @returns string - Processed prompt
 */
export function injectVariables(
  template: string,
  variables: Record<string, string>,
  strict: boolean = false
): string {
  if (strict) {
    const validation = validateVariables(template, variables);
    if (!validation.valid) {
      throw new Error(`Missing required variables: ${validation.missing.join(', ')}`);
    }
  }

  let result = template;
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
    result = result.replace(regex, String(value));
  }

  return result;
}

// =============================================================================
// EXAMPLE LOADING
// =============================================================================

/**
 * Load an example from the examples directory
 *
 * @param exampleName - Name of the example file (without .json extension)
 * @returns Promise<Record<string, unknown> | null> - Parsed example data
 */
export async function loadExample(exampleName: string): Promise<Record<string, unknown> | null> {
  try {
    const examplePath = path.join(process.cwd(), 'src', 'data', 'examples', `${exampleName}.json`);
    const content = await fs.readFile(examplePath, 'utf-8');
    return JSON.parse(content) as Record<string, unknown>;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error(`Error loading example "${exampleName}":`, message);
    return null;
  }
}

// =============================================================================
// PROMPT VALIDATION
// =============================================================================

/**
 * Validate prompt structure and content
 *
 * @param content - Prompt content to validate
 * @returns ValidationResult
 */
export function validatePromptContent(content: string): {
  valid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check for empty content
  if (!content || content.trim().length === 0) {
    errors.push('Prompt content is empty');
    return { valid: false, errors, warnings };
  }

  // Check minimum length
  if (content.length < 50) {
    warnings.push('Prompt content is very short (< 50 characters)');
  }

  // Check for unresolved variables
  const unresolvedVars = extractVariables(content);
  if (unresolvedVars.length > 0) {
    warnings.push(`Unresolved variables found: ${unresolvedVars.join(', ')}`);
  }

  // Check for common issues
  if (content.includes('TODO')) {
    warnings.push('Prompt contains TODO markers');
  }

  if (content.includes('FIXME')) {
    warnings.push('Prompt contains FIXME markers');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}
