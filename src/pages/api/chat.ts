/**
 * Chat API Endpoint
 * Handles AI-powered conversations with lead qualification
 */

import type { APIRoute } from 'astro';
import { sql, isDatabaseConfigured, createLead, updateLead, createConversation, updateConversation } from '../../lib/db';
import { getChatCompletion, extractLeadInfo, isOpenAIConfigured } from '../../lib/openai';
import { triggerLeadProcessing, isAutomationConfigured } from '../../lib/automationTrigger';
import { limitMessageLength, needsSummarization, createConversationSummary } from '../../utils/tokenManager';
import { validateAndCleanEmail } from '../../utils/emailValidator';
import { validateProjectQuality } from '../../utils/projectValidator';
import { validateResponse, truncateToWordLimit } from '../../utils/responseGuardrails';
import { validateExtractedData, verifyDataCollection } from '../../utils/dataValidator';
import { sanitizeInput } from '../../lib/security';
import type {
  ChatRequest,
  ChatResponse,
  LeadData,
  Message,
  ConversationContext,
  ChatMessage,
} from '../../types';

// =============================================================================
// CONSTANTS
// =============================================================================

const MAX_MESSAGE_LENGTH = 500;
const EARLY_EXTRACTION_START = 1;
const EARLY_EXTRACTION_END = 5;
const REGULAR_EXTRACTION_START = 10;
const REGULAR_EXTRACTION_INTERVAL = 3;

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get time of day context for greetings
 */
function getTimeContext(): { timeOfDay: ConversationContext['timeOfDay']; isWeekend: boolean } {
  const hour = new Date().getHours();
  const day = new Date().getDay();

  let timeOfDay: ConversationContext['timeOfDay'];
  if (hour >= 5 && hour < 12) timeOfDay = 'morning';
  else if (hour >= 12 && hour < 17) timeOfDay = 'afternoon';
  else if (hour >= 17 && hour < 22) timeOfDay = 'evening';
  else timeOfDay = 'night';

  return {
    timeOfDay,
    isWeekend: day === 0 || day === 6,
  };
}

/**
 * Convert chat messages to OpenAI format
 */
function convertToOpenAIMessages(conversationHistory: ChatMessage[] | undefined): Message[] {
  return (conversationHistory || []).map((msg) => ({
    role: msg.isBot ? ('assistant' as const) : ('user' as const),
    content: msg.text,
  }));
}

/**
 * Check if we should extract lead info at this message count
 */
function shouldExtractLeadInfo(messageCount: number): boolean {
  if (messageCount >= EARLY_EXTRACTION_START && messageCount <= EARLY_EXTRACTION_END) {
    return true;
  }
  if (messageCount > REGULAR_EXTRACTION_START && messageCount % REGULAR_EXTRACTION_INTERVAL === 0) {
    return true;
  }
  return false;
}

/**
 * Process and validate extracted lead data
 */
async function processExtractedData(
  messages: Message[],
  messageCount: number
): Promise<Partial<LeadData>> {
  const extractedInfo = await extractLeadInfo(messages);

  if (!extractedInfo) {
    return {};
  }

  console.log('✅ Extracted data:', JSON.stringify(extractedInfo, null, 2));

  // Validate for hallucinations during early extraction
  if (messageCount <= EARLY_EXTRACTION_END) {
    const dataValidation = validateExtractedData(extractedInfo, messages);

    if (dataValidation.isHallucinated) {
      console.warn('⚠️ HALLUCINATION DETECTED:', {
        suspiciousFields: dataValidation.suspiciousFields,
        warnings: dataValidation.warnings,
        confidence: dataValidation.confidence,
      });

      for (const field of dataValidation.suspiciousFields) {
        console.log(`🗑️ Removing hallucinated field: ${field}`);
        delete extractedInfo[field as keyof typeof extractedInfo];
      }
    }

    const verification = verifyDataCollection(messages, ['name', 'email', 'company']);
    console.log('🔍 Data collection verification:', {
      collected: verification.collected,
      missing: verification.missing,
      needsFollowUp: verification.needsFollowUp,
    });
  }

  // Validate and clean email
  if (extractedInfo.email) {
    const validatedEmail = validateAndCleanEmail(extractedInfo.email);
    if (validatedEmail) {
      extractedInfo.email = validatedEmail;
      console.log(`✅ Email validated: ${validatedEmail}`);
    } else {
      console.log(`❌ Invalid email format: "${extractedInfo.email}"`);
      delete extractedInfo.email;
    }
  }

  return extractedInfo;
}

