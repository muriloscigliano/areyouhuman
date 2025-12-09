/**
 * Database Client - Neon PostgreSQL
 * Direct PostgreSQL connection using @neondatabase/serverless
 */

import { neon, neonConfig } from '@neondatabase/serverless';
import { dbLogger as log } from './logger';

// Configure for serverless environments
neonConfig.fetchConnectionCache = true;

// Get database URL from environment
const getDatabaseUrl = (): string => {
  const url = import.meta.env.DATABASE_URL || process.env.DATABASE_URL || '';
  return url;
};

// Create SQL client
const createDbClient = () => {
  const url = getDatabaseUrl();
  if (!url || url.includes('placeholder')) {
    return null;
  }
  return neon(url);
};

// Lazy-initialized client
let _sql: ReturnType<typeof neon> | null = null;

export const sql = () => {
  if (!_sql) {
    _sql = createDbClient();
  }
  return _sql;
};

/**
 * Check if database is configured
 */
export const isDatabaseConfigured = (): boolean => {
  const url = getDatabaseUrl();
  return Boolean(url && !url.includes('placeholder'));
};

// =============================================================================
// LEAD OPERATIONS
// =============================================================================

export interface LeadRecord {
  id: string;
  name: string | null;
  email: string | null;
  company: string | null;
  role: string | null;
  phone: string | null;
  industry: string | null;
  company_size: string | null;
  website: string | null;
  problem_text: string | null;
  automation_area: string | null;
  tools_used: string[] | null;
  budget_range: string | null;
  timeline: string | null;
  urgency: string | null;
  interest_level: number | null;
  lead_score: number | null;
  status: string;
  source: string | null;
  created_at: string;
  updated_at: string | null;
  last_contact_at: string | null;
  converted_at: string | null;
}

/**
 * Create a new lead
 */
export async function createLead(data: Partial<LeadRecord>): Promise<LeadRecord | null> {
  const client = sql();
  if (!client) return null;

  try {
    const result = await client`
      INSERT INTO leads (
        name, email, company, role, phone, industry, company_size, website,
        problem_text, automation_area, tools_used, budget_range, timeline,
        urgency, interest_level, lead_score, status, source
      ) VALUES (
        ${data.name || null},
        ${data.email || null},
        ${data.company || null},
        ${data.role || null},
        ${data.phone || null},
        ${data.industry || null},
        ${data.company_size || null},
        ${data.website || null},
        ${data.problem_text || null},
        ${data.automation_area || null},
        ${data.tools_used || null},
        ${data.budget_range || null},
        ${data.timeline || null},
        ${data.urgency || null},
        ${data.interest_level || null},
        ${data.lead_score || null},
        ${data.status || 'new'},
        ${data.source || 'chat'}
      )
      RETURNING *
    `;
    return result[0] as LeadRecord;
  } catch (error) {
    log.error('Error creating lead', error);
    return null;
  }
}

/**
 * Get lead by ID
 */
export async function getLeadById(id: string): Promise<LeadRecord | null> {
  const client = sql();
  if (!client) return null;

  try {
    const result = await client`
      SELECT * FROM leads WHERE id = ${id}
    `;
    return result[0] as LeadRecord || null;
  } catch (error) {
    log.error('Error fetching lead', error, { id });
    return null;
  }
}

/**
 * Update lead
 */
export async function updateLead(
  id: string,
  data: Partial<LeadRecord>
): Promise<LeadRecord | null> {
  const client = sql();
  if (!client) return null;

  try {
    // Build dynamic update
    const updates: string[] = [];
    const values: unknown[] = [];

    if (data.name !== undefined) { updates.push('name'); values.push(data.name); }
    if (data.email !== undefined) { updates.push('email'); values.push(data.email); }
    if (data.company !== undefined) { updates.push('company'); values.push(data.company); }
    if (data.status !== undefined) { updates.push('status'); values.push(data.status); }
    if (data.lead_score !== undefined) { updates.push('lead_score'); values.push(data.lead_score); }
    if (data.last_contact_at !== undefined) { updates.push('last_contact_at'); values.push(data.last_contact_at); }
    if (data.converted_at !== undefined) { updates.push('converted_at'); values.push(data.converted_at); }

    // Add updated_at
    updates.push('updated_at');
    values.push(new Date().toISOString());

    const result = await client`
      UPDATE leads
      SET ${client(Object.fromEntries(updates.map((k, i) => [k, values[i]])))}
      WHERE id = ${id}
      RETURNING *
    `;
    return result[0] as LeadRecord || null;
  } catch (error) {
    log.error('Error updating lead', error, { id });
    return null;
  }
}

