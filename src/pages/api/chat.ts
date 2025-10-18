import type { APIRoute } from 'astro';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';

interface ChatRequest {
  message: string;
  conversationHistory?: Array<{ text: string; isBot: boolean }>;
  leadId?: string;
}

interface ChatResponse {
  reply: string;
  leadId?: string;
  error?: string;
}

export const POST: APIRoute = async ({ request }) => {
  try {
    // Check if Supabase is configured
    if (!isSupabaseConfigured()) {
      console.warn('Supabase not configured - running in demo mode');
    }

    const body: ChatRequest = await request.json();
    const { message, conversationHistory = [], leadId } = body;

    // Simple conversation flow logic
    // In production, you would integrate with OpenAI, Claude, or your preferred LLM
    const messageCount = conversationHistory.length;
    let reply = '';
    let shouldSaveLead = false;
    const leadData: any = {};

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

    // Save or update lead in Supabase (only if configured)
    if (shouldSaveLead && Object.keys(leadData).length > 0 && isSupabaseConfigured()) {
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
        conversation_history: [...conversationHistory, { text: message, isBot: false, timestamp: new Date() }],
        ...leadData
      };

      if (leadId) {
        // Update existing lead
        const { error } = await supabase
          .from('leads')
          .update(fullLeadData)
          .eq('id', leadId);

        if (error) {
          console.error('Error updating lead:', error);
        }
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
          return new Response(
            JSON.stringify({ reply, leadId: data.id }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
          );
        }
      }
    }

    const response: ChatResponse = { reply };
    if (leadId) response.leadId = leadId;

    return new Response(
      JSON.stringify(response),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Chat API error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to process message',
        reply: 'Sorry, I encountered an error. Please try again.'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

