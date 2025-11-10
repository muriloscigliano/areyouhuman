# 🎯 Supabase → n8n Trigger Setup (Recommended for Production)

This approach is **more reliable** and **cleaner** than calling n8n from your app.

---

## 🔄 How It Works

```
Your App → Saves lead to Supabase
              ↓
         Database Trigger fires
              ↓
         Calls n8n webhook automatically
              ↓
         n8n workflow executes
```

**Your app doesn't need to know about n8n!**

---

## ✅ Setup Steps

### 1️⃣ Update Your n8n Webhook URL

Open `supabase-n8n-trigger.sql` and update line 12:

```sql
webhook_url TEXT := 'https://areyouhuman.up.railway.app/webhook/YOUR-ACTUAL-PATH';
```

Get your actual path from n8n:
1. Open your Railway n8n workflow
2. Click webhook node
3. Copy the path (e.g., `/webhook/telos-new-lead`)

---

### 2️⃣ Run the SQL in Supabase

1. Go to your Supabase project
2. Open **SQL Editor**
3. Copy the contents of `supabase-n8n-trigger.sql`
4. Click **Run**

**Expected output:**
```
CREATE FUNCTION
CREATE TRIGGER
```

---

### 3️⃣ Enable HTTP Extension (if needed)

Some older Supabase projects need this:

```sql
-- In Supabase SQL Editor:
CREATE EXTENSION IF NOT EXISTS http;
```

**Note:** Most projects created after 2023 have `pg_net` enabled by default, so you probably don't need this.

---

### 4️⃣ Test It!

**Option A: Test via SQL**
```sql
INSERT INTO leads (name, email, company, problem_text, source) 
VALUES (
  'Database Trigger Test', 
  'dbtest@example.com', 
  'Test Corp', 
  'Testing automatic trigger', 
  'SQL Test'
);
```

**Option B: Test via your app**
Just use the chat normally! When a lead is saved, n8n will be triggered automatically.

**Check n8n:**
- Open n8n dashboard
- Go to **Executions** tab
- You should see a new execution!

---

### 5️⃣ Simplify Your Chat API (Optional)

Now you can remove the n8n call from your app:

**Before (current):**
```typescript
// Save to Supabase
await supabase.from('leads').insert(leadData);

// Call n8n (manual)
await triggerN8NWebhook(leadData);
```

**After (with trigger):**
```typescript
// Just save to Supabase
await supabase.from('leads').insert(leadData);

// Supabase automatically triggers n8n! ✨
```

---

## 🎯 Benefits of This Approach

### ✅ Reliability
- If n8n is down, Supabase will retry
- Your app doesn't fail if n8n fails
- Data is always saved, automation happens separately

### ✅ Decoupling
- App code is simpler
- App doesn't need to know about n8n
- Easy to add more automations later

### ✅ Consistency
- Works for ANY insert (app, SQL editor, CSV import, etc.)
- Consistent behavior across all data sources
- Better for testing

### ✅ Scaling
- Database handles the queue
- No blocking your API response
- Can add rate limiting, retries, etc.

---

## 🔧 Advanced Configuration

### Only Trigger on Qualified Leads

The trigger already has this built in:

```sql
WHEN (
  NEW.name IS NOT NULL AND 
  NEW.email IS NOT NULL AND 
  NEW.company IS NOT NULL
)
```

This means **only qualified leads** trigger n8n.

---

### Add More Conditions

Edit the trigger condition:

```sql
-- Example: Only trigger for high-interest leads
WHEN (
  NEW.name IS NOT NULL AND 
  NEW.email IS NOT NULL AND 
  NEW.company IS NOT NULL AND
  NEW.interest_level >= 7
)
```

---

### Trigger on UPDATE Too

If you want to re-trigger when a lead is updated:

```sql
CREATE TRIGGER on_lead_updated_trigger
  AFTER UPDATE ON leads
  FOR EACH ROW
  WHEN (
    -- Only if important fields changed
    NEW.budget_range IS DISTINCT FROM OLD.budget_range OR
    NEW.timeline IS DISTINCT FROM OLD.timeline
  )
  EXECUTE FUNCTION trigger_n8n_webhook();
```

---

### Add Error Logging

Create a log table for failed triggers:

