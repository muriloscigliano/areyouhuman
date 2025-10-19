# 🔍 How to Check Last Chat Data

## Option 1: Check Terminal Logs (While Server is Running)

### What to Look For:

When a chat happens, you should see these logs in your terminal:

```bash
🎯 CRITICAL PHASE: Extracting lead info at message 2...
✅ Extracted data: {
  "name": "John Smith",
  "email": "john@example.com",
  "company": "Acme Corp",
  "problem_text": "Need AI automation"
}
💾 Saving lead data (4 fields)...
```

### If You Don't See Logs:

1. **Start a new chat** at http://localhost:4321
2. **Watch the terminal** where `npm run dev` is running
3. Send a few messages following the 5-message sequence
4. You should see extraction logs appear

---

## Option 2: Check Supabase Database

### Quick Check (Supabase Dashboard):

1. Go to your **Supabase Dashboard**
2. Click **"Table Editor"** in sidebar
3. Click **"leads"** table
4. Sort by **"created_at"** descending
5. Look for recent rows

### Expected to See:

| name | email | company | problem_text | created_at |
|------|-------|---------|--------------|------------|
| John Smith | john@test.com | Acme Corp | AI automation | 2024-... |

---

## Option 3: Run SQL Queries

### Copy `check-chat-data.sql` into Supabase SQL Editor:

1. Open **Supabase Dashboard**
2. Click **"SQL Editor"**
3. Click **"+ New query"**
4. Copy contents of `check-chat-data.sql`
5. Run each section

### Quick Queries:

**1. Check if ANY data exists:**
```sql
SELECT COUNT(*) as total_leads FROM leads;
SELECT COUNT(*) as total_conversations FROM conversations;
```

**2. View most recent lead:**
```sql
SELECT * FROM leads ORDER BY created_at DESC LIMIT 1;
```

**3. View most recent conversation:**
```sql
SELECT 
  id,
  lead_id,
  jsonb_array_length(messages) as message_count,
  messages
FROM conversations 
ORDER BY created_at DESC 
LIMIT 1;
```

---

## Option 4: Test Right Now

### Do a Quick Test Chat:

**Open http://localhost:4321 and send these messages:**

```
Message 1 (You): "I need AI automation"
Message 2 (You): Wait for Telos response
Message 3 (You): When asked "Who should I make the proposal out to?"
              → Answer: "Sarah Johnson"
Message 4 (You): When asked "Where should I send your quote?"
              → Answer: "sarah@test.com"
Message 5 (You): When asked "What's your company called?"
              → Answer: "TestCo"
```

### Then Immediately Check:

**Terminal should show:**
```bash
🎯 CRITICAL PHASE: Extracting lead info at message 2...
✅ Extracted data: {"problem_text": "AI automation", ...}
🎯 CRITICAL PHASE: Extracting lead info at message 3...
🎯 CRITICAL PHASE: Extracting lead info at message 4...
✅ Extracted data: {"name": "Sarah Johnson", ...}
💾 Saving lead data (2 fields)...
```

**Supabase should have:**
```sql
SELECT * FROM leads WHERE email = 'sarah@test.com';
-- Should return 1 row with name, email, company
```

---

## Troubleshooting

### ❌ No Data in Supabase

**Possible Causes:**

1. **Supabase not configured**
   ```bash
   # Check your .env file
   SUPABASE_URL=your-project-url
   SUPABASE_ANON_KEY=your-anon-key
   ```

2. **OpenAI not configured**
   ```bash
   # Check your .env file
   OPENAI_API_KEY=sk-...
   ```
   
   Without OpenAI, extraction won't work (will use rule-based fallback)

3. **RLS policies blocking**
   ```sql
   -- Check if policies exist
   SELECT * FROM pg_policies WHERE tablename = 'leads';
   ```

### ❌ No Logs in Terminal

**Check:**
- Server is running (`npm run dev`)
- You're sending messages through http://localhost:4321
- Terminal is visible and not minimized

### ❌ Data Partially Saved

**This is normal during early messages!**

- Message 2: Only `problem_text` captured
- Message 4: `name` added
- Message 6: `email` added
- Message 8: `company` added

By message 6-8, you should have full contact info.

---

## Expected Data Flow

```
┌─────────────────────────────────────────┐
│ 1. User sends chat message              │
│ 2. Chat API receives                    │
│ 3. OpenAI generates response            │
│ 4. Extract lead info (messages 2-5)    │
│ 5. Merge with existing leadData         │
│ 6. Save to Supabase                     │
│ 7. Terminal logs show extraction        │
└─────────────────────────────────────────┘
```

---

## Quick Health Check Script

Run this to see current database state:

```sql
-- Copy all of this into Supabase SQL Editor

-- 1. Count everything
SELECT 
  'Leads' as table_name,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '1 hour') as last_hour,
  COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '24 hours') as last_24h
FROM leads
UNION ALL
SELECT 
  'Conversations',
  COUNT(*),
  COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '1 hour'),
  COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '24 hours')
FROM conversations;

-- 2. Show recent activity
SELECT 
  l.name,
  l.email,
  l.company,
  l.problem_text,
  l.created_at,
  c.id as conversation_id,
  jsonb_array_length(c.messages) as message_count
FROM leads l
LEFT JOIN conversations c ON c.lead_id = l.id
WHERE l.created_at > NOW() - INTERVAL '24 hours'
ORDER BY l.created_at DESC
LIMIT 5;
```

---

## What Should You See?

### ✅ **GOOD STATE:**

**Terminal:**
```
🎯 CRITICAL PHASE: Extracting lead info at message 2...
✅ Extracted data: {...}
💾 Saving lead data (3 fields)...
```

**Supabase:**
- Leads table: Has rows with name, email, company
- Conversations table: Has rows with messages JSONB

### ❌ **NEEDS FIXING:**

**Terminal:**
```
⚠️ Supabase not configured
Error creating lead: ...
```

**Supabase:**
- Empty tables
- Or "relation does not exist" errors

→ Run `supabase-schema-fixed.sql` to create tables

---

## Files

- ✅ `check-chat-data.sql` - Quick SQL queries
- ✅ `CHECK_CHAT_DATA.md` - This guide
- ✅ `DATABASE_TESTING_GUIDE.md` - Detailed testing guide

---

**Want me to check your data right now?**

Tell me:
1. Did you recently have a chat?
2. What's your Supabase project URL? (I'll provide the exact query)
3. Or just run the queries in `check-chat-data.sql`!

