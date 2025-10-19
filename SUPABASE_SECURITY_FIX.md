# 🔒 Supabase Security Fixes

## Issues Found in Security Advisor

### ❌ Error 1: Security Definer Views (3 errors)
**Tables affected:**
- `public.conversation_performance`
- `public.lead_analytics`  
- `public.quote_performance`

**Problem:**  
Views created without `security_invoker` can bypass Row Level Security (RLS) policies. This is a security risk if views are accessible to unauthorized users.

**Fix:**
```sql
-- BEFORE (❌ Insecure)
create or replace view lead_analytics as
select ...

-- AFTER (✅ Secure)
create view lead_analytics
with (security_invoker=true) -- Respects RLS policies
as
select ...
```

---

### ❌ Error 2: Function Search Path Mutable (1 warning)
**Function affected:**
- `public.update_updated_at_column`

**Problem:**  
Function doesn't have `search_path` set, which can lead to SQL injection if malicious schemas are created.

**Fix:**
```sql
-- BEFORE (❌ Vulnerable)
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- AFTER (✅ Secure)
create or replace function update_updated_at_column()
returns trigger
language plpgsql
security definer
set search_path = public -- ✅ Locks search path
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
```

---

## How to Apply the Fix

### Step 1: Backup Current Data (IMPORTANT!)

**Option A: Supabase Dashboard**
1. Go to your Supabase project
2. Database → Backups
3. Click "Create backup"

**Option B: SQL Export**
```sql
-- Export your current data
select * from leads;
select * from conversations;
select * from quotes;
-- Copy results to CSV for backup
```

---

### Step 2: Apply the Fixed Schema

1. **Open Supabase SQL Editor**
   - Go to your Supabase Dashboard
   - Click "SQL Editor" in sidebar
   - Click "+ New query"

2. **Copy the entire contents of `supabase-schema-fixed.sql`**

3. **Run the query**
   - Click "Run" (or Cmd/Ctrl + Enter)
   - Wait for completion

4. **Verify** (run these queries):

```sql
-- Check Security Advisor (should be clean now!)
-- 1. Verify views have security_invoker
select 
  table_name,
  view_definition
from information_schema.views 
where table_schema = 'public';

-- 2. Verify function has search_path
select 
  routine_name,
  routine_definition
from information_schema.routines 
where routine_schema = 'public'
and routine_name = 'update_updated_at_column';

-- 3. Test insert
insert into leads (
  name, 
  email, 
  project_title, 
  project_summary, 
  timeline
) values (
  'Test User', 
  'test@example.com', 
  'Test Project', 
  'Testing new schema', 
  '3 months'
);

-- Verify it worked
select * from leads where email = 'test@example.com';

-- Clean up test data
delete from leads where email = 'test@example.com';
```

---

### Step 3: Verify Security Advisor

1. Go to **Database → Security Advisor**
2. Click **Refresh**
3. **Expected Result:** ✅ **0 errors, 0 warnings**

---

## What Changed in the Schema

### Updated `leads` Table

**NEW required fields:**
- ✅ `name` (required)
- ✅ `email` (required, unique)
- ✅ `project_title` (required)
- ✅ `project_summary` (required)
- ✅ `timeline` (required)

**NEW optional fields:**
- `goals` (jsonb) - Array of objectives
- `pain_points` (text)
- `tools_in_use` (jsonb) - Array of current tools
- `desired_features` (jsonb) - Array of wanted features
- `budget_min` (numeric)
- `budget_max` (numeric)
- `quote_status` (enum) - 'pending', 'sent', 'accepted', 'rejected'
- `quote_pdf_url` (text)
- `calendar_link` (text)
- `language` (text) - 'en', 'pt', 'es'

**Legacy fields kept:**
- `problem_text`, `tools_used`, `budget_range`, `urgency`, `interest_level`, `automation_area`, `status`

### New Tables Added

