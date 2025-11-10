/**
 * Response Guardrails for Telos AI
 * Ensures responses stay on-topic and within word limits
 */

interface GuardrailResult {
  isValid: boolean;
  isOffTopic: boolean;
  wordCount: number;
  maxWords: number;
  redirectMessage?: string;
}

const MAX_WORDS = 200;
const TOPIC_KEYWORDS = [
  'automation', 'ai', 'artificial intelligence', 'machine learning', 'workflow',
  'process', 'system', 'integration', 'software', 'technology', 'digital',
  'business', 'company', 'project', 'solution', 'strategy', 'consulting',
  'development', 'build', 'create', 'design', 'implement', 'optimize',
  'efficiency', 'productivity', 'roi', 'budget', 'timeline', 'deliverable',
  'quote', 'proposal', 'estimate', 'audit', 'assessment', 'transformation',
  'humanity', 'human', 'amplify', 'telos', 'are you human'
];

const OFF_TOPIC_KEYWORDS = [
  'recipe', 'cooking', 'weather', 'sports', 'politics', 'religion',
  'medical advice', 'legal advice', 'financial advice', 'investment',
  'stock', 'crypto', 'bitcoin', 'gambling', 'dating', 'relationship advice',
  'personal problems', 'therapy', 'counseling', 'health', 'diet', 'exercise',
  'entertainment', 'movies', 'music', 'celebrity', 'gossip', 'news',
  'current events', 'history', 'philosophy', 'science fiction', 'fantasy'
];

const REDIRECT_MESSAGES = [
  "Interesting tangent! But let's focus on what we do best — amplifying your humanity through intelligent automation. What challenge are you looking to solve?",
  "I appreciate the curiosity, but I'm here to help with automation, AI strategy, and digital transformation. What's your project about?",
  "That's outside my expertise! I specialize in helping businesses automate workflows and build AI solutions. What can I help you automate?",
  "Let's pivot back to what I'm built for — turning your ideas into intelligent systems. What problem are you trying to solve?",
  "I'm laser-focused on automation and AI solutions. What's the biggest inefficiency in your current workflow?",
  "While that's fascinating, I'm here to help with digital transformation and automation. What's your project vision?",
  "That's not quite my domain! I help businesses amplify their humanity through smart automation. What challenge can we tackle together?",
  "Interesting, but let's get back to what I do best — building intelligent systems. What automation opportunity are you exploring?"
];

/**
 * Count words in a text string
 */
export function countWords(text: string): number {
  if (!text || typeof text !== 'string') return 0;
  return text.trim().split(/\s+/).filter(word => word.length > 0).length;
}

/**
 * Check if a response is on-topic based on keywords
 */
export function isOnTopic(text: string): boolean {
  if (!text || typeof text !== 'string') return false;
  
  const lowerText = text.toLowerCase();
  
  // Check for off-topic keywords first (stronger signal)
  const hasOffTopic = OFF_TOPIC_KEYWORDS.some(keyword => 
    lowerText.includes(keyword.toLowerCase())
  );
  
  if (hasOffTopic) {
    // If it has off-topic keywords, check if it also has on-topic keywords
    // (might be discussing automation in context of something else)
    const hasOnTopic = TOPIC_KEYWORDS.some(keyword => 
      lowerText.includes(keyword.toLowerCase())
    );
    
    // If it has both, it might be on-topic (e.g., "automation in healthcare")
    // If only off-topic, it's definitely off-topic
    return hasOnTopic;
  }
  
  // Check for on-topic keywords
  const hasOnTopic = TOPIC_KEYWORDS.some(keyword => 
    lowerText.includes(keyword.toLowerCase())
  );
  
  // If no keywords at all, check if it's a short response that might be part of conversation flow
  // (like "yes", "no", "thanks", etc.)
  if (!hasOnTopic && text.length < 50) {
    return true; // Short responses are likely part of conversation flow
  }
  
  return hasOnTopic;
}

/**
 * Generate a fun redirect message when off-topic
 */
export function generateRedirectMessage(): string {
  const randomIndex = Math.floor(Math.random() * REDIRECT_MESSAGES.length);
  return REDIRECT_MESSAGES[randomIndex];
}

/**
 * Validate response against guardrails
 */
export function validateResponse(response: string): GuardrailResult {
  const wordCount = countWords(response);
  const isOffTopic = !isOnTopic(response);
  
  const result: GuardrailResult = {
    isValid: true,
    isOffTopic,
    wordCount,
    maxWords: MAX_WORDS
  };
  
  // Check word limit
  if (wordCount > MAX_WORDS) {
    result.isValid = false;
    return result;
  }
  
  // Check topic relevance
  if (isOffTopic) {
    result.isValid = false;
    result.redirectMessage = generateRedirectMessage();
    return result;
  }
  
  return result;
}

/**
 * Truncate response to word limit while preserving sentences
 */
export function truncateToWordLimit(text: string, maxWords: number = MAX_WORDS): string {
  const words = text.trim().split(/\s+/);
  
  if (words.length <= maxWords) {
    return text;
  }
  
  // Take first maxWords words
  const truncated = words.slice(0, maxWords).join(' ');
  
  // Try to end on a sentence boundary
  const lastPeriod = truncated.lastIndexOf('.');
  const lastExclamation = truncated.lastIndexOf('!');
  const lastQuestion = truncated.lastIndexOf('?');
  const lastSentenceEnd = Math.max(lastPeriod, lastExclamation, lastQuestion);
  
  if (lastSentenceEnd > truncated.length * 0.7) {
    // If we found a sentence end in the last 30% of text, use it
    return truncated.substring(0, lastSentenceEnd + 1).trim();
  }
  
  // Otherwise, add ellipsis
  return truncated.trim() + '...';
}