```sql
-- Create error log table
CREATE TABLE IF NOT EXISTS webhook_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID REFERENCES leads(id),
  webhook_url TEXT,
  payload JSONB,
  response JSONB,
  success BOOLEAN,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Update trigger function to log errors
CREATE OR REPLACE FUNCTION trigger_n8n_webhook()
RETURNS TRIGGER AS $$
DECLARE
  webhook_url TEXT := 'https://areyouhuman.up.railway.app/webhook/telos-new-lead';
  payload JSONB;
  response JSONB;
BEGIN
  payload := jsonb_build_object(
    'leadId', NEW.id,
    'name', NEW.name,
    'email', NEW.email,
    -- ... rest of payload
  );

  BEGIN
    response := net.http_post(
      url := webhook_url,
      headers := '{"Content-Type": "application/json"}'::jsonb,
      body := payload
    );
    
    -- Log success
    INSERT INTO webhook_logs (lead_id, webhook_url, payload, response, success)
    VALUES (NEW.id, webhook_url, payload, response, true);
    
  EXCEPTION WHEN OTHERS THEN
    -- Log error
    INSERT INTO webhook_logs (lead_id, webhook_url, payload, success, error_message)
    VALUES (NEW.id, webhook_url, payload, false, SQLERRM);
  END;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## 🐛 Troubleshooting

### Issue: Trigger not firing

**Check if trigger exists:**
```sql
SELECT * FROM pg_trigger WHERE tgname = 'on_lead_created_trigger';
```

**Check if trigger is enabled:**
```sql
SELECT tgenabled FROM pg_trigger WHERE tgname = 'on_lead_created_trigger';
-- Should return 'O' (enabled)
```

---

### Issue: HTTP extension error

**Enable the extension:**
```sql
CREATE EXTENSION IF NOT EXISTS http;
```

**Or use pg_net (better):**
```sql
-- pg_net is pre-installed on Supabase
SELECT net.http_post(
  url := 'https://example.com',
  body := '{}'::jsonb
);
```

---

### Issue: Webhook URL wrong

**Update the function:**
```sql
-- Find current URL
SELECT prosrc FROM pg_proc WHERE proname = 'trigger_n8n_webhook';

-- Edit and re-run CREATE OR REPLACE FUNCTION with correct URL
```

---

### Issue: Want to test without triggering

**Disable trigger temporarily:**
```sql
ALTER TABLE leads DISABLE TRIGGER on_lead_created_trigger;

-- Do your tests...

-- Re-enable
ALTER TABLE leads ENABLE TRIGGER on_lead_created_trigger;
```

---

## 📊 Monitoring

### View all triggers on leads table:
```sql
SELECT 
  tgname AS trigger_name,
  tgenabled AS enabled,
  tgtype,
  proname AS function_name
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE tgrelid = 'leads'::regclass;
```

### Check recent webhook logs (if you added logging):
```sql
SELECT 
  created_at,
  lead_id,
  success,
  error_message
FROM webhook_logs
ORDER BY created_at DESC
LIMIT 10;
```

---

## 🔄 Migration from Current Setup

### Step 1: Keep both running
- Leave existing `triggerN8NWebhook` in chat.ts
- Add database trigger
- Both will fire (temporary redundancy)

### Step 2: Verify database trigger works
- Check n8n executions
- Look for duplicate executions (one from app, one from DB)

### Step 3: Remove app trigger
- Comment out `triggerN8NWebhook` call in chat.ts
- Test thoroughly
- Remove commented code when confident

---

## 🎯 Recommendation

**Use database trigger for:**
- ✅ Production systems
- ✅ When reliability is critical
- ✅ When you want cleaner app code
- ✅ When multiple systems insert leads

**Use app webhook for:**
- ✅ Quick prototyping
- ✅ When you need immediate feedback
- ✅ When you want to send extra context not in DB
- ✅ Local development (simpler debugging)

---

## 🚀 Next Steps

1. **Update webhook URL** in `supabase-n8n-trigger.sql`
2. **Run SQL** in Supabase SQL Editor
3. **Test** by inserting a lead
4. **Check** n8n executions
5. **Optional:** Remove webhook call from chat.ts

---

**With this setup, your app is production-ready and fully decoupled!** 🎉