/**
 * Apply response guardrails
 */
function applyGuardrails(reply: string): string {
  const validation = validateResponse(reply);

  if (!validation.isValid) {
    if (validation.isOffTopic && validation.redirectMessage) {
      console.log('⚠️ Response off-topic, using redirect');
      return validation.redirectMessage;
    }

    if (validation.wordCount > validation.maxWords) {
      console.log(`⚠️ Response too long (${validation.wordCount} words), truncating`);
      return truncateToWordLimit(reply, validation.maxWords);
    }
  }

  console.log(`✅ Response validated: ${validation.wordCount} words, on-topic: ${!validation.isOffTopic}`);
  return reply;
}

/**
 * Check if lead is ready for quote
 */
function isLeadQualified(leadData: Partial<LeadData>, reply: string): boolean {
  const projectValidation = validateProjectQuality({
    problem_text: leadData.problem_text,
    automation_area: leadData.automation_area,
    tools_used: leadData.tools_used,
    budget_range: leadData.budget_range,
    timeline: leadData.timeline,
  });

  const hasRequiredData =
    leadData.name &&
    leadData.email &&
    leadData.company &&
    projectValidation.isValid;

  if (!projectValidation.isValid && leadData.problem_text) {
    console.log('⚠️ Project data exists but lacks quality:', {
      missingFields: projectValidation.missingFields,
      lowQualityFields: projectValidation.lowQualityFields,
      suggestions: projectValidation.suggestions,
    });
  }

  const replyLower = reply.toLowerCase();
  const mentionsDelivery =
    replyLower.includes('send') ||
    replyLower.includes('email') ||
    replyLower.includes('inbox') ||
    replyLower.includes('proposal');

  return Boolean(hasRequiredData && mentionsDelivery);
}

/**
 * Generate rule-based fallback response
 */
function getRuleBasedResponse(
  messageCount: number,
  currentMessage: string,
  history: ChatMessage[] | undefined
): { reply: string; leadData: Partial<LeadData> } {
  const leadData: Partial<LeadData> = {};

  switch (messageCount) {
    case 0:
      return {
        reply: `Nice to meet you, ${currentMessage}! What company do you work for?`,
        leadData: { name: currentMessage },
      };

    case 2:
      return {
        reply: `Great! What's your role at ${currentMessage}?`,
        leadData: { company: currentMessage },
      };

    case 4:
      return {
        reply: `Interesting! What's the biggest challenge you're facing that automation could help solve?`,
        leadData: { role: currentMessage },
      };

    case 6:
      return {
        reply: `I understand. That's a common challenge. What tools or systems are you currently using?`,
        leadData: { problem_text: currentMessage },
      };

    case 8:
      return {
        reply: `Thanks for sharing! On a scale of 1-10, how urgent is it to solve this problem?`,
        leadData: { tools_used: currentMessage.split(',').map((t) => t.trim()) },
      };

    case 10:
      return {
        reply: `Got it. Based on what you've told me, I can see several automation opportunities. What's your budget range for automation solutions? (e.g., <$5k, $5k-$20k, $20k-$50k, >$50k)`,
        leadData: { urgency: currentMessage },
      };

    case 12: {
      return {
        reply:
          `Perfect! I'm analyzing your workflow and I can already see some great opportunities:\n\n` +
          `🎯 **Automation Opportunities:**\n` +
          `• Process automation for repetitive tasks\n` +
          `• Data integration between your systems\n` +
          `• AI-powered insights and reporting\n\n` +
          `💰 **Estimated Impact:**\n` +
          `• 15-25 hours saved per week\n` +
          `• 40-60% reduction in manual errors\n` +
          `• ROI in 3-6 months\n\n` +
          `Our team will reach out within 24 hours with a personalized automation roadmap. Can I get your email?`,
        leadData: { budget_range: currentMessage, interest_level: 8 },
      };
    }

    case 14: {
      const userName = history?.[0]?.text || 'there';
      return {
        reply:
          `Excellent! Thanks ${userName}! 🎉\n\n` +
          `I've sent your information to our team. You'll receive:\n` +
          `1. A detailed automation analysis within 24 hours\n` +
          `2. Custom recommendations for your workflow\n` +
          `3. Estimated ROI projections\n\n` +
          `We're excited to help you automate and scale! Talk soon! 🚀`,
        leadData: { email: currentMessage, status: 'qualified' },
      };
    }

    default:
      return {
        reply: `Thanks for the information! Could you tell me more about your automation needs?`,
        leadData: {},
      };
  }
}

