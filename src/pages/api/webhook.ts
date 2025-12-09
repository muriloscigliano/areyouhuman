/**
 * Webhook API Endpoint
 * Handles incoming webhooks from database triggers and external services
 * with proper security, validation, and email template integration
 *
 * Updated: Now uses Neon PostgreSQL instead of Supabase
 */

import type { APIRoute } from 'astro';
import {
  isDatabaseConfigured,
  updateLeadStatus as dbUpdateLeadStatus,
  getQuoteWithLead,
  updateQuoteStatus,
  sql,
} from '../../lib/db';
import { sendEmail } from '../../lib/sendEmail';
import { verifyWebhookSignature, getEnvVar } from '../../lib/security';
import {
  generateWelcomeEmail,
  generateQuoteAcceptedEmail,
  generateQuoteDeclinedEmail,
  generateTeamNotificationEmail,
} from '../../templates/emails';
import type { WebhookPayload, WebhookEvent, LeadData } from '../../types';

// =============================================================================
// TYPES
// =============================================================================

interface LeadCreatedData {
  leadId?: string;
  id?: string;
  name: string;
  email: string;
  company?: string;
  automation_area?: string;
  problem_text?: string;
}

interface QuoteEventData {
  quote_id: string;
  reason?: string;
}

interface ConversationCompletedData {
  conversation_id: string;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const QUALIFIED_LEAD_SCORE_THRESHOLD = 70;
const TEAM_NOTIFICATION_EMAIL = getEnvVar('TEAM_NOTIFICATION_EMAIL');

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Update lead status in database
 */
async function updateLeadStatus(
  leadId: string,
  status: LeadData['status'],
  _additionalFields: Record<string, unknown> = {}
): Promise<void> {
  if (!isDatabaseConfigured() || !leadId) return;

  const success = await dbUpdateLeadStatus(leadId, status);
  if (success) {
    console.log(`✅ Lead status updated to "${status}"`);
  } else {
    console.error(`Error updating lead status to "${status}"`);
  }
}

/**
 * Send team notification for new qualified leads
 */
async function notifyTeam(leadData: LeadCreatedData): Promise<void> {
  if (!TEAM_NOTIFICATION_EMAIL) {
    console.log('📢 Team notification skipped (TEAM_NOTIFICATION_EMAIL not configured)');
    return;
  }

  const html = generateTeamNotificationEmail({
    leadName: leadData.name,
    leadEmail: leadData.email,
    company: leadData.company,
    projectSummary: leadData.problem_text,
  });

  await sendEmail({
    to: TEAM_NOTIFICATION_EMAIL,
    subject: `🎯 New Lead: ${leadData.name} from ${leadData.company || 'Unknown Company'}`,
    html,
  });

  console.log('✅ Team notification sent');
}

// =============================================================================
// EVENT HANDLERS
// =============================================================================

/**
 * Handle new lead creation
 */
async function handleLeadCreated(data: LeadCreatedData): Promise<void> {
  console.log('👤 New lead created:', data.email);

  try {
    // Send welcome email
    if (data.email && data.name) {
      const html = generateWelcomeEmail({
        name: data.name,
        company: data.company,
        automationArea: data.automation_area,
        problemText: data.problem_text,
      });

      await sendEmail({
        to: data.email,
        subject: '🤖 Your Automation Project - Next Steps',
        html,
      });

      console.log('✅ Welcome email sent to:', data.email);
    }

    // Send team notification
    await notifyTeam(data);

    // Update lead status
    const leadId = data.leadId || data.id;
    if (leadId) {
      await updateLeadStatus(leadId, 'contacted');
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error handling lead creation:', message);
  }
}

/**
 * Handle quote acceptance
 */
async function handleQuoteAccepted(data: QuoteEventData): Promise<void> {
  console.log('✅ Quote accepted:', data.quote_id);

  if (!isDatabaseConfigured()) return;

  try {
    // Update quote status
    await updateQuoteStatus(data.quote_id, 'accepted');

    // Get quote and lead details
    const result = await getQuoteWithLead(data.quote_id);

    if (!result) {
      console.error('Error fetching quote');
      return;
    }

    const { quote, lead } = result;

    // Send confirmation email
    if (lead?.email && lead?.name) {
      const html = generateQuoteAcceptedEmail({
        name: lead.name,
        company: lead.company || undefined,
        projectTitle: quote.project_title,
      });

      await sendEmail({
        to: lead.email,
        subject: `🎉 Quote Accepted - Let's Get Started!`,
        html,
      });

      console.log('✅ Acceptance confirmation sent to:', lead.email);
    }

    // Update lead status to converted
    if (lead?.id) {
      await updateLeadStatus(lead.id, 'converted');
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error handling quote acceptance:', message);
  }
}

/**
 * Handle quote decline
 */
async function handleQuoteDeclined(data: QuoteEventData): Promise<void> {
  console.log('❌ Quote declined:', data.quote_id);

  if (!isDatabaseConfigured()) return;

  try {
    // Update quote status
    await updateQuoteStatus(data.quote_id, 'declined', data.reason);

    // Get quote and lead details
    const result = await getQuoteWithLead(data.quote_id);

    if (!result) {
      console.error('Error fetching quote');
      return;
    }

    const { quote, lead } = result;

    // Send feedback request email
    if (lead?.email && lead?.name) {
      const html = generateQuoteDeclinedEmail({
        name: lead.name,
        projectTitle: quote.project_title,
        declineReason: data.reason,
      });

      await sendEmail({
        to: lead.email,
        subject: 'Thanks for considering us - Quick feedback?',
        html,
      });

      console.log('✅ Feedback request sent to:', lead.email);
    }

    // Update lead status to nurture
    if (lead?.id) {
      await updateLeadStatus(lead.id, 'nurture');
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error handling quote decline:', message);
  }
}

/**
 * Handle conversation completion
 */
async function handleConversationCompleted(data: ConversationCompletedData): Promise<void> {
  console.log('💬 Conversation completed:', data.conversation_id);

  if (!isDatabaseConfigured()) return;

  const client = sql();
  if (!client) return;

  try {
    // Get conversation and lead details
    const result = await client`
      SELECT
        c.id,
        l.id as lead_id,
        l.name as lead_name,
        l.email as lead_email,
        l.company as lead_company,
        l.lead_score,
        l.problem_text,
        l.automation_area,
        l.budget_range
      FROM conversations c
      LEFT JOIN leads l ON c.lead_id = l.id
      WHERE c.id = ${data.conversation_id}
    `;

    if (!result[0]) {
      console.error('Error fetching conversation');
      return;
    }

    const row = result[0] as Record<string, unknown>;

    // Update conversation status
    await client`
      UPDATE conversations
      SET status = 'completed', completed_at = ${new Date().toISOString()}
      WHERE id = ${data.conversation_id}
    `;

    console.log('✅ Conversation marked as completed');

    // Check if lead is qualified for quote generation
    const leadScore = row.lead_score as number | null;
    const isQualified = leadScore && leadScore >= QUALIFIED_LEAD_SCORE_THRESHOLD;

    if (isQualified && row.lead_id) {
      console.log(`🎯 Lead is qualified (score: ${leadScore}) - ready for quote generation`);

      // Update lead status to qualified
      await updateLeadStatus(row.lead_id as string, 'qualified');

      // Send welcome email with next steps
      if (row.lead_email && row.lead_name) {
        const html = generateWelcomeEmail({
          name: row.lead_name as string,
          company: row.lead_company as string | undefined,
          automationArea: row.automation_area as string | undefined,
          problemText: row.problem_text as string | undefined,
        });

        await sendEmail({
          to: row.lead_email as string,
          subject: '🎯 Your Custom Proposal is Being Prepared',
          html,
        });
      }
    } else {
      console.log(`⚠️ Lead not qualified (score: ${leadScore || 'N/A'}) - adding to nurture`);

      if (row.lead_id) {
        await updateLeadStatus(row.lead_id as string, 'nurture');
      }
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error handling conversation completion:', message);
  }
}

// =============================================================================
// API ROUTE HANDLERS
// =============================================================================

export const POST: APIRoute = async ({ request }) => {
  try {
    // Get raw body for signature verification
    const rawBody = await request.text();
    const signature = request.headers.get('x-webhook-signature');
    const webhookSecret = getEnvVar('WEBHOOK_SECRET');

    // Verify webhook signature (if secret is configured)
    if (webhookSecret) {
      if (!verifyWebhookSignature(rawBody, signature, webhookSecret)) {
        console.warn('⚠️ Invalid webhook signature');
        return new Response(
          JSON.stringify({ error: 'Unauthorized' }),
          { status: 401, headers: { 'Content-Type': 'application/json' } }
        );
      }
      console.log('✅ Webhook signature verified');
    }

    // Parse payload
    const payload = JSON.parse(rawBody) as WebhookPayload;
    const { event, data } = payload;

    console.log('🔔 Webhook received:', event);

    // Route to appropriate handler
    switch (event as WebhookEvent) {
      case 'lead.created':
        await handleLeadCreated(data as LeadCreatedData);
        break;

      case 'quote.accepted':
        await handleQuoteAccepted(data as QuoteEventData);
        break;

      case 'quote.declined':
        await handleQuoteDeclined(data as QuoteEventData);
        break;

      case 'conversation.completed':
        await handleConversationCompleted(data as ConversationCompletedData);
        break;

      default:
        console.log('Unknown event type:', event);
    }

    return new Response(
      JSON.stringify({ success: true, event }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Webhook error:', errorMessage);

    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

/**
 * GET endpoint for webhook verification
 * Required by some services (like Stripe) for endpoint validation
 */
export const GET: APIRoute = async ({ url }) => {
  const challenge = url.searchParams.get('challenge');

  if (challenge) {
    return new Response(challenge, {
      status: 200,
      headers: { 'Content-Type': 'text/plain' },
    });
  }

  return new Response(
    JSON.stringify({
      status: 'ok',
      message: 'Webhook endpoint is active',
      timestamp: new Date().toISOString(),
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
};
