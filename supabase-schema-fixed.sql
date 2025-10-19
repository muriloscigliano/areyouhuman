-- Are You Human? Copilot - FIXED Database Schema
-- ✅ Fixes Supabase Security Advisor warnings
-- ✅ Updated to match new requirements
-- Run this in your Supabase SQL Editor

-- ============================================
-- 💼 TABLE: leads (UPDATED SCHEMA)
-- ============================================
drop table if exists leads cascade;

create table leads (
  id uuid primary key default gen_random_uuid(),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  
  -- Contact Information (Required)
  name text not null,
  email text not null unique,
  company text, -- Optional now
  role text, -- e.g., "Founder", "CTO", "Designer"
  
  -- Project Information (Required)
  project_title text not null,
  project_summary text not null,
  timeline text not null, -- e.g., "3 months", "4-6 weeks"
  
  -- Structured Data (Optional)
  goals jsonb default '[]'::jsonb, -- ["automation", "growth", "efficiency"]
  pain_points text,
  tools_in_use jsonb default '[]'::jsonb, -- ["Stripe", "MercadoPago", "Notion"]
  desired_features jsonb default '[]'::jsonb, -- ["Dashboard", "WhatsApp integration", "AI"]
  
  -- Budget (Optional)
  budget_min numeric,
  budget_max numeric,
  
  -- Quote Status
  quote_status text default 'pending' check (quote_status in ('pending', 'sent', 'accepted', 'rejected')),
  quote_pdf_url text,
  
  -- Additional Fields
  calendar_link text,
  source text not null default 'Telos Chat', -- "Telos Chat", "Website", "Referral"
  language text default 'en', -- "en", "pt", "es"
  
  -- Legacy fields (for backward compatibility)
  problem_text text,
  tools_used text[],
  budget_range text,
  urgency text,
  interest_level int check (interest_level >= 0 and interest_level <= 10),
  automation_area text,
  status text default 'new' check (status in ('new', 'contacted', 'qualified', 'quoted', 'converted', 'closed', 'ready_for_quote')),
  
  -- Timestamps
  last_contact timestamp with time zone
);

-- ============================================
-- 💬 TABLE: conversations (NO CHANGES)
-- ============================================
create table if not exists conversations (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references leads (id) on delete cascade,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  
  -- Conversation Content
  messages jsonb default '[]'::jsonb,
  summary text, -- NEW: For token optimization
  context_tags text[],
  
  -- AI Model Info
  model_used text default 'rule-based',
  
  -- Status
  status text default 'active' check (status in ('active', 'archived', 'converted'))
);

-- ============================================
-- 📄 TABLE: quotes (UPDATED SCHEMA)
-- ============================================
create table if not exists quotes (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references leads (id) on delete cascade,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  
  -- Quote Content
  project_title text not null,
  version int default 1,
  pdf_url text,
  quote_data jsonb, -- Full lead data snapshot
  
  -- Pricing
  total_cost numeric,
  breakdown jsonb, -- Component-level cost breakdown
  
  -- Status & Tracking
  status text default 'draft' check (status in ('draft', 'generated', 'sent', 'viewed', 'accepted', 'declined', 'expired')),
  generated_at timestamp with time zone,
  sent_at timestamp with time zone,
  viewed_at timestamp with time zone,
  responded_at timestamp with time zone
);

-- ============================================
-- 📎 TABLE: quote_files (NO CHANGES)
-- ============================================
create table if not exists quote_files (
  id uuid primary key default gen_random_uuid(),
  quote_id uuid references quotes (id) on delete cascade,
  created_at timestamp with time zone default now(),
  
  file_url text,
  file_name text,
  file_size int,
  mime_type text default 'application/pdf',
  
  sent_via text,
  email_status text,
  
  version int default 1,
  is_latest boolean default true
);

