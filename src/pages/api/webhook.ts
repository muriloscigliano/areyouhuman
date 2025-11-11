import type { APIRoute } from 'astro';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { sendEmail, sendQuoteEmail } from '../../lib/sendEmail';
import { triggerN8NWebhook } from '../../lib/n8nTrigger';

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
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

/**
 * Handle new lead creation
 * Triggered by n8n when it receives a qualified lead from Supabase
 */
async function handleLeadCreated(data: any) {
  console.log('👤 New lead created:', data.email);

  try {
    // Send welcome/thank you email to lead
    if (data.email && data.name) {
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background: linear-gradient(135deg, #fb6400 0%, #ff7a1a 100%);
              color: white;
              padding: 30px;
              text-align: center;
              border-radius: 8px;
              margin-bottom: 30px;
            }
            .content {
              background: #f8fafc;
              padding: 30px;
              border-radius: 8px;
              margin-bottom: 20px;
            }
            .footer {
              text-align: center;
              color: #64748b;
              font-size: 14px;
              margin-top: 30px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>🎉 Thanks for Connecting!</h1>
          </div>

          <div class="content">
            <p>Hi ${data.name},</p>

            <p>Thanks for chatting with Telos! I've passed your project details to our team, and they're already analyzing how we can help you with <strong>${data.automation_area || 'your automation needs'}</strong>.</p>

            <p><strong>What happens next?</strong></p>
            <ul>
              <li>📊 We're analyzing your requirements</li>
              <li>💰 Calculating ROI and pricing</li>
              <li>📝 Preparing a custom proposal</li>
            </ul>

            <p>You'll receive a detailed proposal in your inbox within 24 hours. It will include:</p>
            <ul>
              <li>✅ Tailored automation strategy</li>
              <li>⏱️ Timeline and milestones</li>
              <li>💵 Transparent pricing</li>
              <li>🚀 Next steps to get started</li>
            </ul>

            ${data.problem_text ? `
              <p><strong>Your Challenge:</strong><br>
              <em>"${data.problem_text}"</em></p>
            ` : ''}

            <p>In the meantime, if you have any questions or want to discuss your project further, just reply to this email!</p>

            <p>Stay Human. Stay Ahead.</p>

            <p>Best,<br>
            <strong>The Are You Human? Team</strong></p>
          </div>

          <div class="footer">
            <p>Are You Human? | AI-Powered Automation Consulting</p>
            <p><a href="https://areyouhuman.com">areyouhuman.com</a></p>
          </div>
        </body>
        </html>
      `;

      await sendEmail({
        to: data.email,
        subject: '🤖 Your Automation Project - Next Steps',
        html
      });

      console.log('✅ Welcome email sent to:', data.email);
    }

    // Notify team via Slack/Discord (if configured)
    // This would be handled by n8n workflow, but we log it here
    console.log('📢 Team notification: New qualified lead from', data.company || data.name);

    // Update lead status in Supabase
    if (isSupabaseConfigured() && data.leadId) {
      await supabase
        .from('leads')
        .update({
          status: 'contacted',
          last_contact_at: new Date().toISOString()
        })
        .eq('id', data.leadId);

      console.log('✅ Lead status updated to "contacted"');
    }

  } catch (error: any) {
    console.error('Error handling lead creation:', error.message);
    // Don't throw - we don't want to fail the webhook
  }
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

    // Get quote and lead details
    const { data: quote, error: quoteError } = await supabase
      .from('quotes')
      .select(`
        *,
        leads (
          id,
          name,
          email,
          company
        )
      `)
      .eq('id', data.quote_id)
      .single();

    if (quoteError || !quote) {
      console.error('Error fetching quote:', quoteError);
      return;
    }

    const lead = quote.leads;

    // Send confirmation email to client
    if (lead?.email && lead?.name) {
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background: linear-gradient(135deg, #10b981 0%, #059669 100%);
              color: white;
              padding: 30px;
              text-align: center;
              border-radius: 8px;
              margin-bottom: 30px;
            }
            .content {
              background: #f0fdf4;
              padding: 30px;
              border-radius: 8px;
              margin-bottom: 20px;
            }
            .footer {
              text-align: center;
              color: #64748b;
              font-size: 14px;
              margin-top: 30px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>🎉 Welcome Aboard!</h1>
          </div>

          <div class="content">
            <p>Hi ${lead.name},</p>

            <p>Fantastic news! We've received your acceptance for <strong>${quote.project_title}</strong>.</p>

            <p><strong>What happens next?</strong></p>
            <ul>
              <li>📅 We'll schedule a kickoff call within 48 hours</li>
              <li>📋 You'll receive access to our project dashboard</li>
              <li>👥 We'll introduce you to your dedicated team</li>
              <li>🚀 We'll finalize the project timeline</li>
            </ul>

            <p>Our team is thrilled to work with ${lead.company || 'you'} on this project. We're committed to delivering exceptional results.</p>

            <p>Keep an eye on your inbox for your onboarding materials and meeting invite!</p>

            <p>Excited to build something amazing together!</p>

            <p>Best,<br>
            <strong>The Are You Human? Team</strong></p>
          </div>

          <div class="footer">
            <p>Are You Human? | AI-Powered Automation Consulting</p>
            <p><a href="https://areyouhuman.com">areyouhuman.com</a></p>
          </div>
        </body>
        </html>
      `;

      await sendEmail({
        to: lead.email,
        subject: `🎉 Quote Accepted - Let's Get Started!`,
        html
      });

      console.log('✅ Acceptance confirmation sent to:', lead.email);
    }

    // Update lead status to converted
    if (lead?.id) {
      await supabase
        .from('leads')
        .update({
          status: 'converted',
          converted_at: new Date().toISOString()
        })
        .eq('id', lead.id);

      console.log('✅ Lead status updated to "converted"');
    }

    // Trigger onboarding workflow in n8n (if configured)
    // This would create project in PM tool, send Slack notifications, etc.
    console.log('📢 Onboarding workflow triggered for:', lead?.company || lead?.name);

  } catch (error: any) {
    console.error('Error handling quote acceptance:', error.message);
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

    // Get quote and lead details
    const { data: quote, error: quoteError } = await supabase
      .from('quotes')
      .select(`
        *,
        leads (
          id,
          name,
          email,
          company
        )
      `)
      .eq('id', data.quote_id)
      .single();

    if (quoteError || !quote) {
      console.error('Error fetching quote:', quoteError);
      return;
    }

    const lead = quote.leads;

    // Send feedback request email
    if (lead?.email && lead?.name) {
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
              color: white;
              padding: 30px;
              text-align: center;
              border-radius: 8px;
              margin-bottom: 30px;
            }
            .content {
              background: #f8fafc;
              padding: 30px;
              border-radius: 8px;
              margin-bottom: 20px;
            }
            .footer {
              text-align: center;
              color: #64748b;
              font-size: 14px;
              margin-top: 30px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>💭 Help Us Improve</h1>
          </div>

          <div class="content">
            <p>Hi ${lead.name},</p>

            <p>Thank you for considering Are You Human? for your <strong>${quote.project_title}</strong> project.</p>

            <p>We noticed that you decided not to move forward with our proposal. While we're sorry it wasn't the right fit, we'd love to learn how we can improve.</p>

            ${data.reason ? `
              <p><strong>Your feedback:</strong><br>
              <em>"${data.reason}"</em></p>
            ` : ''}

            <p><strong>Would you mind sharing more?</strong></p>
            <ul>
              <li>Was it pricing, timeline, or scope?</li>
              <li>Did you find a better alternative?</li>
              <li>Is there anything we could have done differently?</li>
            </ul>

            <p>Your honest feedback helps us serve clients like you better. Just reply to this email with your thoughts!</p>

            <p><strong>Still interested?</strong> If circumstances change, we'd be happy to revisit this conversation. We're here whenever you need us.</p>

            <p>Thanks again for your time,</p>

            <p>Best,<br>
            <strong>The Are You Human? Team</strong></p>
          </div>

          <div class="footer">
            <p>Are You Human? | AI-Powered Automation Consulting</p>
            <p><a href="https://areyouhuman.com">areyouhuman.com</a></p>
          </div>
        </body>
        </html>
      `;

      await sendEmail({
        to: lead.email,
        subject: 'Thanks for considering us - Quick feedback?',
        html
      });

      console.log('✅ Feedback request sent to:', lead.email);
    }

    // Update lead status to nurture (might come back later)
    if (lead?.id) {
      await supabase
        .from('leads')
        .update({
          status: 'nurture',
          last_contact_at: new Date().toISOString()
        })
        .eq('id', lead.id);

      console.log('✅ Lead status updated to "nurture"');
    }

    // Trigger nurture workflow in n8n
    // This could add them to a long-term drip campaign
    console.log('📧 Nurture workflow triggered for:', lead?.company || lead?.name);

  } catch (error: any) {
    console.error('Error handling quote decline:', error.message);
  }
}

/**
 * Handle conversation completion
 */
async function handleConversationCompleted(data: any) {
  console.log('💬 Conversation completed:', data.conversation_id);

  if (!isSupabaseConfigured()) return;

  try {
    // Get conversation and lead details
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select(`
        *,
        leads (
          id,
          name,
          email,
          company,
          lead_score,
          problem_text,
          automation_area,
          budget_range
        )
      `)
      .eq('id', data.conversation_id)
      .single();

    if (convError || !conversation) {
      console.error('Error fetching conversation:', convError);
      return;
    }

    const lead = conversation.leads;

    // Update conversation status
    await supabase
      .from('conversations')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString()
      })
      .eq('id', data.conversation_id);

    console.log('✅ Conversation marked as completed');

    // Check if lead is qualified for quote generation
    const isQualified = lead?.lead_score && lead.lead_score >= 70;

    if (isQualified && lead) {
      console.log('🎯 Lead is qualified (score:', lead.lead_score, ') - triggering quote generation');

      // Trigger n8n quote generation workflow
      await triggerN8NWebhook({
        leadId: lead.id,
        name: lead.name,
        email: lead.email,
        company: lead.company,
        project_title: lead.automation_area ? `${lead.automation_area} Automation` : 'AI Automation Project',
        project_summary: lead.problem_text,
        budget_range: lead.budget_range,
        automation_area: lead.automation_area,
        interest_level: 9, // High since conversation completed successfully
        source: 'Telos Chat - Completed Conversation'
      });

      // Update lead status
      await supabase
        .from('leads')
        .update({
          status: 'qualified',
          last_contact_at: new Date().toISOString()
        })
        .eq('id', lead.id);

      console.log('✅ Quote generation workflow triggered');

    } else {
      console.log('⚠️ Lead not qualified (score:', lead?.lead_score, ') - adding to nurture workflow');

      // Update lead status to nurture
      if (lead?.id) {
        await supabase
          .from('leads')
          .update({
            status: 'nurture',
            last_contact_at: new Date().toISOString()
          })
          .eq('id', lead.id);
      }
    }

  } catch (error: any) {
    console.error('Error handling conversation completion:', error.message);
  }
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

