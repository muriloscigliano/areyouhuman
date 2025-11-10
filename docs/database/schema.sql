-- Are You Human? Copilot - Comprehensive Database Schema
-- Run this in your Supabase SQL Editor to create all tables

-- ============================================
-- 💼 TABLE: leads
-- ============================================
-- Stores core client information and source data

create table if not exists leads (
  id uuid primary key default gen_random_uuid(),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  
  -- Contact Information
  name text,
  email text,
  company text,
  role text,
  industry text,
  country text,
  
  -- Source & Classification
  source text default 'chat', -- 'chat', 'form', 'referral', 'manual'
  status text default 'new' check (status in ('new', 'contacted', 'qualified', 'quoted', 'converted', 'closed')),
  
  -- Additional Context
  notes text,
  
  -- Lead Scoring
  interest_level int check (interest_level >= 0 and interest_level <= 10),
  
  -- Quick Access Fields (can be derived from conversations)
  problem_text text,
  tools_used text[],
  goal text,
  budget_range text,
  urgency text,
  tech_familiarity text,
  automation_area text,
  complexity text
);

-- ============================================
-- 💬 TABLE: conversations
-- ============================================
-- Stores chat interactions for RAG training and lead analysis

create table if not exists conversations (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references leads (id) on delete cascade,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  
  -- Conversation Content
  messages jsonb default '[]'::jsonb, -- [{role:'user', content:'...'}, {role:'assistant', content:'...'}]
  summary text, -- AI-generated summary
  context_tags text[], -- ['automation', 'crm', 'gym', 'reporting']
  
  -- AI Model Info
  model_used text default 'rule-based', -- 'gpt-4o-mini', 'claude-3.5-sonnet', 'rule-based'
  
  -- Status
  status text default 'active' check (status in ('active', 'archived', 'converted'))
);

-- ============================================
-- 📄 TABLE: quotes
-- ============================================
-- Generated proposals and quotes from conversations

create table if not exists quotes (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references leads (id) on delete cascade,
  conversation_id uuid references conversations (id) on delete set null,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  
  -- Quote Content
  project_title text,
  project_summary text,
  proposed_solution jsonb, -- [{feature:'Automation Workflow', description:'Connect Typeform + Notion', value:'$2000'}]
  
  -- Pricing & Timeline
  estimated_timeline text, -- '4-6 weeks'
  estimated_cost text, -- '$5,000 - $8,000'
  roi_estimate text, -- '15-25 hours saved per week, ROI in 3-6 months'
  
  -- Generation Info
  ai_model text, -- Model that generated the quote
  tone text default 'professional', -- 'professional', 'friendly', 'technical'
  
  -- Status & Tracking
  status text default 'draft' check (status in ('draft', 'sent', 'viewed', 'accepted', 'rejected', 'expired')),
  sent_at timestamp with time zone,
  viewed_at timestamp with time zone,
  responded_at timestamp with time zone
);

-- ============================================
-- 📎 TABLE: quote_files
-- ============================================
-- Links generated PDF files to quotes

create table if not exists quote_files (
  id uuid primary key default gen_random_uuid(),
  quote_id uuid references quotes (id) on delete cascade,
  created_at timestamp with time zone default now(),
  
  -- File Information
  file_url text, -- Supabase Storage URL or external URL
  file_name text,
  file_size int, -- bytes
  mime_type text default 'application/pdf',
  
  -- Delivery Tracking
  sent_via text, -- 'email', 'manual', 'link'
  email_status text, -- 'sent', 'opened', 'clicked', 'downloaded'
  
  -- Version Control
  version int default 1,
  is_latest boolean default true
);

-- ============================================
-- 📬 TABLE: emails
-- ============================================
-- Communication tracking and automation log

create table if not exists emails (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references leads (id) on delete cascade,
  quote_id uuid references quotes (id) on delete set null,
  created_at timestamp with time zone default now(),
  
  -- Email Content
  subject text,
  body text,
  recipient_email text,
  
  -- Tracking
  status text default 'sent' check (status in ('draft', 'sent', 'delivered', 'opened', 'clicked', 'bounced', 'failed')),
  sent_at timestamp with time zone,
  opened_at timestamp with time zone,
  clicked_at timestamp with time zone,
  
  -- Metadata
  provider text default 'resend', -- 'resend', 'sendgrid', 'manual'
  external_id text -- ID from email provider
);

-- ============================================
-- INDEXES for Performance
-- ============================================

