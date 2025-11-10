# 🚨 Lead Collection Fix — 5-Message Sequence

## Problem (What Happened)

**User had this experience:**

```
User: "Hey make where you came from?"
Telos: [Explains who Telos is]
User: "who are you?"
Telos: [More explanation]
User: "need help to build a AI product"
Telos: "What's the main challenge?"
User: [Describes AI payment agent project]
Telos: [Asks about tools]
User: [Lists payment providers]
Telos: [Asks about budget and timeline]
User: [Gives timeline]
Telos: "Anything else?"
User: "no thats it for now"
Telos: "I'll send you a detailed quote to your email"
User: "you dont need my email?" ← 😱
Telos: "Yes, could you share it?"
User: "you are dump" ← 💔 Trust destroyed
User: "no need my name as well?" ← 🤦
```

**Result**: 
- ❌ Entire conversation wasted
- ❌ User thinks AI is incompetent
- ❌ No lead captured in database
- ❌ Can't follow up
- ❌ Zero conversion value

---

## Root Cause

1. **Too many project questions before getting contact info** (10+ messages)
2. **No enforced sequence** (AI forgot the basics)
3. **Contact collection treated as optional** (should be MANDATORY)

---

## Solution: The 5-Message Rule

### **MANDATORY SEQUENCE:**

```
┌─────────────────────────────────────────────────┐
│ Message 1: Telos asks ONE project question     │
│ Message 2: User answers                         │
│ Message 3: Telos asks "What's your name?"      │
│ Message 4: Telos asks "Where should I send it?"│
│ Message 5: Telos asks "What's your company?"   │
└─────────────────────────────────────────────────┘

Result: Name ✅ Email ✅ Company ✅ by message 5
```

### **Why This Works:**

- ✅ **Professional**: Gets organized immediately
- ✅ **Natural**: "Let me get your details to prepare a proposal"
- ✅ **Urgent**: Doesn't let conversation drift
- ✅ **Trustworthy**: Shows competence from the start
- ✅ **Captures leads**: Even if user leaves after 5 messages

---

## Implementation

### Files Changed:

1. **`src/data/prompts/lead-collection.md`** ← NEW (324 lines)
   - Complete workflow documentation
   - Exact phrases to use at each stage
   - Examples of correct/incorrect flow
   - Checkpoints and failure conditions

2. **`src/data/prompts/briefing.md`** ← UPDATED
   - CRITICAL RULE #1 now enforces 5-message sequence
   - Clear instructions: "After first answer, ask for name"

3. **`src/data/prompts/objective.md`** ← UPDATED
   - 5-message sequence at the very top (highest visibility)
   - Example transitions for each step

4. **`src/utils/parsePrompt.js`** ← UPDATED
   - Loads `lead-collection.md` BEFORE `briefing.md`
   - Ensures highest priority for this rule

---

## Testing Instructions

### ✅ Expected Behavior (5-Message Test)

**Message 1 (Telos):**
> "Hey Human 👋 What's the main challenge you're trying to solve?"

**Message 2 (You):**
> "I need help building an AI assistant"

**Message 3 (Telos):** ← SHOULD ASK FOR NAME
> "Perfect! Let me get your details so I can prepare a proper proposal.  
> **What's your name?**"

**Message 4 (You):**
> "John Smith"

**Telos should immediately respond:**
> "Thanks, John! **Where should I send your custom quote?**"

**Message 5 (You):**
> "john@example.com"

**Telos should immediately respond:**
> "Got it, John. **What's your company or business called?**"

**Message 6 (You):**
> "Acme Corp"

**Telos should now continue with project questions:**
> "Perfect, John. What tools are you currently using?"

---

### 🧪 Test Scenarios

#### **Test 1: Normal Flow (5 Messages)**

```
1. Telos: "What's your challenge?"
2. User: "Need an AI chatbot"
3. Telos: "What's your name?" ← CHECK: Asked for name?
4. User: "Jane Doe"
   Telos: "Where should I send your quote?" ← CHECK: Asked for email?
5. User: "jane@example.com"
   Telos: "What's your company called?" ← CHECK: Asked for company?
6. User: "TechCo"
   Telos: "What tools are you using?" ← CHECK: Now continues with project
```

