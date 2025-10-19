-- ================================================
-- Supabase Migration: Lead Tracking & Follow-up
-- ================================================
-- Run this in your Supabase SQL Editor to add
-- fields needed for n8n smart routing and dashboard

-- Add quote status tracking
ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS quote_status TEXT DEFAULT 'incomplete'
  CHECK (quote_status IN (
    'incomplete',  -- Missing budget or timeline
    'ready',       -- Has all data, ready for quote
    'quoted',      -- PDF sent
    'nurturing',   -- In follow-up sequence
    'cold',        -- Follow-up sequence complete, no response
    'converted',   -- Became a customer
    'lost'         -- Explicitly not interested
  ));

-- Add follow-up sequence tracking
ALTER TABLE leads
ADD COLUMN IF NOT EXISTS followup_sequence INTEGER DEFAULT 0
  CHECK (followup_sequence >= 0 AND followup_sequence <= 3);

-- Add timestamps for follow-up management
ALTER TABLE leads
ADD COLUMN IF NOT EXISTS last_followup TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS quoted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS converted_at TIMESTAMPTZ;

-- Add quote URL (for PDF storage)
ALTER TABLE leads
ADD COLUMN IF NOT EXISTS quote_url TEXT;

-- Add lead source tracking (if not already exists)
ALTER TABLE leads
ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'Telos Chat';

-- Create indexes for fast dashboard queries
CREATE INDEX IF NOT EXISTS idx_leads_quote_status 
ON leads(quote_status);

CREATE INDEX IF NOT EXISTS idx_leads_created_at 
ON leads(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_leads_followup 
ON leads(last_followup) 
WHERE quote_status = 'nurturing';

-- ================================================
-- Create Views for Dashboard
-- ================================================

-- Lead status summary
CREATE OR REPLACE VIEW lead_status_summary AS
SELECT 
  quote_status,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 1) as percentage
FROM leads
GROUP BY quote_status
ORDER BY 
  CASE quote_status
    WHEN 'converted' THEN 1
    WHEN 'quoted' THEN 2
    WHEN 'ready' THEN 3
    WHEN 'nurturing' THEN 4
    WHEN 'incomplete' THEN 5
    WHEN 'cold' THEN 6
    WHEN 'lost' THEN 7
  END;

-- Leads needing follow-up
CREATE OR REPLACE VIEW leads_needing_followup AS
SELECT 
  id,
  name,
  email,
  company,
  automation_area,
  quote_status,
  followup_sequence,
  last_followup,
  created_at,
  CASE 
    WHEN followup_sequence = 0 THEN 'Send Email 1'
    WHEN followup_sequence = 1 AND last_followup < NOW() - INTERVAL '3 days' THEN 'Send Email 2'
    WHEN followup_sequence = 2 AND last_followup < NOW() - INTERVAL '7 days' THEN 'Send Email 3'
    ELSE 'Up to date'
  END as action_needed
FROM leads
WHERE quote_status = 'nurturing'
ORDER BY last_followup ASC NULLS FIRST;

-- Conversion funnel (last 30 days)
CREATE OR REPLACE VIEW conversion_funnel_30d AS
SELECT 
  DATE(created_at) as date,
  COUNT(*) as total_leads,
  COUNT(*) FILTER (WHERE quote_status IN ('ready', 'quoted', 'converted')) as qualified,
  COUNT(*) FILTER (WHERE quote_status = 'quoted') as quoted,
  COUNT(*) FILTER (WHERE quote_status = 'converted') as converted,
  ROUND(COUNT(*) FILTER (WHERE quote_status IN ('ready', 'quoted', 'converted')) * 100.0 / NULLIF(COUNT(*), 0), 1) as qualification_rate,
  ROUND(COUNT(*) FILTER (WHERE quote_status = 'quoted') * 100.0 / NULLIF(COUNT(*), 0), 1) as quote_rate,
  ROUND(COUNT(*) FILTER (WHERE quote_status = 'converted') * 100.0 / NULLIF(COUNT(*), 0), 1) as conversion_rate
FROM leads
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- Recent leads with full context
CREATE OR REPLACE VIEW recent_leads AS
SELECT 
  l.id,
  l.name,
  l.email,
  l.company,
  l.automation_area,
  l.budget_range,
  l.timeline,
  l.quote_status,
  l.followup_sequence,
  l.source,
  l.created_at,
  l.last_followup,
  l.quoted_at,
  COALESCE(jsonb_array_length(c.messages), 0) as message_count,
  c.model_used as ai_model
FROM leads l
LEFT JOIN conversations c ON c.lead_id = l.id
ORDER BY l.created_at DESC
LIMIT 50;

-- ================================================
-- Grant Permissions (if using RLS)
-- ================================================

-- Allow authenticated users to view dashboard data
GRANT SELECT ON lead_status_summary TO authenticated;
GRANT SELECT ON leads_needing_followup TO authenticated;
GRANT SELECT ON conversion_funnel_30d TO authenticated;
GRANT SELECT ON recent_leads TO authenticated;

-- ================================================
-- Test Queries
-- ================================================

-- Test 1: Check if fields were added
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'leads'
  AND column_name IN ('quote_status', 'followup_sequence', 'last_followup', 'quoted_at', 'quote_url')
ORDER BY column_name;

-- Test 2: View lead status summary
SELECT * FROM lead_status_summary;

-- Test 3: Check recent leads
SELECT 
  name,
  email,
  quote_status,
  followup_sequence,
  created_at
FROM leads
ORDER BY created_at DESC
LIMIT 5;

-- ================================================
-- Sample Data (Optional - for testing)
-- ================================================

/*
-- Insert test leads with different statuses
INSERT INTO leads (name, email, company, project_summary, budget_range, timeline, automation_area, quote_status, source)
VALUES 
  ('John Doe', 'john@test.com', 'TestCorp', 'Payment automation', '$10k-$20k', '3 months', 'payment processing', 'quoted', 'Telos Chat'),
  ('Jane Smith', 'jane@test.com', 'JaneCorp', 'CRM integration', NULL, NULL, 'CRM', 'incomplete', 'Telos Chat'),
  ('Bob Wilson', 'bob@test.com', 'BobCo', 'AI chatbot', '$5k-$10k', '2 months', 'chatbot', 'nurturing', 'Telos Chat');
*/

-- ================================================
-- Migration Complete!
-- ================================================
-- Run the test queries above to verify everything works.
-- Then import the n8n workflow and start routing! 🚀

