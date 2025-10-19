import type { APIRoute } from 'astro';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { getChatCompletion, extractLeadInfo, isOpenAIConfigured } from '../../lib/openai';
import { limitMessageLength, needsSummarization, createConversationSummary } from '../../utils/tokenManager';

interface ChatRequest {
  message: string;
  conversationHistory?: Array<{ text: string; isBot: boolean; timestamp?: Date }>;
  leadId?: string;
  conversationId?: string;
}

interface ChatResponse {
  reply: string;
  leadId?: string;
  conversationId?: string;
  error?: string;
}

export const POST: APIRoute = async ({ request }) => {
  try {
    // Check if Supabase is configured
    if (!isSupabaseConfigured()) {
      console.warn('Supabase not configured - running in demo mode');
    }

    const body: ChatRequest = await request.json();
    let { message, conversationHistory = [], leadId, conversationId } = body;

    // LIMIT MESSAGE LENGTH to prevent abuse
    message = limitMessageLength(message, 500);
    if (message.length >= 500) {
      console.log('⚠️ Message truncated to 500 characters');
    }

    let reply = '';
    let shouldSaveLead = false;
    const leadData: any = {};

    // Use OpenAI if configured, otherwise fall back to rule-based
    if (isOpenAIConfigured()) {
      console.log('🤖 Using OpenAI GPT-4o-mini');
      // ==================================================
      // AI-POWERED CONVERSATION (OpenAI)
      // ==================================================
      try {
        // Convert conversation history to OpenAI format
        const messages = conversationHistory.map((msg: any) => ({
          role: msg.isBot ? 'assistant' as const : 'user' as const,
          content: msg.text
        }));

        // Add current message
        messages.push({ role: 'user', content: message });

        // CHECK IF CONVERSATION NEEDS SUMMARIZATION
        let conversationSummary: string | undefined;
        if (needsSummarization(messages)) {
          console.log('📝 Generating conversation summary...');
          conversationSummary = createConversationSummary(messages);
          console.log(`✅ Summary: ${conversationSummary}`);
          
          // TODO: Store summary in Supabase for future use
          if (conversationId && isSupabaseConfigured()) {
            await supabase
              .from('conversations')
              .update({ summary: conversationSummary })
              .eq('id', conversationId);
          }
        }

        // Get AI response with token optimization
        reply = await getChatCompletion(messages, 'briefing', {}, conversationSummary);

        // Extract structured lead info MORE FREQUENTLY (every 3 messages after message 6)
        // Old: only at 10, 14, 18... New: at 6, 9, 12, 15...
        if (conversationHistory.length >= 6 && conversationHistory.length % 3 === 0) {
          console.log(`📊 Extracting lead info at message ${conversationHistory.length}...`);
          const extractedInfo = await extractLeadInfo(messages);
          if (extractedInfo) {
            console.log('✅ Extracted data:', extractedInfo);
            Object.assign(leadData, extractedInfo);
            shouldSaveLead = true;
          }
        }

        // ALSO save after any message where we have partial data
        if (conversationHistory.length >= 4 && Object.keys(leadData).length > 0) {
          console.log(`💾 Saving partial lead data (${Object.keys(leadData).length} fields)...`);
          shouldSaveLead = true;
        }

        // Check if we have all required data to trigger quote generation
        const hasRequiredData = leadData.name && leadData.email && leadData.company && leadData.problem_text;
        
        // If AI is confirming quote send, trigger the workflow
        if (hasRequiredData && 
            (reply.toLowerCase().includes('send') || 
             reply.toLowerCase().includes('email') || 
             reply.toLowerCase().includes('inbox'))) {
          
          console.log('🎯 Triggering quote generation workflow...');
          
          // Note: In production, this would call /api/generate-quote
          // For now, we mark the lead as ready for quote
          leadData.status = 'ready_for_quote';
          shouldSaveLead = true;
        }

      } catch (error: any) {
        console.error('OpenAI error, falling back to rule-based:', error.message || error);
        console.error('Error details:', JSON.stringify(error, null, 2));
        // Fall through to rule-based system below
      }
    }

    // ==================================================
    // RULE-BASED FALLBACK (if OpenAI not configured or fails)
    // ==================================================
    if (!reply) {
      console.log('📋 Using rule-based responses');
      const messageCount = conversationHistory.length;

    // Conversation flow based on message count
    if (messageCount === 0) {
      reply = `Nice to meet you, ${message}! What company do you work for?`;
      leadData.name = message;
    } else if (messageCount === 2) {
      reply = `Great! What's your role at ${message}?`;
      leadData.company = message;
    } else if (messageCount === 4) {
      reply = `Interesting! What's the biggest challenge you're facing that automation could help solve?`;
      leadData.role = message;
    } else if (messageCount === 6) {
      reply = `I understand. That's a common challenge. What tools or systems are you currently using?`;
      leadData.problem_text = message;
    } else if (messageCount === 8) {
      reply = `Thanks for sharing! On a scale of 1-10, how urgent is it to solve this problem?`;
      leadData.tools_used = message.split(',').map((tool: string) => tool.trim());
    } else if (messageCount === 10) {
      reply = `Got it. Based on what you've told me, I can see several automation opportunities. What's your budget range for automation solutions? (e.g., <$5k, $5k-$20k, $20k-$50k, >$50k)`;
      leadData.urgency = message;
    } else if (messageCount === 12) {
      shouldSaveLead = true;
      leadData.budget_range = message;
      leadData.interest_level = 8;
      
      reply = `Perfect! I'm analyzing your workflow and I can already see some great opportunities:\n\n` +
              `🎯 **Automation Opportunities:**\n` +
              `• Process automation for repetitive tasks\n` +
              `• Data integration between your systems\n` +
              `• AI-powered insights and reporting\n\n` +
              `💰 **Estimated Impact:**\n` +
              `• 15-25 hours saved per week\n` +
              `• 40-60% reduction in manual errors\n` +
              `• ROI in 3-6 months\n\n` +
              `Our team will reach out within 24 hours with a personalized automation roadmap. Can I get your email?`;
    } else if (messageCount === 14) {
      shouldSaveLead = true;
      leadData.email = message;
      leadData.status = 'qualified';
      
      reply = `Excellent! Thanks ${conversationHistory[0]?.text || 'there'}! 🎉\n\n` +
              `I've sent your information to our team. You'll receive:\n` +
              `1. A detailed automation analysis within 24 hours\n` +
              `2. Custom recommendations for your workflow\n` +
              `3. Estimated ROI projections\n\n` +
              `We're excited to help you automate and scale! Talk soon! 🚀`;
    } else {
      reply = `Thanks for the information! Could you tell me more about your automation needs?`;
      }
    }

    // Save or update lead in Supabase (only if configured)
    if (shouldSaveLead && Object.keys(leadData).length > 0 && isSupabaseConfigured()) {
      try {
        let currentLeadId = leadId;
        let currentConversationId = conversationId;

        // Collect all previous data from conversation
        const fullLeadData = {
          name: conversationHistory[0]?.text || leadData.name,
          company: conversationHistory[2]?.text || leadData.company,
          role: conversationHistory[4]?.text || leadData.role,
          problem_text: conversationHistory[6]?.text || leadData.problem_text,
          tools_used: conversationHistory[8]?.text?.split(',').map((t: string) => t.trim()) || leadData.tools_used,
          urgency: conversationHistory[10]?.text || leadData.urgency,
          budget_range: conversationHistory[12]?.text || leadData.budget_range,
          email: leadData.email || null,
          source: 'chat',
          ...leadData
        };

        // Create or update lead
        if (currentLeadId) {
          // Update existing lead
          const { error } = await supabase
            .from('leads')
            .update(fullLeadData)
            .eq('id', currentLeadId);

          if (error) console.error('Error updating lead:', error);
        } else {
          // Create new lead
          const { data, error } = await supabase
            .from('leads')
            .insert([fullLeadData])
            .select('id')
            .single();

          if (error) {
            console.error('Error creating lead:', error);
          } else if (data) {
            currentLeadId = data.id;
          }
        }

        // Save conversation to conversations table
        if (currentLeadId) {
          const conversationMessages = [
            ...conversationHistory.map((msg: any) => ({
              role: msg.isBot ? 'assistant' : 'user',
              content: msg.text,
              timestamp: msg.timestamp || new Date()
            })),
            {
              role: 'user',
              content: message,
              timestamp: new Date()
            },
            {
              role: 'assistant',
              content: reply,
              timestamp: new Date()
            }
          ];

          if (currentConversationId) {
            // Update existing conversation
            const { error } = await supabase
              .from('conversations')
              .update({
                messages: conversationMessages,
                updated_at: new Date().toISOString()
              })
              .eq('id', currentConversationId);

            if (error) console.error('Error updating conversation:', error);
          } else {
            // Create new conversation
            const { data, error } = await supabase
              .from('conversations')
              .insert([{
                lead_id: currentLeadId,
                messages: conversationMessages,
                model_used: isOpenAIConfigured() ? 'gpt-4o-mini' : 'rule-based',
                status: 'active'
              }])
              .select('id')
              .single();

            if (error) {
              console.error('Error creating conversation:', error);
            } else if (data) {
              currentConversationId = data.id;
            }
          }
        }

        const response: ChatResponse = { 
          reply,
          leadId: currentLeadId,
          conversationId: currentConversationId
        };

        return new Response(
          JSON.stringify(response),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      } catch (err) {
        console.error('Error saving to database:', err);
      }
    }

    const response: ChatResponse = { reply };
    if (leadId) response.leadId = leadId;
    if (conversationId) response.conversationId = conversationId;

    return new Response(
      JSON.stringify(response),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Chat API error:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to process message',
        reply: 'Sorry, I encountered an error. Please try again.',
        debug: error.message
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

