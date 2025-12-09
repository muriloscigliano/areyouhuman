import OpenAI from 'openai';
import { buildSystemPrompt, PromptStages } from '../utils/parsePrompt';
import { 
  optimizeMessagePayload, 
  limitMessageLength, 
  needsSummarization,
  getTokenStats,
  countTokens
} from '../utils/tokenManager.js';
import { 
  validateResponse, 
  truncateToWordLimit, 
  countWords 
} from '../utils/responseGuardrails.js';
import { 
  validateExtractedData,
  getHallucinationPreventionPrompt 
} from '../utils/dataValidator.js';

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
    
    // Higher temperature for first message to get more varied greetings
    const isFirstMessage = messages.length === 1 && messages[0]?.role === 'user';
    const temperature = isFirstMessage ? 0.9 : 0.7; // More creative for greetings
    
    const completion = await client.chat.completions.create({
      model: 'gpt-4o-mini', // Fast and cost-effective
      messages: optimizedMessages,
      temperature: temperature,
      max_tokens: 300, // Reduced to encourage shorter responses (200 words ≈ 250-300 tokens)
    });

    let response = completion.choices[0]?.message?.content || 'I apologize, but I encountered an issue. Could you please try again?';
    
    // Apply guardrails: check topic relevance and word limit
    const validation = validateResponse(response);
    
    if (!validation.isValid) {
      if (validation.isOffTopic && validation.redirectMessage) {
        // If off-topic, return redirect message instead
        console.log('⚠️ Response off-topic, redirecting:', { wordCount: validation.wordCount });
        return validation.redirectMessage;
      }
      
      if (validation.wordCount > validation.maxWords) {
        // If too long, truncate to word limit
        console.log(`⚠️ Response too long (${validation.wordCount} words), truncating to ${validation.maxWords}`);
        response = truncateToWordLimit(response, validation.maxWords);
      }
    }
    
    return response;
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
    // Load anti-hallucination prompt
    const antiHallucinationPrompt = getHallucinationPreventionPrompt();
    
    const completion = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `${antiHallucinationPrompt}

---

Extract lead information from this conversation. 

IMPORTANT: We use conversational questions, so recognize these patterns:
- "Who should I make the proposal out to?" → Extract NAME from user's answer
- "Where should I send your quote" / "teleport your quote" / "inbox" → Extract EMAIL
- "What's the name of your company or brand?" / "business" → Extract COMPANY
- "What's your challenge?" → Extract PROBLEM_TEXT
- "What tools are you using?" → Extract TOOLS_USED

Return JSON with: 
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

⚠️ CRITICAL RULES:
1. ONLY extract data that is EXPLICITLY stated in the conversation
2. If data is missing, return null - DO NOT guess or infer
3. Never use placeholder values (example@email.com, N/A, etc.)
4. Verify data exists in conversation before extracting
5. When in doubt, return null

Only include fields found in the conversation. Use null for unknown values.
Extract complete information even from short conversations.`
        },
        ...conversationMessages
      ],
      response_format: { type: 'json_object' },
      temperature: 0.2, // Lower temperature for more accurate extraction
    });

    const result = completion.choices[0]?.message?.content;
    const extractedData = result ? JSON.parse(result) : null;
    
    // Validate extracted data to prevent hallucinations
    if (extractedData) {
      const validation = validateExtractedData(extractedData, conversationMessages);
      
      if (validation.isHallucinated || validation.confidence < 0.5) {
        console.warn('⚠️ Potential hallucination detected:', {
          suspiciousFields: validation.suspiciousFields,
          warnings: validation.warnings,
          confidence: validation.confidence
        });
        
        // Remove suspicious fields
        validation.suspiciousFields.forEach(field => {
          console.log(`🗑️ Removing suspicious field: ${field}`);
          extractedData[field] = null;
        });
      }
      
      if (validation.warnings.length > 0) {
        console.log('⚠️ Validation warnings:', validation.warnings);
      }
      
      console.log(`✅ Data validation: confidence=${validation.confidence.toFixed(2)}, valid=${validation.isValid}`);
    }
    
    return extractedData;
  } catch (error) {
    console.error('Error extracting lead info:', error);
    return null;
  }
}

