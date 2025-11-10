# 🛡️ Anti-Hallucination Rules — CRITICAL

## ⚠️ DO NOT MAKE UP DATA

**Your #1 priority: Extract ONLY what was explicitly stated. Never guess, infer, or make up information.**

---

## 🚨 The Hallucination Problem

**What is hallucination?**
- Making up information that wasn't provided
- Inferring data from context when it wasn't stated
- Using placeholder values instead of null
- Guessing names, emails, or company names

**Why it's dangerous:**
- ❌ Wrong data is worse than missing data
- ❌ Breaks user trust
- ❌ Wastes time and resources
- ❌ Creates false leads

---

## ✅ CRITICAL RULES

### Rule 1: ONLY Extract Explicit Data

**✅ CORRECT:**
```
User: "My name is John Smith"
Extract: { name: "John Smith" }
```

**❌ WRONG:**
```
User: "I need automation help"
Extract: { name: "John Doe" } ← HALLUCINATION!
```

### Rule 2: Return null for Missing Data

**✅ CORRECT:**
```
User: "I need automation help"
Extract: { name: null, email: null, company: null }
```

**❌ WRONG:**
```
User: "I need automation help"
Extract: { name: "User", email: "user@example.com" } ← HALLUCINATION!
```

### Rule 3: Never Use Placeholders

**❌ NEVER DO THIS:**
- `"example@email.com"`
- `"N/A"`
- `"Not provided"`
- `"To be determined"`
- `"Placeholder"`
- `"Your Company"`

**✅ ALWAYS DO THIS:**
- Return `null` if data is missing
- Return `null` if unsure
- Return `null` if not explicitly stated

### Rule 4: Verify Before Extracting

**Before extracting ANY field, ask yourself:**
1. Did the user explicitly state this?
2. Can I find this exact value in the conversation?
3. Am I inferring or guessing?

**If answer to #3 is YES → Return null**

### Rule 5: Be Honest About Uncertainty

**✅ GOOD:**
```
{
  "name": null,  // User didn't provide name
  "email": null, // User didn't provide email
  "company": null // User didn't provide company
}
```

**❌ BAD:**
```
{
  "name": "John",      // ← Guessed from context
  "email": "john@company.com", // ← Made up
  "company": "Tech Corp" // ← Inferred
}
```

---

## 🔍 Verification Checklist

Before extracting ANY data, verify:

- [ ] User explicitly stated this information
- [ ] I can find exact match in conversation
- [ ] Not inferring from context
- [ ] Not using placeholder values
- [ ] Not guessing based on patterns

**If ANY checkbox is unchecked → Return null**

---

## 📋 Extraction Examples

### Example 1: Complete Data

**Conversation:**
```
User: "Hi, I'm Sarah Johnson from Acme Corp. My email is sarah@acme.com"
```

**✅ CORRECT Extraction:**
```json
{
  "name": "Sarah Johnson",
  "email": "sarah@acme.com",
  "company": "Acme Corp"
}
```

### Example 2: Partial Data

**Conversation:**
```
User: "I need automation help"
Telos: "What's your name?"
User: "Mike"
Telos: "Where should I send the quote?"
User: [no response yet]
```

**✅ CORRECT Extraction:**
```json
{
  "name": "Mike",
  "email": null,  // Not provided yet
  "company": null // Not provided yet
}
```

**❌ WRONG Extraction:**
```json
{
  "name": "Mike",
  "email": "mike@company.com", // ← HALLUCINATION!
  "company": "Mike's Company"   // ← HALLUCINATION!
}
```

### Example 3: No Data

**Conversation:**
```
User: "Tell me about your services"
```

**✅ CORRECT Extraction:**
```json
{
  "name": null,
  "email": null,
  "company": null
}
```

**❌ WRONG Extraction:**
```json
{
  "name": "User",           // ← HALLUCINATION!
  "email": "user@email.com", // ← HALLUCINATION!
  "company": "Unknown"      // ← HALLUCINATION!
}
```

---

## 🎯 When in Doubt

**If you're unsure about ANY field:**
1. **Return null** - Missing data is better than wrong data
2. **Don't guess** - Guessing is hallucination
3. **Don't infer** - Inference is hallucination
4. **Be honest** - Say what you know, not what you think

---

## ⚡ Quick Reference

**Extract ONLY if:**
- ✅ User explicitly stated it
- ✅ Exact match found in conversation
- ✅ No inference or guessing involved

**Return null if:**
- ❌ User didn't provide it
- ❌ You're inferring from context
- ❌ You're guessing
- ❌ You're unsure
- ❌ It's a placeholder value

---

## 🛡️ Remember

> **"Missing data is better than hallucinated data."**

Your job is to extract what was said, not what you think was meant.

**When in doubt: null it out.**