-- ============================================
-- 📬 TABLE: emails (NO CHANGES)
-- ============================================
create table if not exists emails (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references leads (id) on delete cascade,
  quote_id uuid references quotes (id) on delete set null,
  created_at timestamp with time zone default now(),
  
  subject text,
  body text,
  recipient_email text,
  
  status text default 'sent' check (status in ('draft', 'sent', 'delivered', 'opened', 'clicked', 'bounced', 'failed')),
  sent_at timestamp with time zone,
  opened_at timestamp with time zone,
  clicked_at timestamp with time zone,
  
  provider text default 'resend',
  external_id text
);

-- ============================================
-- 📊 TABLE: messages (NEW - Optional Analytics)
-- ============================================
create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references leads (id) on delete cascade,
  conversation_id uuid references conversations (id) on delete cascade,
  created_at timestamp with time zone default now(),
  
  role text not null check (role in ('human', 'ai', 'system')),
  content text not null,
  type text default 'text' check (type in ('text', 'ui', 'system')),
  tokens_used int,
  
  -- Metadata
  model_used text,
  intent text, -- For analytics: "greeting", "qualification", "objection", etc.
  confidence numeric -- AI confidence score 0-1
);

-- ============================================
-- 🗂️ TABLE: projects (NEW - Future Use)
-- ============================================
create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references leads (id) on delete cascade,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  
  project_name text not null,
  description text,
  status text default 'discovery' check (status in ('discovery', 'scoping', 'in_progress', 'completed', 'paused', 'cancelled')),
  
  start_date date,
  end_date date,
  budget numeric,
  
  deliverables jsonb default '[]'::jsonb,
  notes text
);

-- ============================================
-- INDEXES for Performance
-- ============================================

-- Leads indexes
create index if not exists leads_email_idx on leads(email);
create index if not exists leads_created_at_idx on leads(created_at desc);
create index if not exists leads_status_idx on leads(status);
create index if not exists leads_quote_status_idx on leads(quote_status);
create index if not exists leads_source_idx on leads(source);
create index if not exists leads_company_idx on leads(company);

-- Conversations indexes
create index if not exists conversations_lead_id_idx on conversations(lead_id);
create index if not exists conversations_created_at_idx on conversations(created_at desc);
create index if not exists conversations_status_idx on conversations(status);

-- Quotes indexes
create index if not exists quotes_lead_id_idx on quotes(lead_id);
create index if not exists quotes_status_idx on quotes(status);
create index if not exists quotes_created_at_idx on quotes(created_at desc);

-- Quote files indexes
create index if not exists quote_files_quote_id_idx on quote_files(quote_id);
create index if not exists quote_files_is_latest_idx on quote_files(is_latest) where is_latest = true;

-- Emails indexes
create index if not exists emails_lead_id_idx on emails(lead_id);
create index if not exists emails_quote_id_idx on emails(quote_id);
create index if not exists emails_status_idx on emails(status);

-- Messages indexes (NEW)
create index if not exists messages_lead_id_idx on messages(lead_id);
create index if not exists messages_conversation_id_idx on messages(conversation_id);
create index if not exists messages_created_at_idx on messages(created_at desc);
create index if not exists messages_role_idx on messages(role);

-- Projects indexes (NEW)
create index if not exists projects_lead_id_idx on projects(lead_id);
create index if not exists projects_status_idx on projects(status);

-- ============================================
-- ⚠️ FIX: Function with proper search_path
-- ============================================
-- This fixes the "Function Search Path Mutable" warning

create or replace function update_updated_at_column()
returns trigger
language plpgsql
security definer
set search_path = public -- ✅ FIXES THE WARNING
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ============================================
-- TRIGGERS for Auto-Update Timestamps
-- ============================================

-- Triggers for leads
drop trigger if exists update_leads_updated_at on leads;
create trigger update_leads_updated_at
  before update on leads
  for each row
  execute function update_updated_at_column();

-- Triggers for conversations
drop trigger if exists update_conversations_updated_at on conversations;
create trigger update_conversations_updated_at
  before update on conversations
  for each row
  execute function update_updated_at_column();

-- Triggers for quotes
drop trigger if exists update_quotes_updated_at on quotes;
create trigger update_quotes_updated_at
  before update on quotes
  for each row
  execute function update_updated_at_column();

