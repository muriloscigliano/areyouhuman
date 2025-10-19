/**
 * n8n Webhook Trigger
 * Sends qualified leads to n8n for automation (email, Slack, PDF generation, etc.)
 */

interface LeadPayload {
  leadId: string;
  name: string;
  email: string;
  company: string;
  project_title?: string;
  project_summary: string;
  tools_used?: string[];
  budget_range?: string;
  timeline?: string;
  urgency?: string;
  automation_area?: string;
  interest_level?: number;
  source: string;
  created_at?: string;
}

interface N8NResponse {
  success: boolean;
  message?: string;
  workflowId?: string;
}

/**
 * Trigger n8n workflow with lead data
 * @param leadData - The qualified lead data
 * @returns Promise with success status
 */
export async function triggerN8NWebhook(leadData: LeadPayload): Promise<N8NResponse> {
  const webhookUrl = import.meta.env.N8N_WEBHOOK_URL || process.env.N8N_WEBHOOK_URL;

  // If n8n is not configured, skip silently (optional)
  if (!webhookUrl || webhookUrl === '' || webhookUrl.includes('placeholder')) {
    console.log('⚠️ n8n webhook not configured, skipping automation trigger');
    return { success: false, message: 'n8n not configured' };
  }

  try {
    console.log('🚀 Triggering n8n webhook for lead:', leadData.name);
    
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        // Lead identification
        leadId: leadData.leadId,
        timestamp: new Date().toISOString(),
        
        // Contact details
        name: leadData.name,
        email: leadData.email,
        company: leadData.company,
        
        // Project details
        project_title: leadData.project_title || `${leadData.automation_area} Automation`,
        project_summary: leadData.project_summary,
        automation_area: leadData.automation_area,
        
        // Context
        tools_used: leadData.tools_used || [],
        budget_range: leadData.budget_range,
        timeline: leadData.timeline,
        urgency: leadData.urgency,
        interest_level: leadData.interest_level,
        
        // Metadata
        source: leadData.source || 'Telos Chat',
        created_at: leadData.created_at || new Date().toISOString(),
      }),
    });

    if (!response.ok) {
      throw new Error(`n8n webhook failed: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    console.log('✅ n8n webhook triggered successfully');
    
    return {
      success: true,
      message: 'Workflow triggered',
      workflowId: result.workflowId,
    };
  } catch (error: any) {
    console.error('❌ Failed to trigger n8n webhook:', error.message);
    
    // Don't throw error - we don't want to break the chat flow if n8n fails
    return {
      success: false,
      message: error.message,
    };
  }
}

/**
 * Check if n8n is configured
 */
export function isN8NConfigured(): boolean {
  const webhookUrl = import.meta.env.N8N_WEBHOOK_URL || process.env.N8N_WEBHOOK_URL;
  return !!webhookUrl && webhookUrl !== '' && !webhookUrl.includes('placeholder');
}

/**
 * Trigger multiple n8n workflows (for different use cases)
 */
export async function triggerN8NWorkflows(leadData: LeadPayload, workflows: string[]): Promise<N8NResponse[]> {
  const results: N8NResponse[] = [];
  
  for (const workflowType of workflows) {
    const webhookUrl = getWebhookUrlForWorkflow(workflowType);
    
    if (webhookUrl) {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(leadData),
      });
      
      results.push({
        success: response.ok,
        message: workflowType,
      });
    }
  }
  
  return results;
}

/**
 * Get webhook URL for specific workflow type
 */
function getWebhookUrlForWorkflow(type: string): string | null {
  const baseUrl = import.meta.env.N8N_BASE_URL || process.env.N8N_BASE_URL;
  
  if (!baseUrl) return null;
  
  const workflows: Record<string, string> = {
    'new-lead': `${baseUrl}/webhook/telos-new-lead`,
    'quote-ready': `${baseUrl}/webhook/telos-quote-ready`,
    'follow-up': `${baseUrl}/webhook/telos-follow-up`,
  };
  
  return workflows[type] || null;
}

/**
 * Example: Trigger Slack notification
 */
export async function notifySlack(leadData: LeadPayload): Promise<boolean> {
  const slackWebhook = import.meta.env.N8N_SLACK_WEBHOOK || process.env.N8N_SLACK_WEBHOOK;
  
  if (!slackWebhook) return false;
  
  try {
    await fetch(slackWebhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: `🎯 New qualified lead from Telos`,
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `*${leadData.name}* from *${leadData.company}*\n${leadData.project_summary}`,
            },
          },
          {
            type: 'context',
            elements: [
              {
                type: 'mrkdwn',
                text: `Budget: ${leadData.budget_range} | Timeline: ${leadData.timeline}`,
              },
            ],
          },
        ],
      }),
    });
    
    return true;
  } catch (error) {
    console.error('Failed to notify Slack:', error);
    return false;
  }
}

