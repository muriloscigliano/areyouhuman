import OpenAI from 'openai';
import { buildSystemPrompt, PromptStages } from '../utils/parsePrompt.js';
import { 
  optimizeMessagePayload, 
  limitMessageLength, 
  needsSummarization,
  getTokenStats,
  countTokens
} from '../utils/tokenManager.js';

// Get API key - lazy evaluation for proper Astro context
const getApiKey = () => {
  // In Astro API routes, import.meta.env is available
  if (import.meta.env?.OPENAI_API_KEY) {
    return import.meta.env.OPENAI_API_KEY;
  }
  return '';
};

// Lazy OpenAI client initialization
let _openaiClient: OpenAI | null = null;
export const getOpenAIClient = () => {
  if (!_openaiClient) {
    const key = getApiKey();
    if (key && !key.includes('placeholder')) {
      _openaiClient = new OpenAI({ apiKey: key });
    }
  }
  return _openaiClient;
};

export const openai = getOpenAIClient(); // For backwards compatibility

export const isOpenAIConfigured = () => {
  const key = getApiKey();
  return !!key && key !== '' && !key.includes('placeholder');
};

// Build system prompt dynamically from markdown files
let _cachedSystemPrompt: string | null = null;
export async function getSystemPrompt(stage: string = 'briefing', context: any = {}): Promise<string> {
  // Cache the prompt to avoid re-reading files on every request
  if (!_cachedSystemPrompt) {
    try {
      _cachedSystemPrompt = await buildSystemPrompt(stage, context);
    } catch (error) {
      console.error('Error loading system prompt, using fallback:', error);
      // Fallback if markdown files can't be loaded
      _cachedSystemPrompt = `You are Telos, the AI strategist of Are You Human? 
      
Your mission: Transform human ideas into intelligent systems through conversation.
Stay curious, empathetic, and clear. Guide Humans through briefing, quote generation, and project planning.

Core behaviors:
- Ask one thoughtful question at a time
- Mirror their language and energy
- Never be transactional or robotic
- Focus on understanding before proposing
- Keep responses concise (2-3 sentences)

Remember: You're not just collecting data — you're designing a bridge between imagination and structure.`;
    }
  }
  return _cachedSystemPrompt;
}

// Legacy export for backwards compatibility
export const SYSTEM_PROMPT = await getSystemPrompt();

interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export async function getChatCompletion(
  messages: Message[], 
  stage: string = 'briefing',
  context: any = {},
  conversationSummary?: string
): Promise<string> {
  const client = getOpenAIClient();
  if (!client) {
    throw new Error('OpenAI is not configured. Please add OPENAI_API_KEY to environment variables.');
  }

  try {
    // Load the appropriate system prompt for the conversation stage
    const systemPrompt = await getSystemPrompt(stage, context);
    
    // TOKEN OPTIMIZATION: Trim conversation to fit budget
    const optimizedMessages = optimizeMessagePayload(
      systemPrompt,
      messages,
      conversationSummary
    );
    
    // Log token stats for monitoring
    const stats = getTokenStats(messages);
    console.log(`📊 Token stats - Total: ${stats.totalTokens}, User: ${stats.userTokens}, Assistant: ${stats.assistantTokens}`);
    
    const completion = await client.chat.completions.create({
      model: 'gpt-4o-mini', // Fast and cost-effective
      messages: optimizedMessages,
      temperature: 0.7,
      max_tokens: 500, // Keep responses concise
    });

    return completion.choices[0]?.message?.content || 'I apologize, but I encountered an issue. Could you please try again?';
  } catch (error) {
    console.error('OpenAI API error:', error);
    throw error;
  }
}

// Helper to extract structured data from conversation
export async function extractLeadInfo(conversationMessages: Message[]): Promise<any> {
  const client = getOpenAIClient();
  if (!client) {
    return null;
  }

  try {
    const completion = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `Extract lead information from this conversation. Return JSON with: 
          {
            "name": "string or null",
            "email": "string or null", 
            "company": "string or null",
            "role": "string or null",
            "industry": "string or null",
            "problem_text": "string or null",
            "budget_range": "string or null",
            "urgency": "string or null",
            "tools_used": ["array of tool names"],
            "interest_level": number 1-10,
            "automation_area": "string or null"
          }
          Only include fields mentioned in the conversation. Use null for unknown values.`
        },
        ...conversationMessages
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
    });

    const result = completion.choices[0]?.message?.content;
    return result ? JSON.parse(result) : null;
  } catch (error) {
    console.error('Error extracting lead info:', error);
    return null;
  }
}

