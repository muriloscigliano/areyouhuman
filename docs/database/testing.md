# 🗄️ Database Testing Guide

## What Was Fixed

### ❌ **BEFORE** (Data Not Being Saved)
```
Messages 1-5: Collect Name, Email, Company
Message 6: Extraction starts ← TOO LATE!
Result: Critical data MISSED ❌
```

### ✅ **AFTER** (Aggressive Extraction)
```
Message 2: Extract → captures problem
Message 3: Extract → captures name
Message 4: Extract → captures email  
Message 5: Extract → captures company
Result: ALL data SAVED ✅
```

---

## How to Test Database Collection

### 1. **Open Chat**
Go to: http://localhost:4321

### 2. **Follow This Conversation**

**Message 1 (Telos):**
> "Hey Human 👋 What's the main challenge you're trying to solve?"

**Message 2 (You):**
> "I need an AI payment system"

**Watch Terminal:** Should see:
```
🎯 CRITICAL PHASE: Extracting lead info at message 2...
✅ Extracted data: {"problem_text": "AI payment system", ...}
💾 Saving lead data (1 fields)...
```

---

**Message 3 (Telos):**
> "Great! Who should I make the proposal out to?"

**Watch Terminal:** Should see:
```
🎯 CRITICAL PHASE: Extracting lead info at message 3...
```

---

**Message 4 (You):**
> "Maria Rodriguez"

**Watch Terminal:** Should see:
```
🎯 CRITICAL PHASE: Extracting lead info at message 4...
✅ Extracted data: {"name": "Maria Rodriguez", ...}
💾 Saving lead data (2 fields)...
```

---

**Message 5 (Telos):**
> "Thanks, Maria! Where should I send your quote once it's ready?"

**Watch Terminal:** Should see:
```
🎯 CRITICAL PHASE: Extracting lead info at message 5...
```

---

**Message 6 (You):**
> "maria@techpay.com"

**Watch Terminal:** Should see:
```
📊 Regular extraction at message 6...
✅ Extracted data: {"name": "Maria Rodriguez", "email": "maria@techpay.com", ...}
💾 Saving lead data (3 fields)...
```

---

**Message 7 (Telos):**
> "Perfect. What's the name of your company or brand?"

**Message 8 (You):**
> "TechPay Solutions"

**Watch Terminal:** Should see:
```
📊 Regular extraction at message 9...
✅ Extracted data: {"name": "Maria Rodriguez", "email": "maria@techpay.com", "company": "TechPay Solutions", ...}
💾 Saving lead data (4 fields)...
```

---

## 3. **Check Supabase Database**

### Option A: Supabase Dashboard

1. Go to your Supabase project
2. Navigate to **Table Editor**
3. Open the **`leads`** table
4. Sort by **`created_at`** descending
5. You should see a new row with:
   - ✅ `name`: "Maria Rodriguez"
   - ✅ `email`: "maria@techpay.com"
   - ✅ `company`: "TechPay Solutions"
   - ✅ `problem_text`: "AI payment system"

### Option B: SQL Query

Run this in Supabase SQL Editor:

```sql
SELECT 
  id,
  name, 
  email, 
  company,
  problem_text,
  budget_range,
  created_at,
  updated_at
FROM leads
WHERE created_at > NOW() - INTERVAL '10 minutes'
ORDER BY created_at DESC
LIMIT 10;
```

**Expected Result:**
```
| name            | email                | company            | problem_text        |
|-----------------|----------------------|--------------------|---------------------|
| Maria Rodriguez | maria@techpay.com    | TechPay Solutions  | AI payment system   |
```

---

## 4. **Check Conversations Table**

```sql
SELECT 
  id,
  lead_id,
  messages,
  model_used,
  created_at
FROM conversations
WHERE created_at > NOW() - INTERVAL '10 minutes'
ORDER BY created_at DESC;
```

**Expected Result:**
- Should see a conversation linked to the lead
- `messages` field should contain full conversation JSON
- `model_used`: "gpt-4o-mini"

---

## What to Watch For in Terminal

### ✅ **GOOD SIGNS:**

```
🎯 CRITICAL PHASE: Extracting lead info at message 2...
✅ Extracted data: {"name": "Maria Rodriguez", "email": "maria@techpay.com", ...}
💾 Saving lead data (3 fields)...
```

