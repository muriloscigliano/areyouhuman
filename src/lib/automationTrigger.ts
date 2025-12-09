/**
 * Automation Trigger
 * Triggers the Python automation service for lead processing, quotes, and notifications
 * Replaces the previous n8n integration with a self-hosted Python service
 */

import type { LeadPayload, AutomationResult } from '../types';
import { getEnvVar } from './security';

// =============================================================================
// CONFIGURATION
// =============================================================================

const AUTOMATION_URL = getEnvVar('AUTOMATION_SERVICE_URL');
const WEBHOOK_SECRET = getEnvVar('WEBHOOK_SECRET');

/**
 * Check if automation service is configured
 */
export function isAutomationConfigured(): boolean {
  return Boolean(AUTOMATION_URL && !AUTOMATION_URL.includes('placeholder'));
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
    console.log('⚠️ Automation service not configured, skipping lead processing');
    return { success: false, message: 'Automation service not configured' };
  }

  try {
    console.log('🚀 Triggering lead processing for:', leadData.name);

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

    const response = await fetch(`${AUTOMATION_URL}/webhooks/lead`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(WEBHOOK_SECRET && { 'x-webhook-signature': generateSignature(payload) }),
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Automation service error: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    console.log('✅ Lead processing triggered successfully');

    return {
      success: true,
      message: 'Lead processing triggered',
      workflowId: result.workflowId,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Failed to trigger lead processing:', message);

    // Don't throw - we don't want to break the chat flow
    return { success: false, message };
  }
}

/**
 * Trigger quote generation
 */
export async function triggerQuoteGeneration(leadId: string): Promise<AutomationResult> {
  if (!isAutomationConfigured()) {
    return { success: false, message: 'Automation service not configured' };
  }

  try {
    const payload = {
      event: 'conversation.completed',
      data: { conversation_id: leadId },
      timestamp: new Date().toISOString(),
    };

    const response = await fetch(`${AUTOMATION_URL}/webhooks/conversation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(WEBHOOK_SECRET && { 'x-webhook-signature': generateSignature(payload) }),
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Quote generation failed: ${response.status}`);
    }

    return { success: true, message: 'Quote generation triggered' };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Failed to trigger quote generation:', message);
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
    return { success: false, message: 'Automation service not configured' };
  }

  try {
    const payload = {
      event: status === 'accepted' ? 'quote.accepted' : 'quote.declined',
      data: {
        quote_id: quoteId,
        ...(reason && { reason }),
      },
      timestamp: new Date().toISOString(),
    };

    const response = await fetch(`${AUTOMATION_URL}/webhooks/quote`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(WEBHOOK_SECRET && { 'x-webhook-signature': generateSignature(payload) }),
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Quote status update failed: ${response.status}`);
    }

    return { success: true, message: `Quote ${status}` };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Failed to update quote status:', message);
    return { success: false, message };
  }
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Generate webhook signature for payload
 */
function generateSignature(payload: unknown): string {
  if (!WEBHOOK_SECRET) return '';

  // Simple signature for now - in production use crypto.createHmac
  const payloadString = JSON.stringify(payload);
  let hash = 0;
  for (let i = 0; i < payloadString.length; i++) {
    const char = payloadString.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return hash.toString(16);
}

/**
 * Check automation service health
 */
export async function checkAutomationHealth(): Promise<boolean> {
  if (!isAutomationConfigured()) return false;

  try {
    const response = await fetch(`${AUTOMATION_URL}/health`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    return response.ok;
  } catch {
    return false;
  }
}
