/**
 * Token Management Utility
 * Handles conversation trimming, token counting, and context optimization
 */

import { encode } from 'gpt-tokenizer';

interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface TokenBudget {
  systemPrompt: number;
  contextSummary: number;
  conversationHistory: number;
  total: number;
}

// Recommended token budgets for GPT-4o-mini
export const DEFAULT_TOKEN_BUDGET: TokenBudget = {
  systemPrompt: 1500,      // Telos identity and instructions
  contextSummary: 600,      // Conversation summary
  conversationHistory: 3000, // Recent messages
  total: 5100               // Safe limit (model supports ~8k input)
};

/**
 * Count tokens in a string
 */
export function countTokens(text: string): number {
  try {
    return encode(text).length;
  } catch (error) {
    // Fallback: rough estimate (1 token ≈ 4 characters)
    return Math.ceil(text.length / 4);
  }
}

/**
 * Count tokens in a message
 */
export function countMessageTokens(message: Message): number {
  // Role and formatting add ~4 tokens per message
  return countTokens(message.content) + 4;
}

/**
 * Trim conversation to fit within token budget
 * Keeps most recent messages, removes oldest first
 */
export function trimConversation(
  messages: Message[],
  maxTokens: number = DEFAULT_TOKEN_BUDGET.conversationHistory
): Message[] {
  const result: Message[] = [];
  let totalTokens = 0;

  // Process messages in reverse (newest first)
  for (let i = messages.length - 1; i >= 0; i--) {
    const message = messages[i];
    const messageTokens = countMessageTokens(message);

    if (totalTokens + messageTokens > maxTokens) {
      // Would exceed budget, stop here
      break;
    }

    result.unshift(message); // Add to beginning
    totalTokens += messageTokens;
  }

  return result;
}

/**
 * Create a conversation summary from messages
 * Useful for maintaining context when trimming old messages
 */
export function createConversationSummary(messages: Message[]): string {
  const userMessages = messages.filter(m => m.role === 'user');
  const assistantMessages = messages.filter(m => m.role === 'assistant');

  const summary: string[] = [];

  // Extract key information
  const firstUserMessage = userMessages[0]?.content;
  if (firstUserMessage) {
    summary.push(`Initial request: ${firstUserMessage.substring(0, 100)}...`);
  }

  // Count exchanges
  summary.push(`Total exchanges: ${Math.floor(messages.length / 2)}`);

  // Identify if lead data was collected
  const hasContactInfo = userMessages.some(m => 
    m.content.toLowerCase().includes('@') || 
    m.content.toLowerCase().includes('email')
  );
  
  if (hasContactInfo) {
    summary.push('Contact information collected');
  }

  return summary.join('. ');
}

/**
 * Optimize message payload for API call
 * Combines system prompt, summary, and trimmed history
 */
export function optimizeMessagePayload(
  systemPrompt: string,
  messages: Message[],
  conversationSummary?: string,
  budget: TokenBudget = DEFAULT_TOKEN_BUDGET
): Message[] {
  const optimized: Message[] = [];

  // 1. Add system prompt (always included)
  const systemTokens = countTokens(systemPrompt);
  if (systemTokens > budget.systemPrompt) {
    console.warn(`⚠️ System prompt (${systemTokens} tokens) exceeds budget (${budget.systemPrompt})`);
  }
  optimized.push({ role: 'system', content: systemPrompt });

  // 2. Add conversation summary if available
  if (conversationSummary) {
    const summaryTokens = countTokens(conversationSummary);
    if (summaryTokens <= budget.contextSummary) {
      optimized.push({ 
        role: 'system', 
        content: `Previous conversation context: ${conversationSummary}` 
      });
    }
  }

  // 3. Add trimmed conversation history
  const availableForHistory = budget.conversationHistory;
  const trimmedMessages = trimConversation(messages, availableForHistory);
  optimized.push(...trimmedMessages);

  // 4. Calculate total and warn if over budget
  const totalTokens = optimized.reduce(
    (sum, msg) => sum + countMessageTokens(msg), 
    0
  );

  if (totalTokens > budget.total) {
    console.warn(`⚠️ Total tokens (${totalTokens}) exceeds budget (${budget.total})`);
  } else {
    console.log(`✅ Token usage: ${totalTokens}/${budget.total} (${Math.round(totalTokens/budget.total*100)}%)`);
  }

  return optimized;
}

/**
 * Limit message length to prevent abuse
 */
export function limitMessageLength(
  message: string, 
  maxLength: number = 500
): string {
  if (message.length <= maxLength) {
    return message;
  }

  return message.substring(0, maxLength);
}

/**
 * Check if conversation needs summarization
 * Returns true if conversation is getting long
 */
export function needsSummarization(messages: Message[]): boolean {
  // Summarize after every 20 messages (10 exchanges)
  return messages.length >= 20 && messages.length % 20 === 0;
}

/**
 * Get token usage statistics
 */
export function getTokenStats(messages: Message[]): {
  totalMessages: number;
  totalTokens: number;
  averageTokensPerMessage: number;
  userTokens: number;
  assistantTokens: number;
} {
  const userMessages = messages.filter(m => m.role === 'user');
  const assistantMessages = messages.filter(m => m.role === 'assistant');

  const userTokens = userMessages.reduce(
    (sum, m) => sum + countMessageTokens(m), 
    0
  );
  const assistantTokens = assistantMessages.reduce(
    (sum, m) => sum + countMessageTokens(m), 
    0
  );
  const totalTokens = userTokens + assistantTokens;

  return {
    totalMessages: messages.length,
    totalTokens,
    averageTokensPerMessage: Math.round(totalTokens / messages.length),
    userTokens,
    assistantTokens
  };
}

