import type { APIRoute } from 'astro';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';

/**
 * Webhook Handler
 * 
 * Receives webhooks from:
 * - Supabase (database triggers)
 * - n8n (automation workflows)
 * - External services
 * 
 * POST /api/webhook
 * 
 * Example payloads:
 * 
 * 1. New Lead Created:
 * {
 *   "event": "lead.created",
 *   "data": {
 *     "id": "uuid",
 *     "email": "user@example.com",
 *     "name": "John Doe"
 *   }
 * }
 * 
 * 2. Quote Status Changed:
 * {
 *   "event": "quote.status_changed",
 *   "data": {
 *     "quote_id": "uuid",
 *     "old_status": "draft",
 *     "new_status": "accepted"
 *   }
 * }
 * 
 * 3. n8n Workflow Trigger:
 * {
 *   "event": "workflow.trigger",
 *   "workflow_id": "workflow-123",
 *   "data": { ... }
 * }
 */

export const POST: APIRoute = async ({ request }) => {
  try {
    // Verify webhook signature (important for production!)
    const signature = request.headers.get('x-webhook-signature');
    const webhookSecret = import.meta.env.WEBHOOK_SECRET;
    
    if (webhookSecret && signature !== webhookSecret) {
      console.warn('⚠️ Invalid webhook signature');
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    const payload = await request.json();
    const { event, data } = payload;
    
    console.log('🔔 Webhook received:', event);
    
    // Route to appropriate handler
    switch (event) {
      case 'lead.created':
        await handleLeadCreated(data);
        break;
        
      case 'quote.accepted':
        await handleQuoteAccepted(data);
        break;
        
      case 'quote.declined':
        await handleQuoteDeclined(data);
        break;
        
      case 'conversation.completed':
        await handleConversationCompleted(data);
        break;
        
      case 'workflow.trigger':
        await handleWorkflowTrigger(data);
        break;
        
      default:
        console.log('Unknown event type:', event);
    }
    
    return new Response(
      JSON.stringify({ success: true, received: true }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Webhook error:', error);
    
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

/**
 * Handle new lead creation
 */
async function handleLeadCreated(data: any) {
  console.log('👤 New lead created:', data.email);
  
  // TODO: Trigger welcome email workflow
  // TODO: Notify team via Slack/Discord
  // TODO: Add to CRM
}

/**
 * Handle quote acceptance
 */
async function handleQuoteAccepted(data: any) {
  console.log('✅ Quote accepted:', data.quote_id);
  
  if (!isSupabaseConfigured()) return;
  
  try {
    // Update quote status
    await supabase
      .from('quotes')
      .update({ 
        status: 'accepted',
        accepted_at: new Date().toISOString()
      })
      .eq('id', data.quote_id);
    
    // TODO: Trigger onboarding workflow
    // TODO: Send confirmation email
    // TODO: Create project in project management tool
  } catch (error) {
    console.error('Error updating quote:', error);
  }
}

/**
 * Handle quote decline
 */
async function handleQuoteDeclined(data: any) {
  console.log('❌ Quote declined:', data.quote_id);
  
  if (!isSupabaseConfigured()) return;
  
  try {
    // Update quote status
    await supabase
      .from('quotes')
      .update({ 
        status: 'declined',
        declined_at: new Date().toISOString(),
        decline_reason: data.reason
      })
      .eq('id', data.quote_id);
    
    // TODO: Trigger follow-up workflow
    // TODO: Ask for feedback
  } catch (error) {
    console.error('Error updating quote:', error);
  }
}

/**
 * Handle conversation completion
 */
async function handleConversationCompleted(data: any) {
  console.log('💬 Conversation completed:', data.conversation_id);
  
  // TODO: Generate conversation summary
  // TODO: Extract action items
  // TODO: Trigger quote generation if ready
}

/**
 * Handle n8n workflow trigger
 */
async function handleWorkflowTrigger(data: any) {
  console.log('⚡ Workflow triggered:', data.workflow_id);
  
  // TODO: Execute workflow-specific logic
  // Could trigger:
  // - Email campaigns
  // - Data synchronization
  // - Report generation
  // - Social media posting
}

/**
 * GET endpoint for webhook verification
 * Some services (like Stripe) require a verification challenge
 */
export const GET: APIRoute = async ({ url }) => {
  const challenge = url.searchParams.get('challenge');
  
  if (challenge) {
    return new Response(challenge, {
      status: 200,
      headers: { 'Content-Type': 'text/plain' }
    });
  }
  
  return new Response(
    JSON.stringify({ 
      status: 'ok', 
      message: 'Webhook endpoint is active' 
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
};