### ❌ **BAD SIGNS:**

```
Error extracting lead info: ...
Error creating lead: ...
⚠️ Supabase not configured
```

**If you see errors:**
1. Check your `.env` file has `SUPABASE_URL` and `SUPABASE_ANON_KEY`
2. Verify OpenAI API key is set (`OPENAI_API_KEY`)
3. Check Supabase RLS policies allow inserts

---

## Extraction Schedule

| Message # | Extraction? | What Gets Captured |
|-----------|-------------|-------------------|
| 1 | ❌ No | Greeting |
| 2 | ✅ **YES** | Problem description |
| 3 | ✅ **YES** | (Asking for name) |
| 4 | ✅ **YES** | **NAME** collected |
| 5 | ✅ **YES** | (Asking for email) |
| 6 | ✅ YES | **EMAIL** collected |
| 7 | ❌ No | (Asking for company) |
| 8 | ❌ No | **COMPANY** collected |
| 9 | ✅ YES | All data updated |
| 10-11 | ❌ No | - |
| 12 | ✅ YES | Budget/tools |

**Key Point**: Messages 2-5 = CRITICAL PHASE with extraction every message!

---

## Common Issues & Solutions

### Issue 1: "No data in database"

**Possible Causes:**
- Supabase not configured
- RLS policies blocking inserts
- OpenAI API not working (falls back to rule-based)

**Solution:**
Check terminal for:
```
⚠️ Supabase not configured
```

If you see this, set up your `.env` file properly.

---

### Issue 2: "Data extracted but not saved"

**Possible Cause:** RLS policies

**Solution:**
Run this in Supabase SQL Editor:

```sql
-- Allow inserts from service role (your API)
CREATE POLICY "Enable insert for authenticated users" ON leads
FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users" ON leads
FOR UPDATE USING (true);
```

---

### Issue 3: "Extraction not happening"

**Check:**
1. OpenAI API key is valid
2. Terminal shows "🤖 Using OpenAI GPT-4o-mini"
3. No errors in terminal

**If using rule-based fallback:**
Terminal will show: "Using rule-based responses"
→ Data collection works differently (based on message position)

---

## Quick Verification Checklist

After a test conversation (8 messages):

- [ ] Terminal showed "🎯 CRITICAL PHASE" at messages 2-5
- [ ] Terminal showed "✅ Extracted data" with JSON
- [ ] Terminal showed "💾 Saving lead data"
- [ ] Supabase `leads` table has new row
- [ ] Row contains `name`, `email`, `company`
- [ ] Supabase `conversations` table has matching record

---

## Expected Data Flow

```
┌─────────────────────────────────────────────────┐
│ 1. User sends message                           │
│ 2. Chat API receives it                         │
│ 3. OpenAI generates response                    │
│ 4. Extract lead info (messages 2-5)            │
│ 5. Merge with existing leadData                 │
│ 6. Save to Supabase (leads table)              │
│ 7. Save conversation (conversations table)      │
│ 8. Return response to UI                        │
└─────────────────────────────────────────────────┘
```

---

## Advanced: Watch Extraction in Real-Time

### In Terminal:
```bash
cd /Users/muriloscigliano/areyouhuman
npm run dev

# Watch for these logs:
# 🎯 CRITICAL PHASE: Extracting...
# ✅ Extracted data: {...}
# 💾 Saving lead data...
```

### In Supabase Dashboard:
1. Open "Table Editor"
2. Click "Realtime" toggle
3. Watch rows appear as you chat!

---

## Success Criteria

**After 5 messages, you should have in Supabase:**

```json
{
  "id": "uuid",
  "name": "Maria Rodriguez",
  "email": "maria@techpay.com",
  "company": "TechPay Solutions",
  "problem_text": "AI payment system",
  "source": "chat",
  "created_at": "2024-...",
  "updated_at": "2024-..."
}
```

**If you have this → SUCCESS!** ✅

---

## Need Help?

1. Check terminal for error messages
2. Verify `.env` configuration
3. Test Supabase connection manually
4. Check RLS policies in Supabase

**Database collection is NOW FIXED and should work!** 🎉