-- Triggers for projects (NEW)
drop trigger if exists update_projects_updated_at on projects;
create trigger update_projects_updated_at
  before update on projects
  for each row
  execute function update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
alter table leads enable row level security;
alter table conversations enable row level security;
alter table quotes enable row level security;
alter table quote_files enable row level security;
alter table emails enable row level security;
alter table messages enable row level security;
alter table projects enable row level security;

-- ✅ PERMISSIVE POLICIES (for API access)
-- Note: In production, tighten these based on your auth strategy

-- Policies for leads
create policy "Allow public insert for leads" on leads
  for insert
  with check (true);

create policy "Allow service role all access for leads" on leads
  for all
  using (auth.role() = 'service_role' or auth.role() = 'authenticated')
  with check (auth.role() = 'service_role' or auth.role() = 'authenticated');

-- Policies for conversations
create policy "Allow public insert for conversations" on conversations
  for insert
  with check (true);

create policy "Allow service role all access for conversations" on conversations
  for all
  using (auth.role() = 'service_role' or auth.role() = 'authenticated')
  with check (auth.role() = 'service_role' or auth.role() = 'authenticated');

-- Policies for quotes
create policy "Allow service role all access for quotes" on quotes
  for all
  using (auth.role() = 'service_role' or auth.role() = 'authenticated')
  with check (auth.role() = 'service_role' or auth.role() = 'authenticated');

-- Policies for quote_files
create policy "Allow service role all access for quote_files" on quote_files
  for all
  using (auth.role() = 'service_role' or auth.role() = 'authenticated')
  with check (auth.role() = 'service_role' or auth.role() = 'authenticated');

-- Policies for emails
create policy "Allow service role all access for emails" on emails
  for all
  using (auth.role() = 'service_role' or auth.role() = 'authenticated')
  with check (auth.role() = 'service_role' or auth.role() = 'authenticated');

-- Policies for messages (NEW)
create policy "Allow service role all access for messages" on messages
  for all
  using (auth.role() = 'service_role' or auth.role() = 'authenticated')
  with check (auth.role() = 'service_role' or auth.role() = 'authenticated');

-- Policies for projects (NEW)
create policy "Allow service role all access for projects" on projects
  for all
  using (auth.role() = 'service_role' or auth.role() = 'authenticated')
  with check (auth.role() = 'service_role' or auth.role() = 'authenticated');

-- ============================================
-- ⚠️ FIX: VIEWS with SECURITY INVOKER
-- ============================================
-- This fixes the "Security Definer View" warnings

-- Lead Analytics View
drop view if exists lead_analytics;
create view lead_analytics
with (security_invoker=true) -- ✅ FIXES THE WARNING
as
select
  date_trunc('day', created_at) as date,
  count(*) as total_leads,
  count(*) filter (where status = 'qualified') as qualified_leads,
  count(*) filter (where status = 'quoted' or quote_status = 'sent') as quoted_leads,
  count(*) filter (where status = 'converted') as converted_leads,
  avg(interest_level) as avg_interest_level,
  count(distinct company) as unique_companies,
  count(distinct source) as unique_sources
from leads
group by date_trunc('day', created_at)
order by date desc;

-- Conversation Performance View
drop view if exists conversation_performance;
create view conversation_performance
with (security_invoker=true) -- ✅ FIXES THE WARNING
as
select
  date_trunc('day', c.created_at) as date,
  count(*) as total_conversations,
  count(distinct c.lead_id) as unique_leads,
  avg(jsonb_array_length(c.messages)) as avg_message_count,
  count(*) filter (where c.status = 'converted') as converted_conversations,
  count(distinct c.model_used) as models_used
from conversations c
group by date_trunc('day', c.created_at)
order by date desc;

