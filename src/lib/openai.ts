import OpenAI from 'openai';

// Get API key - works in both server and build contexts
const getApiKey = () => {
  // Try import.meta.env first (Astro context)
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    return import.meta.env.OPENAI_API_KEY || '';
  }
  // Fallback to process.env (Node context)
  if (typeof process !== 'undefined' && process.env) {
    return process.env.OPENAI_API_KEY || '';
  }
  return '';
};

const apiKey = getApiKey();

export const openai = apiKey ? new OpenAI({ apiKey }) : null;

export const isOpenAIConfigured = () => {
  return !!apiKey && apiKey !== '' && !apiKey.includes('placeholder');
};

// System prompt for the automation consultant
export const SYSTEM_PROMPT = `You are an expert automation consultant for "Are You Human?" - a company that helps businesses implement intelligent automation solutions.

Your role:
1. Ask thoughtful questions to understand the customer's business challenges
2. Identify automation opportunities
3. Suggest practical solutions using tools like n8n, Zapier, Make.com, or custom solutions
4. Provide ROI estimates and timeline projections
5. Be friendly, professional, and consultative

Conversation Flow:
- Start by asking for their name
- Learn about their company and role
- Understand their biggest pain points
- Identify what tools they currently use
- Assess their budget and urgency
- Collect their email to send a detailed proposal

Keep responses concise (2-3 sentences max) and conversational.
Focus on understanding before proposing solutions.`;

interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export async function getChatCompletion(messages: Message[]): Promise<string> {
  if (!openai) {
    throw new Error('OpenAI is not configured. Please add OPENAI_API_KEY to environment variables.');
  }

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // Fast and cost-effective
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        ...messages
      ],
      temperature: 0.7,
      max_tokens: 300, // Keep responses concise
    });

    return completion.choices[0]?.message?.content || 'I apologize, but I encountered an issue. Could you please try again?';
  } catch (error) {
    console.error('OpenAI API error:', error);
    throw error;
  }
}

// Helper to extract structured data from conversation
export async function extractLeadInfo(conversationMessages: Message[]): Promise<any> {
  if (!openai) {
    return null;
  }

  try {
    const completion = await openai.chat.completions.create({
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

