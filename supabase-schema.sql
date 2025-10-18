-- Are You Human? Copilot Database Schema
-- Run this in your Supabase SQL Editor to create the leads table

-- Create the leads table
create table if not exists leads (
  id uuid primary key default gen_random_uuid(),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  
  -- User Information
  name text,
  email text,
  company text,
  role text,
  industry text,
  
  -- Problem & Goals
  problem_text text,
  tools_used text[],
  goal text,
  
  -- Budget & Timeline
  budget_range text,
  urgency text,
  
  -- Technical Details
  tech_familiarity text,
  automation_area text,
  complexity text,
  
  -- Lead Scoring & Recommendations
  interest_level int check (interest_level >= 0 and interest_level <= 10),
  automation_idea text,
  suggested_tools text[],
  roi_estimate text,
  next_step text,
  
  -- Conversation Data
  conversation_history jsonb default '[]'::jsonb,
  
  -- Metadata
  source text default 'web_chat',
  status text default 'new' check (status in ('new', 'contacted', 'qualified', 'converted', 'closed'))
);

-- Create indexes for better query performance
create index if not exists leads_email_idx on leads(email);
create index if not exists leads_created_at_idx on leads(created_at desc);
create index if not exists leads_status_idx on leads(status);
create index if not exists leads_company_idx on leads(company);

-- Create updated_at trigger
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_leads_updated_at
  before update on leads
  for each row
  execute function update_updated_at_column();

-- Enable Row Level Security (RLS)
alter table leads enable row level security;

-- Create a policy that allows authenticated users to read all leads
create policy "Allow authenticated read access" on leads
  for select
  using (auth.role() = 'authenticated');

-- Create a policy that allows inserting new leads (for the chat)
create policy "Allow insert for all users" on leads
  for insert
  with check (true);

-- Create a policy that allows authenticated users to update leads
create policy "Allow authenticated update access" on leads
  for update
  using (auth.role() = 'authenticated');

-- Optional: Create a view for lead analytics
create or replace view lead_analytics as
select
  date_trunc('day', created_at) as date,
  count(*) as total_leads,
  count(*) filter (where status = 'qualified') as qualified_leads,
  count(*) filter (where status = 'converted') as converted_leads,
  avg(interest_level) as avg_interest_level,
  count(distinct industry) as unique_industries,
  count(distinct company) as unique_companies
from leads
group by date_trunc('day', created_at)
order by date desc;

-- Add some comments for documentation
comment on table leads is 'Stores lead information collected through the AI copilot chat';
comment on column leads.conversation_history is 'JSON array storing the full conversation between user and AI';
comment on column leads.interest_level is 'Lead interest score from 0-10 based on conversation';
comment on column leads.status is 'Current status in the lead pipeline';

