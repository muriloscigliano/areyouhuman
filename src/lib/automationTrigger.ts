/**
 * Automation Trigger
 * Triggers the Python automation service for lead processing, quotes, and notifications
 * Replaces the previous n8n integration with a self-hosted Python service
 */

import type { LeadPayload, AutomationResult } from '../types';
import { getEnvVar, generateWebhookSignature } from './security';
import { automationLogger as log } from './logger';

// =============================================================================
// CONFIGURATION
// =============================================================================

const AUTOMATION_URL = getEnvVar('AUTOMATION_SERVICE_URL');
const WEBHOOK_SECRET = getEnvVar('WEBHOOK_SECRET');

/** Default timeout for automation requests (10 seconds) */
const REQUEST_TIMEOUT_MS = 10000;

/**
 * Check if automation service is configured
 */
export function isAutomationConfigured(): boolean {
  return Boolean(AUTOMATION_URL && !AUTOMATION_URL.includes('placeholder'));
}

/**
 * Create AbortController with timeout
 */
function createTimeoutController(timeoutMs: number = REQUEST_TIMEOUT_MS): {
  controller: AbortController;
  timeoutId: NodeJS.Timeout;
} {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  return { controller, timeoutId };
}

/**
 * Make authenticated request to automation service with timeout
 */
async function makeAutomationRequest(
  endpoint: string,
  payload: unknown
): Promise<Response> {
  const { controller, timeoutId } = createTimeoutController();

  try {
    const payloadString = JSON.stringify(payload);
    const signature = WEBHOOK_SECRET
      ? generateWebhookSignature(payloadString, WEBHOOK_SECRET)
      : undefined;

    const response = await fetch(`${AUTOMATION_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(signature && { 'x-webhook-signature': signature }),
      },
      body: payloadString,
      signal: controller.signal,
    });

    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

// =============================================================================
// WEBHOOK TRIGGERS
// =============================================================================

/**
 * Trigger lead processing in the automation service
 *
 * @param leadData - The lead data to process
 * @returns AutomationResult
 */
export async function triggerLeadProcessing(leadData: LeadPayload): Promise<AutomationResult> {
  if (!isAutomationConfigured()) {
    log.warn('Automation service not configured, skipping lead processing');
    return { success: false, message: 'Automation service not configured' };
  }

  try {
    log.info('Triggering lead processing', { leadId: leadData.leadId });

    const payload = {
      event: 'lead.created',
      data: {
        leadId: leadData.leadId,
        name: leadData.name,
        email: leadData.email,
        company: leadData.company,
        project_title: leadData.project_title || `${leadData.automation_area || 'AI'} Automation`,
        project_summary: leadData.project_summary,
        automation_area: leadData.automation_area,
        tools_used: leadData.tools_used || [],
        budget_range: leadData.budget_range,
        timeline: leadData.timeline,
        urgency: leadData.urgency,
        interest_level: leadData.interest_level,
        source: leadData.source || 'Telos Chat',
        created_at: leadData.created_at || new Date().toISOString(),
      },
      timestamp: new Date().toISOString(),
    };

    const response = await makeAutomationRequest('/webhooks/lead', payload);

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      throw new Error(`Automation service error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    log.info('Lead processing triggered successfully', { workflowId: result.workflowId });

    return {
      success: true,
      message: 'Lead processing triggered',
      workflowId: result.workflowId,
    };
  } catch (error) {
    const isTimeout = error instanceof Error && error.name === 'AbortError';
    const message = isTimeout
      ? 'Request timeout'
      : error instanceof Error
        ? error.message
        : 'Unknown error';

    log.error('Failed to trigger lead processing', error, { leadId: leadData.leadId });

    // Don't throw - we don't want to break the chat flow
    return { success: false, message };
  }
}

/**
 * Trigger quote generation
 */
export async function triggerQuoteGeneration(leadId: string): Promise<AutomationResult> {
  if (!isAutomationConfigured()) {
    log.warn('Automation service not configured');
    return { success: false, message: 'Automation service not configured' };
  }

  try {
    log.info('Triggering quote generation', { leadId });

    const payload = {
      event: 'conversation.completed',
      data: { conversation_id: leadId },
      timestamp: new Date().toISOString(),
    };

    const response = await makeAutomationRequest('/webhooks/conversation', payload);

    if (!response.ok) {
      throw new Error(`Quote generation failed: ${response.status}`);
    }

    log.info('Quote generation triggered successfully', { leadId });
    return { success: true, message: 'Quote generation triggered' };
  } catch (error) {
    const isTimeout = error instanceof Error && error.name === 'AbortError';
    const message = isTimeout
      ? 'Request timeout'
      : error instanceof Error
        ? error.message
        : 'Unknown error';

    log.error('Failed to trigger quote generation', error, { leadId });
    return { success: false, message };
  }
}

/**
 * Notify about quote status change
 */
export async function triggerQuoteStatusChange(
  quoteId: string,
  status: 'accepted' | 'declined',
  reason?: string
): Promise<AutomationResult> {
  if (!isAutomationConfigured()) {
    log.warn('Automation service not configured');
    return { success: false, message: 'Automation service not configured' };
  }

  try {
    log.info('Triggering quote status change', { quoteId, status });

    const payload = {
      event: status === 'accepted' ? 'quote.accepted' : 'quote.declined',
      data: {
        quote_id: quoteId,
        ...(reason && { reason }),
      },
      timestamp: new Date().toISOString(),
    };

    const response = await makeAutomationRequest('/webhooks/quote', payload);

    if (!response.ok) {
      throw new Error(`Quote status update failed: ${response.status}`);
    }

    log.info('Quote status updated successfully', { quoteId, status });
    return { success: true, message: `Quote ${status}` };
  } catch (error) {
    const isTimeout = error instanceof Error && error.name === 'AbortError';
    const message = isTimeout
      ? 'Request timeout'
      : error instanceof Error
        ? error.message
        : 'Unknown error';

    log.error('Failed to update quote status', error, { quoteId, status });
    return { success: false, message };
  }
}

/**
 * Check automation service health
 */
export async function checkAutomationHealth(): Promise<boolean> {
  if (!isAutomationConfigured()) return false;

  const { controller, timeoutId } = createTimeoutController(5000); // 5s timeout for health

  try {
    const response = await fetch(`${AUTOMATION_URL}/health`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
    });

    return response.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timeoutId);
  }
}
