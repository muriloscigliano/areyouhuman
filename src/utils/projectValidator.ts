/**
 * Project Data Quality Validation
 * Ensures we have enough context to create a proper quote
 */

interface ProjectData {
  problem_text?: string | null;
  automation_area?: string | null;
  tools_used?: string[] | null;
  budget_range?: string | null;
  timeline?: string | null;
}

interface ValidationResult {
  isValid: boolean;
  missingFields: string[];
  lowQualityFields: string[];
  suggestions: string[];
}

/**
 * Validates if project description has enough detail for a quote
 */
export function validateProjectQuality(data: ProjectData): ValidationResult {
  const missingFields: string[] = [];
  const lowQualityFields: string[] = [];
  const suggestions: string[] = [];

  // Check for missing critical fields
  if (!data.problem_text || data.problem_text.trim() === '') {
    missingFields.push('problem_text');
    suggestions.push("What specific challenge or problem are you trying to solve?");
  } else if (data.problem_text.trim().length < 20) {
    // Too vague: "automation", "AI stuff", "help me"
    lowQualityFields.push('problem_text');
    suggestions.push("Can you tell me more about the problem? What's the context? Why is it important?");
  }

  if (!data.automation_area || data.automation_area.trim() === '') {
    missingFields.push('automation_area');
    suggestions.push("What type of solution are you looking for? (e.g., payment automation, chatbot, CRM integration)");
  } else if (data.automation_area.trim().length < 10) {
    // Too vague: "AI", "automation", "bot"
    lowQualityFields.push('automation_area');
    suggestions.push("What kind of automation exactly? Give me more details about what it should do.");
  }

  // Optional but nice to have
  if (!data.budget_range || data.budget_range === 'No budget yet') {
    suggestions.push("Do you have a ballpark budget in mind? Even a rough range helps me tailor the proposal.");
  }

  if (!data.timeline || data.timeline === 'Flexible') {
    suggestions.push("When do you need this live? (e.g., 1 month, 3 months, urgent)");
  }

  const isValid = missingFields.length === 0 && lowQualityFields.length === 0;

  return {
    isValid,
    missingFields,
    lowQualityFields,
    suggestions
  };
}

/**
 * Checks if a text description has enough substance
 */
export function hasEnoughDetail(text: string | null | undefined, minLength = 20, minWords = 3): boolean {
  if (!text || typeof text !== 'string') {
    return false;
  }

  const cleaned = text.trim();
  const wordCount = cleaned.split(/\s+/).length;

  return cleaned.length >= minLength && wordCount >= minWords;
}

/**
 * Detects vague/generic responses that need follow-up
 */
export function isVagueResponse(text: string | null | undefined): boolean {
  if (!text) return true;

  const vaguePhrases = [
    'automation',
    'ai stuff',
    'help me',
    'not sure',
    'i don\'t know',
    'something',
    'anything',
    'whatever',
    'just automate',
    'make it better',
    'improve',
    'optimize',
    'fix',
    'build something',
  ];

  const cleaned = text.toLowerCase().trim();

  // Too short
  if (cleaned.length < 15) return true;

  // Contains only vague phrases
  return vaguePhrases.some(phrase => cleaned === phrase || cleaned.includes(phrase) && cleaned.length < 30);
}

/**
 * Generates a follow-up question based on what's missing
 */
export function getFollowUpQuestion(field: string): string {
  const questions: Record<string, string[]> = {
    problem_text: [
      "I'm intrigued! But I need more context. What's the full picture? What happens now that you want to change?",
      "Tell me more about this challenge. What's painful about the current way you're doing it?",
      "Let's dig deeper. What problem keeps you up at night? What would success look like?",
    ],
    automation_area: [
      "What kind of automation are we talking about? Payment flows? Customer service? Data entry? Give me specifics.",
      "I need to know what type of system you're envisioning. Is it a chatbot? A workflow automation? An AI agent?",
      "What exactly should this thing DO? Walk me through the ideal scenario.",
    ],
    budget_range: [
      "Do you have a rough budget in mind? Even a ballpark helps me design the right solution.",
      "What's your investment range? $5k? $20k? $50k+? Just so I know what scale we're playing at.",
    ],
    timeline: [
      "When do you need this live? Next month? 3 months? Yesterday? (That last one's tricky, but I can try.)",
      "What's your timeline looking like? Rush job or methodical rollout?",
    ],
  };

  const questionList = questions[field] || ["Tell me more about that."];
  return questionList[Math.floor(Math.random() * questionList.length)];
}

/**
 * Scores project data completeness (0-100)
 */
export function scoreProjectCompleteness(data: ProjectData): number {
  let score = 0;

  // Critical fields (60 points total)
  if (hasEnoughDetail(data.problem_text, 20, 3)) score += 30;
  if (hasEnoughDetail(data.automation_area, 10, 2)) score += 30;

  // Nice-to-have fields (40 points total)
  if (data.budget_range && data.budget_range !== 'No budget yet') score += 15;
  if (data.timeline && data.timeline !== 'Flexible') score += 15;
  if (data.tools_used && data.tools_used.length > 0) score += 10;

  return score;
}

