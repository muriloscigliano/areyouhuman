-- =====================================================
-- Add 'goal' column to leads table
-- =====================================================
-- Run this in your Supabase SQL Editor
-- =====================================================

-- Add goal column if it doesn't exist
ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS goal TEXT;

-- Add a comment to document the field
COMMENT ON COLUMN leads.goal IS 'Primary goal or objective for the automation project';

-- Optional: Create an index if you'll search by goal
-- CREATE INDEX IF NOT EXISTS idx_leads_goal ON leads(goal);

-- =====================================================
-- Verify the column was added
-- =====================================================
-- Run this to check:
-- SELECT column_name, data_type 
-- FROM information_schema.columns 
-- WHERE table_name = 'leads' AND column_name = 'goal';