/**
 * Save lead data to Neon PostgreSQL
 */
async function saveToDatabase(
  leadData: Partial<LeadData>,
  conversationHistory: ChatMessage[] | undefined,
  currentMessage: string,
  reply: string,
  existingLeadId?: string,
  existingConversationId?: string
): Promise<{ leadId?: string; conversationId?: string; isNewLead?: boolean }> {
  if (!isDatabaseConfigured()) {
    console.warn('⚠️ Database not configured - skipping save');
    return {};
  }

  let currentLeadId = existingLeadId;
  let currentConversationId = existingConversationId;
  let isNewLead = false;

  try {
    const fullLeadData = {
      source: 'chat',
      ...leadData,
    };

    // Create or update lead
    if (currentLeadId) {
      const updated = await updateLead(currentLeadId, fullLeadData);
      if (!updated) {
        console.error('Error updating lead');
      }
    } else {
      const newLead = await createLead(fullLeadData);
      if (newLead) {
        currentLeadId = newLead.id;
        isNewLead = true;
        console.log('✅ New lead created:', currentLeadId);
      } else {
        console.error('Error creating lead');
      }
    }

    // Save conversation
    if (currentLeadId) {
      const conversationMessages = [
        ...(conversationHistory || []).map((msg) => ({
          role: msg.isBot ? 'assistant' : 'user',
          content: msg.text,
          timestamp: msg.timestamp || new Date().toISOString(),
        })),
        {
          role: 'user',
          content: currentMessage,
          timestamp: new Date().toISOString(),
        },
        {
          role: 'assistant',
          content: reply,
          timestamp: new Date().toISOString(),
        },
      ];

      if (currentConversationId) {
        const success = await updateConversation(currentConversationId, conversationMessages);
        if (!success) {
          console.error('Error updating conversation');
        }
      } else {
        const newConversation = await createConversation(currentLeadId, conversationMessages);
        if (newConversation) {
          currentConversationId = newConversation.id;
          console.log('✅ New conversation created:', currentConversationId);
        } else {
          console.error('Error creating conversation');
        }
      }
    }

    return { leadId: currentLeadId, conversationId: currentConversationId, isNewLead };
  } catch (err) {
    console.error('Error saving to database:', err);
    return { leadId: currentLeadId, conversationId: currentConversationId };
  }
}

// =============================================================================
// API ROUTE HANDLER
// =============================================================================

