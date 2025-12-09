/**
 * Core Type Definitions for Are You Human?
 * Centralized type system for type safety across the application
 */

// =============================================================================
// LEAD TYPES
// =============================================================================

export type LeadStatus =
  | 'new'
  | 'contacted'
  | 'qualified'
  | 'nurture'
  | 'quoted'
  | 'converted'
  | 'lost'
  | 'spam';

export type LeadQuality = 'high' | 'medium' | 'low';

export interface LeadData {
  id?: string;
  name: string | null;
  email: string | null;
  company: string | null;
  role?: string | null;
  phone?: string | null;
  industry?: string | null;
  company_size?: string | null;
  website?: string | null;
  problem_text?: string | null;
  automation_area?: string | null;
  tools_used?: string[] | null;
  budget_range?: string | null;
  timeline?: string | null;
  urgency?: string | null;
  interest_level?: number | null;
  lead_score?: number | null;
  status?: LeadStatus;
  source?: string;
  created_at?: string;
  updated_at?: string;
}

export interface LeadScore {
  total: number;
  interest_level: number;
  budget_clarity: number;
  urgency: number;
  problem_clarity: number;
  decision_authority: number;
  tech_readiness: number;
}

export interface LeadPayload {
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

// =============================================================================
// CONVERSATION TYPES
// =============================================================================

export type MessageRole = 'system' | 'user' | 'assistant';

export interface Message {
  id?: string;
  role: MessageRole;
  content: string;
  timestamp?: Date;
}

export interface ChatMessage {
  id: string;
  text: string;
  isBot: boolean;
  timestamp: Date;
}

export interface ConversationContext {
  isFirstMessage: boolean;
  needsContactInfo: boolean;
  messageCount: number;
  shouldNotAskProject: boolean;
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
  isWeekend: boolean;
}

export type ConversationStage =
  | 'greeting'
  | 'briefing'
  | 'quote'
  | 'followup'
  | 'actions'
  | 'roadmap';

export interface ConversationState {
  leadId: string | null;
  conversationId: string | null;
  stage: ConversationStage;
  messageCount: number;
  hasContactInfo: boolean;
  hasProjectInfo: boolean;
}

// =============================================================================
// API TYPES
// =============================================================================

export interface ChatRequest {
  message: string;
  conversationHistory?: ChatMessage[];
  leadId?: string;
  conversationId?: string;
}

export interface ChatResponse {
  reply: string;
  leadId?: string;
  conversationId?: string;
  error?: string;
}

export interface WebhookPayload {
  event: WebhookEvent;
  data: Record<string, unknown>;
  timestamp?: string;
}

export type WebhookEvent =
  | 'lead.created'
  | 'lead.updated'
  | 'quote.accepted'
  | 'quote.declined'
  | 'conversation.completed'
  | 'workflow.trigger';

export interface WebhookResponse {
  success: boolean;
  message?: string;
  error?: string;
}

// =============================================================================
// QUOTE TYPES
// =============================================================================

export type QuoteStatus =
  | 'draft'
  | 'sent'
  | 'viewed'
  | 'accepted'
  | 'declined'
  | 'expired';

export interface QuoteData {
  id?: string;
  lead_id: string;
  project_title: string;
  project_summary: string;
  scope_items: ScopeItem[];
  total_amount: number;
  currency: string;
  valid_until: string;
  status: QuoteStatus;
  created_at?: string;
  sent_at?: string;
  accepted_at?: string;
  declined_at?: string;
  decline_reason?: string;
}

export interface ScopeItem {
  title: string;
  description: string;
  amount: number;
  hours?: number;
}

// =============================================================================
// VALIDATION TYPES
// =============================================================================

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface DataValidationResult {
  isValid: boolean;
  isHallucinated: boolean;
  missingFields: string[];
  suspiciousFields: string[];
  confidence: number;
  warnings: string[];
}

export interface ProjectValidationResult {
  isValid: boolean;
  missingFields: string[];
  lowQualityFields: string[];
  suggestions: string[];
  score: number;
}

export interface GuardrailResult {
  isValid: boolean;
  isOffTopic: boolean;
  wordCount: number;
  maxWords: number;
  redirectMessage?: string;
}

// =============================================================================
// TOKEN MANAGEMENT TYPES
// =============================================================================

export interface TokenBudget {
  systemPrompt: number;
  contextSummary: number;
  conversationHistory: number;
  total: number;
}

export interface TokenStats {
  totalMessages: number;
  totalTokens: number;
  averageTokensPerMessage: number;
  userTokens: number;
  assistantTokens: number;
}

// =============================================================================
// EMAIL TYPES
// =============================================================================

export interface EmailOptions {
  to: string;
  subject: string;
  html?: string;
  text?: string;
  attachments?: EmailAttachment[];
}

export interface EmailAttachment {
  filename: string;
  content: Buffer | string;
  contentType?: string;
}

export interface QuoteEmailData {
  clientName: string;
  projectTitle: string;
  quoteUrl?: string;
}

// =============================================================================
// AUTOMATION TYPES
// =============================================================================

export interface AutomationResult {
  success: boolean;
  message?: string;
  workflowId?: string;
  error?: string;
}

export interface NotificationPayload {
  type: 'slack' | 'email' | 'webhook';
  channel?: string;
  message: string;
  data?: Record<string, unknown>;
}

// =============================================================================
// CONFIGURATION TYPES
// =============================================================================

export interface AppConfig {
  supabase: {
    url: string;
    anonKey: string;
    configured: boolean;
  };
  openai: {
    apiKey: string;
    model: string;
    configured: boolean;
  };
  resend: {
    apiKey: string;
    fromEmail: string;
    configured: boolean;
  };
  webhooks: {
    secret: string;
    automationUrl?: string;
  };
}

// =============================================================================
// UTILITY TYPES
// =============================================================================

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
