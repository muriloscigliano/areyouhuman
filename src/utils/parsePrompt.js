import fs from 'fs/promises';
import path from 'path';

/**
 * Parse and load markdown prompts from the /src/data/prompts directory
 * Supports dynamic prompt composition and variable injection
 */

/**
 * Load a prompt file by name
 * @param {string} promptName - Name of the prompt file (without .md extension)
 * @returns {Promise<string>} Prompt content
 */
export async function loadPrompt(promptName) {
  try {
    const promptPath = path.join(process.cwd(), 'src', 'data', 'prompts', `${promptName}.md`);
    const content = await fs.readFile(promptPath, 'utf-8');
    return content;
  } catch (error) {
    console.error(`Error loading prompt "${promptName}":`, error.message);
    return '';
  }
}

/**
 * Load a context file by name
 * @param {string} contextName - Name of the context file (without .md extension)
 * @returns {Promise<string>} Context content
 */
export async function loadContext(contextName) {
  try {
    const contextPath = path.join(process.cwd(), 'src', 'data', 'context', `${contextName}.md`);
    const content = await fs.readFile(contextPath, 'utf-8');
    return content;
  } catch (error) {
    console.error(`Error loading context "${contextName}":`, error.message);
    return '';
  }
}

/**
 * Compose multiple prompts into a single system message
 * @param {string[]} promptNames - Array of prompt names to combine
 * @param {Object} variables - Variables to inject into prompts
 * @returns {Promise<string>} Combined prompt
 */
export async function composePrompts(promptNames, variables = {}) {
  const prompts = await Promise.all(
    promptNames.map(name => loadPrompt(name))
  );
  
  let combined = prompts.filter(p => p).join('\n\n---\n\n');
  
  // Inject variables
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`{{${key}}}`, 'g');
    combined = combined.replace(regex, value);
  }
  
  return combined;
}

/**
 * Build a complete system prompt for the AI assistant
 * Combines objective, context, and stage-specific prompts with brand voice
 * @param {string} stage - Current conversation stage: 'greeting', 'briefing', 'quote', 'followup'
 * @param {Object} context - Additional context variables
 * @returns {Promise<string>} Complete system prompt
 */
export async function buildSystemPrompt(stage = 'briefing', context = {}) {
  const prompts = ['objective', 'context']; // Core identity files
  
  // Add stage-specific prompts
  switch (stage) {
    case 'briefing':
      prompts.push('briefing');
      break;
    case 'quote':
      prompts.push('quote-builder');
      break;
    case 'followup':
      prompts.push('followup');
      break;
    case 'actions':
      prompts.push('actions');
      break;
    case 'roadmap':
      prompts.push('roadmap');
      break;
  }
  
  // Load context files (tone, knowledge, pricing, faq)
  const [tone, knowledge, faq] = await Promise.all([
    loadContext('tone'),
    loadContext('knowledge'),
    loadContext('faq')
  ]);
  
  // Compose everything
  const mainPrompt = await composePrompts(prompts, context);
  
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
 * Extract variables from a markdown prompt
 * Finds all {{variable}} placeholders
 * @param {string} promptContent - Prompt markdown content
 * @returns {string[]} Array of variable names
 */
export function extractVariables(promptContent) {
  const regex = /{{(\w+)}}/g;
  const matches = [...promptContent.matchAll(regex)];
  return matches.map(match => match[1]);
}

/**
 * Validate that all required variables are provided
 * @param {string} promptContent - Prompt content with variables
 * @param {Object} variables - Variables object
 * @returns {Object} { valid: boolean, missing: string[] }
 */
export function validateVariables(promptContent, variables) {
  const required = extractVariables(promptContent);
  const provided = Object.keys(variables);
  const missing = required.filter(v => !provided.includes(v));
  
  return {
    valid: missing.length === 0,
    missing
  };
}

/**
 * Inject variables into a prompt template
 * @param {string} template - Prompt template with {{variables}}
 * @param {Object} variables - Variables to inject
 * @param {boolean} strict - Throw error if variables are missing
 * @returns {string} Processed prompt
 */
export function injectVariables(template, variables, strict = false) {
  if (strict) {
    const validation = validateVariables(template, variables);
    if (!validation.valid) {
      throw new Error(`Missing required variables: ${validation.missing.join(', ')}`);
    }
  }
  
  let result = template;
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`{{${key}}}`, 'g');
    result = result.replace(regex, String(value));
  }
  
  return result;
}

/**
 * Load an example from the examples directory
 * @param {string} exampleName - Name of the example file (without .json extension)
 * @returns {Promise<Object>} Parsed example data
 */
export async function loadExample(exampleName) {
  try {
    const examplePath = path.join(process.cwd(), 'src', 'data', 'examples', `${exampleName}.json`);
    const content = await fs.readFile(examplePath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.error(`Error loading example "${exampleName}":`, error.message);
    return null;
  }
}

// Export convenience functions for common prompt combinations
export const PromptStages = {
  GREETING: 'greeting',
  BRIEFING: 'briefing',
  QUOTE: 'quote',
  FOLLOWUP: 'followup'
};

/**
 * Get a ready-to-use system prompt for a specific stage
 * @param {string} stage - Conversation stage
 * @param {Object} context - Context variables
 * @returns {Promise<string>} System prompt
 */
export async function getSystemPrompt(stage, context = {}) {
  return buildSystemPrompt(stage, context);
}

