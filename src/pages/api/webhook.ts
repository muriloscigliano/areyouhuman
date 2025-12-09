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
import { verifyWebhookSignature, getEnvVar, checkRateLimit } from '../../lib/security';
import { webhookLogger as log } from '../../lib/logger';
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
    log.info('Lead status updated', { leadId, status });
  } else {
    log.error('Error updating lead status', undefined, { leadId, status });
  }
}

/**
 * Send team notification for new qualified leads
 */
async function notifyTeam(leadData: LeadCreatedData): Promise<void> {
  if (!TEAM_NOTIFICATION_EMAIL) {
    log.debug('Team notification skipped (TEAM_NOTIFICATION_EMAIL not configured)');
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
    subject: `New Lead: ${leadData.name} from ${leadData.company || 'Unknown Company'}`,
    html,
  });

  log.info('Team notification sent');
}

// =============================================================================
// EVENT HANDLERS
// =============================================================================

/**
 * Handle new lead creation
 */
async function handleLeadCreated(data: LeadCreatedData): Promise<void> {
  log.info('New lead created', { email: data.email });

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
        subject: 'Your Automation Project - Next Steps',
        html,
      });

      log.info('Welcome email sent', { email: data.email });
    }

    // Send team notification
    await notifyTeam(data);

    // Update lead status
    const leadId = data.leadId || data.id;
    if (leadId) {
      await updateLeadStatus(leadId, 'contacted');
    }
  } catch (error) {
    log.error('Error handling lead creation', error);
  }
}

/**
 * Handle quote acceptance
 */
async function handleQuoteAccepted(data: QuoteEventData): Promise<void> {
  log.info('Quote accepted', { quoteId: data.quote_id });

  if (!isDatabaseConfigured()) return;

  try {
    // Update quote status
    await updateQuoteStatus(data.quote_id, 'accepted');

    // Get quote and lead details
    const result = await getQuoteWithLead(data.quote_id);

    if (!result) {
      log.error('Error fetching quote', undefined, { quoteId: data.quote_id });
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
        subject: `Quote Accepted - Let's Get Started!`,
        html,
      });

      log.info('Acceptance confirmation sent', { email: lead.email });
    }

    // Update lead status to converted
    if (lead?.id) {
      await updateLeadStatus(lead.id, 'converted');
    }
  } catch (error) {
    log.error('Error handling quote acceptance', error, { quoteId: data.quote_id });
  }
}

/**
 * Handle quote decline
 */
async function handleQuoteDeclined(data: QuoteEventData): Promise<void> {
  log.info('Quote declined', { quoteId: data.quote_id });

  if (!isDatabaseConfigured()) return;

  try {
    // Update quote status
    await updateQuoteStatus(data.quote_id, 'declined', data.reason);

    // Get quote and lead details
    const result = await getQuoteWithLead(data.quote_id);

    if (!result) {
      log.error('Error fetching quote', undefined, { quoteId: data.quote_id });
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

      log.info('Feedback request sent', { email: lead.email });
    }

    // Update lead status to nurture
    if (lead?.id) {
      await updateLeadStatus(lead.id, 'nurture');
    }
  } catch (error) {
    log.error('Error handling quote decline', error, { quoteId: data.quote_id });
  }
}

/**
 * Handle conversation completion
 */
async function handleConversationCompleted(data: ConversationCompletedData): Promise<void> {
  log.info('Conversation completed', { conversationId: data.conversation_id });

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
      log.error('Error fetching conversation', undefined, { conversationId: data.conversation_id });
      return;
    }

    const row = result[0] as Record<string, unknown>;

    // Update conversation status
    await client`
      UPDATE conversations
      SET status = 'completed', completed_at = ${new Date().toISOString()}
      WHERE id = ${data.conversation_id}
    `;

    log.info('Conversation marked as completed', { conversationId: data.conversation_id });

    // Check if lead is qualified for quote generation
    const leadScore = row.lead_score as number | null;
    const isQualified = leadScore && leadScore >= QUALIFIED_LEAD_SCORE_THRESHOLD;

    if (isQualified && row.lead_id) {
      log.info('Lead qualified for quote generation', { leadScore });

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
          subject: 'Your Custom Proposal is Being Prepared',
          html,
        });
      }
    } else {
      log.debug('Lead not qualified, adding to nurture', { leadScore });

      if (row.lead_id) {
        await updateLeadStatus(row.lead_id as string, 'nurture');
      }
    }
  } catch (error) {
    log.error('Error handling conversation completion', error, { conversationId: data.conversation_id });
  }
}

// =============================================================================
// API ROUTE HANDLERS
// =============================================================================

export const POST: APIRoute = async ({ request }) => {
  try {
    // Rate limiting - 100 requests per minute per IP
    const clientIP = request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';
    const rateLimitResult = checkRateLimit(`webhook:${clientIP}`, 100, 60000);

    if (!rateLimitResult.allowed) {
      log.warn('Webhook rate limit exceeded', { clientIP });
      return new Response(
        JSON.stringify({ error: 'Too many requests' }),
        { status: 429, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get raw body for signature verification
    const rawBody = await request.text();
    const signature = request.headers.get('x-webhook-signature');
    const webhookSecret = getEnvVar('WEBHOOK_SECRET');

    // Verify webhook signature (if secret is configured)
    if (webhookSecret) {
      if (!verifyWebhookSignature(rawBody, signature, webhookSecret)) {
        log.warn('Invalid webhook signature');
        return new Response(
          JSON.stringify({ error: 'Unauthorized' }),
          { status: 401, headers: { 'Content-Type': 'application/json' } }
        );
      }
      log.debug('Webhook signature verified');
    }

    // Parse payload
    const payload = JSON.parse(rawBody) as WebhookPayload;
    const { event, data } = payload;

    log.info('Webhook received', { event });

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
        log.warn('Unknown event type', { event });
    }

    return new Response(
      JSON.stringify({ success: true, event }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    log.error('Webhook error', error);

    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
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