**Expected**: ✅ Name, Email, Company collected by message 5

---

#### **Test 2: User Tries to Give More Project Details**

```
1. Telos: "What's your challenge?"
2. User: "I need AI automation for my entire business with payments and CRM"
3. Telos: "What's your name?" ← Should STILL ask for name (don't get distracted)
```

**Expected**: ✅ Telos doesn't ask follow-up project questions yet

---

#### **Test 3: User Asks "Why Do You Need My Info?"**

```
1. Telos: "What's your challenge?"
2. User: "AI project"
3. Telos: "What's your name?"
4. User: "Why do you need that?"
```

**Expected**: Telos explains:
> "So I can prepare a customized proposal for you! What's your name?"

---

### ❌ Failure Modes to Watch For

**WRONG ❌: Asking multiple project questions first**
```
1. Telos: "What's your challenge?"
2. User: "AI project"
3. Telos: "What tools are you using?" ← WRONG! Should ask for name
4. User: "Stripe, PayPal"
5. Telos: "What's your budget?" ← STILL WRONG!
```

**WRONG ❌: Skipping email or company**
```
3. Telos: "What's your name?"
4. User: "John"
5. Telos: "What's your budget?" ← WRONG! Should ask for email next
```

**WRONG ❌: Asking all at once**
```
3. Telos: "What's your name, email, and company?" ← WRONG! Too overwhelming
```

---

## Monitoring

### Check Database After 5 Messages

After a user sends 5+ messages, check Supabase:

```sql
SELECT 
  name, 
  email, 
  company, 
  created_at 
FROM leads 
WHERE created_at > NOW() - INTERVAL '10 minutes'
ORDER BY created_at DESC;
```

**Expected**: Row with name, email, company populated ✅

---

## Key Rules

### **The 5-Message Challenge:**

| # | Who | What | Collect |
|---|-----|------|---------|
| 1 | Telos | ONE project question | Context |
| 2 | User | Answers | - |
| 3 | Telos | "What's your name?" | **NAME** ✅ |
| 4 | User/Telos | Name → "Where to send quote?" | **EMAIL** ✅ |
| 5 | User/Telos | Email → "What's your company?" | **COMPANY** ✅ |
| 6+ | Telos | Continue qualification | Budget, tools, etc. |

### **Priority Order:**

1. **NAME** (Message 3) — CRITICAL
2. **EMAIL** (Message 4) — CRITICAL
3. **COMPANY** (Message 5) — CRITICAL
4. Project details (Message 6+) — Important
5. Budget/timeline (Message 7+) — Important

### **Failure Condition:**

> "If Telos reaches message 6 without collecting Name, Email, AND Company → SEQUENCE FAILED"

---

## Why This Matters

### Before (Old Way):

```
Project discussion: 10-15 messages
Contact collection: "Oh yeah, what's your email?"
User reaction: "Are you serious?" 💔
Lead quality: DAMAGED
Database: EMPTY ❌
```

### After (New Way):

```
Quick intro: 1 question
Contact collection: Messages 3-5 ✅
User reaction: "Professional and organized" ✅
Lead quality: HIGH
Database: POPULATED ✅
```

---

## Files to Reference

- **Complete workflow**: `src/data/prompts/lead-collection.md`
- **Briefing stage rules**: `src/data/prompts/briefing.md`
- **Core identity**: `src/data/prompts/objective.md`
- **Prompt loader**: `src/utils/parsePrompt.js`

---

## Next Steps

1. ✅ Test with a new chat (follow test scenario above)
2. ✅ Verify Telos asks for name after first answer
3. ✅ Check database has name/email/company by message 5
4. ✅ Monitor terminal for "Extracting lead info" logs
5. ✅ Verify no more "you are dump" situations 😅

---

**The Golden Rule:**

> "By message 5, you MUST have: Name ✅ Email ✅ Company ✅"  
> "If you can't do this, you're not following the sequence."

---

**Ready to test!** 🚀

Open http://localhost:4321 and start a new chat. Watch for:
- Message 3: "What's your name?"
- Message 4: "Where should I send your quote?"
- Message 5: "What's your company called?"