export const POST: APIRoute = async ({ request }) => {
  try {
    if (!isDatabaseConfigured()) {
      console.warn('⚠️ Database not configured - running in demo mode');
    }

    const body = (await request.json()) as ChatRequest;
    let { message, conversationHistory = [], leadId, conversationId } = body;

    // Sanitize and limit message length
    message = sanitizeInput(limitMessageLength(message, MAX_MESSAGE_LENGTH));
    if (message.length >= MAX_MESSAGE_LENGTH) {
      console.log('⚠️ Message truncated to max length');
    }

    let reply = '';
    let leadData: Partial<LeadData> = {};
    let shouldSaveLead = false;
    const messageCount = conversationHistory.length;

    // ==========================================================================
    // AI-POWERED CONVERSATION
    // ==========================================================================
    if (isOpenAIConfigured()) {
      console.log('🤖 Using OpenAI GPT-4o-mini');

      try {
        const messages = convertToOpenAIMessages(conversationHistory);
        messages.push({ role: 'user', content: message });

        // Check if summarization is needed
        let conversationSummary: string | undefined;
        if (needsSummarization(messages)) {
          console.log('📝 Generating conversation summary...');
          conversationSummary = createConversationSummary(messages);
          console.log(`✅ Summary: ${conversationSummary}`);
          // Summary is stored when conversation is updated
        }

        // Build conversation context
        const { timeOfDay, isWeekend } = getTimeContext();
        const needsContactInfo = !leadData.name || !leadData.email || !leadData.company;

        const context: ConversationContext = {
          isFirstMessage: messageCount === 0,
          needsContactInfo: needsContactInfo && messageCount < 5,
          messageCount,
          shouldNotAskProject: needsContactInfo,
          timeOfDay,
          isWeekend,
        };

        reply = await getChatCompletion(messages, 'briefing', context, conversationSummary);
        reply = applyGuardrails(reply);

        // Extract lead info if appropriate
        if (shouldExtractLeadInfo(messageCount)) {
          console.log(`🎯 Extracting lead info at message ${messageCount}...`);
          const extractedData = await processExtractedData(messages, messageCount);
          Object.assign(leadData, extractedData);
          shouldSaveLead = Object.keys(extractedData).length > 0;
        }

        // Always save if we have lead data
        if (Object.keys(leadData).length > 0) {
          console.log(`💾 Saving lead data (${Object.keys(leadData).length} fields)...`);
          shouldSaveLead = true;
        }

        // Check if lead is qualified
        if (isLeadQualified(leadData, reply)) {
          console.log('🎯 Lead qualified! Saving to database');
          shouldSaveLead = true;
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('OpenAI error, falling back to rule-based:', errorMessage);
      }
    }

    // ==========================================================================
    // RULE-BASED FALLBACK
    // ==========================================================================
    if (!reply) {
      console.log('📋 Using rule-based responses');
      const fallback = getRuleBasedResponse(messageCount, message, conversationHistory);
      reply = fallback.reply;
      Object.assign(leadData, fallback.leadData);
      shouldSaveLead = Object.keys(fallback.leadData).length > 0;
    }

    // ==========================================================================
    // SAVE TO DATABASE
    // ==========================================================================
    let isQualifiedLead = false;
    if (shouldSaveLead && Object.keys(leadData).length > 0) {
      const saved = await saveToDatabase(
        leadData,
        conversationHistory,
        message,
        reply,
        leadId,
        conversationId
      );

      if (saved.leadId) leadId = saved.leadId;
      if (saved.conversationId) conversationId = saved.conversationId;

      // Check if this is a qualified lead (has email, name, company, and problem)
      isQualifiedLead = Boolean(
        leadData.email &&
        leadData.name &&
        leadData.company &&
        (leadData.problem_text || leadData.automation_area)
      );
    }

    // ==========================================================================
    // TRIGGER AUTOMATION FOR QUALIFIED LEADS
    // ==========================================================================
    if (isQualifiedLead && leadId && isAutomationConfigured()) {
      console.log('🚀 Triggering automation for qualified lead:', leadId);

      // Fire and forget - don't block the chat response
      triggerLeadProcessing({
        leadId,
        name: leadData.name,
        email: leadData.email,
        company: leadData.company,
        project_summary: leadData.problem_text,
        automation_area: leadData.automation_area,
        tools_used: leadData.tools_used,
        budget_range: leadData.budget_range,
        timeline: leadData.timeline,
        urgency: leadData.urgency,
        interest_level: leadData.interest_level,
        source: 'Telos Chat',
      }).then(result => {
        if (result.success) {
          console.log('✅ Automation triggered successfully');
        } else {
          console.warn('⚠️ Automation trigger failed:', result.message);
        }
      }).catch(err => {
        console.error('❌ Automation trigger error:', err);
      });
    }

    // ==========================================================================
    // SEND RESPONSE
    // ==========================================================================
    const response: ChatResponse = { reply };
    if (leadId) response.leadId = leadId;
    if (conversationId) response.conversationId = conversationId;

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Chat API error:', errorMessage);

    return new Response(
      JSON.stringify({
        error: 'Failed to process message',
        reply: 'Sorry, I encountered an error. Please try again.',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
