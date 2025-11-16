/**
 * Quote Types
 * Type definitions for quote generation and management
 */

export interface Quote {
  id?: string;
  lead_id: string;
  project_title: string;
  project_summary?: string;
  estimated_hours?: number;
  hourly_rate?: number;
  total_cost?: number;
  timeline?: string;
  deliverables?: string[];
  assumptions?: string[];
  exclusions?: string[];
  status?: QuoteStatus;
  sent_at?: string;
  viewed_at?: string;
  accepted_at?: string;
  declined_at?: string;
  decline_reason?: string;
  expires_at?: string;
  created_at?: string;
  updated_at?: string;
}

export type QuoteStatus =
  | 'draft'
  | 'sent'
  | 'viewed'
  | 'accepted'
  | 'declined'
  | 'expired'
  | 'revised';

export interface QuoteGenerationRequest {
  leadId: string;
  name: string;
  email: string;
  company?: string;
  project_title: string;
  project_summary?: string;
  budget_range?: string;
  automation_area?: string;
  interest_level?: number;
  source?: string;
}
