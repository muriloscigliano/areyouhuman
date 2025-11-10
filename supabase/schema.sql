-- ============================================================================
-- TELOS AI - SUPABASE DATABASE SCHEMA
-- ============================================================================
-- Complete database setup for AI-powered lead qualification system
--
-- Features:
-- - Lead tracking with conversation history
-- - Quote generation and status tracking
-- - Automatic n8n webhook triggers
-- - Real-time subscriptions
-- - Row-Level Security (RLS)
-- - Analytics views
--
-- Usage:
-- 1. Copy this entire file
-- 2. Go to Supabase Dashboard > SQL Editor
-- 3. Paste and run
-- ============================================================================

-- ============================================================================
-- EXTENSIONS
-- ============================================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable HTTP requests (for n8n webhooks)
CREATE EXTENSION IF NOT EXISTS "http";

-- Enable pgcrypto for hashing
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- CUSTOM TYPES
-- ============================================================================

-- Lead status enum
CREATE TYPE lead_status AS ENUM (
  'new',           -- Just created
  'contacted',     -- Initial contact made
  'qualified',     -- Passed qualification criteria
  'nurture',       -- Needs follow-up
  'quoted',        -- Quote sent
  'converted',     -- Became customer
  'lost',          -- Did not convert
  'spam'           -- Filtered out
);

-- Quote status enum
CREATE TYPE quote_status AS ENUM (
  'draft',         -- Being generated
  'sent',          -- Emailed to lead
  'viewed',        -- Lead opened email/PDF
  'accepted',      -- Lead accepted quote
  'declined',      -- Lead declined
  'expired',       -- Quote expired (30 days)
  'revised'        -- Quote was updated
);

-- Conversation status enum
CREATE TYPE conversation_status AS ENUM (
  'active',        -- Ongoing
  'completed',     -- Finished successfully
  'abandoned',     -- User dropped off
  'transferred'    -- Handed to human
);

-- ============================================================================
-- LEADS TABLE
-- ============================================================================