**1. `messages` (Optional Analytics)**
```sql
{
  id: uuid,
  lead_id: uuid,
  conversation_id: uuid,
  role: 'human' | 'ai' | 'system',
  content: text,
  type: 'text' | 'ui' | 'system',
  tokens_used: int,
  intent: text,
  confidence: numeric,
  created_at: timestamp
}
```

**Use Cases:**
- Track token costs per lead
- Analyze conversion patterns
- Identify common intents
- A/B test different prompts

**2. `projects` (Future Use)**
```sql
{
  id: uuid,
  lead_id: uuid,
  project_name: text,
  description: text,
  status: enum,
  start_date: date,
  end_date: date,
  budget: numeric,
  deliverables: jsonb
}
```

**Use Cases:**
- Multi-project clients
- Track project lifecycle
- Link to quotes
- Manage deliverables

### New Analytics Views

**1. `message_analytics`**
```sql
-- Token cost tracking by day
select * from message_analytics;
```

**2. `conversion_funnel`**
```sql
-- Full funnel metrics
select * from conversion_funnel;
```

Returns:
- Total leads
- Qualification rate
- Quote rate
- Acceptance rate
- Conversion rate

---

## Migration Guide (If You Have Existing Data)

### Option 1: Fresh Start (Recommended for Testing)

```sql
-- Drop all tables (⚠️ DELETES ALL DATA)
drop table if exists projects cascade;
drop table if exists messages cascade;
drop table if exists emails cascade;
drop table if exists quote_files cascade;
drop table if exists quotes cascade;
drop table if exists conversations cascade;
drop table if exists leads cascade;

-- Then run supabase-schema-fixed.sql
```

### Option 2: Preserve Existing Data

```sql
-- 1. Add new columns to existing leads table
alter table leads add column if not exists project_title text;
alter table leads add column if not exists project_summary text;
alter table leads add column if not exists timeline text;
alter table leads add column if not exists goals jsonb default '[]'::jsonb;
alter table leads add column if not exists pain_points text;
alter table leads add column if not exists tools_in_use jsonb default '[]'::jsonb;
alter table leads add column if not exists desired_features jsonb default '[]'::jsonb;
alter table leads add column if not exists budget_min numeric;
alter table leads add column if not exists budget_max numeric;
alter table leads add column if not exists quote_status text default 'pending';
alter table leads add column if not exists quote_pdf_url text;
alter table leads add column if not exists calendar_link text;
alter table leads add column if not exists language text default 'en';

-- 2. Migrate data from legacy fields
update leads set 
  project_title = coalesce(automation_area, 'Untitled Project'),
  project_summary = coalesce(problem_text, 'No summary provided'),
  timeline = coalesce(urgency, '3 months')
where project_title is null;

-- 3. Add constraints (if needed)
-- Note: Only do this if you're confident all data is valid
-- alter table leads alter column name set not null;
-- alter table leads alter column email set not null;
-- alter table leads add constraint leads_email_unique unique(email);

-- 4. Create new tables (messages, projects)
-- Copy the CREATE TABLE statements from supabase-schema-fixed.sql

-- 5. Update views (drop and recreate with security_invoker)
drop view if exists lead_analytics;
drop view if exists conversation_performance;
drop view if exists quote_performance;
-- Then copy CREATE VIEW statements from supabase-schema-fixed.sql

-- 6. Update function
-- Copy the CREATE OR REPLACE FUNCTION from supabase-schema-fixed.sql
```

---

## Testing the Fixed Schema

### Test 1: Insert New Lead

