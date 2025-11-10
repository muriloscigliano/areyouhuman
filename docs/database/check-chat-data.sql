-- Quick queries to check recent chat data in Supabase
-- Run these in your Supabase SQL Editor

-- ============================================
-- 1. Check Recent Leads (Last 24 hours)
-- ============================================
SELECT 
  id,
  name,
  email,
  company,
  problem_text,
  project_title,
  project_summary,
  timeline,
  budget_range,
  status,
  quote_status,
  source,
  created_at,
  updated_at
FROM leads
WHERE created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC
LIMIT 10;

-- ============================================
-- 2. Check Recent Conversations (Last 24 hours)
-- ============================================
SELECT 
  id,
  lead_id,
  jsonb_array_length(messages) as message_count,
  model_used,
  status,
  summary,
  created_at,
  updated_at
FROM conversations
WHERE created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC
LIMIT 10;

-- ============================================
-- 3. View Conversation Messages (Most Recent)
-- ============================================
SELECT 
  c.id as conversation_id,
  l.name as lead_name,
  l.email as lead_email,
  c.messages,
  c.created_at
FROM conversations c
LEFT JOIN leads l ON c.lead_id = l.id
ORDER BY c.created_at DESC
LIMIT 1;

-- ============================================
-- 4. Check All Leads (Count)
-- ============================================
SELECT 
  COUNT(*) as total_leads,
  COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '24 hours') as leads_today,
  COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '7 days') as leads_this_week
FROM leads;

-- ============================================
-- 5. Check Data Completeness (Recent Leads)
-- ============================================
SELECT 
  id,
  name,
  email,
  company,
  CASE 
    WHEN name IS NOT NULL THEN '✅' ELSE '❌' 
  END as has_name,
  CASE 
    WHEN email IS NOT NULL THEN '✅' ELSE '❌' 
  END as has_email,
  CASE 
    WHEN company IS NOT NULL THEN '✅' ELSE '❌' 
  END as has_company,
  CASE 
    WHEN problem_text IS NOT NULL THEN '✅' ELSE '❌' 
  END as has_problem,
  created_at
FROM leads
WHERE created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;

-- ============================================
-- 6. View Full Lead Details (Most Recent)
-- ============================================
SELECT *
FROM leads
ORDER BY created_at DESC
LIMIT 1;

-- ============================================
-- 7. Check if Tables Exist
-- ============================================
SELECT 
  table_name,
  CASE 
    WHEN table_name IN (
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public'
    ) THEN '✅ Exists' 
    ELSE '❌ Missing' 
  END as status
FROM (
  VALUES 
    ('leads'),
    ('conversations'),
    ('quotes'),
    ('quote_files'),
    ('emails')
) AS required_tables(table_name);

-- ============================================
-- 8. Quick Health Check
-- ============================================
SELECT 
  'Total Leads' as metric,
  COUNT(*)::text as value
FROM leads
UNION ALL
SELECT 
  'Total Conversations',
  COUNT(*)::text
FROM conversations
UNION ALL
SELECT 
  'Leads with Email',
  COUNT(*)::text
FROM leads WHERE email IS NOT NULL
UNION ALL
SELECT 
  'Leads with Company',
  COUNT(*)::text
FROM leads WHERE company IS NOT NULL;

