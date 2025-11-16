/**
 * Lead and Conversation Types
 * Shared type definitions for lead management and conversations
 */

export interface LeadData {
  id?: string;
  name?: string | null;
  email?: string | null;
  company?: string | null;
  role?: string | null;
  industry?: string | null;
  company_size?: string | null;
  problem_text?: string | null;
  automation_area?: string | null;
  budget_range?: string | null;
  timeline?: string | null;
  urgency?: string | null;
  tools_used?: string[] | null;
  interest_level?: number | null;
  lead_score?: number | null;
  status?: LeadStatus;
  source?: string;
  created_at?: string;
  updated_at?: string;
  last_contact_at?: string;
  converted_at?: string;
}

export type LeadStatus =
  | 'new'
  | 'contacted'
  | 'qualified'
  | 'nurture'
  | 'quoted'
  | 'converted'
  | 'lost'
  | 'spam';

export interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
  timestamp?: Date;
}

export interface ConversationMessage {
  id?: string;
  text: string;
  isBot: boolean;
  timestamp: Date;
}

export interface Conversation {
  id?: string;
  lead_id?: string;
  messages: ConversationMessage[];
  summary?: string;
  model_used?: string;
  status?: ConversationStatus;
  created_at?: string;
  updated_at?: string;
  completed_at?: string;
}

export type ConversationStatus = 'active' | 'completed' | 'abandoned' | 'transferred';

export interface ChatRequest {
  message: string;
  conversationHistory?: ConversationMessage[];
  leadId?: string;
  conversationId?: string;
}

export interface ChatResponse {
  reply: string;
  leadId?: string;
  conversationId?: string;
  error?: string;
}

export interface ExtractedLeadData {
  name?: string | null;
  email?: string | null;
  company?: string | null;
  role?: string | null;
  industry?: string | null;
  problem_text?: string | null;
  budget_range?: string | null;
  urgency?: string | null;
  tools_used?: string[] | null;
  interest_level?: number | null;
  automation_area?: string | null;
}
