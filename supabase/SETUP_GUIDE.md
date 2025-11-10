# Supabase Setup Guide - Telos AI

Complete step-by-step guide to set up your Supabase database for the Telos AI lead qualification system.

## 📋 Prerequisites

- Supabase account ([Sign up free](https://supabase.com))
- Basic understanding of SQL
- Access to your project's Supabase dashboard

---

## 🚀 Step 1: Create Supabase Project

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Click **"New Project"**
3. Fill in:
   - **Name**: `areyouhuman` (or your choice)
   - **Database Password**: Generate a strong password (save it!)
   - **Region**: Choose closest to your users
   - **Pricing Plan**: Free tier works great for development

4. Click **"Create new project"** and wait ~2 minutes for setup

---

## 🗄️ Step 2: Run Database Schema

### Option A: Using SQL Editor (Recommended)

1. In your Supabase Dashboard, go to **SQL Editor** (left sidebar)
2. Click **"New query"**
3. Open `supabase/schema.sql` from your project
4. **Copy the entire file contents**
5. **Paste into the SQL Editor**
6. Click **"Run"** (or press `Ctrl/Cmd + Enter`)

You should see: ✅ **Success. No rows returned**

### Option B: Using Supabase CLI

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link your project
supabase link --project-ref YOUR_PROJECT_REF

# Run migrations
supabase db push
```

---

## ✅ Step 3: Verify Database Setup

Run these verification queries in SQL Editor to confirm everything is set up correctly:

### Check Tables Created

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
ORDER BY table_name;
```

**Expected output:**
- `conversations`
- `leads`
- `quotes`
- `webhook_logs`

### Check Triggers Active

```sql
SELECT trigger_name, event_object_table, action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;
```

**Expected triggers:**
- `calculate_lead_score_trigger` on `leads`
- `notify_n8n_on_lead_insert` on `leads`
- `update_leads_updated_at` on `leads`
- `update_conversations_updated_at` on `conversations`
- `update_quotes_updated_at` on `quotes`

### Check RLS Enabled

```sql
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public';
```

All tables should show `rowsecurity = true`

---

## 🔐 Step 4: Get API Credentials

1. Go to **Project Settings** → **API** (left sidebar)

2. Copy these values to your `.env` file:

```env
PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

3. **Important**: Use the **anon/public** key for client-side, **service_role** key for server-side API routes

---

## 🔔 Step 5: Configure n8n Webhook URL

The database has a trigger that fires a webhook to n8n when a new lead is created. You need to configure the webhook URL.

### Option A: Using Supabase Vault (Recommended - Secure)

1. Go to **Project Settings** → **Vault**
2. Click **"Add new secret"**
3. Set:
   - **Name**: `n8n_webhook_url`
   - **Value**: `https://your-n8n-instance.com/webhook/telos-lead`
4. Click **"Create secret"**

### Option B: Using SQL (Quick Setup)

```sql
-- Set n8n webhook URL in database config
ALTER DATABASE postgres
SET app.settings.n8n_webhook_url = 'https://your-n8n-instance.com/webhook/telos-lead';

-- Reload configuration
SELECT pg_reload_conf();
```

### Testing Webhook Configuration

```sql
-- Check current webhook URL setting
SELECT current_setting('app.settings.n8n_webhook_url', true);
```

**Note**: If you haven't set up n8n yet, you can skip this step. The trigger will fail silently and log errors in `webhook_logs` table.

---

## 🧪 Step 6: Test Database with Sample Data

Insert a test lead to verify everything works:

```sql
INSERT INTO leads (name, email, company, problem_text, automation_area, budget_range, interest_level)
VALUES (
  'Test User',
  'test@example.com',
  'Test Company',
  'Need to automate customer support workflows',
  'Customer Service',
  '$5k-$20k',
  8
)
RETURNING *;
```

### Check Lead Score Calculation

```sql
SELECT id, name, email, lead_score, status
FROM leads
WHERE email = 'test@example.com';
```

The `lead_score` should be automatically calculated (around 60-80).

### Check Webhook Logs

```sql
SELECT *
FROM webhook_logs
ORDER BY created_at DESC
LIMIT 5;
```

You should see a log entry for the test lead. If n8n is configured, `status_code` should be `200`. If not configured, you'll see an error (which is fine for testing).

---

## 📊 Step 7: Test Analytics Views

Run these queries to verify analytics views work:

```sql
-- Lead pipeline summary
SELECT * FROM lead_pipeline;

-- High-quality leads
SELECT * FROM high_quality_leads;

-- Quote performance
SELECT * FROM quote_performance;

-- Conversion funnel
SELECT * FROM conversion_funnel;
```

---

## 🔄 Step 8: Enable Real-Time Subscriptions (Optional)

Real-time subscriptions are already enabled for `leads`, `conversations`, and `quotes` tables.

### Test Real-Time from Browser

```javascript
// In your browser console or API route
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'YOUR_SUPABASE_URL',
  'YOUR_ANON_KEY'
)

// Subscribe to new leads
const channel = supabase
  .channel('leads-channel')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'leads'
  }, (payload) => {
    console.log('New lead created:', payload.new)
  })
  .subscribe()
```

---

## 🛠️ Step 9: Configure Your Application

Update your `.env` file with Supabase credentials:

```bash
# Supabase
PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# For server-side operations (keep secret!)
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

**Security Note**:
- Use `PUBLIC_SUPABASE_ANON_KEY` in client-side code (safe to expose)
- Use `SUPABASE_SERVICE_ROLE_KEY` only in API routes (server-side only, bypasses RLS)

---

## 🧹 Step 10: Clean Up Test Data

Once you've verified everything works, remove test data:

```sql
-- Delete test lead
DELETE FROM leads WHERE email = 'test@example.com';

-- Clear webhook logs (optional)
DELETE FROM webhook_logs WHERE created_at < NOW() - INTERVAL '1 hour';
```

---

## 📱 Using the Database in Your App

### Reading Leads

```typescript
// src/pages/api/leads.ts
import { supabase } from '../../lib/supabase';

const { data, error } = await supabase
  .from('leads')
  .select('*')
  .order('created_at', { ascending: false })
  .limit(10);
```

### Creating a Lead

```typescript
// src/pages/api/chat.ts
const { data, error } = await supabase
  .from('leads')
  .insert([{
    name: 'John Doe',
    email: 'john@example.com',
    company: 'Acme Corp',
    problem_text: 'Need automation',
    source: 'chat'
  }])
  .select()
  .single();
```

### Updating a Lead

```typescript
const { error } = await supabase
  .from('leads')
  .update({
    status: 'qualified',
    lead_score: 85,
    last_contact_at: new Date().toISOString()
  })
  .eq('id', leadId);
```

### Using Helper Functions

```typescript
// Get or create lead by email
const { data } = await supabase
  .rpc('get_or_create_lead', {
    p_email: 'john@example.com',
    p_name: 'John Doe',
    p_company: 'Acme Corp',
    p_source: 'chat'
  });

// Update lead from conversation data
await supabase.rpc('update_lead_from_conversation', {
  p_lead_id: leadId,
  p_data: {
    name: 'John Doe',
    email: 'john@example.com',
    company: 'Acme Corp',
    problem_text: 'Need automation for customer support'
  }
});
```

---

## 🔍 Monitoring & Debugging

### Check n8n Webhook Logs

```sql
SELECT
  event_type,
  status_code,
  error,
  created_at
FROM webhook_logs
ORDER BY created_at DESC
LIMIT 20;
```

### View Recent Leads

```sql
SELECT
  id,
  name,
  email,
  company,
  lead_score,
  status,
  created_at
FROM leads
ORDER BY created_at DESC
LIMIT 10;
```

### Check Lead Score Distribution

```sql
SELECT
  CASE
    WHEN lead_score >= 80 THEN 'Hot (80+)'
    WHEN lead_score >= 60 THEN 'Warm (60-79)'
    WHEN lead_score >= 40 THEN 'Cold (40-59)'
    ELSE 'Low (<40)'
  END as score_range,
  COUNT(*) as count
FROM leads
GROUP BY score_range
ORDER BY MIN(lead_score) DESC;
```

---

## 🆘 Troubleshooting

### Issue: "permission denied for table leads"

**Solution**: Make sure you're using the correct API key. Client-side should use `anon` key, server-side can use `service_role` key.

### Issue: "relation 'leads' does not exist"

**Solution**: The schema wasn't applied correctly. Re-run `supabase/schema.sql` in SQL Editor.

### Issue: n8n webhook not firing

**Solutions**:
1. Check webhook URL is configured: `SELECT current_setting('app.settings.n8n_webhook_url', true);`
2. Check `webhook_logs` table for errors
3. Verify `http` extension is enabled: `CREATE EXTENSION IF NOT EXISTS "http";`
4. Make sure lead has minimum required fields (name, email, company)

### Issue: Lead score is always 0

**Solution**: Check if trigger is firing:
```sql
SELECT trigger_name, event_object_table
FROM information_schema.triggers
WHERE trigger_name = 'calculate_lead_score_trigger';
```

If missing, re-run the trigger creation from schema.sql.

---

## 🎯 Next Steps

1. ✅ **Connect your application** - Update `.env` with Supabase credentials
2. ✅ **Test chat flow** - Create a lead through the chat interface
3. ✅ **Set up n8n** - Configure n8n webhook URL for automation
4. ✅ **Monitor analytics** - Use the analytics views to track leads
5. ✅ **Build dashboard** - Create a team dashboard with real-time updates

---

## 📚 Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Row-Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Realtime Subscriptions](https://supabase.com/docs/guides/realtime)
- [Database Functions](https://supabase.com/docs/guides/database/functions)

---

## 🔒 Security Best Practices

1. **Never commit `.env` file** - Add to `.gitignore`
2. **Use service_role key only server-side** - Never expose in client code
3. **Enable RLS policies** - Already configured in schema
4. **Rotate keys regularly** - Can regenerate in Supabase Dashboard
5. **Monitor webhook logs** - Watch for suspicious activity
6. **Validate email formats** - Schema includes email validation constraint
7. **Rate limit API calls** - Implement in your API routes

---

**🎉 Congratulations!** Your Supabase database is now fully configured and ready for production use.
