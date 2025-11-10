import type { APIRoute } from 'astro';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { getChatCompletion, extractLeadInfo, isOpenAIConfigured } from '../../lib/openai';
import { limitMessageLength, needsSummarization, createConversationSummary } from '../../utils/tokenManager';
import { triggerN8NWebhook, isN8NConfigured } from '../../lib/n8nTrigger';
import { validateAndCleanEmail, getEmailErrorMessage } from '../../utils/emailValidator';
import { validateProjectQuality, hasEnoughDetail } from '../../utils/projectValidator';
import { validateResponse, truncateToWordLimit, countWords } from '../../utils/responseGuardrails';

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
        
        // Final guardrail check (double-check in case something slipped through)
        const finalValidation = validateResponse(reply);
        if (!finalValidation.isValid) {
          if (finalValidation.isOffTopic && finalValidation.redirectMessage) {
            console.log('⚠️ Final check: Response off-topic, using redirect');
            reply = finalValidation.redirectMessage;
          } else if (finalValidation.wordCount > finalValidation.maxWords) {
            console.log(`⚠️ Final check: Response too long (${finalValidation.wordCount} words), truncating`);
            reply = truncateToWordLimit(reply, finalValidation.maxWords);
          }
        }
        
        console.log(`✅ Response validated: ${finalValidation.wordCount} words, on-topic: ${!finalValidation.isOffTopic}`);

        // ⚠️ CRITICAL: Extract lead info DURING the 5-message sequence!
        // Messages 3-5 collect Name, Email, Company - we need to extract IMMEDIATELY
        const messageCount = conversationHistory.length;
        
        // AGGRESSIVE EXTRACTION during critical collection phase (messages 2-10)
        // This covers all user responses during name/email/company collection
        if (messageCount >= 2 && messageCount <= 10) {
          console.log(`🎯 CRITICAL PHASE: Extracting lead info at message ${messageCount}...`);
          const extractedInfo = await extractLeadInfo(messages);
          if (extractedInfo) {
            console.log('✅ Extracted data:', JSON.stringify(extractedInfo, null, 2));
            
            // ✉️ VALIDATE EMAIL before accepting it
            if (extractedInfo.email) {
              const validatedEmail = validateAndCleanEmail(extractedInfo.email);
              if (validatedEmail) {
                extractedInfo.email = validatedEmail;
                console.log(`✅ Email validated: ${validatedEmail}`);
              } else {
                console.log(`❌ Invalid email format: "${extractedInfo.email}"`);
                // Don't save invalid email - Telos will re-ask
                delete extractedInfo.email;
              }
            }
            
            Object.assign(leadData, extractedInfo);
            shouldSaveLead = true;
          }
        }
        // Continue regular extraction after message 10 (every 3 messages)
        else if (messageCount > 10 && messageCount % 3 === 0) {
          console.log(`📊 Regular extraction at message ${messageCount}...`);
          const extractedInfo = await extractLeadInfo(messages);
          if (extractedInfo) {
            console.log('✅ Extracted data:', JSON.stringify(extractedInfo, null, 2));
            
            // ✉️ VALIDATE EMAIL before accepting it
            if (extractedInfo.email) {
              const validatedEmail = validateAndCleanEmail(extractedInfo.email);
              if (validatedEmail) {
                extractedInfo.email = validatedEmail;
                console.log(`✅ Email validated: ${validatedEmail}`);
              } else {
                console.log(`❌ Invalid email format: "${extractedInfo.email}"`);
                // Don't save invalid email - Telos will re-ask
                delete extractedInfo.email;
              }
            }
            
            Object.assign(leadData, extractedInfo);
            shouldSaveLead = true;
          }
        }

        // ALWAYS save if we have any lead data
        if (Object.keys(leadData).length > 0) {
          console.log(`💾 Saving lead data (${Object.keys(leadData).length} fields)...`);
          shouldSaveLead = true;
        }

        // ✅ VALIDATE PROJECT DATA QUALITY (not just presence!)
        const projectValidation = validateProjectQuality({
          problem_text: leadData.problem_text,
          automation_area: leadData.automation_area,
          tools_used: leadData.tools_used,
          budget_range: leadData.budget_range,
          timeline: leadData.timeline
        });

        // Check if we have all required data WITH enough quality to trigger n8n automation
        const hasRequiredData = leadData.name && 
                                leadData.email && 
                                leadData.company && 
                                projectValidation.isValid; // ← NEW: Check quality, not just presence!
        
        if (!projectValidation.isValid && leadData.problem_text) {
          console.log('⚠️ Project data exists but lacks quality:', {
            missingFields: projectValidation.missingFields,
            lowQualityFields: projectValidation.lowQualityFields,
            suggestions: projectValidation.suggestions
          });
        }
        
        // If AI is confirming quote send, trigger n8n workflow
        if (hasRequiredData && 
            (reply.toLowerCase().includes('send') || 
             reply.toLowerCase().includes('email') || 
             reply.toLowerCase().includes('inbox') ||
             reply.toLowerCase().includes('proposal'))) {
          
          console.log('🎯 Lead qualified! Triggering n8n automation workflow...');
          
          // Trigger n8n webhook for automation (email, PDF, Slack, etc.)
          if (isN8NConfigured()) {
            const n8nResult = await triggerN8NWebhook({
              leadId: currentLeadId || 'pending',
              name: leadData.name,
              email: leadData.email,
              company: leadData.company,
              project_title: leadData.automation_area ? `${leadData.automation_area} Automation` : 'AI Automation Project',
              project_summary: leadData.problem_text,
              tools_used: leadData.tools_used || [],
              budget_range: leadData.budget_range,
              timeline: leadData.urgency,
              urgency: leadData.urgency,
              automation_area: leadData.automation_area,
              interest_level: leadData.interest_level,
              source: 'Telos Chat',
            });
            
            if (n8nResult.success) {
              console.log('✅ n8n workflow triggered successfully!');
            } else {
              console.log('⚠️ n8n trigger failed:', n8nResult.message);
            }
          } else {
            console.log('⚠️ n8n not configured, skipping automation');
          }
          
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

