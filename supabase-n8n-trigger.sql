-- =====================================================
-- SUPABASE → n8n TRIGGER SETUP
-- =====================================================
-- This creates a database trigger that automatically calls
-- your n8n webhook whenever a new lead is inserted
-- =====================================================

-- 1. Create a function to call n8n webhook
CREATE OR REPLACE FUNCTION trigger_n8n_webhook()
RETURNS TRIGGER AS $$
DECLARE
  webhook_url TEXT := 'https://areyouhuman.up.railway.app/webhook/telos-new-lead';
  payload JSONB;
BEGIN
  -- Build the payload from the new lead data
  payload := jsonb_build_object(
    'leadId', NEW.id,
    'timestamp', NOW(),
    'name', NEW.name,
    'email', NEW.email,
    'company', NEW.company,
    'project_title', COALESCE(NEW.automation_area || ' Automation', 'AI Automation Project'),
    'project_summary', NEW.problem_text,
    'automation_area', NEW.automation_area,
    'tools_used', NEW.tools_used,
    'budget_range', NEW.budget_range,
    'timeline', NEW.timeline,
    'urgency', NEW.urgency,
    'interest_level', NEW.interest_level,
    'source', COALESCE(NEW.source, 'Telos Chat'),
    'created_at', NEW.created_at
  );

  -- Call n8n webhook using Supabase's http extension
  PERFORM
    net.http_post(
      url := webhook_url,
      headers := '{"Content-Type": "application/json"}'::jsonb,
      body := payload
    );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Create trigger that fires AFTER a lead is inserted
DROP TRIGGER IF EXISTS on_lead_created_trigger ON leads;

CREATE TRIGGER on_lead_created_trigger
  AFTER INSERT ON leads
  FOR EACH ROW
  WHEN (
    -- Only trigger if lead is qualified (has name, email, company)
    NEW.name IS NOT NULL AND 
    NEW.email IS NOT NULL AND 
    NEW.company IS NOT NULL
  )
  EXECUTE FUNCTION trigger_n8n_webhook();

-- =====================================================
-- USAGE:
-- =====================================================
-- After running this SQL:
-- 1. Any INSERT into 'leads' table will automatically trigger n8n
-- 2. Your app only needs to save to Supabase
-- 3. Supabase handles calling n8n for you
-- =====================================================

-- Test it:
-- INSERT INTO leads (name, email, company, problem_text, source) 
-- VALUES ('Test User', 'test@example.com', 'Test Corp', 'Test automation', 'Manual Test');
-- 
-- Check n8n executions - you should see a new workflow run!

-- =====================================================
-- ENABLE SUPABASE HTTP EXTENSION (if not enabled)
-- =====================================================
-- You may need to enable the 'http' extension first:
-- Run this in Supabase SQL Editor:

-- CREATE EXTENSION IF NOT EXISTS http;

-- Or use the pg_net extension (newer, better):
-- This is already enabled in most Supabase projects
-- No action needed if your project was created recently

-- =====================================================
-- UPDATE WEBHOOK URL
-- =====================================================
-- To change the webhook URL later, update the function:
-- 
-- ALTER FUNCTION trigger_n8n_webhook() 
-- SET search_path = public;
-- 
-- Then modify the webhook_url in the function definition above
-- and re-run the CREATE OR REPLACE FUNCTION statement

-- =====================================================
-- DISABLE TRIGGER (if needed)
-- =====================================================
-- To temporarily disable:
-- ALTER TABLE leads DISABLE TRIGGER on_lead_created_trigger;
--
-- To re-enable:
-- ALTER TABLE leads ENABLE TRIGGER on_lead_created_trigger;

-- =====================================================
-- VIEW TRIGGER STATUS
-- =====================================================
-- SELECT * FROM pg_trigger WHERE tgname = 'on_lead_created_trigger';