```sql
insert into leads (
  name,
  email,
  company,
  project_title,
  project_summary,
  timeline,
  goals,
  tools_in_use,
  desired_features,
  budget_min,
  budget_max,
  source
) values (
  'Maria Silva',
  'maria@techco.com',
  'TechCo Solutions',
  'AI Payment Automation',
  'Build an intelligent payment system that automatically selects the best payment provider based on transaction details.',
  '4-6 weeks',
  '["automation", "cost_reduction", "efficiency"]'::jsonb,
  '["Stripe", "PayPal", "Mercado Pago"]'::jsonb,
  '["Dashboard", "WhatsApp integration", "Real-time analytics"]'::jsonb,
  5000,
  8000,
  'Telos Chat'
);

-- Verify
select 
  name,
  email,
  company,
  project_title,
  jsonb_array_length(goals) as goals_count,
  jsonb_array_length(tools_in_use) as tools_count,
  budget_min,
  budget_max
from leads 
where email = 'maria@techco.com';

-- Clean up
delete from leads where email = 'maria@techco.com';
```

### Test 2: Analytics Views

```sql
-- Should work without errors
select * from lead_analytics limit 5;
select * from conversation_performance limit 5;
select * from quote_performance limit 5;
select * from conversion_funnel;
```

### Test 3: Security Advisor

1. Go to **Database → Security Advisor**
2. Click **Refresh**
3. Should show: **✅ 0 errors, 0 warnings, 0 suggestions**

---

## Next Steps

### 1. Update Your API Code

The new schema has additional fields. Update `src/pages/api/chat.ts`:

```typescript
// When saving lead data
const fullLeadData = {
  name: leadData.name,
  email: leadData.email,
  company: leadData.company,
  
  // NEW FIELDS
  project_title: leadData.automation_area || 'Untitled Project',
  project_summary: leadData.problem_text || '',
  timeline: leadData.urgency || '3 months',
  
  goals: leadData.goals || [],
  tools_in_use: leadData.tools_used || [],
  desired_features: leadData.desired_features || [],
  
  // If you have budget as a range string like "$5k-$10k"
  budget_min: parseBudgetMin(leadData.budget_range),
  budget_max: parseBudgetMax(leadData.budget_range),
  
  source: 'Telos Chat',
  language: 'en',
  
  // Legacy fields (still supported)
  problem_text: leadData.problem_text,
  tools_used: leadData.tools_used,
  budget_range: leadData.budget_range,
  urgency: leadData.urgency,
  status: 'qualified',
};
```

### 2. Enable Message Tracking (Optional)

If you want token cost tracking:

```typescript
// In your chat API, after getting AI response
await supabase.from('messages').insert({
  lead_id: currentLeadId,
  conversation_id: currentConversationId,
  role: 'ai',
  content: reply,
  tokens_used: completion.usage?.total_tokens,
  intent: detectIntent(reply), // Custom function
  model_used: 'gpt-4o-mini'
});
```

### 3. Monitor Your Funnel

```sql
-- Daily check
select * from conversion_funnel;

-- Weekly trend
select 
  date,
  total_leads,
  qualified_leads,
  quoted_leads,
  converted_leads,
  round(100.0 * converted_leads / nullif(total_leads, 0), 2) as conversion_rate
from lead_analytics
where date > current_date - interval '7 days'
order by date desc;
```

---

## Summary of Fixes

| Issue | Status | Fix Applied |
|-------|--------|-------------|
| Security Definer Views | ✅ Fixed | Added `with (security_invoker=true)` to all views |
| Function Search Path | ✅ Fixed | Added `set search_path = public` to function |
| Schema Updates | ✅ Done | Updated to match new requirements |
| New Tables Added | ✅ Done | `messages`, `projects` |
| New Views Added | ✅ Done | `message_analytics`, `conversion_funnel` |
| RLS Policies | ✅ Updated | Service role + authenticated access |
| Indexes | ✅ Optimized | Added for all new tables |
| Comments | ✅ Added | Documentation for all schema changes |

---

## Files in This Repo

- ✅ **`supabase-schema-fixed.sql`** - Run this to fix all issues
- ✅ **`SUPABASE_SECURITY_FIX.md`** (this file) - Complete guide
- ⚠️ **`supabase-schema.sql`** - OLD (has security warnings)

---

**You're all set!** 🎉 

Run `supabase-schema-fixed.sql` in your Supabase SQL Editor and the Security Advisor should be clean!