-- Quote Performance View
drop view if exists quote_performance;
create view quote_performance
with (security_invoker=true) -- ✅ FIXES THE WARNING
as
select
  date_trunc('day', created_at) as date,
  count(*) as total_quotes,
  count(*) filter (where status = 'sent') as sent_quotes,
  count(*) filter (where status = 'viewed') as viewed_quotes,
  count(*) filter (where status = 'accepted') as accepted_quotes,
  count(*) filter (where status = 'declined' or status = 'rejected') as rejected_quotes,
  round(
    100.0 * count(*) filter (where status = 'accepted') / 
    nullif(count(*) filter (where status in ('accepted', 'declined', 'rejected')), 0),
    2
  ) as acceptance_rate
from quotes
group by date_trunc('day', created_at)
order by date desc;

-- ============================================
-- 📊 NEW ANALYTICS VIEWS
-- ============================================

-- Message Analytics (for token cost tracking)
create view if not exists message_analytics
with (security_invoker=true)
as
select
  date_trunc('day', created_at) as date,
  count(*) as total_messages,
  count(*) filter (where role = 'human') as human_messages,
  count(*) filter (where role = 'ai') as ai_messages,
  sum(tokens_used) as total_tokens,
  avg(tokens_used) as avg_tokens_per_message,
  count(distinct lead_id) as unique_leads
from messages
group by date_trunc('day', created_at)
order by date desc;

-- Conversion Funnel View
create view if not exists conversion_funnel
with (security_invoker=true)
as
select
  count(*) as total_leads,
  count(*) filter (where status in ('qualified', 'quoted', 'converted')) as qualified,
  count(*) filter (where status in ('quoted', 'converted') or quote_status = 'sent') as quoted,
  count(*) filter (where quote_status = 'accepted') as accepted,
  count(*) filter (where status = 'converted') as converted,
  
  -- Conversion rates
  round(100.0 * count(*) filter (where status in ('qualified', 'quoted', 'converted')) / nullif(count(*), 0), 2) as qualify_rate,
  round(100.0 * count(*) filter (where status in ('quoted', 'converted') or quote_status = 'sent') / nullif(count(*) filter (where status in ('qualified', 'quoted', 'converted')), 0), 2) as quote_rate,
  round(100.0 * count(*) filter (where quote_status = 'accepted') / nullif(count(*) filter (where quote_status in ('sent', 'accepted', 'rejected')), 0), 2) as acceptance_rate,
  round(100.0 * count(*) filter (where status = 'converted') / nullif(count(*), 0), 2) as conversion_rate
from leads;

-- ============================================
-- COMMENTS for Documentation
-- ============================================

comment on table leads is 'Core customer information and lead tracking (UPDATED SCHEMA)';
comment on table conversations is 'Chat history for AI training and analysis';
comment on table quotes is 'Generated proposals and pricing quotes (UPDATED SCHEMA)';
comment on table quote_files is 'PDF files and documents linked to quotes';
comment on table emails is 'Email communication tracking';
comment on table messages is 'Individual message tracking for analytics and cost monitoring';
comment on table projects is 'Multi-project tracking per client (future use)';

comment on column conversations.summary is 'AI-generated summary for token optimization';
comment on column leads.quote_status is 'Status of the quote process (pending, sent, accepted, rejected)';
comment on column messages.tokens_used is 'Token count for cost tracking';
comment on column messages.intent is 'Message intent for conversion analytics';

-- ============================================
-- ✅ VERIFICATION QUERIES
-- ============================================

-- Run these to verify everything works:

-- 1. Check all tables exist
select table_name from information_schema.tables 
where table_schema = 'public' 
and table_type = 'BASE TABLE'
order by table_name;

-- 2. Check all views (should have security_invoker)
select 
  table_name as view_name,
  view_definition
from information_schema.views 
where table_schema = 'public';

-- 3. Check RLS is enabled
select 
  schemaname,
  tablename,
  rowsecurity
from pg_tables 
where schemaname = 'public'
order by tablename;

-- 4. Test insert (should work)
-- insert into leads (name, email, project_title, project_summary, timeline, source)
-- values ('Test User', 'test@example.com', 'Test Project', 'Test summary', '3 months', 'Telos Chat');

