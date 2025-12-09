-- Are You Human? Database Schema
-- For Neon PostgreSQL
-- Run this to set up your database

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- LEADS TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Contact Info
    name VARCHAR(255),
    email VARCHAR(255),
    company VARCHAR(255),
    role VARCHAR(255),
    phone VARCHAR(50),

    -- Company Info
    industry VARCHAR(255),
    company_size VARCHAR(100),
    website VARCHAR(500),

    -- Project Info
    problem_text TEXT,
    automation_area VARCHAR(255),
    tools_used TEXT[], -- Array of tool names
    budget_range VARCHAR(100),
    timeline VARCHAR(100),
    urgency VARCHAR(50),
    goal VARCHAR(255),

    -- Scoring
    interest_level INTEGER CHECK (interest_level >= 1 AND interest_level <= 10),
    lead_score INTEGER CHECK (lead_score >= 0 AND lead_score <= 100),

    -- Status
    status VARCHAR(50) DEFAULT 'new' CHECK (status IN (
        'new', 'contacted', 'qualified', 'nurture', 'converted', 'lost'
    )),
    source VARCHAR(100) DEFAULT 'chat',

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE,
    last_contact_at TIMESTAMP WITH TIME ZONE,
    converted_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for leads
CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(email);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_lead_score ON leads(lead_score DESC);

-- =============================================================================
-- CONVERSATIONS TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,

    -- Content
    messages JSONB DEFAULT '[]'::jsonb,
    summary TEXT,

    -- Status
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN (
        'active', 'completed', 'abandoned'
    )),

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for conversations
CREATE INDEX IF NOT EXISTS idx_conversations_lead_id ON conversations(lead_id);
CREATE INDEX IF NOT EXISTS idx_conversations_status ON conversations(status);
CREATE INDEX IF NOT EXISTS idx_conversations_created_at ON conversations(created_at DESC);

-- =============================================================================
-- QUOTES TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS quotes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,

    -- Project Details
    project_title VARCHAR(500) NOT NULL,
    project_summary TEXT,
    scope_items JSONB DEFAULT '[]'::jsonb,

    -- Pricing
    total_amount DECIMAL(12, 2) DEFAULT 0,
    currency VARCHAR(3) DEFAULT 'USD',

    -- Status
    status VARCHAR(50) DEFAULT 'draft' CHECK (status IN (
        'draft', 'sent', 'viewed', 'accepted', 'declined', 'expired'
    )),

    -- Validity
    valid_until DATE,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    sent_at TIMESTAMP WITH TIME ZONE,
    viewed_at TIMESTAMP WITH TIME ZONE,
    accepted_at TIMESTAMP WITH TIME ZONE,
    declined_at TIMESTAMP WITH TIME ZONE,
    decline_reason TEXT
);

-- Indexes for quotes
CREATE INDEX IF NOT EXISTS idx_quotes_lead_id ON quotes(lead_id);
CREATE INDEX IF NOT EXISTS idx_quotes_status ON quotes(status);
CREATE INDEX IF NOT EXISTS idx_quotes_created_at ON quotes(created_at DESC);

-- =============================================================================
-- HELPFUL VIEWS
-- =============================================================================

-- View: Qualified leads ready for quotes
CREATE OR REPLACE VIEW qualified_leads AS
SELECT
    l.*,
    c.id as conversation_id,
    c.messages as conversation_messages
FROM leads l
LEFT JOIN conversations c ON c.lead_id = l.id
WHERE l.status = 'qualified'
  AND l.lead_score >= 70
ORDER BY l.created_at DESC;

-- View: Recent lead activity
CREATE OR REPLACE VIEW recent_leads AS
SELECT
    l.id,
    l.name,
    l.email,
    l.company,
    l.lead_score,
    l.status,
    l.created_at,
    COUNT(c.id) as conversation_count,
    COUNT(q.id) as quote_count
FROM leads l
LEFT JOIN conversations c ON c.lead_id = l.id
LEFT JOIN quotes q ON q.lead_id = l.id
WHERE l.created_at > NOW() - INTERVAL '30 days'
GROUP BY l.id
ORDER BY l.created_at DESC;

-- =============================================================================
-- FUNCTIONS
-- =============================================================================

-- Function: Update updated_at timestamp automatically
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_leads_updated_at ON leads;
CREATE TRIGGER update_leads_updated_at
    BEFORE UPDATE ON leads
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_conversations_updated_at ON conversations;
CREATE TRIGGER update_conversations_updated_at
    BEFORE UPDATE ON conversations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