/**
 * Update lead status
 */
export async function updateLeadStatus(
  id: string,
  status: string,
  additionalFields: Record<string, unknown> = {}
): Promise<boolean> {
  const client = sql();
  if (!client) return false;

  try {
    await client`
      UPDATE leads
      SET
        status = ${status},
        last_contact_at = ${new Date().toISOString()},
        updated_at = ${new Date().toISOString()}
      WHERE id = ${id}
    `;
    return true;
  } catch (error) {
    log.error('Error updating lead status', error, { id, status });
    return false;
  }
}

// =============================================================================
// CONVERSATION OPERATIONS
// =============================================================================

export interface ConversationRecord {
  id: string;
  lead_id: string | null;
  messages: object[];
  status: string;
  created_at: string;
  updated_at: string | null;
  completed_at: string | null;
}

/**
 * Create a new conversation
 */
export async function createConversation(
  leadId: string | null,
  messages: object[]
): Promise<ConversationRecord | null> {
  const client = sql();
  if (!client) return null;

  try {
    const result = await client`
      INSERT INTO conversations (lead_id, messages, status)
      VALUES (${leadId}, ${JSON.stringify(messages)}, 'active')
      RETURNING *
    `;
    return result[0] as ConversationRecord;
  } catch (error) {
    log.error('Error creating conversation', error, { leadId });
    return null;
  }
}

/**
 * Update conversation messages
 */
export async function updateConversation(
  id: string,
  messages: object[]
): Promise<boolean> {
  const client = sql();
  if (!client) return false;

  try {
    await client`
      UPDATE conversations
      SET
        messages = ${JSON.stringify(messages)},
        updated_at = ${new Date().toISOString()}
      WHERE id = ${id}
    `;
    return true;
  } catch (error) {
    log.error('Error updating conversation', error, { id });
    return false;
  }
}

// =============================================================================
// QUOTE OPERATIONS
// =============================================================================

export interface QuoteRecord {
  id: string;
  lead_id: string;
  project_title: string;
  project_summary: string | null;
  scope_items: object[];
  total_amount: number;
  currency: string;
  status: string;
  valid_until: string;
  created_at: string;
  accepted_at: string | null;
  declined_at: string | null;
  decline_reason: string | null;
}

/**
 * Get quote with lead details
 */
export async function getQuoteWithLead(quoteId: string): Promise<{
  quote: QuoteRecord;
  lead: LeadRecord;
} | null> {
  const client = sql();
  if (!client) return null;

  try {
    const result = await client`
      SELECT
        q.*,
        l.id as lead_id,
        l.name as lead_name,
        l.email as lead_email,
        l.company as lead_company
      FROM quotes q
      LEFT JOIN leads l ON q.lead_id = l.id
      WHERE q.id = ${quoteId}
    `;

    if (!result[0]) return null;

    const row = result[0] as Record<string, unknown>;
    return {
      quote: {
        id: row.id as string,
        lead_id: row.lead_id as string,
        project_title: row.project_title as string,
        project_summary: row.project_summary as string | null,
        scope_items: row.scope_items as object[],
        total_amount: row.total_amount as number,
        currency: row.currency as string,
        status: row.status as string,
        valid_until: row.valid_until as string,
        created_at: row.created_at as string,
        accepted_at: row.accepted_at as string | null,
        declined_at: row.declined_at as string | null,
        decline_reason: row.decline_reason as string | null,
      },
      lead: {
        id: row.lead_id as string,
        name: row.lead_name as string | null,
        email: row.lead_email as string | null,
        company: row.lead_company as string | null,
      } as LeadRecord,
    };
  } catch (error) {
    log.error('Error fetching quote', error, { quoteId });
    return null;
  }
}

/**
 * Update quote status
 */
export async function updateQuoteStatus(
  id: string,
  status: 'accepted' | 'declined',
  reason?: string
): Promise<boolean> {
  const client = sql();
  if (!client) return false;

  try {
    const now = new Date().toISOString();

    if (status === 'accepted') {
      await client`
        UPDATE quotes
        SET status = 'accepted', accepted_at = ${now}
        WHERE id = ${id}
      `;
    } else {
      await client`
        UPDATE quotes
        SET status = 'declined', declined_at = ${now}, decline_reason = ${reason || null}
        WHERE id = ${id}
      `;
    }
    return true;
  } catch (error) {
    log.error('Error updating quote status', error, { id, status });
    return false;
  }
}