CREATE TABLE leads (
  -- Primary identification
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Contact information
  name TEXT,
  email TEXT,
  company TEXT,
  role TEXT,
  phone TEXT,

  -- Business context
  industry TEXT,
  company_size TEXT,
  website TEXT,

  -- Project details
  problem_text TEXT,
  automation_area TEXT,
  tools_used TEXT[], -- Array of tool names
  budget_range TEXT,
  timeline TEXT,
  urgency TEXT,

  -- Lead scoring
  interest_level INTEGER CHECK (interest_level >= 1 AND interest_level <= 10),
  lead_score INTEGER DEFAULT 0, -- Calculated score (0-100)
  status lead_status DEFAULT 'new',

  -- Source tracking
  source TEXT DEFAULT 'chat', -- 'chat', 'form', 'api', 'import'
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  referrer TEXT,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_contact_at TIMESTAMPTZ,
  converted_at TIMESTAMPTZ,

  -- Additional data (flexible JSON for custom fields)
  metadata JSONB DEFAULT '{}'::JSONB,

  -- Constraints
  CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- Indexes for performance
CREATE INDEX idx_leads_email ON leads(email);
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_created_at ON leads(created_at DESC);
CREATE INDEX idx_leads_lead_score ON leads(lead_score DESC);
CREATE INDEX idx_leads_company ON leads(company);
CREATE INDEX idx_leads_source ON leads(source);

-- Full-text search on problem description
CREATE INDEX idx_leads_problem_search ON leads USING gin(to_tsvector('english', problem_text));

-- ============================================================================
-- CONVERSATIONS TABLE
-- ============================================================================

CREATE TABLE conversations (
  -- Primary identification
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,

  -- Conversation data
  messages JSONB DEFAULT '[]'::JSONB, -- Array of message objects
  summary TEXT, -- AI-generated summary for token optimization

  -- AI metadata
  model_used TEXT DEFAULT 'gpt-4o-mini',
  total_tokens INTEGER DEFAULT 0,
  total_messages INTEGER DEFAULT 0,

  -- Status tracking
  status conversation_status DEFAULT 'active',
  started_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,

  -- Quality metrics
  sentiment_score DECIMAL(3,2), -- -1.00 to 1.00
  engagement_score INTEGER, -- 0-100

  -- Metadata
  metadata JSONB DEFAULT '{}'::JSONB
);

-- Indexes
CREATE INDEX idx_conversations_lead_id ON conversations(lead_id);
CREATE INDEX idx_conversations_status ON conversations(status);
CREATE INDEX idx_conversations_started_at ON conversations(started_at DESC);

-- ============================================================================
-- QUOTES TABLE
-- ============================================================================

CREATE TABLE quotes (
  -- Primary identification
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL,

  -- Quote details
  project_title TEXT NOT NULL,
  project_summary TEXT,
  scope_of_work TEXT,
  deliverables TEXT[],

  -- Pricing
  subtotal DECIMAL(10,2),
  tax DECIMAL(10,2),
  total DECIMAL(10,2),
  currency TEXT DEFAULT 'USD',

  -- Timeline
  estimated_duration TEXT, -- e.g., "4-6 weeks"
  start_date DATE,
  end_date DATE,

  -- Status tracking
  status quote_status DEFAULT 'draft',

  -- File storage
  pdf_url TEXT,
  pdf_generated_at TIMESTAMPTZ,

  -- Tracking
  sent_at TIMESTAMPTZ,
  viewed_at TIMESTAMPTZ,
  accepted_at TIMESTAMPTZ,
  declined_at TIMESTAMPTZ,
  decline_reason TEXT,
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days'),

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::JSONB
);

-- Indexes
CREATE INDEX idx_quotes_lead_id ON quotes(lead_id);
CREATE INDEX idx_quotes_status ON quotes(status);
CREATE INDEX idx_quotes_created_at ON quotes(created_at DESC);
CREATE INDEX idx_quotes_expires_at ON quotes(expires_at);

-- ============================================================================
-- WEBHOOK LOGS TABLE (for debugging n8n triggers)
-- ============================================================================

CREATE TABLE webhook_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_type TEXT NOT NULL,
  payload JSONB,
  response JSONB,
  status_code INTEGER,
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_webhook_logs_created_at ON webhook_logs(created_at DESC);
CREATE INDEX idx_webhook_logs_event_type ON webhook_logs(event_type);

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function: Update updated_at timestamp automatically
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function: Calculate lead score based on data quality
CREATE OR REPLACE FUNCTION calculate_lead_score(lead_id UUID)
RETURNS INTEGER AS $$
DECLARE
  score INTEGER := 0;
  lead_record RECORD;
BEGIN
  SELECT * INTO lead_record FROM leads WHERE id = lead_id;

  -- Contact information (30 points)
  IF lead_record.name IS NOT NULL THEN score := score + 10; END IF;
  IF lead_record.email IS NOT NULL THEN score := score + 10; END IF;
  IF lead_record.company IS NOT NULL THEN score := score + 10; END IF;

  -- Project details (40 points)
  IF lead_record.problem_text IS NOT NULL AND LENGTH(lead_record.problem_text) > 50 THEN score := score + 15; END IF;
  IF lead_record.budget_range IS NOT NULL THEN score := score + 10; END IF;
  IF lead_record.timeline IS NOT NULL THEN score := score + 10; END IF;
  IF lead_record.automation_area IS NOT NULL THEN score := score + 5; END IF;

  -- Engagement (30 points)
  IF lead_record.interest_level >= 8 THEN score := score + 20;
  ELSIF lead_record.interest_level >= 6 THEN score := score + 10;
  ELSIF lead_record.interest_level >= 4 THEN score := score + 5;
  END IF;

  IF lead_record.tools_used IS NOT NULL AND array_length(lead_record.tools_used, 1) > 0 THEN score := score + 10; END IF;

  RETURN score;
END;
$$ LANGUAGE plpgsql;

-- Function: Trigger n8n webhook on lead insert/update
CREATE OR REPLACE FUNCTION notify_n8n_webhook()
RETURNS TRIGGER AS $$
DECLARE
  webhook_url TEXT;
  request_id INTEGER;
  response RECORD;
BEGIN
  -- Get n8n webhook URL from environment or use default
  -- You'll configure this in Supabase Dashboard > Project Settings > Vault
  webhook_url := current_setting('app.settings.n8n_webhook_url', true);

  -- If webhook URL is not configured, skip (prevents errors in dev)
  IF webhook_url IS NULL OR webhook_url = '' THEN
    RAISE NOTICE 'n8n webhook URL not configured, skipping trigger';
    RETURN NEW;
  END IF;

  -- Only trigger for leads with minimum required data
  IF NEW.name IS NOT NULL AND NEW.email IS NOT NULL AND NEW.company IS NOT NULL THEN

    -- Log the webhook attempt
    INSERT INTO webhook_logs (event_type, payload, created_at)
    VALUES (
      'lead.created',
      jsonb_build_object(
        'leadId', NEW.id,
        'name', NEW.name,
        'email', NEW.email,
        'company', NEW.company,
        'problem_text', NEW.problem_text,
        'automation_area', NEW.automation_area,
        'budget_range', NEW.budget_range,
        'interest_level', NEW.interest_level,
        'lead_score', NEW.lead_score,
        'source', NEW.source,
        'created_at', NEW.created_at
      ),
      NOW()
    );

    -- Make HTTP request to n8n (async, non-blocking)
    -- NOTE: This requires the 'http' extension
    BEGIN
      SELECT * INTO response FROM http_post(
        webhook_url,
        jsonb_build_object(
          'event', 'lead.created',
          'data', jsonb_build_object(
            'leadId', NEW.id,
            'name', NEW.name,
            'email', NEW.email,
            'company', NEW.company,
            'problem_text', NEW.problem_text,
            'automation_area', NEW.automation_area,
            'tools_used', NEW.tools_used,
            'budget_range', NEW.budget_range,
            'timeline', NEW.timeline,
            'urgency', NEW.urgency,
            'interest_level', NEW.interest_level,
            'lead_score', NEW.lead_score,
            'source', NEW.source,
            'created_at', NEW.created_at
          )
        )::TEXT,
        'application/json'
      );

      -- Log the response
      UPDATE webhook_logs
      SET response = jsonb_build_object('status', response.status),
          status_code = response.status
      WHERE event_type = 'lead.created'
        AND created_at = (SELECT MAX(created_at) FROM webhook_logs WHERE event_type = 'lead.created');

    EXCEPTION WHEN OTHERS THEN
      -- Log the error but don't fail the insert
      UPDATE webhook_logs
      SET error = SQLERRM
      WHERE event_type = 'lead.created'
        AND created_at = (SELECT MAX(created_at) FROM webhook_logs WHERE event_type = 'lead.created');

      RAISE NOTICE 'n8n webhook failed: %', SQLERRM;
    END;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Auto-update updated_at timestamp on all tables
CREATE TRIGGER update_leads_updated_at
  BEFORE UPDATE ON leads
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_conversations_updated_at
  BEFORE UPDATE ON conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_quotes_updated_at
  BEFORE UPDATE ON quotes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Auto-calculate lead score on insert/update
CREATE TRIGGER calculate_lead_score_trigger
  BEFORE INSERT OR UPDATE ON leads
  FOR EACH ROW
  EXECUTE FUNCTION (
    SELECT calculate_lead_score(NEW.id) INTO NEW.lead_score;
    RETURN NEW;
  );

-- Simpler lead score trigger
CREATE OR REPLACE FUNCTION set_lead_score()
RETURNS TRIGGER AS $$
BEGIN
  NEW.lead_score := calculate_lead_score(NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS calculate_lead_score_trigger ON leads;
CREATE TRIGGER calculate_lead_score_trigger
  BEFORE INSERT OR UPDATE ON leads
  FOR EACH ROW
  EXECUTE FUNCTION set_lead_score();

-- Trigger n8n webhook on lead insert
CREATE TRIGGER notify_n8n_on_lead_insert
  AFTER INSERT ON leads
  FOR EACH ROW
  EXECUTE FUNCTION notify_n8n_webhook();

-- ============================================================================
-- ROW-LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Allow service role (API routes) to do everything
CREATE POLICY "Service role can do everything on leads"
  ON leads
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role can do everything on conversations"
  ON conversations
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role can do everything on quotes"
  ON quotes
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role can do everything on webhook_logs"
  ON webhook_logs
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Policy: Authenticated users can read their own data (future feature)
-- Uncomment when you add user authentication
-- CREATE POLICY "Users can read their own leads"
--   ON leads
--   FOR SELECT
--   TO authenticated
--   USING (auth.uid() = user_id);

-- Policy: Anon users can insert leads (for public chat form)
CREATE POLICY "Anonymous users can insert leads"
  ON leads
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Policy: Anon users can insert conversations (for public chat)
CREATE POLICY "Anonymous users can insert conversations"
  ON conversations
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- ============================================================================
-- ANALYTICS VIEWS
-- ============================================================================

-- View: Lead Pipeline Summary
CREATE OR REPLACE VIEW lead_pipeline AS
SELECT
  status,
  COUNT(*) as count,
  AVG(lead_score) as avg_score,
  SUM(CASE WHEN created_at > NOW() - INTERVAL '7 days' THEN 1 ELSE 0 END) as new_this_week,
  SUM(CASE WHEN created_at > NOW() - INTERVAL '30 days' THEN 1 ELSE 0 END) as new_this_month
FROM leads
GROUP BY status
ORDER BY
  CASE status
    WHEN 'new' THEN 1
    WHEN 'contacted' THEN 2
    WHEN 'qualified' THEN 3
    WHEN 'quoted' THEN 4
    WHEN 'converted' THEN 5
    WHEN 'nurture' THEN 6
    WHEN 'lost' THEN 7
    WHEN 'spam' THEN 8
  END;

-- View: High-Quality Leads (score >= 70)
CREATE OR REPLACE VIEW high_quality_leads AS
SELECT
  id,
  name,
  email,
  company,
  problem_text,
  budget_range,
  lead_score,
  interest_level,
  status,
  created_at
FROM leads
WHERE lead_score >= 70
  AND status NOT IN ('converted', 'lost', 'spam')
ORDER BY lead_score DESC, created_at DESC;

-- View: Leads Needing Follow-Up
CREATE OR REPLACE VIEW leads_needing_followup AS
SELECT
  l.id,
  l.name,
  l.email,
  l.company,
  l.status,
  l.lead_score,
  l.created_at,
  l.last_contact_at,
  EXTRACT(DAY FROM NOW() - COALESCE(l.last_contact_at, l.created_at)) as days_since_contact
FROM leads l
WHERE l.status IN ('contacted', 'qualified', 'quoted')
  AND COALESCE(l.last_contact_at, l.created_at) < NOW() - INTERVAL '3 days'
ORDER BY days_since_contact DESC;

-- View: Quote Performance
CREATE OR REPLACE VIEW quote_performance AS
SELECT
  status,
  COUNT(*) as count,
  AVG(total) as avg_value,
  SUM(total) as total_value,
  AVG(EXTRACT(EPOCH FROM (accepted_at - sent_at))/86400) as avg_days_to_accept
FROM quotes
GROUP BY status;

-- View: Conversion Funnel
CREATE OR REPLACE VIEW conversion_funnel AS
SELECT
  'Total Leads' as stage,
  COUNT(*) as count,
  100.0 as percentage
FROM leads
UNION ALL
SELECT
  'Qualified',
  COUNT(*),
  (COUNT(*)::DECIMAL / (SELECT COUNT(*) FROM leads) * 100)
FROM leads WHERE status IN ('qualified', 'quoted', 'converted')
UNION ALL
SELECT
  'Quoted',
  COUNT(*),
  (COUNT(*)::DECIMAL / (SELECT COUNT(*) FROM leads) * 100)
FROM leads WHERE status IN ('quoted', 'converted')
UNION ALL
SELECT
  'Converted',
  COUNT(*),
  (COUNT(*)::DECIMAL / (SELECT COUNT(*) FROM leads) * 100)
FROM leads WHERE status = 'converted';

-- ============================================================================
-- REAL-TIME SUBSCRIPTIONS
-- ============================================================================

-- Enable realtime for tables
ALTER PUBLICATION supabase_realtime ADD TABLE leads;
ALTER PUBLICATION supabase_realtime ADD TABLE conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE quotes;

-- ============================================================================
-- HELPER FUNCTIONS FOR API ROUTES
-- ============================================================================

-- Function: Get or create lead by email
CREATE OR REPLACE FUNCTION get_or_create_lead(
  p_email TEXT,
  p_name TEXT DEFAULT NULL,
  p_company TEXT DEFAULT NULL,
  p_source TEXT DEFAULT 'chat'
)
RETURNS UUID AS $$
DECLARE
  v_lead_id UUID;
BEGIN
  -- Try to find existing lead
  SELECT id INTO v_lead_id FROM leads WHERE email = p_email;

  -- If not found, create new lead
  IF v_lead_id IS NULL THEN
    INSERT INTO leads (email, name, company, source)
    VALUES (p_email, p_name, p_company, p_source)
    RETURNING id INTO v_lead_id;
  END IF;

  RETURN v_lead_id;
END;
$$ LANGUAGE plpgsql;

-- Function: Update lead from conversation data
CREATE OR REPLACE FUNCTION update_lead_from_conversation(
  p_lead_id UUID,
  p_data JSONB
)
RETURNS VOID AS $$
BEGIN
  UPDATE leads
  SET
    name = COALESCE((p_data->>'name')::TEXT, name),
    email = COALESCE((p_data->>'email')::TEXT, email),
    company = COALESCE((p_data->>'company')::TEXT, company),
    role = COALESCE((p_data->>'role')::TEXT, role),
    problem_text = COALESCE((p_data->>'problem_text')::TEXT, problem_text),
    automation_area = COALESCE((p_data->>'automation_area')::TEXT, automation_area),
    budget_range = COALESCE((p_data->>'budget_range')::TEXT, budget_range),
    timeline = COALESCE((p_data->>'timeline')::TEXT, timeline),
    urgency = COALESCE((p_data->>'urgency')::TEXT, urgency),
    interest_level = COALESCE((p_data->>'interest_level')::INTEGER, interest_level),
    tools_used = COALESCE((p_data->>'tools_used')::TEXT[], tools_used),
    updated_at = NOW(),
    last_contact_at = NOW()
  WHERE id = p_lead_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- SAMPLE DATA (for testing)
-- ============================================================================

-- Uncomment to insert sample data for testing
/*
INSERT INTO leads (name, email, company, problem_text, automation_area, budget_range, interest_level, status)
VALUES
  ('John Doe', 'john@example.com', 'TechCorp', 'Need to automate customer support', 'Customer Service', '$5k-$20k', 8, 'qualified'),
  ('Jane Smith', 'jane@startup.io', 'StartupX', 'Want AI chatbot for sales', 'Sales Automation', '$3k-$5k', 7, 'contacted'),
  ('Bob Johnson', 'bob@bigco.com', 'BigCo Inc', 'Automate data entry tasks', 'Data Processing', '$20k-$50k', 9, 'quoted');
*/

-- ============================================================================
-- CONFIGURATION NOTES
-- ============================================================================

/*
IMPORTANT: Configure n8n webhook URL in Supabase

1. Go to Supabase Dashboard > Project Settings > Vault
2. Create a new secret called 'n8n_webhook_url'
3. Set the value to your n8n webhook URL, e.g.:
   https://your-n8n-instance.com/webhook/telos-lead

Alternatively, you can set it via SQL:

ALTER DATABASE postgres SET app.settings.n8n_webhook_url = 'https://your-n8n-instance.com/webhook/telos-lead';

Then reload configuration:

SELECT pg_reload_conf();
*/

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check that all tables were created
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- Check that all triggers are active
SELECT trigger_name, event_object_table
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;

-- Check that RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public';

-- ============================================================================
-- END OF SCHEMA
-- ============================================================================
