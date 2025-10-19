# ⚡ TEST DATABASE COLLECTION NOW (2 minutes)

## 🧪 Quick Test

### Step 1: Open the Chat
Go to: **http://localhost:4321**

### Step 2: Send These 5 Messages

**Message 1 (You):**
```
I need help with AI automation
```

**Wait for Telos response, then...**

**Message 2 (You) - When asked "Who should I make the proposal out to?":**
```
Test User
```

**Wait for Telos response, then...**

**Message 3 (You) - When asked "Where should I send your quote?":**
```
test@database-check.com
```

**Wait for Telos response, then...**

**Message 4 (You) - When asked about company:**
```
Database Test Co
```

---

## 👀 Step 3: Check Your Terminal

**Your terminal should NOW show:**

```bash
🎯 CRITICAL PHASE: Extracting lead info at message 2...
✅ Extracted data: {"problem_text": "AI automation", ...}
💾 Saving lead data (1 fields)...

🎯 CRITICAL PHASE: Extracting lead info at message 3...
✅ Extracted data: {"name": "Test User", ...}
💾 Saving lead data (2 fields)...

🎯 CRITICAL PHASE: Extracting lead info at message 4...
✅ Extracted data: {"email": "test@database-check.com", ...}
💾 Saving lead data (3 fields)...
```

### ✅ IF YOU SEE THESE LOGS:
**Database IS working!** ✅

### ❌ IF YOU DON'T SEE THESE LOGS:
One of these is missing:
- OpenAI API key not set
- Supabase credentials not configured
- Error in the code

---

## 🔍 Step 4: Verify in Supabase

### Quick Check:

1. Go to **Supabase Dashboard**
2. Click **"Table Editor"** → **"leads"**
3. Look for row with email: `test@database-check.com`

### OR run this SQL:

```sql
SELECT 
  name,
  email,
  company,
  problem_text,
  created_at
FROM leads
WHERE email = 'test@database-check.com'
OR created_at > NOW() - INTERVAL '10 minutes';
```

**Expected Result:**
```
name        | email                      | company           | problem_text
Test User   | test@database-check.com    | Database Test Co  | AI automation
```

---

## ⚠️ Troubleshooting

### If Terminal Shows NO Logs:

**Check your `.env` file:**

```bash
# Must have these:
OPENAI_API_KEY=sk-...
SUPABASE_URL=https://...
SUPABASE_ANON_KEY=eyJ...
```

**If missing, add them and restart:**
```bash
# Stop server (Ctrl+C)
npm run dev
# Try chat again
```

### If Terminal Shows Errors:

**Look for these:**
- `⚠️ Supabase not configured` → Add SUPABASE_URL and SUPABASE_ANON_KEY
- `⚠️ OpenAI not configured` → Add OPENAI_API_KEY
- `Error creating lead:` → Check Supabase RLS policies

**Fix:** Run `supabase-schema-fixed.sql` in Supabase

### If Supabase Table is Empty:

**Possible causes:**
1. RLS policies blocking inserts
2. Table doesn't exist
3. Extraction working but save failing

**Quick fix:**
```sql
-- Create policy to allow inserts
CREATE POLICY "Allow all inserts for leads" ON leads
FOR INSERT WITH CHECK (true);
```

---

## 📊 What SHOULD Happen:

```
User sends message
    ↓
Terminal: "🎯 CRITICAL PHASE: Extracting..."
    ↓
Terminal: "✅ Extracted data: {...}"
    ↓
Terminal: "💾 Saving lead data..."
    ↓
Supabase: New row in leads table
    ✅ SUCCESS!
```

---

## 🎯 Summary

1. ✅ Open http://localhost:4321
2. ✅ Send test messages
3. ✅ Watch terminal for extraction logs
4. ✅ Check Supabase for new row

**If steps 3 & 4 work → Database IS collecting data!** 🎉

**If they don't → Check .env file and restart server**

---

**Ready to test? Open the chat and try it now!** 🚀