-- Leads indexes
create index if not exists leads_email_idx on leads(email);
create index if not exists leads_created_at_idx on leads(created_at desc);
create index if not exists leads_status_idx on leads(status);
create index if not exists leads_source_idx on leads(source);
create index if not exists leads_company_idx on leads(company);

-- Conversations indexes
create index if not exists conversations_lead_id_idx on conversations(lead_id);
create index if not exists conversations_created_at_idx on conversations(created_at desc);
create index if not exists conversations_status_idx on conversations(status);

-- Quotes indexes
create index if not exists quotes_lead_id_idx on quotes(lead_id);
create index if not exists quotes_conversation_id_idx on quotes(conversation_id);
create index if not exists quotes_status_idx on quotes(status);
create index if not exists quotes_created_at_idx on quotes(created_at desc);

-- Quote files indexes
create index if not exists quote_files_quote_id_idx on quote_files(quote_id);
create index if not exists quote_files_is_latest_idx on quote_files(is_latest) where is_latest = true;

-- Emails indexes
create index if not exists emails_lead_id_idx on emails(lead_id);
create index if not exists emails_quote_id_idx on emails(quote_id);
create index if not exists emails_status_idx on emails(status);

-- ============================================
-- TRIGGERS for Auto-Update Timestamps
-- ============================================

-- Function to update updated_at column
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Triggers for leads
create trigger update_leads_updated_at
  before update on leads
  for each row
  execute function update_updated_at_column();

-- Triggers for conversations
create trigger update_conversations_updated_at
  before update on conversations
  for each row
  execute function update_updated_at_column();

-- Triggers for quotes
create trigger update_quotes_updated_at
  before update on quotes
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

-- Policies for leads
create policy "Allow public insert for leads" on leads
  for insert
  with check (true);

create policy "Allow authenticated read access for leads" on leads
  for select
  using (auth.role() = 'authenticated');

create policy "Allow authenticated update for leads" on leads
  for update
  using (auth.role() = 'authenticated');

-- Policies for conversations
create policy "Allow public insert for conversations" on conversations
  for insert
  with check (true);

create policy "Allow authenticated read access for conversations" on conversations
  for select
  using (auth.role() = 'authenticated');

create policy "Allow authenticated update for conversations" on conversations
  for update
  using (auth.role() = 'authenticated');

-- Policies for quotes
create policy "Allow authenticated all access for quotes" on quotes
  for all
  using (auth.role() = 'authenticated');

-- Policies for quote_files
create policy "Allow authenticated all access for quote_files" on quote_files
  for all
  using (auth.role() = 'authenticated');

-- Policies for emails
create policy "Allow authenticated all access for emails" on emails
  for all
  using (auth.role() = 'authenticated');

-- ============================================
-- VIEWS for Analytics
-- ============================================

-- Lead Analytics View
create or replace view lead_analytics as
select
  date_trunc('day', created_at) as date,
  count(*) as total_leads,
  count(*) filter (where status = 'qualified') as qualified_leads,
  count(*) filter (where status = 'quoted') as quoted_leads,
  count(*) filter (where status = 'converted') as converted_leads,
  avg(interest_level) as avg_interest_level,
  count(distinct industry) as unique_industries,
  count(distinct company) as unique_companies,
  count(distinct source) as unique_sources
from leads
group by date_trunc('day', created_at)
order by date desc;

-- Conversation Performance View
create or replace view conversation_performance as
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
create or replace view quote_performance as
select
  date_trunc('day', created_at) as date,
  count(*) as total_quotes,
  count(*) filter (where status = 'sent') as sent_quotes,
  count(*) filter (where status = 'viewed') as viewed_quotes,
  count(*) filter (where status = 'accepted') as accepted_quotes,
  count(*) filter (where status = 'rejected') as rejected_quotes,
  round(
    100.0 * count(*) filter (where status = 'accepted') / 
    nullif(count(*) filter (where status in ('accepted', 'rejected')), 0),
    2
  ) as acceptance_rate
from quotes
group by date_trunc('day', created_at)
order by date desc;

-- ============================================
-- COMMENTS for Documentation
-- ============================================

comment on table leads is 'Core customer information and lead tracking';
comment on table conversations is 'Chat history for AI training and analysis';
comment on table quotes is 'Generated proposals and pricing quotes';
comment on table quote_files is 'PDF files and documents linked to quotes';
comment on table emails is 'Email communication tracking';

comment on column conversations.messages is 'JSONB array of chat messages with roles';
comment on column quotes.proposed_solution is 'JSONB array of features and pricing';
comment on column leads.interest_level is 'Lead quality score 0-10';
